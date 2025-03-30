import { useState } from "react";
import { X, LightbulbIcon } from "lucide-react";
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
import { InsertTask } from "@shared/schema";
import { useTasks } from "@/hooks/useTaskManager";
import { useToast } from "@/hooks/use-toast";
import { useAI } from "@/hooks/useAI";

type TaskModalProps = {
  open: boolean;
  onClose: () => void;
  taskToEdit?: InsertTask;
};

// Extend the original schema with extra validations
const taskFormSchema = insertTaskSchema.extend({
  date: z.string().min(1, "Date is required"),
  endDate: z.string().optional(),
  time: z.string().optional(), // Will be merged with date
  endTime: z.string().optional(), // Will be merged with endDate
});

type TaskFormValues = z.infer<typeof taskFormSchema>;

export default function TaskModal({ open, onClose, taskToEdit }: TaskModalProps) {
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
        }
  });
  
  const isAllDay = watch("isAllDay");
  
  const onSubmit = async (data: TaskFormValues) => {
    try {
      // Combine date and time
      const dateObj = new Date(data.date);
      if (!isAllDay && data.time) {
        const [hours, minutes] = data.time.split(':').map(Number);
        dateObj.setHours(hours, minutes);
      } else {
        dateObj.setHours(0, 0, 0, 0);
      }
      
      // Process end date if provided
      let endDateObj: Date | undefined;
      if (data.endDate) {
        endDateObj = new Date(data.endDate);
        if (!isAllDay && data.endTime) {
          const [hours, minutes] = data.endTime.split(':').map(Number);
          endDateObj.setHours(hours, minutes);
        } else {
          endDateObj.setHours(23, 59, 59, 999);
        }
      }
      
      // Create task object
      const taskData: InsertTask = {
        title: data.title,
        description: data.description,
        date: dateObj,
        endDate: endDateObj,
        priority: data.priority,
        location: data.location || undefined,
        isAllDay: data.isAllDay,
        reminder: data.reminder,
        completed: false,
      };
      
      await createTask(taskData);
      
      toast({
        title: "Success",
        description: "Task created successfully!",
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create task. Please try again.",
        variant: "destructive",
      });
    }
  };
  
  const handleAskAI = async () => {
    const title = watch("title");
    const description = watch("description");
    
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
      <DialogContent className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <DialogHeader className="flex justify-between items-center p-4 border-b border-gray-200">
          <DialogTitle className="text-lg font-medium text-gray-800">
            {taskToEdit ? "Edit Task" : "Create New Task"}
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
        
        <form onSubmit={handleSubmit(onSubmit)} className="p-4">
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
                  className="w-full border border-gray-300 rounded-lg" 
                  placeholder="Enter task title" 
                />
              )}
            />
            {errors.title && (
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
                  {...field} 
                  id="description"
                  className="w-full border border-gray-300 rounded-lg" 
                  rows={3} 
                  placeholder="Task description"
                />
              )}
            />
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
                    onCheckedChange={field.onChange}
                  />
                  <Label htmlFor="isAllDay" className="ml-2 text-sm font-medium text-gray-700">
                    All-day event
                  </Label>
                </div>
              )}
            />
          </div>
          
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
                    className="w-full border border-gray-300 rounded-lg" 
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
                      className="w-full border border-gray-300 rounded-lg" 
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
                    className="w-full border border-gray-300 rounded-lg" 
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
                      className="w-full border border-gray-300 rounded-lg" 
                    />
                  )}
                />
              </div>
            )}
          </div>
          
          <div className="mb-4">
            <Label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
              Priority
            </Label>
            <Controller
              name="priority"
              control={control}
              render={({ field }) => (
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
                  {...field} 
                  id="location"
                  className="w-full border border-gray-300 rounded-lg" 
                  placeholder="Enter location" 
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
                      onCheckedChange={(checked) => {
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
                      onCheckedChange={(checked) => {
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
          
          <div className="flex justify-between p-4 border-t border-gray-200">
            <div className="flex items-center text-sm text-accent">
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
            </div>
            <div>
              <Button
                type="button"
                variant="outline"
                className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg mr-2 hover:bg-gray-300"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="default"
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark"
                disabled={isCreatingTask}
              >
                {isCreatingTask ? "Saving..." : "Save Task"}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
