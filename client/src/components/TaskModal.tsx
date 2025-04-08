import React, { useState, useEffect } from 'react';
import { X, CalendarDays, AlertTriangle, LightbulbIcon } from 'lucide-react';
import { z } from 'zod';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format, addDays } from 'date-fns';
import { Task, InsertTask } from '@shared/schema';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { isHoliday } from '@/utils/holidays';
import { findPostponeSuggestions } from '@/utils/postponeSuggestions';
import { useTaskManager } from '@/hooks/useTaskManager';
import { useAI } from '@/hooks/useAI';

// Create a schema for task form validation
const taskFormSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  date: z.string().optional(),
  endDate: z.string().optional(),
  time: z.string().optional(),
  endTime: z.string().optional(),
  priority: z.string().optional().default("medium"),
  isAllDay: z.boolean().default(false),
  location: z.string().optional(),
  reminder: z.array(z.number()).optional(),
  isRecurring: z.boolean().default(false),
  recurrenceType: z.string().optional(),
  recurrenceStartDate: z.string().optional(),
  recurrenceEndDate: z.string().optional(),
  recurringDays: z.array(z.string()).optional(),
  skipHolidays: z.boolean().default(false),
  holidayCountry: z.string().optional(),
});

// Function to format date to preserve the local day when converting to ISO
function formatDateToPreserveLocalDay(date: Date): string {
  const offset = date.getTimezoneOffset();
  const adjustedDate = new Date(date.getTime() - offset * 60 * 1000);
  return adjustedDate.toISOString().split('T')[0];
}

type TaskFormValues = z.infer<typeof taskFormSchema>;

// Function to suggest end date based on recurrence type
function suggestEndDateForRecurrence(startDate: Date, recurrenceType: string): Date {
  switch(recurrenceType) {
    case 'daily':
      return addDays(startDate, 7); // 1 week for daily recurrence
    case 'weekly':
      return addDays(startDate, 28); // 4 weeks for weekly recurrence
    case 'monthly':
      // Add 1 month - same day next month
      const nextMonth = new Date(startDate);
      nextMonth.setMonth(nextMonth.getMonth() + 1);
      return nextMonth;
    case 'yearly':
      // Add 1 year - same day next year
      const nextYear = new Date(startDate);
      nextYear.setFullYear(nextYear.getFullYear() + 1);
      return nextYear;
    default:
      return addDays(startDate, 7); // Default to 1 week
  }
}

interface TaskModalProps {
  open: boolean;
  onClose: () => void;
  taskToEdit?: Task;
  viewOnly?: boolean;
}

export default function TaskModal({ open, onClose, taskToEdit, viewOnly = false }: TaskModalProps) {
  const { toast } = useToast();
  const { createTask, updateTask, tasks: allTasks } = useTaskManager();
  const { askAiForTaskSuggestion } = useAI();
  const [isCreatingTask, setIsCreatingTask] = useState(false);
  const [isAskingAi, setIsAskingAi] = useState(false);
  
  // Initialize form with default values or task to edit
  const { control, handleSubmit, watch, reset, setValue, formState: { errors } } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: taskToEdit ? {
      title: taskToEdit.title,
      description: taskToEdit.description || "",
      date: taskToEdit.date ? new Date(taskToEdit.date).toISOString().split('T')[0] : undefined,
      endDate: taskToEdit.endDate ? new Date(taskToEdit.endDate).toISOString().split('T')[0] : undefined,
      time: taskToEdit.date && !taskToEdit.isAllDay ? new Date(taskToEdit.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : undefined,
      endTime: taskToEdit.endDate && !taskToEdit.isAllDay ? new Date(taskToEdit.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false }) : undefined,
      priority: taskToEdit.priority || "medium",
      isAllDay: taskToEdit.isAllDay || false,
      location: taskToEdit.location || "",
      reminder: taskToEdit.reminder || [],
      isRecurring: taskToEdit.isRecurring || false,
      recurrenceType: taskToEdit.recurrenceType || "daily",
      recurrenceStartDate: taskToEdit.recurrenceStartDate ? new Date(taskToEdit.recurrenceStartDate).toISOString().split('T')[0] : undefined,
      recurrenceEndDate: taskToEdit.recurrenceEndDate ? new Date(taskToEdit.recurrenceEndDate).toISOString().split('T')[0] : undefined,
      recurringDays: taskToEdit.recurringDays || [],
      skipHolidays: taskToEdit.skipHolidays || false,
      holidayCountry: taskToEdit.holidayCountry || "",
    } : {
      title: "",
      description: "",
      date: format(new Date(), "yyyy-MM-dd"),
      endDate: "",
      time: "",
      endTime: "",
      priority: "medium",
      isAllDay: false,
      location: "",
      reminder: [],
      isRecurring: false,
      recurrenceType: "daily",
      recurrenceStartDate: format(new Date(), "yyyy-MM-dd"),
      recurrenceEndDate: format(addDays(new Date(), 7), "yyyy-MM-dd"),
      recurringDays: [],
      skipHolidays: false,
      holidayCountry: "",
    }
  });
  
  // Watch the value of isAllDay to conditionally display time fields
  const isAllDay = watch("isAllDay");
  
  // Reset form when modal is closed
  useEffect(() => {
    if (!open) {
      reset();
    }
  }, [open, reset]);
  
  // Check for time conflicts with existing tasks
  const checkTimeConflicts = async (date: Date, endDate?: Date, isAllDay: boolean = false): Promise<string | null> => {
    try {
      // Get the date string for the task
      const dateStr = date.toISOString().split('T')[0];
      
      // Filter tasks for the same day
      const tasksOnSameDay = allTasks.filter((task: Task) => {
        const taskDate = new Date(task.date);
        return taskDate.toISOString().split('T')[0] === dateStr && !task.isRecurring;
      });
      
      if (isAllDay) {
        // For all-day events, check if there are other all-day events
        const existingAllDayEvents = tasksOnSameDay.filter((task: Task) => task.isAllDay);
        if (existingAllDayEvents.length > 0) {
          return `You already have ${existingAllDayEvents.length} all-day events scheduled on this date. Would you like to merge them?`;
        }
        return null;
      } else {
        // For time-specific events, check for overlaps
        const conflictingTasks = tasksOnSameDay.filter((task: Task) => {
          if (task.isAllDay) return false; // Ignore all-day events
          
          const taskStart = new Date(task.date).getTime();
          const taskEnd = task.endDate ? new Date(task.endDate).getTime() : taskStart + 3600000; // Default 1 hour
          
          const newTaskStart = date.getTime();
          const newTaskEnd = endDate ? endDate.getTime() : newTaskStart + 3600000; // Default 1 hour
          
          // Check for overlap
          return (
            (newTaskStart >= taskStart && newTaskStart < taskEnd) || // New task starts during existing task
            (newTaskEnd > taskStart && newTaskEnd <= taskEnd) || // New task ends during existing task
            (newTaskStart <= taskStart && newTaskEnd >= taskEnd) // New task completely contains existing task
          );
        });
        
        if (conflictingTasks.length > 0) {
          const conflictDetails = conflictingTasks.map((task: Task) => `"${task.title}" at ${new Date(task.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`).join(", ");
          
          // Generate postpone suggestions
          const suggestions = findPostponeSuggestions(tasksOnSameDay, date);
          const suggestionText = suggestions.length > 0 
            ? ` Would you like to reschedule to one of these times instead: ${suggestions.map(d => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })).join(', ')}?`
            : '';
          
          return `Time conflict with: ${conflictDetails}.${suggestionText}`;
        }
        
        return null;
      }
    } catch (error) {
      console.error("Error checking time conflicts:", error);
      return "Error checking for conflicts. Please try again.";
    }
  };
  
  // Function to find available time slots on a given day
  const findAvailableTimeSlots = (tasksOnDay: Task[], preferredDate: Date): Date[] => {
    // Convert tasks to busy time ranges
    const busyRanges: {start: Date, end: Date, title: string}[] = tasksOnDay
      .filter(task => !task.isAllDay)
      .map(task => {
        const start = new Date(task.date);
        const end = task.endDate ? new Date(task.endDate) : new Date(start.getTime() + 60 * 60 * 1000); // Default 1 hour
        return { start, end, title: task.title };
      });
    
    // Sort busy ranges by start time
    busyRanges.sort((a, b) => a.start.getTime() - b.start.getTime());
    
    // Find available slots (assuming working hours 9 AM - 6 PM)
    const availableSlots: Date[] = [];
    let currentTime: Date;
    
    // Set start time to 9 AM on the preferred date if before 9 AM, otherwise use the preferred time
    const workDayStart = new Date(preferredDate);
    workDayStart.setHours(9, 0, 0, 0);
    
    // Set end time to 6 PM on the preferred date
    const workDayEnd = new Date(preferredDate);
    workDayEnd.setHours(18, 0, 0, 0);
    
    // If preferred time is before work hours, start at beginning of work day
    if (preferredDate.getTime() < workDayStart.getTime()) {
      currentTime = new Date(workDayStart);
    } 
    // If preferred time is after work hours, suggest next day
    else if (preferredDate.getTime() > workDayEnd.getTime()) {
      const nextDay = new Date(preferredDate);
      nextDay.setDate(nextDay.getDate() + 1);
      nextDay.setHours(9, 0, 0, 0);
      currentTime = nextDay;
    } 
    // Otherwise start at the preferred time
    else {
      currentTime = new Date(preferredDate);
    }
    
    // Find 3 available slots
    while (availableSlots.length < 3 && currentTime.getTime() < workDayEnd.getTime()) {
      // Check if current time conflicts with any busy range
      const isConflict = busyRanges.some(range => 
        currentTime.getTime() >= range.start.getTime() && 
        currentTime.getTime() < range.end.getTime()
      );
      
      if (!isConflict) {
        availableSlots.push(new Date(currentTime));
        // Move to next 30-minute slot
        currentTime.setMinutes(currentTime.getMinutes() + 30);
      } else {
        // Find the end of the current conflict
        const conflictEnd = busyRanges.find(range => 
          currentTime.getTime() >= range.start.getTime() && 
          currentTime.getTime() < range.end.getTime()
        )?.end;
        
        if (conflictEnd) {
          currentTime = new Date(conflictEnd);
        } else {
          // Fallback: move 30 minutes ahead
          currentTime.setMinutes(currentTime.getMinutes() + 30);
        }
      }
    }
    
    // If we couldn't find enough slots today, check tomorrow
    if (availableSlots.length < 3) {
      const tomorrow = new Date(preferredDate);
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      
      // Add early morning slot
      availableSlots.push(tomorrow);
      
      // Add mid-morning slot
      const midMorning = new Date(tomorrow);
      midMorning.setHours(11, 0, 0, 0);
      availableSlots.push(midMorning);
      
      // Add afternoon slot
      const afternoon = new Date(tomorrow);
      afternoon.setHours(14, 0, 0, 0);
      availableSlots.push(afternoon);
    }
    
    return availableSlots;
  };
  
  // Handle form submission
  const onSubmit = async (data: TaskFormValues) => {
    try {
      setIsCreatingTask(true);
      
      // Validate required fields
      if (!data.title) {
        toast({
          title: "Missing Information",
          description: "Please enter a title for the task.",
          variant: "destructive",
        });
        setIsCreatingTask(false);
        return;
      }
      
      // Initialize date variables at a higher scope
      let dateObj: Date;
      let endDateObj: Date | undefined;
      
      // Handle different date logic for recurring vs single events
      if (data.isRecurring) {
        // For recurring events, validate recurrence settings
        if (!data.recurrenceStartDate) {
          toast({
            title: "Missing Information",
            description: "Please select a start date for the recurring event.",
            variant: "destructive",
          });
          return;
        }
        
        // Verificar que la fecha de inicio de recurrencia no sea en el pasado
        const recurrStartDate = new Date(data.recurrenceStartDate);
        recurrStartDate.setHours(0, 0, 0, 0); // Reset time part for date comparison
        
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time part for date comparison
        
        // Cambiamos la comparación para permitir tareas que comienzan hoy
        if (recurrStartDate.getTime() < today.getTime() && 
            !(recurrStartDate.getDate() === today.getDate() && 
              recurrStartDate.getMonth() === today.getMonth() && 
              recurrStartDate.getFullYear() === today.getFullYear())) {
          toast({
            title: "Invalid Start Date",
            description: "Cannot schedule recurring events starting in the past. Please select a present or future date.",
            variant: "destructive",
          });
          return;
        }
        
        if (!data.recurrenceEndDate) {
          toast({
            title: "Missing Information",
            description: "Please select an end date for the recurring event.",
            variant: "destructive",
          });
          return;
        }
        
        if (data.recurrenceType === "weekly" && (!data.recurringDays || data.recurringDays.length === 0)) {
          toast({
            title: "Missing Information",
            description: "Please select at least one day of the week for weekly recurring events.",
            variant: "destructive",
          });
          return;
        }
        
        // Use recurrence start date as the main date
        dateObj = new Date(data.recurrenceStartDate);
        
        // Validate that start date is before end date
        const startDate = new Date(data.recurrenceStartDate);
        const endDate = new Date(data.recurrenceEndDate);
        if (startDate > endDate) {
          toast({
            title: "Invalid Date Range",
            description: "The start date must be before the end date.",
            variant: "destructive",
          });
          return;
        }
        
        // Time handling
        if (!isAllDay && data.time) {
          const [hours, minutes] = data.time.split(':').map(Number);
          dateObj.setHours(hours, minutes);
        } else {
          dateObj.setHours(0, 0, 0, 0);
        }
        
        // Process recurrence end date
        endDateObj = new Date(data.recurrenceEndDate);
        if (!isAllDay && data.endTime) {
          const [hours, minutes] = data.endTime.split(':').map(Number);
          endDateObj.setHours(hours, minutes);
        } else {
          endDateObj.setHours(23, 59, 59, 999);
        }
      } else {
        // For single events, check if date is provided
        if (!data.date) {
          toast({
            title: "Missing Information",
            description: "Please select a date for the event.",
            variant: "destructive",
          });
          return;
        }
        
        // Verificar que la fecha no sea en el pasado
        const selectedDate = new Date(data.date);
        selectedDate.setHours(0, 0, 0, 0); // Reset time part for date comparison
        
        const today = new Date();
        today.setHours(0, 0, 0, 0); // Reset time part for date comparison
        
        // Cambiamos la comparación para permitir tareas que comienzan hoy
        if (selectedDate.getTime() < today.getTime() &&
            !(selectedDate.getDate() === today.getDate() && 
              selectedDate.getMonth() === today.getMonth() && 
              selectedDate.getFullYear() === today.getFullYear())) {
          toast({
            title: "Invalid Date",
            description: "Cannot schedule tasks in the past. Please select a present or future date.",
            variant: "destructive",
          });
          return;
        }
        
        if (!isAllDay && !data.time) {
          toast({
            title: "Missing Information",
            description: "Please specify a time for the event.",
            variant: "destructive",
          });
          return;
        }
        
        // For single events, use the regular date fields
        // Crear la fecha con control preciso sobre la hora local
        // Esto evita que la zona horaria afecte la visualización
        const dateStr = data.date; // Formato YYYY-MM-DD
        let timeStr = '00:00:00';
        
        if (!isAllDay && data.time) {
          timeStr = `${data.time}:00`; // Añadir los segundos
        }
        
        // Crear la fecha combinando la fecha y hora explícitamente
        dateObj = new Date(`${dateStr}T${timeStr}`);
        
        // Mantenemos la fecha tal cual está, sin aplicar ajustes de zona horaria
        // Ya que el problema de la fecha está resuelto, no necesitamos compensar las horas
        // dateObj mantiene la fecha y hora exactas que el usuario seleccionó
        
        // Process regular end date if provided
        if (data.endDate) {
          // Crear la fecha de fin con control preciso sobre la hora local
          const endDateStr = data.endDate; // Formato YYYY-MM-DD
          let endTimeStr = '23:59:59'; // Por defecto, final del día
          
          if (!isAllDay && data.endTime) {
            endTimeStr = `${data.endTime}:00`; // Añadir los segundos
          }
          
          // Crear la fecha combinando la fecha y hora explícitamente
          endDateObj = new Date(`${endDateStr}T${endTimeStr}`);
          
          // Mantenemos la fecha tal cual está, sin aplicar ajustes de zona horaria
          // Ya que el problema de la fecha está resuelto, no necesitamos compensar las horas
          
          // Validate that end date is not before start date
          if (endDateObj < dateObj) {
            toast({
              title: "Invalid Date Range",
              description: "The end date cannot be before the start date.",
              variant: "destructive",
            });
            return;
          }
        }
      }

      // Check for time conflicts for non-recurring events
      if (!data.isRecurring && dateObj) {
        const conflictMessage = await checkTimeConflicts(dateObj, endDateObj, data.isAllDay);
        if (conflictMessage) {
          toast({
            title: "Time Conflict Detected",
            description: conflictMessage,
            variant: "destructive",
          });
          // Prevent creating the task due to scheduling conflict
          return;
        }
      }

      // Convierte la fecha a un string en formato ISO
      // Mantenemos el formato ISO pero sin aplicar ningún ajuste adicional
      // ya que ya hemos compensado las diferencias de zona horaria anteriormente
      const formatDateToPreserveLocalDay = (date: Date): string => {
        // Formato directo de la fecha a ISO
        return date.toISOString();
      };
      
      const taskData: InsertTask = {
        title: data.title,
        description: data.description || "",
        userId: 0, // This will be populated by the server based on the session
        date: formatDateToPreserveLocalDay(dateObj), // Format date to preserve local time 
        endDate: endDateObj ? formatDateToPreserveLocalDay(endDateObj) : undefined,
        priority: data.priority,
        location: data.location || "",
        isAllDay: data.isAllDay,
        reminder: data.reminder,
        completed: false,
        isRecurring: data.isRecurring,
        recurringDays: data.recurringDays,
        skipHolidays: data.skipHolidays,
        holidayCountry: data.holidayCountry || undefined,
        recurrenceType: data.recurrenceType,
        recurrenceStartDate: data.isRecurring ? formatDateToPreserveLocalDay(dateObj) : undefined,
        recurrenceEndDate: data.isRecurring && endDateObj ? formatDateToPreserveLocalDay(endDateObj) : undefined,
      };
      
      console.log("Attempting to create task:", taskData);
      const result = await createTask(taskData);
      console.log("Task creation result:", result);
      
      toast({
        title: "Success",
        description: "Task created successfully!",
      });
      
      onClose();
    } catch (error) {
      console.error("Error creating task:", error);
      let errorMessage = "An unexpected error occurred. Please try again.";
      
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (typeof error === 'string') {
        errorMessage = error;
      } else if (error instanceof Response) {
        try {
          const data = await error.json();
          errorMessage = data.message || errorMessage;
        } catch (e) {
          errorMessage = `Server error (${error.status}): ${error.statusText}`;
        }
      }
      
      toast({
        title: "Error Creating Task",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };
  
  const isRecurring = watch("isRecurring");
  const skipHolidays = watch("skipHolidays");
  const selectedDate = watch("date");
  const recurrenceType = watch("recurrenceType");
  
  // Check if the selected date falls on a holiday
  const [holidayInfo, setHolidayInfo] = useState<{ isHoliday: boolean; holidayName?: string }>({ isHoliday: false });
  const [selectedCountry, setSelectedCountry] = useState<string>(watch("holidayCountry") || "");
  
  // Update holiday check when date or country changes
  const recurrenceStartDate = watch("recurrenceStartDate");
  
  // Update end date when recurrence type or start date changes
  useEffect(() => {
    // Only update if we're dealing with recurring events and have a start date
    if (isRecurring && recurrenceStartDate) {
      try {
        const startDate = new Date(recurrenceStartDate);
        // Make sure we have a valid date before proceeding
        if (!isNaN(startDate.getTime())) {
          const suggestedEndDate = suggestEndDateForRecurrence(startDate, recurrenceType || "daily");
          setValue("recurrenceEndDate", format(suggestedEndDate, "yyyy-MM-dd"));
        }
      } catch (error) {
        console.error("Error updating recurrence end date:", error);
      }
    }
  }, [isRecurring, recurrenceType, recurrenceStartDate, setValue]);
  
  useEffect(() => {
    // Check holidays based on whether it's recurring or not
    if (isRecurring && recurrenceStartDate && selectedCountry) {
      const dateObj = new Date(recurrenceStartDate);
      const holidayCheck = isHoliday(dateObj, selectedCountry);
      setHolidayInfo(holidayCheck);
    } else if (selectedDate && selectedCountry) {
      const dateObj = new Date(selectedDate);
      const holidayCheck = isHoliday(dateObj, selectedCountry);
      setHolidayInfo(holidayCheck);
    } else {
      setHolidayInfo({ isHoliday: false });
    }
  }, [selectedDate, recurrenceStartDate, selectedCountry, isRecurring]);
  
  const handleAskAI = async () => {
    const title = watch("title");
    const description = watch("description") || "";
    
    if (!title) {
      toast({
        title: "Missing Information",
        description: "Please enter a task title first.",
        variant: "default",
      });
      return;
    }
    
    try {
      const suggestion = await askAiForTaskSuggestion(title, description);
      
      if (suggestion) {
        // Apply AI suggestion to form
        toast({
          title: "AI Suggestion Applied",
          description: "The AI has suggested some improvements to your task.",
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to get AI suggestions. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={() => onClose()}>
      <DialogContent className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-auto p-0 max-h-[70vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex justify-between items-center p-4 border-b border-gray-200 flex-shrink-0">
          <DialogTitle className="text-lg font-medium text-gray-800">
            {viewOnly ? "View Task" : taskToEdit ? "Edit Task" : "Create New Task"}
          </DialogTitle>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X className="h-5 w-5" />
          </Button>
        </DialogHeader>
        
        <div className="overflow-y-auto flex-grow custom-scrollbar px-4 pt-4" style={{ maxHeight: 'calc(70vh - 140px)' }}>
          <form onSubmit={viewOnly ? (e) => { e.preventDefault(); } : handleSubmit(onSubmit)} id="task-form">
            <div className="mb-4">
            <Label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
              Task Title
            </Label>
            <Controller
              name="title"
              control={control}
              render={({ field }) => (
                <Input 
                  {...field} 
                  id="title"
                  className={`w-full border border-gray-300 rounded-lg ${viewOnly ? 'bg-gray-50' : ''}`}
                  placeholder="Enter task title" 
                  readOnly={viewOnly}
                  disabled={viewOnly}
                />
              )}
            />
            {errors.title && !viewOnly && (
              <p className="text-xs text-red-500 mt-1">{errors.title.message}</p>
            )}
          </div>
          
          <div className="mb-4">
            <Label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description
            </Label>
            <Controller
              name="description"
              control={control}
              render={({ field }) => (
                <Textarea 
                  id="description"
                  className={`w-full border border-gray-300 rounded-lg ${viewOnly ? 'bg-gray-50' : ''}`}
                  rows={3} 
                  placeholder="Task description"
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  value={field.value || ""}
                  ref={field.ref}
                  name={field.name}
                  readOnly={viewOnly}
                  disabled={viewOnly}
                />
              )}
            />
          </div>
          
          {/* Recurring Event Settings - moved to top */}
          <div className="mb-4 border-t pt-4">
            <Controller
              name="isRecurring"
              control={control}
              render={({ field }) => (
                <div className="flex items-center mb-2">
                  <Checkbox 
                    id="isRecurring" 
                    checked={field.value}
                    onCheckedChange={viewOnly ? undefined : field.onChange}
                    disabled={viewOnly}
                  />
                  <Label htmlFor="isRecurring" className="ml-2 text-sm font-medium text-gray-700 flex items-center">
                    <CalendarDays className="h-4 w-4 mr-1" />
                    Recurring event
                  </Label>
                </div>
              )}
            />
            
            {isRecurring && (
              <div className="mt-2 ml-7">
                {/* Recurrence Type Selection */}
                <div className="mb-4">
                  <Label htmlFor="recurrenceType" className="block text-sm font-medium text-gray-700 mb-1">
                    Recurrence Type
                  </Label>
                  <Controller
                    name="recurrenceType"
                    control={control}
                    render={({ field }) => (
                      <Select 
                        onValueChange={field.onChange}
                        value={field.value}
                        defaultValue={field.value}
                      >
                        <SelectTrigger className="w-full border border-gray-300 rounded-lg">
                          <SelectValue placeholder="Select recurrence type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                
                {/* Date Range Selection for Recurring Events */}
                <div className="mb-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="recurrenceStartDate" className="block text-sm font-medium text-gray-700 mb-1">
                        Starts On
                      </Label>
                      <Controller
                        name="recurrenceStartDate"
                        control={control}
                        render={({ field }) => (
                          <Input 
                            {...field} 
                            id="recurrenceStartDate"
                            type="date" 
                            min={new Date().toISOString().split('T')[0]} // Establecer fecha mínima como hoy
                            className="w-full border border-gray-300 rounded-lg" 
                          />
                        )}
                      />
                    </div>
                    <div>
                      <Label htmlFor="recurrenceEndDate" className="block text-sm font-medium text-gray-700 mb-1">
                        Ends On
                      </Label>
                      <Controller
                        name="recurrenceEndDate"
                        control={control}
                        render={({ field }) => (
                          <Input 
                            {...field} 
                            id="recurrenceEndDate"
                            type="date" 
                            min={watch("recurrenceStartDate") || new Date().toISOString().split('T')[0]} // Fecha mínima es la fecha inicio o hoy
                            className="w-full border border-gray-300 rounded-lg" 
                          />
                        )}
                      />
                    </div>
                  </div>
                  
                  {!isAllDay && (
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div>
                        <Label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">
                          Start Time
                        </Label>
                        <Controller
                          name="time"
                          control={control}
                          render={({ field }) => (
                            <Input 
                              {...field} 
                              id="time"
                              type="time" 
                              className="w-full border border-gray-300 rounded-lg" 
                            />
                          )}
                        />
                      </div>
                      <div>
                        <Label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">
                          End Time
                        </Label>
                        <Controller
                          name="endTime"
                          control={control}
                          render={({ field }) => (
                            <Input 
                              {...field} 
                              id="endTime"
                              type="time" 
                              className="w-full border border-gray-300 rounded-lg" 
                            />
                          )}
                        />
                      </div>
                    </div>
                  )}
                </div>
                
                {recurrenceType === "weekly" && (
                  <>
                    <Label className="block text-sm font-medium text-gray-700 mb-1">
                      Repeat on these days
                    </Label>
                    <div className="grid grid-cols-7 gap-1 mt-1">
                      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => (
                        <Controller
                          key={day}
                          name="recurringDays"
                          control={control}
                          render={({ field }) => {
                            const dayName = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"][index];
                            const isSelected = field.value?.includes(dayName);
                            
                            return (
                              <Button
                                type="button"
                                variant={isSelected ? "default" : "outline"}
                                className={`text-xs ${isSelected ? 'bg-primary text-white' : 'bg-white text-gray-700'} p-1 h-8`}
                                onClick={() => {
                                  const newValue = [...(field.value || [])];
                                  if (isSelected) {
                                    const index = newValue.indexOf(dayName);
                                    if (index !== -1) newValue.splice(index, 1);
                                  } else {
                                    newValue.push(dayName);
                                  }
                                  field.onChange(newValue);
                                }}
                              >
                                {day}
                              </Button>
                            );
                          }}
                        />
                      ))}
                    </div>
                  </>
                )}
                
                {/* Holiday settings */}
                <div className="mt-4">
                  <Controller
                    name="skipHolidays"
                    control={control}
                    render={({ field }) => (
                      <div className="flex items-center">
                        <Checkbox 
                          id="skipHolidays" 
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                        <Label htmlFor="skipHolidays" className="ml-2 text-sm text-gray-700">
                          Skip public holidays
                        </Label>
                      </div>
                    )}
                  />
                  
                  {skipHolidays && (
                    <div className="mt-2">
                      <Label htmlFor="holidayCountry" className="block text-sm font-medium text-gray-700 mb-1">
                        Holiday Calendar
                      </Label>
                      <Controller
                        name="holidayCountry"
                        control={control}
                        render={({ field }) => (
                          <Select 
                            onValueChange={(value) => {
                              field.onChange(value);
                              setSelectedCountry(value);
                            }}
                            value={field.value || ""}
                            defaultValue={field.value || ""}
                          >
                            <SelectTrigger className="w-full border border-gray-300 rounded-lg">
                              <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="US">United States</SelectItem>
                              <SelectItem value="CO">Colombia</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {!isRecurring && (
            <>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <Label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
                    Date
                  </Label>
                  <Controller
                    name="date"
                    control={control}
                    render={({ field }) => (
                      <Input 
                        {...field} 
                        id="date"
                        type="date" 
                        min={new Date().toISOString().split('T')[0]} // Establecer fecha mínima como hoy
                        className={`w-full border border-gray-300 rounded-lg ${viewOnly ? 'bg-gray-50' : ''}`}
                        readOnly={viewOnly}
                        disabled={viewOnly}
                      />
                    )}
                  />
                  {errors.date && (
                    <p className="text-xs text-red-500 mt-1">{errors.date.message}</p>
                  )}
                </div>
                
                {!isAllDay && (
                  <div>
                    <Label htmlFor="time" className="block text-sm font-medium text-gray-700 mb-1">
                      Start Time
                    </Label>
                    <Controller
                      name="time"
                      control={control}
                      render={({ field }) => (
                        <Input 
                          {...field} 
                          id="time"
                          type="time" 
                          className={`w-full border border-gray-300 rounded-lg ${viewOnly ? 'bg-gray-50' : ''}`}
                          readOnly={viewOnly}
                          disabled={viewOnly}
                        />
                      )}
                    />
                  </div>
                )}
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <Label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
                    End Date (optional)
                  </Label>
                  <Controller
                    name="endDate"
                    control={control}
                    render={({ field }) => (
                      <Input 
                        {...field} 
                        id="endDate"
                        type="date" 
                        min={watch("date") || new Date().toISOString().split('T')[0]} // Fecha mínima es la fecha inicio o hoy
                        className={`w-full border border-gray-300 rounded-lg ${viewOnly ? 'bg-gray-50' : ''}`}
                        readOnly={viewOnly}
                        disabled={viewOnly}
                      />
                    )}
                  />
                </div>
                
                {!isAllDay && (
                  <div>
                    <Label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">
                      End Time
                    </Label>
                    <Controller
                      name="endTime"
                      control={control}
                      render={({ field }) => (
                        <Input 
                          {...field} 
                          id="endTime"
                          type="time" 
                          className={`w-full border border-gray-300 rounded-lg ${viewOnly ? 'bg-gray-50' : ''}`}
                          readOnly={viewOnly}
                          disabled={viewOnly}
                        />
                      )}
                    />
                  </div>
                )}
              </div>
            </>
          )}
          
          <div className="mb-4">
            <Label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </Label>
            <Controller
              name="priority"
              control={control}
              render={({ field }) => (
                <>
                  {viewOnly ? (
                    <div className="p-2 border border-gray-300 rounded-lg bg-gray-50">
                      {field.value ? field.value.charAt(0).toUpperCase() + field.value.slice(1) : "None"}
                    </div>
                  ) : (
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <SelectTrigger className="w-full border border-gray-300 rounded-lg">
                        <SelectValue placeholder="Select priority" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </>
              )}
            />
          </div>
          
          <div className="mb-4">
            <Label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">
              Location (optional)
            </Label>
            <Controller
              name="location"
              control={control}
              render={({ field }) => (
                <Input 
                  id="location"
                  className={`w-full border border-gray-300 rounded-lg ${viewOnly ? 'bg-gray-50' : ''}`}
                  placeholder="Enter location"
                  onChange={field.onChange}
                  onBlur={field.onBlur}
                  value={field.value || ""}
                  ref={field.ref}
                  name={field.name}
                  readOnly={viewOnly}
                  disabled={viewOnly}
                />
              )}
            />
          </div>
          
          <div className="mb-4">
            <Label className="block text-sm font-medium text-gray-700 mb-1">
              Reminders
            </Label>
            <Controller
              name="reminder"
              control={control}
              render={({ field }) => (
                <>
                  <div className="flex items-center">
                    <Checkbox 
                      id="reminder15" 
                      checked={field.value?.includes(15)}
                      disabled={viewOnly}
                      onCheckedChange={(checked) => {
                        if (viewOnly) return;
                        const newValue = [...(field.value || [])];
                        if (checked) {
                          newValue.push(15);
                        } else {
                          const index = newValue.indexOf(15);
                          if (index !== -1) newValue.splice(index, 1);
                        }
                        field.onChange(newValue);
                      }}
                    />
                    <Label htmlFor="reminder15" className="ml-2 text-sm text-gray-700">
                      15 minutes before
                    </Label>
                  </div>
                  <div className="flex items-center mt-2">
                    <Checkbox 
                      id="reminder60" 
                      checked={field.value?.includes(60)}
                      disabled={viewOnly}
                      onCheckedChange={(checked) => {
                        if (viewOnly) return;
                        const newValue = [...(field.value || [])];
                        if (checked) {
                          newValue.push(60);
                        } else {
                          const index = newValue.indexOf(60);
                          if (index !== -1) newValue.splice(index, 1);
                        }
                        field.onChange(newValue);
                      }}
                    />
                    <Label htmlFor="reminder60" className="ml-2 text-sm text-gray-700">
                      1 hour before
                    </Label>
                  </div>
                </>
              )}
            />
          </div>
          
          {/* Other task settings */}
          <div className="mb-4 border-t pt-4">
            
            {isRecurring && (
              <div className="mt-2 ml-7">
                {/* Recurrence Type Selection */}
                <div className="mb-4">
                  <Label htmlFor="recurrenceType" className="block text-sm font-medium text-gray-700 mb-1">
                    Recurrence Type
                  </Label>
                  <Controller
                    name="recurrenceType"
                    control={control}
                    render={({ field }) => (
                      <Select 
                        onValueChange={field.onChange}
                        value={field.value}
                        defaultValue={field.value}
                      >
                        <SelectTrigger className="w-full border border-gray-300 rounded-lg">
                          <SelectValue placeholder="Select recurrence type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="daily">Daily</SelectItem>
                          <SelectItem value="weekly">Weekly</SelectItem>
                          <SelectItem value="monthly">Monthly</SelectItem>
                          <SelectItem value="yearly">Yearly</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>
                
                {/* Date Range Selection */}
                <div className="mb-4 grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="recurrenceStartDate" className="block text-sm font-medium text-gray-700 mb-1">
                      Starts On
                    </Label>
                    <Controller
                      name="recurrenceStartDate"
                      control={control}
                      render={({ field }) => (
                        <Input 
                          {...field} 
                          id="recurrenceStartDate"
                          type="date" 
                          min={new Date().toISOString().split('T')[0]} // Establecer fecha mínima como hoy
                          className="w-full border border-gray-300 rounded-lg" 
                        />
                      )}
                    />
                  </div>
                  <div>
                    <Label htmlFor="recurrenceEndDate" className="block text-sm font-medium text-gray-700 mb-1">
                      Ends On
                    </Label>
                    <Controller
                      name="recurrenceEndDate"
                      control={control}
                      render={({ field }) => (
                        <Input 
                          {...field} 
                          id="recurrenceEndDate"
                          type="date" 
                          min={watch("recurrenceStartDate") || new Date().toISOString().split('T')[0]} // Fecha mínima es la fecha inicio o hoy
                          className="w-full border border-gray-300 rounded-lg" 
                        />
                      )}
                    />
                  </div>
                </div>
                
                {recurrenceType === "weekly" && (
                  <>
                    <Label className="block text-sm font-medium text-gray-700 mb-1">
                      Repeat on these days
                    </Label>
                    <div className="grid grid-cols-7 gap-1 mt-1">
                      {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => (
                        <Controller
                          key={day}
                          name="recurringDays"
                          control={control}
                          render={({ field }) => {
                            const dayName = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"][index];
                            const isSelected = field.value?.includes(dayName);
                            
                            return (
                              <Button
                                type="button"
                                variant={isSelected ? "default" : "outline"}
                                className={`text-xs ${isSelected ? 'bg-primary text-white' : 'bg-white text-gray-700'} p-1 h-8`}
                                onClick={() => {
                                  const newValue = [...(field.value || [])];
                                  if (isSelected) {
                                    const index = newValue.indexOf(dayName);
                                    if (index !== -1) newValue.splice(index, 1);
                                  } else {
                                    newValue.push(dayName);
                                  }
                                  field.onChange(newValue);
                                }}
                              >
                                {day}
                              </Button>
                            );
                          }}
                        />
                      ))}
                    </div>
                  </>
                )}
                
                {/* Holiday settings */}
                <div className="mt-4">
                  <Controller
                    name="skipHolidays"
                    control={control}
                    render={({ field }) => (
                      <div className="flex items-center">
                        <Checkbox 
                          id="skipHolidays" 
                          checked={field.value}
                          onCheckedChange={field.onChange}
                        />
                        <Label htmlFor="skipHolidays" className="ml-2 text-sm text-gray-700">
                          Skip public holidays
                        </Label>
                      </div>
                    )}
                  />
                  
                  {skipHolidays && (
                    <div className="mt-2">
                      <Label htmlFor="holidayCountry" className="block text-sm font-medium text-gray-700 mb-1">
                        Holiday Calendar
                      </Label>
                      <Controller
                        name="holidayCountry"
                        control={control}
                        render={({ field }) => (
                          <Select 
                            onValueChange={(value) => {
                              field.onChange(value);
                              setSelectedCountry(value);
                            }}
                            value={field.value || ""}
                            defaultValue={field.value || ""}
                          >
                            <SelectTrigger className="w-full border border-gray-300 rounded-lg">
                              <SelectValue placeholder="Select country" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="US">United States</SelectItem>
                              <SelectItem value="CO">Colombia</SelectItem>
                            </SelectContent>
                          </Select>
                        )}
                      />
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Holiday warning if date falls on a holiday */}
          {holidayInfo.isHoliday && (
            <Alert className="mb-4 bg-amber-50 border-amber-200">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-sm text-amber-800">
                This date falls on a holiday: <strong>{holidayInfo.holidayName}</strong>
              </AlertDescription>
            </Alert>
          )}
          
          {/* AI suggestion button moved to fixed footer */}
          <div className="mb-4">
            {/* Empty space to ensure form content doesn't get hidden behind the fixed footer */}
            <div className="h-6"></div>
          </div>
        </form>
        </div>

        {/* Fixed footer with action buttons */}
        <div className="border-t border-gray-200 p-4 flex justify-between items-center bg-white">
          {/* AI button on the left side */}
          <div>
            {!viewOnly && (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="flex items-center text-accent"
                onClick={handleAskAI}
                disabled={isAskingAi}
              >
                <LightbulbIcon className="h-4 w-4 mr-1" />
                Ask AI for suggestions
              </Button>
            )}
          </div>
          
          {/* Action buttons on the right side */}
          <div className="flex gap-2">
            {viewOnly ? (
              <>
                <Button 
                  variant="outline" 
                  onClick={onClose}
                >
                  Close
                </Button>
                <Button 
                  type="button" 
                  onClick={() => {
                    // Logic to open in edit mode would go here
                    onClose();
                  }}
                >
                  Edit
                </Button>
              </>
            ) : (
              <>
                <Button 
                  variant="outline" 
                  onClick={onClose}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit"
                  form="task-form"
                  disabled={isCreatingTask}
                >
                  {isCreatingTask ? "Saving..." : "Save Task"}
                </Button>
              </>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
