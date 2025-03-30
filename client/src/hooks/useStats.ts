import { useQuery } from "@tanstack/react-query";
import { WeeklyStats } from "@/types";

export function useStats() {
  // Query for getting weekly statistics
  const { data, isLoading, error } = useQuery({
    queryKey: ['/api/statistics'],
    queryFn: () => {
      // Until we have real data, provide realistic default stats
      return {
        tasksCompleted: 13,
        tasksTotal: 20,
        avgProductivity: 3.9, // out of 5
        aiSuggestionsAccepted: 8,
        aiSuggestionsTotal: 19
      };
    }
  });
  
  // Calculate derived stats
  const stats: WeeklyStats = {
    tasksCompletionRate: data ? Math.round((data.tasksCompleted / data.tasksTotal) * 100) : 65,
    productivityScore: data ? Math.round((data.avgProductivity / 5) * 100) : 78,
    aiSuggestionsRate: data ? Math.round((data.aiSuggestionsAccepted / data.aiSuggestionsTotal) * 100) : 42
  };
  
  return {
    stats,
    isLoading,
    error
  };
}
