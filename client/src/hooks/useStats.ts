import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { WeeklyStats } from "@/types";
import { apiRequest } from "@/lib/queryClient";
import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";

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
  const queryClient = useQueryClient();
  
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

  // Get user ID from the useAuth hook
  const { isAuthenticated, user } = useAuth();
  const userId = user?.id;
  
  // Get current week's statistics
  const { 
    data: currentWeekData, 
    isLoading, 
    error, 
    refetch: refetchWeeklyStats 
  } = useQuery({
    queryKey: ['/api/statistics/week', userId],
    queryFn: async () => {
      try {
        console.log("Fetching weekly statistics for user:", userId);
        const { startDate, endDate } = getCurrentWeekDates();
        
        // First try to fetch existing stats for the week
        const response = await fetch(`/api/statistics/week?start=${startDate.toISOString()}&end=${endDate.toISOString()}&userId=${userId}`);
        
        // If found, return the data
        if (response.ok) {
          const data = await response.json();
          console.log("Received weekly statistics:", data);
          return calculateRates(data);
        }
        
        // If not found (404) or other error, generate new stats
        const generatedReport = await generateWeeklyReport(startDate, endDate);
        console.log("Generated new weekly report:", generatedReport);
        
        // Retry fetching
        const retryResponse = await fetch(`/api/statistics/week?start=${startDate.toISOString()}&end=${endDate.toISOString()}&userId=${userId}`);
        if (retryResponse.ok) {
          const data = await retryResponse.json();
          console.log("Received weekly statistics after generation:", data);
          return calculateRates(data);
        }
        
        throw new Error('Failed to fetch weekly statistics after generation');
      } catch (error) {
        console.error("Error fetching statistics:", error);
        // Return default stats with 0 values
        const { startDate, endDate } = getCurrentWeekDates();
        return calculateRates({
          id: 0,
          userId,
          weekStart: startDate.toISOString(),
          weekEnd: endDate.toISOString(),
          tasksCompleted: 0,
          tasksTotal: 0,
          avgProductivity: 0,
          aiSuggestionsAccepted: 0,
          aiSuggestionsTotal: 0
        });
      }
    },
    enabled: isAuthenticated && userId !== undefined && userId !== null // Only fetch when user is authenticated and we have a valid userId
  });
  
  // Function to generate weekly report
  const generateWeeklyReport = async (startDate?: Date, endDate?: Date) => {
    try {
      console.log("Generating weekly report for user:", userId);
      
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
      
      const result = await response.json();
      
      // Invalidate cache and trigger refetch
      queryClient.invalidateQueries({ queryKey: ['/api/statistics/week'] });
      queryClient.invalidateQueries({ queryKey: ['/api/statistics'] });
      
      // Manually refresh statistics
      setTimeout(() => {
        refetchWeeklyStats();
        refetchHistoricalStats();
      }, 500);
      
      return result;
    } catch (error) {
      console.error("Error generating weekly report:", error);
      return null;
    }
  };
  
  // Get historical statistics
  const { 
    data: historicalData, 
    refetch: refetchHistoricalStats 
  } = useQuery({
    queryKey: ['/api/statistics', userId],
    queryFn: async () => {
      try {
        console.log("Fetching historical statistics for user:", userId);
        const response = await fetch(`/api/statistics?userId=${userId}`);
        if (!response.ok) {
          throw new Error('Failed to fetch historical statistics');
        }
        
        const data = await response.json();
        return data.map(calculateRates);
      } catch (error) {
        console.error("Error fetching historical statistics:", error);
        return [];
      }
    },
    enabled: isAuthenticated && userId !== undefined && userId !== null // Only fetch when user is authenticated and we have a valid userId
  });
  
  // Force refresh function that can be called after check-ins
  const refreshAllStats = async () => {
    console.log("Manual refresh of all statistics triggered");
    try {
      // First make sure we generate a new weekly report
      const { startDate, endDate } = getCurrentWeekDates();
      
      console.log("Generating new weekly report with date range:", 
        startDate.toISOString(), "to", endDate.toISOString());
        
      const response = await fetch('/api/generate-weekly-report', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          startDate: startDate.toISOString(),
          endDate: endDate.toISOString(),
          userId
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate weekly report');
      }
      
      const result = await response.json();
      console.log("Weekly report generation successful:", result);
      
      // Now force invalidate queries and refetch all data
      console.log("Invalidating query cache and refetching statistics...");
      queryClient.invalidateQueries({ queryKey: ['/api/statistics/week'] });
      queryClient.invalidateQueries({ queryKey: ['/api/statistics'] });
      
      // Add a slight delay to ensure the server has time to update
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Now refetch all data
      const [weeklyStats, historicalStats] = await Promise.all([
        refetchWeeklyStats(),
        refetchHistoricalStats()
      ]);
      
      console.log("Statistics refreshed successfully:", {
        weeklyStats: weeklyStats.data,
        historicalDataCount: historicalStats.data?.length
      });
      
      return result;
    } catch (error) {
      console.error("Error during statistics refresh:", error);
      // Still try to refresh if generate report fails
      try {
        queryClient.invalidateQueries({ queryKey: ['/api/statistics/week'] });
        queryClient.invalidateQueries({ queryKey: ['/api/statistics'] });
        await Promise.all([refetchWeeklyStats(), refetchHistoricalStats()]);
      } catch (refetchError) {
        console.error("Failed to refetch after error:", refetchError);
      }
      throw error;
    }
  };
  
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
    generateWeeklyReport,
    refreshAllStats,
    refetchWeeklyStats
  };
}
