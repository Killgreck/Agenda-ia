import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Task, InsertTask, InsertCheckIn, CheckIn } from "@shared/schema";
import { apiRequest } from "@/lib/queryClient";
import { startOfMonth, endOfMonth, format, addDays } from "date-fns";
import { useAuth } from '@/hooks/use-auth';

interface UseTasksOptions {
  month?: number;
  year?: number;
}

export function useTaskManager() {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  
  // Fetch all tasks
  const { data: tasks = [], isLoading, error } = useQuery({
    queryKey: ['/api/tasks'],
    queryFn: async () => {
      console.log('Fetching tasks with auth status:', isAuthenticated);
      const response = await fetch('/api/tasks', {
        credentials: 'include' // Importante para enviar cookies de sesión
      });
      
      if (!response.ok) {
        // Si recibimos un 401, el usuario no está autenticado
        if (response.status === 401) {
          console.warn('User not authenticated when fetching tasks');
          return [];
        }
        throw new Error(`Failed to fetch tasks: ${response.status}`);
      }
      
      const data = await response.json();
      return data || [];
    },
    enabled: isAuthenticated // Solo ejecutar la consulta si el usuario está autenticado
  });
  
  // Create a new task with improved error handling
  const { mutateAsync: createTask } = useMutation({
    mutationFn: async (taskData: InsertTask) => {
      console.log("CreateTask in useTaskManager called with data:", taskData);
      
      // Verificar explícitamente que userId está presente
      if (!taskData.userId) {
        console.error("No userId provided in task data");
        throw new Error("User ID is required for creating tasks. Please login and try again.");
      }
      
      try {
        const response = await apiRequest('/api/tasks', {
          method: 'POST',
          body: JSON.stringify(taskData),
          credentials: 'include' // Asegurar que las cookies de sesión son enviadas
        });
        console.log("Task creation successful:", response);
        return response;
      } catch (error) {
        console.error("Error in createTask mutation:", error);
        throw error; // Re-lanzar para que sea capturado por el componente
      }
    },
    onSuccess: () => {
      console.log("Task created successfully, invalidating queries");
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
    },
    onError: (error) => {
      console.error("Error in task creation:", error);
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
  const { isAuthenticated, user } = useAuth();
  
  // Set up month and year, defaulting to current month/year if not specified
  const month = options?.month !== undefined ? options.month : today.getMonth();
  const year = options?.year !== undefined ? options.year : today.getFullYear();
  
  // Calculate the start and end dates for query
  const monthStart = startOfMonth(new Date(year, month));
  const monthEnd = endOfMonth(new Date(year, month));
  
  // Format dates for the API
  const startDate = format(monthStart, 'yyyy-MM-dd');
  const endDate = format(monthEnd, 'yyyy-MM-dd');
  
  // Query tasks for the specified month - only run when authenticated
  const { data: tasks = [], isLoading, error } = useQuery({
    queryKey: ['/api/tasks', startDate, endDate],
    queryFn: async () => {
      console.log('Fetching tasks for month with auth status:', isAuthenticated);
      const response = await fetch(`/api/tasks?startDate=${startDate}&endDate=${endDate}`, {
        credentials: 'include' // Importante para enviar cookies de sesión
      });
      
      if (!response.ok) {
        // Si recibimos un 401, el usuario no está autenticado
        if (response.status === 401) {
          console.warn('User not authenticated when fetching tasks for month');
          return [];
        }
        throw new Error(`Failed to fetch tasks: ${response.status}`);
      }
      
      return response.json();
    },
    enabled: isAuthenticated // Solo ejecutar la consulta si el usuario está autenticado
  });
  
  // Create a separate upcoming tasks query to ensure it's always up-to-date
  // This provides upcoming tasks for the next 5 days regardless of the month view
  const todayFormatted = format(today, 'yyyy-MM-dd');
  const fiveDaysFromNow = addDays(today, 5);
  const fiveDaysFromNowFormatted = format(fiveDaysFromNow, 'yyyy-MM-dd');
  
  const { data: upcomingTasksData = [] } = useQuery({
    queryKey: ['/api/tasks/upcoming', todayFormatted, fiveDaysFromNowFormatted],
    queryFn: async () => {
      console.log('Fetching upcoming tasks with auth status:', isAuthenticated);
      const response = await fetch(`/api/tasks?startDate=${todayFormatted}&endDate=${fiveDaysFromNowFormatted}`, {
        credentials: 'include' // Importante para enviar cookies de sesión
      });
      
      if (!response.ok) {
        // Si recibimos un 401, el usuario no está autenticado
        if (response.status === 401) {
          console.warn('User not authenticated when fetching upcoming tasks');
          return [];
        }
        throw new Error(`Failed to fetch upcoming tasks: ${response.status}`);
      }
      
      return response.json();
    },
    enabled: isAuthenticated // Solo ejecutar la consulta si el usuario está autenticado
  });
  
  // Filter upcoming tasks that aren't completed and sort by date
  const upcomingTasks: Task[] = upcomingTasksData
    .filter((task: Task) => !task.completed)
    .sort((a: Task, b: Task) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(0, 3); // Get only the first 3 upcoming tasks
  
  // Create a new task with improved validation and error handling
  const { mutateAsync: createTask, isPending: isCreatingTask } = useMutation({
    mutationFn: async (newTask: InsertTask) => {
      console.log('Creating task with auth status:', isAuthenticated);
      
      // Verificar autenticación
      if (!isAuthenticated) {
        throw new Error('User is not authenticated. Please log in first.');
      }
      
      // Verificar que newTask tenga userId
      if (!newTask.userId) {
        console.error("No userId provided in task data");
        
        // Si el usuario está autenticado pero no se proporciona userId, añadirlo
        if (user?.id) {
          console.log('Adding missing userId from authenticated user:', user.id);
          newTask.userId = user.id;
        } else {
          throw new Error('User ID is required for creating tasks. Please login and try again.');
        }
      }
      
      // Añadir más logs para debugging
      console.log('Task data to be sent:', JSON.stringify(newTask, null, 2));
      
      try {
        const result = await apiRequest<Task>('/api/tasks', {
          method: 'POST',
          body: JSON.stringify(newTask),
          credentials: 'include' // Importante para enviar cookies de sesión
        });
        
        console.log('Task creation response:', result);
        return result;
      } catch (error) {
        console.error('Error in task creation API request:', error);
        throw error; // Re-lanzar para que sea capturado por el componente
      }
    },
    onSuccess: (data) => {
      console.log('Task created successfully, task ID:', data.id);
      // Invalidate all task queries to refresh data across all components
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      // Specifically invalidate upcoming tasks to ensure sidebar is updated
      queryClient.invalidateQueries({ queryKey: ['/api/tasks/upcoming'] });
    },
    onError: (error) => {
      console.error('Error creating task:', error);
    }
  });
  
  // Update a task
  const { mutateAsync: updateTask, isPending: isUpdatingTask } = useMutation({
    mutationFn: async ({ id, ...updates }: { id: number } & Partial<InsertTask>) => {
      console.log('Updating task with auth status:', isAuthenticated);
      
      if (!isAuthenticated) {
        throw new Error('User is not authenticated. Please log in first.');
      }
      
      return await apiRequest<Task>(`/api/tasks/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(updates),
        credentials: 'include' // Importante para enviar cookies de sesión
      });
    },
    onSuccess: () => {
      console.log('Task updated successfully, invalidating queries');
      // Invalidate all task queries to refresh data across all components
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      // Specifically invalidate upcoming tasks to ensure sidebar is updated
      queryClient.invalidateQueries({ queryKey: ['/api/tasks/upcoming'] });
    },
    onError: (error) => {
      console.error('Error updating task:', error);
    }
  });
  
  // Delete a task
  const { mutateAsync: deleteTask, isPending: isDeletingTask } = useMutation({
    mutationFn: async (id: number) => {
      console.log('Deleting task with auth status:', isAuthenticated);
      
      if (!isAuthenticated) {
        throw new Error('User is not authenticated. Please log in first.');
      }
      
      await apiRequest(`/api/tasks/${id}`, {
        method: 'DELETE',
        credentials: 'include' // Importante para enviar cookies de sesión
      });
      return id;
    },
    onSuccess: () => {
      console.log('Task deleted successfully, invalidating queries');
      // Invalidate all task queries to refresh data across all components
      queryClient.invalidateQueries({ queryKey: ['/api/tasks'] });
      // Specifically invalidate upcoming tasks to ensure sidebar is updated
      queryClient.invalidateQueries({ queryKey: ['/api/tasks/upcoming'] });
    },
    onError: (error) => {
      console.error('Error deleting task:', error);
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
  const { isAuthenticated, user } = useAuth();
  
  // Get user ID from auth context
  const userId = user?.id || 0;
  
  // Submit a new check-in
  const { mutateAsync: submitCheckin, isPending: isCheckingIn } = useMutation({
    mutationFn: async (checkIn: InsertCheckIn) => {
      console.log('Submitting check-in with auth status:', isAuthenticated);
      
      if (!isAuthenticated) {
        throw new Error('User is not authenticated. Please log in first.');
      }
      
      // Make sure we include the userId in the check-in data
      const checkInWithUser = {
        ...checkIn,
        userId: checkIn.userId || userId
      };
      
      return await apiRequest<CheckIn>('/api/check-ins', {
        method: 'POST',
        body: JSON.stringify(checkInWithUser),
        credentials: 'include' // Importante para enviar cookies de sesión
      });
    },
    onSuccess: () => {
      console.log('Check-in submitted successfully, invalidating queries');
      queryClient.invalidateQueries({ queryKey: ['/api/check-ins'] });
      queryClient.invalidateQueries({ queryKey: ['/api/check-ins/latest'] });
    },
    onError: (error) => {
      console.error('Error submitting check-in:', error);
    }
  });
  
  // Get the latest check-in
  const { data: latestCheckIn, isLoading: isLoadingLatest, refetch: refetchLatestCheckIn } = useQuery({
    queryKey: ['/api/check-ins/latest', userId],
    queryFn: async () => {
      console.log('Fetching latest check-in with auth status:', isAuthenticated);
      
      // Add userId as a query parameter to get the correct user's data
      const response = await fetch(`/api/check-ins/latest?userId=${userId}`, {
        credentials: 'include' // Importante para enviar cookies de sesión
      });
      
      if (!response.ok) {
        // Si recibimos un 401, el usuario no está autenticado
        if (response.status === 401) {
          console.warn('User not authenticated when fetching latest check-in');
          return null;
        }
        
        if (response.status === 404) {
          // No check-ins yet, return null instead of throwing an error
          return null;
        }
        
        throw new Error(`Failed to fetch latest check-in: ${response.status}`);
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
