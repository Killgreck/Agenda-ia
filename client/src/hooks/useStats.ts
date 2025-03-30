import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { WeeklyStats } from "@/types";
import { apiRequest } from "@/lib/queryClient";
import { useState, useEffect } from "react";

// Interface for detailed statistics
export interface DetailedStats {
  id: number;
  userId: number;
  weekStart: string;
  weekEnd: string;
  tasksCompleted: number;
  tasksTotal: number;
  avgProductivity: number;
  aiSuggestionsAccepted: number;
  aiSuggestionsTotal: number;
  tasksCompletionRate?: number;
  productivityScore?: number;
  aiSuggestionsRate?: number;
  weekLabel?: string;
}

// Get week label (e.g. "Mar 24 - Mar 30")
const getWeekLabel = (weekStart: string, weekEnd: string) => {
  const start = new Date(weekStart);
  const end = new Date(weekEnd);
  
  const formatDate = (date: Date) => {
    const month = date.toLocaleString('default', { month: 'short' });
    const day = date.getDate();
    return `${month} ${day}`;
  };
  
  return `${formatDate(start)} - ${formatDate(end)}`;
};

// Calculate completion rates and scores
const calculateRates = (stats: Omit<DetailedStats, 'tasksCompletionRate' | 'productivityScore' | 'aiSuggestionsRate' | 'weekLabel'>): DetailedStats => {
  const tasksCompletionRate = stats.tasksTotal > 0 
    ? Math.round((stats.tasksCompleted / stats.tasksTotal) * 100) 
    : 0;
    
  const productivityScore = Math.round((stats.avgProductivity / 5) * 100);
  
  const aiSuggestionsRate = stats.aiSuggestionsTotal > 0 
    ? Math.round((stats.aiSuggestionsAccepted / stats.aiSuggestionsTotal) * 100) 
    : 0;
    
  return {
    ...stats,
    tasksCompletionRate,
    productivityScore,
    aiSuggestionsRate,
    weekLabel: getWeekLabel(stats.weekStart, stats.weekEnd)
  };
};

export function useStats() {
  // Helper function to get current week dates
  const getCurrentWeekDates = () => {
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
    
    // Calculate start of week (Sunday)
    const startDate = new Date(now);
    startDate.setDate(now.getDate() - dayOfWeek);
    startDate.setHours(0, 0, 0, 0);
    
    // Calculate end of week (Saturday)
    const endDate = new Date(startDate);
    endDate.setDate(startDate.getDate() + 6);
    endDate.setHours(23, 59, 59, 999);
    
    return { startDate, endDate };
  };

  // Get current week's statistics
  const { data: currentWeekData, isLoading, error } = useQuery({
    queryKey: ['/api/statistics/week'],
    queryFn: async () => {
      try {
        const { startDate, endDate } = getCurrentWeekDates();
        
        // First try to fetch existing stats for the week
        const response = await fetch(`/api/statistics/week?start=${startDate.toISOString()}&end=${endDate.toISOString()}`);
        
        // If found, return the data
        if (response.ok) {
          const data = await response.json();
          return calculateRates(data);
        }
        
        // If not found (404) or other error, generate new stats
        await generateWeeklyReport(startDate, endDate);
        
        // Retry fetching
        const retryResponse = await fetch(`/api/statistics/week?start=${startDate.toISOString()}&end=${endDate.toISOString()}`);
        if (retryResponse.ok) {
          return calculateRates(await retryResponse.json());
        }
        
        throw new Error('Failed to fetch weekly statistics after generation');
      } catch (error) {
        console.error("Error fetching statistics:", error);
        // Return default stats with 0 values
        const { startDate, endDate } = getCurrentWeekDates();
        return calculateRates({
          id: 0,
          userId: 0,
          weekStart: startDate.toISOString(),
          weekEnd: endDate.toISOString(),
          tasksCompleted: 0,
          tasksTotal: 0,
          avgProductivity: 0,
          aiSuggestionsAccepted: 0,
          aiSuggestionsTotal: 0
        });
      }
    }
  });
  
  // Function to generate weekly report
  const generateWeeklyReport = async (startDate?: Date, endDate?: Date) => {
    try {
      // Get user ID from localStorage
      const authStorageStr = localStorage.getItem('auth-storage');
      const authStorage = authStorageStr ? JSON.parse(authStorageStr) : { state: { user: { id: 0 } } };
      const userId = authStorage?.state?.user?.id || 0;
      
      // Use provided dates or calculate current week
      const dates = startDate && endDate 
        ? { startDate, endDate } 
        : getCurrentWeekDates();
      
      const response = await fetch('/api/generate-weekly-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          startDate: dates.startDate.toISOString(),
          endDate: dates.endDate.toISOString(),
          userId
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate weekly report');
      }
      
      return await response.json();
    } catch (error) {
      console.error("Error generating weekly report:", error);
      return null;
    }
  };
  
  // Get historical statistics
  const { data: historicalData } = useQuery({
    queryKey: ['/api/statistics'],
    queryFn: async () => {
      try {
        const response = await fetch('/api/statistics');
        if (!response.ok) {
          throw new Error('Failed to fetch historical statistics');
        }
        
        const data = await response.json();
        return data.map(calculateRates);
      } catch (error) {
        console.error("Error fetching historical statistics:", error);
        return [];
      }
    }
  });
  
  // Calculate derived stats for current week
  const stats: WeeklyStats = {
    tasksCompletionRate: currentWeekData?.tasksCompletionRate || 0,
    productivityScore: currentWeekData?.productivityScore || 0,
    aiSuggestionsRate: currentWeekData?.aiSuggestionsRate || 0
  };
  
  return {
    stats,
    currentWeekData,
    historicalData,
    isLoading,
    error,
    generateWeeklyReport
  };
}
