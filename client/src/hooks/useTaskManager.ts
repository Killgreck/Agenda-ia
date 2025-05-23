import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Task, InsertTask, InsertCheckIn, CheckIn } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { startOfMonth, endOfMonth, format, addDays } from "date-fns";

interface UseTasksOptions {
  month?: number;
  year?: number;
}

export function useTaskManager() {
  const queryClient = useQueryClient();
  
  // Fetch all tasks
  const { data: tasks = [] } = useQuery({
    queryKey: ['/api/tasks'],
    queryFn: async () => {
      const response = await fetch('/api/tasks');
      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }
      const data = await response.json();
      return data.tasks || [];
    }
  });
  
  // Create a new task
  const { mutateAsync: createTask } = useMutation({
    mutationFn: async (taskData: InsertTask) => {
      const response = await apiRequest('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(taskData)
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
    }
  });
  
  // Update an existing task
  const { mutateAsync: updateTask } = useMutation({
    mutationFn: async ({ id, taskData }: { id: number, taskData: Partial<InsertTask> }) => {
      const response = await apiRequest(`/api/tasks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(taskData)
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
    }
  });
  
  // Delete a task
  const { mutateAsync: deleteTask } = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(`/api/tasks/${id}`, {
        method: 'DELETE'
      });
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
    }
  });
  
  return {
    tasks,
    createTask,
    updateTask,
    deleteTask
  };
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
  
  // Check if authentication has been verified - fetch the auth status from localStorage
  const authStorageStr = localStorage.getItem('auth-storage');
  const authStorage = authStorageStr ? JSON.parse(authStorageStr) : { state: { isAuthenticated: false } };
  const isAuthenticated = authStorage?.state?.isAuthenticated;
  
  // Query tasks for the specified month - only run when authenticated
  const { data: tasks = [], isLoading, error } = useQuery({
    queryKey: ['/api/tasks', startDate, endDate],
    queryFn: async () => {
      const response = await fetch(`/api/tasks?startDate=${startDate}&endDate=${endDate}`);
      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }
      return response.json();
    },
    enabled: isAuthenticated // Only run query if authenticated
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
    },
    enabled: isAuthenticated // Only run query if authenticated
  });
  
  // Filter upcoming tasks that aren't completed and sort by date
  const upcomingTasks: Task[] = upcomingTasksData
    .filter((task: Task) => !task.completed)
    .sort((a: Task, b: Task) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3); // Get only the first 3 upcoming tasks
  
  // Create a new task
  const { mutateAsync: createTask, isPending: isCreatingTask } = useMutation({
    mutationFn: async (newTask: InsertTask) => {
      return await apiRequest<Task>('/api/tasks', {
        method: 'POST',
        body: JSON.stringify(newTask)
      });
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
      return await apiRequest<Task>(`/api/tasks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates)
      });
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
      await apiRequest(`/api/tasks/${id}`, {
        method: 'DELETE'
      });
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
  
  // Check if authentication has been verified - fetch the auth status from localStorage
  const authStorageStr = localStorage.getItem('auth-storage');
  const authStorage = authStorageStr ? JSON.parse(authStorageStr) : { state: { isAuthenticated: false } };
  const isAuthenticated = authStorage?.state?.isAuthenticated;
  
  // Get user ID from localStorage for API calls
  const userId = authStorage?.state?.user?.id || 0;
  
  // Submit a new check-in
  const { mutateAsync: submitCheckin, isPending: isCheckingIn } = useMutation({
    mutationFn: async (checkIn: InsertCheckIn) => {
      // Make sure we include the userId in the check-in data
      const checkInWithUser = {
        ...checkIn,
        userId: checkIn.userId || userId
      };
      
      return await apiRequest<CheckIn>('/api/check-ins', {
        method: 'POST',
        body: JSON.stringify(checkInWithUser)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/check-ins'] });
      queryClient.invalidateQueries({ queryKey: ['/api/check-ins/latest'] });
    }
  });
  
  // Get the latest check-in
  const { data: latestCheckIn, isLoading: isLoadingLatest, refetch: refetchLatestCheckIn } = useQuery({
    queryKey: ['/api/check-ins/latest', userId],
    queryFn: async () => {
      // Add userId as a query parameter to get the correct user's data
      const response = await fetch(`/api/check-ins/latest?userId=${userId}`);
      if (!response.ok) {
        if (response.status === 404) {
          // No check-ins yet, return null instead of throwing an error
          return null;
        }
        throw new Error('Failed to fetch latest check-in');
      }
      return response.json();
    },
    enabled: isAuthenticated && userId > 0 // Only enable when authenticated and have a valid userId
  });
  
  return {
    submitCheckin,
    isCheckingIn,
    latestCheckIn,
    isLoadingLatest,
    refetchLatestCheckIn
  };
}
