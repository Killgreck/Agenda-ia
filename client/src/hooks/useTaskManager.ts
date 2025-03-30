import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Task, InsertTask, InsertCheckIn } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { startOfMonth, endOfMonth, format, addDays } from "date-fns";

interface UseTasksOptions {
  month?: number;
  year?: number;
}

export function useTasks(options?: UseTasksOptions) {
  const queryClient = useQueryClient();
  const today = new Date();
  
  // Set up month and year, defaulting to current month/year if not specified
  const month = options?.month !== undefined ? options.month : today.getMonth();
  const year = options?.year !== undefined ? options.year : today.getFullYear();
  
  // Calculate the start and end dates for query
  const monthStart = startOfMonth(new Date(year, month));
  const monthEnd = endOfMonth(new Date(year, month));
  
  // Format dates for the API
  const startDate = format(monthStart, 'yyyy-MM-dd');
  const endDate = format(monthEnd, 'yyyy-MM-dd');
  
  // Query tasks for the specified month
  const { data: tasks = [], isLoading, error } = useQuery({
    queryKey: ['/api/tasks', startDate, endDate],
    queryFn: async () => {
      const response = await fetch(`/api/tasks?startDate=${startDate}&endDate=${endDate}`);
      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }
      return response.json();
    }
  });
  
  // Create a separate upcoming tasks query to ensure it's always up-to-date
  // This provides upcoming tasks for the next 5 days regardless of the month view
  const todayFormatted = format(today, 'yyyy-MM-dd');
  const fiveDaysFromNow = addDays(today, 5);
  const fiveDaysFromNowFormatted = format(fiveDaysFromNow, 'yyyy-MM-dd');
  
  const { data: upcomingTasksData = [] } = useQuery({
    queryKey: ['/api/tasks/upcoming', todayFormatted, fiveDaysFromNowFormatted],
    queryFn: async () => {
      const response = await fetch(`/api/tasks?startDate=${todayFormatted}&endDate=${fiveDaysFromNowFormatted}`);
      if (!response.ok) {
        throw new Error('Failed to fetch upcoming tasks');
      }
      return response.json();
    }
  });
  
  // Filter upcoming tasks that aren't completed and sort by date
  const upcomingTasks: Task[] = upcomingTasksData
    .filter((task: Task) => !task.completed)
    .sort((a: Task, b: Task) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3); // Get only the first 3 upcoming tasks
  
  // Create a new task
  const { mutateAsync: createTask, isPending: isCreatingTask } = useMutation({
    mutationFn: async (newTask: InsertTask) => {
      const response = await apiRequest('POST', '/api/tasks', newTask);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all task queries to refresh data across all components
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      // Specifically invalidate upcoming tasks to ensure sidebar is updated
      queryClient.invalidateQueries({ queryKey: ['/api/tasks/upcoming'] });
    }
  });
  
  // Update a task
  const { mutateAsync: updateTask, isPending: isUpdatingTask } = useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & Partial<InsertTask>) => {
      const response = await apiRequest('PATCH', `/api/tasks/${id}`, updates);
      return response.json();
    },
    onSuccess: () => {
      // Invalidate all task queries to refresh data across all components
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      // Specifically invalidate upcoming tasks to ensure sidebar is updated
      queryClient.invalidateQueries({ queryKey: ['/api/tasks/upcoming'] });
    }
  });
  
  // Delete a task
  const { mutateAsync: deleteTask, isPending: isDeletingTask } = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest('DELETE', `/api/tasks/${id}`);
      return id;
    },
    onSuccess: () => {
      // Invalidate all task queries to refresh data across all components
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      // Specifically invalidate upcoming tasks to ensure sidebar is updated
      queryClient.invalidateQueries({ queryKey: ['/api/tasks/upcoming'] });
    }
  });
  
  return {
    tasks,
    upcomingTasks,
    isLoading,
    error,
    createTask,
    updateTask,
    deleteTask,
    isCreatingTask,
    isUpdatingTask,
    isDeletingTask
  };
}

export function useCheckin() {
  const queryClient = useQueryClient();
  
  // Submit a new check-in
  const { mutateAsync: submitCheckin, isPending: isCheckingIn } = useMutation({
    mutationFn: async (checkIn: InsertCheckIn) => {
      const response = await apiRequest('POST', '/api/check-ins', checkIn);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/check-ins'] });
      queryClient.invalidateQueries({ queryKey: ['/api/check-ins/latest'] });
    }
  });
  
  // Get the latest check-in
  const { data: latestCheckIn, isLoading: isLoadingLatest } = useQuery({
    queryKey: ['/api/check-ins/latest'],
    enabled: false // Only load on demand
  });
  
  return {
    submitCheckin,
    isCheckingIn,
    latestCheckIn,
    isLoadingLatest
  };
}
