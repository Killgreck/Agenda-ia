import { useState, useEffect } from "react";
import { X, LightbulbIcon, CalendarDays, AlertTriangle } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { insertTaskSchema } from "@shared/schema";
import { z } from "zod";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { InsertTask, Task } from "@shared/schema";
import { useTasks } from "@/hooks/useTaskManager";
import { useToast } from "@/hooks/use-toast";
import { useAI } from "@/hooks/useAI";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { isHoliday } from "@/utils/holidays";

type TaskModalProps = {
  open: boolean;
  onClose: () => void;
  taskToEdit?: InsertTask;
  viewOnly?: boolean;
};

// Utility function to format a date string preserving the local date (not UTC converted)
// This prevents the timezone offset issues when sending dates to the server
function formatDateToPreserveLocalDay(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  
  // Format without timezone component
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

// Extend the original schema with extra validations
const taskFormSchema = insertTaskSchema.extend({
  date: z.string().min(1, "Date is required"),
  endDate: z.string().optional(),
  time: z.string().optional(), // Will be merged with date
  endTime: z.string().optional(), // Will be merged with endDate
  isRecurring: z.boolean().default(false),
  recurringDays: z.array(z.string()).default([]),
  skipHolidays: z.boolean().default(false),
  holidayCountry: z.string().optional(),
  recurrenceType: z.enum(["daily", "weekly"]).optional(),
  recurrenceStartDate: z.string().optional(),
  recurrenceEndDate: z.string().optional(),
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

export default function TaskModal({ open, onClose, taskToEdit, viewOnly = false }: TaskModalProps) {
  const { createTask, isCreatingTask } = useTasks();
  const { toast } = useToast();
  const { askAiForTaskSuggestion, isAskingAi } = useAI();
  
  // Initialize form with default values or edit values
  const { control, handleSubmit, watch, setValue, formState: { errors } } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: taskToEdit 
      ? {
          title: taskToEdit.title,
          description: taskToEdit.description || "",
          date: new Date(taskToEdit.date).toISOString().split('T')[0],
          time: taskToEdit.isAllDay ? "" : new Date(taskToEdit.date).toISOString().split('T')[1].substring(0, 5),
          endDate: taskToEdit.endDate ? new Date(taskToEdit.endDate).toISOString().split('T')[0] : "",
          endTime: taskToEdit.endDate && !taskToEdit.isAllDay ? new Date(taskToEdit.endDate).toISOString().split('T')[1].substring(0, 5) : "",
          priority: taskToEdit.priority || "medium",
          location: taskToEdit.location || "",
          isAllDay: taskToEdit.isAllDay || false,
          reminder: taskToEdit.reminder || [],
          isRecurring: taskToEdit.isRecurring || false,
          recurringDays: taskToEdit.recurringDays || [],
          skipHolidays: taskToEdit.skipHolidays || false,
          holidayCountry: taskToEdit.holidayCountry || "",
          recurrenceType: (taskToEdit.recurrenceType as "daily" | "weekly") || "weekly",
          recurrenceStartDate: taskToEdit.recurrenceStartDate 
            ? new Date(taskToEdit.recurrenceStartDate).toISOString().split('T')[0] 
            : new Date().toISOString().split('T')[0],
          recurrenceEndDate: taskToEdit.recurrenceEndDate 
            ? new Date(taskToEdit.recurrenceEndDate).toISOString().split('T')[0] 
            : "",
        }
      : {
          title: "",
          description: "",
          date: new Date().toISOString().split('T')[0],
          time: "",
          endDate: "",
          endTime: "",
          priority: "medium",
          location: "",
          isAllDay: false,
          reminder: [15, 60], // Default reminders: 15 min and 1 hour before
          isRecurring: false,
          recurringDays: ["monday", "wednesday", "friday"], // Default to MWF for weekly recurrence
          skipHolidays: false,
          holidayCountry: "US",
          recurrenceType: "weekly",
          recurrenceStartDate: new Date().toISOString().split('T')[0],
          recurrenceEndDate: new Date(new Date().setDate(new Date().getDate() + 30)).toISOString().split('T')[0], // Default to 30 days ahead
        }
  });
  
  const isAllDay = watch("isAllDay");
  
  // Function to check for time conflicts with existing tasks
  const checkTimeConflicts = async (date: Date, endDate?: Date, isAllDay: boolean = false): Promise<string | null> => {
    try {
      // Get all tasks for the same date
      const allTasks = await fetch('/api/tasks').then(res => res.json());
      
      if (!allTasks || allTasks.length === 0) return null;
      
      // Filter tasks that occur on the same day (excluding the current task if editing)
      const tasksOnSameDay = allTasks.filter((task: Task) => {
        // Skip if we're editing this task (compare by matching fields since ID might not be accessible during edit)
        if (taskToEdit && task.title === taskToEdit.title && 
            new Date(task.date).toISOString() === new Date(taskToEdit.date).toISOString()) {
          return false;
        }
        const taskDate = new Date(task.date);
        return taskDate.toDateString() === date.toDateString();
      });
      
      if (tasksOnSameDay.length === 0) return null;
      
      // For all-day events, reject if there's already an all-day event
      if (isAllDay) {
        const existingAllDayEvents = tasksOnSameDay.filter((task: Task) => task.isAllDay);
        if (existingAllDayEvents.length > 0) {
          return "There's already an all-day event scheduled for this day. Please choose a different day.";
        }
      }
      
      // Check for time conflicts for non-all-day events
      if (!isAllDay) {
        // Ensure endDate exists - default to 1 hour if not specified
        const actualEndDate = endDate || new Date(date.getTime() + 60 * 60 * 1000);
        
        const conflictingTasks = tasksOnSameDay.filter((task: Task) => {
          // All-day events conflict with any time of the day
          if (task.isAllDay) return true; 
          
          const taskStart = new Date(task.date);
          const taskEnd = task.endDate ? new Date(task.endDate) : new Date(taskStart.getTime() + 60 * 60 * 1000); // Default 1 hour
          
          // Check if there's an overlap: new event starts before existing ends AND new event ends after existing starts
          const hasOverlap = (date < taskEnd && actualEndDate > taskStart);
          
          // Log conflict detection details for debugging
          if (hasOverlap) {
            console.log("Conflict detected:", {
              newEventStart: date.toLocaleTimeString(),
              newEventEnd: actualEndDate.toLocaleTimeString(),
              existingEventStart: taskStart.toLocaleTimeString(),
              existingEventEnd: taskEnd.toLocaleTimeString(),
              taskTitle: task.title
            });
          }
          
          return hasOverlap;
        });
        
        if (conflictingTasks.length > 0) {
          // Get details about conflicting tasks
          const conflictDetails = conflictingTasks.map((task: Task) => `"${task.title}" at ${new Date(task.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`).join(", ");
          
          // Find available time slots
          const availableSlots = findAvailableTimeSlots(tasksOnSameDay, date);
          
          if (availableSlots.length > 0) {
            const nextSlot = availableSlots[0];
            const formattedTime = nextSlot.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
            return `Time conflict with: ${conflictDetails}. Try scheduling at ${formattedTime} instead.`;
          } else {
            return `Time conflicts with: ${conflictDetails}. Please choose another day.`;
          }
        }
      }
      
      return null;
    } catch (error) {
      console.error("Error checking time conflicts:", error);
      return "Error checking for time conflicts. Please try again.";
    }
  };
  
  // Function to find available time slots
  const findAvailableTimeSlots = (tasksOnDay: Task[], preferredDate: Date): Date[] => {
    // Default business hours: 8 AM to 6 PM, with a preference to schedule during standard work hours
    const businessHoursStart = 8;
    const businessHoursEnd = 18;
    const preferredStart = 9; // Prefer to suggest slots during core work hours
    const preferredEnd = 17;
    
    // Get duration of the preferred time slot (default to 1 hour)
    const preferredDuration = 60; // minutes
    
    // Convert tasks to busy time ranges
    const busyRanges: {start: Date, end: Date, title: string}[] = tasksOnDay
      .filter(task => !task.isAllDay)
      .map(task => {
        const start = new Date(task.date);
        const end = task.endDate ? new Date(task.endDate) : new Date(start.getTime() + 60 * 60 * 1000);
        return { start, end, title: task.title };
      });
    
    // Sort by start time
    busyRanges.sort((a, b) => a.start.getTime() - b.start.getTime());
    
    // Find available slots (at least for duration of preferred time slot)
    const availableSlots: Date[] = [];
    const day = preferredDate.getDate();
    const month = preferredDate.getMonth();
    const year = preferredDate.getFullYear();
    
    // When looking for available slots, consider the current time if we're scheduling for today
    const now = new Date();
    let currentTime: Date;
    
    if (now.getFullYear() === year && now.getMonth() === month && now.getDate() === day) {
      // We're scheduling for today, start from the current time (rounded up to next half hour)
      const minutes = now.getMinutes();
      const roundedMinutes = minutes < 30 ? 30 : 0;
      const roundedHour = minutes < 30 ? now.getHours() : now.getHours() + 1;
      
      if (roundedHour >= businessHoursStart && roundedHour < businessHoursEnd) {
        currentTime = new Date(year, month, day, roundedHour, roundedMinutes);
      } else {
        // If current time is outside business hours, start from business hours
        currentTime = new Date(year, month, day, businessHoursStart, 0);
      }
    } else {
      // Not today, start from business hours
      currentTime = new Date(year, month, day, businessHoursStart, 0);
    }
    
    // Check each 30-minute slot within business hours
    while (currentTime.getHours() < businessHoursEnd) {
      const slotEnd = new Date(currentTime.getTime() + preferredDuration * 60 * 1000);
      
      // Check if this slot conflicts with any busy range
      let isConflicting = false;
      for (const range of busyRanges) {
        // If there's an overlap
        if (currentTime < range.end && slotEnd > range.start) {
          isConflicting = true;
          // Jump to the end of this busy period
          currentTime = new Date(range.end);
          break;
        }
      }
      
      // If no conflict found, this slot is available
      if (!isConflicting) {
        // Prefer slots during core work hours
        const hour = currentTime.getHours();
        if (hour >= preferredStart && hour < preferredEnd) {
          availableSlots.push(new Date(currentTime));
        } else if (availableSlots.length === 0) {
          // Add slots outside core hours only if we haven't found any better options
          availableSlots.push(new Date(currentTime));
        }
        
        // Move to next slot (30-minute increments)
        currentTime = new Date(currentTime.getTime() + 30 * 60 * 1000);
      }
      
      // Safety check to avoid infinite loops
      if (availableSlots.length >= 5) break; // Limit to 5 suggestions
    }
    
    // Sort slots by preference (core work hours first)
    availableSlots.sort((a, b) => {
      const aHour = a.getHours();
      const bHour = b.getHours();
      
      // Prefer core work hours
      const aIsCore = aHour >= preferredStart && aHour < preferredEnd;
      const bIsCore = bHour >= preferredStart && bHour < preferredEnd;
      
      if (aIsCore && !bIsCore) return -1;
      if (!aIsCore && bIsCore) return 1;
      
      // If both are in the same category, sort chronologically
      return a.getTime() - b.getTime();
    });
    
    // Log available time slots for debugging
    if (availableSlots.length > 0) {
      console.log("Available time slots found:", 
        availableSlots.map(slot => slot.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }))
      );
    } else {
      console.log("No available time slots found for this day");
    }
    
    return availableSlots;
  };

  const onSubmit = async (data: TaskFormValues) => {
    try {
      console.log("Starting task submission"); // Debug log
      let dateObj: Date;
      let endDateObj: Date | undefined;
      
      // Validate form data
      if (!data.title.trim()) {
        toast({
          title: "Missing Information",
          description: "Please provide a title for the task.",
          variant: "destructive",
        });
        return;
      }
      
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
        
        // Aplicamos un ajuste de 5 horas para compensar el desfase observado
        // Este ajuste es específico para esta implementación
        const userTimezoneOffset = 5 * 60 * 60 * 1000; // 5 horas en milisegundos
        dateObj = new Date(dateObj.getTime() - userTimezoneOffset);
        
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
          
          // Aplicar el mismo ajuste que a la fecha de inicio
          endDateObj = new Date(endDateObj.getTime() - userTimezoneOffset);
          
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
      if (!data.isRecurring) {
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
          
          <div className="mb-4">
            <Controller
              name="isAllDay"
              control={control}
              render={({ field }) => (
                <div className="flex items-center mb-2">
                  <Checkbox 
                    id="isAllDay" 
                    checked={field.value}
                    onCheckedChange={viewOnly ? undefined : field.onChange}
                    disabled={viewOnly}
                  />
                  <Label htmlFor="isAllDay" className="ml-2 text-sm font-medium text-gray-700">
                    All-day event
                  </Label>
                </div>
              )}
            />
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
