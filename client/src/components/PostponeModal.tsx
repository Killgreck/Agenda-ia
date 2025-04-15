import { useState, useEffect } from "react";
import { Task } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { 
  Calendar as CalendarIcon, 
  Clock, 
  LightbulbIcon,
  X,
  CalendarDays
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { useTasks } from "@/hooks/useTaskManager";
import { useToast } from "@/hooks/use-toast";
import { format, addDays, isSameDay } from "date-fns";
import { 
  generatePostponeSuggestion, 
  generatePostponeDateOptions 
} from "@/utils/postponeSuggestions";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { useMemo } from "react";

type PostponeModalProps = {
  open: boolean;
  onClose: () => void;
  task: Task;
};

export default function PostponeModal({ open, onClose, task }: PostponeModalProps) {
  const { updateTask, isUpdatingTask, tasks } = useTasks();
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [time, setTime] = useState<string>("09:00");
  const [suggestion, setSuggestion] = useState<string>("");
  const [calendarOpen, setCalendarOpen] = useState(false);
  
  const originalTaskDate = new Date(task.date);
  const postponeOptions = useMemo(() => 
    generatePostponeDateOptions(originalTaskDate), 
    [originalTaskDate]
  );
  
  const existingEvents = useMemo(() => {
    // Find all tasks on the same day as the selected date
    if (!selectedDate) return [];
    
    return tasks.filter((t: Task) => {
      const tDate = new Date(t.date);
      return isSameDay(tDate, selectedDate) && t.id !== task.id;
    });
  }, [selectedDate, tasks, task.id]);
  
  // Generate a new suggestion on mount
  useEffect(() => {
    setSuggestion(generatePostponeSuggestion());
  }, []);
  
  // Format time from hour/minute for display
  const formatTimeDisplay = (date: Date) => {
    return date.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: true 
    });
  };
  
  // Handle quick option selection
  const handleQuickOptionSelect = (option: {label: string, date: Date}) => {
    setSelectedDate(option.date);
    
    // If the original task had a specific time, preserve it
    if (!task.isAllDay) {
      const originalTime = new Date(task.date);
      setTime(
        originalTime.toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: false 
        })
      );
    }
  };
  
  // Handle postpone submit
  const handlePostpone = async () => {
    if (!selectedDate) {
      toast({
        title: "Please select a date",
        description: "You need to select a date to postpone this task",
        variant: "destructive"
      });
      return;
    }
    
    try {
      // Create a date that combines the selected date and time
      const postponeDateTime = new Date(selectedDate);
      
      if (!task.isAllDay && time) {
        const [hours, minutes] = time.split(':').map(Number);
        postponeDateTime.setHours(hours, minutes);
      }
      
      // Prepare task update payload
      const updatedTask = {
        ...task,
        date: postponeDateTime
      };
      
      // Update the task
      await updateTask({
        id: task.id,
        date: postponeDateTime.toISOString()
      });
      
      toast({
        title: "Task postponed",
        description: `"${task.title}" has been rescheduled to ${format(postponeDateTime, "PPPP")} ${!task.isAllDay ? 'at ' + formatTimeDisplay(postponeDateTime) : ''}`,
      });
      
      onClose();
    } catch (error) {
      toast({
        title: "Failed to postpone task",
        description: "There was an error rescheduling your task. Please try again.",
        variant: "destructive"
      });
    }
  };
  
  // Generate a new suggestion
  const handleGenerateNewSuggestion = () => {
    setSuggestion(generatePostponeSuggestion());
  };
  
  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <CalendarDays className="mr-2 h-5 w-5" />
            Postpone Task
          </DialogTitle>
          <DialogDescription>
            Reschedule "{task.title}" to a different time
          </DialogDescription>
        </DialogHeader>
        
        {/* AI Suggestion */}
        <div className="bg-accent/10 p-3 rounded-md flex items-start mt-2">
          <LightbulbIcon className="text-accent h-5 w-5 mt-0.5 mr-2 flex-shrink-0" />
          <div>
            <p className="text-sm text-gray-700">{suggestion}</p>
            <Button 
              variant="link" 
              size="sm" 
              className="text-accent p-0 h-auto mt-1"
              onClick={handleGenerateNewSuggestion}
            >
              Generate another suggestion
            </Button>
          </div>
        </div>
        
        {/* Quick Options */}
        <div className="mt-4">
          <div className="text-sm font-medium mb-2">Quick options:</div>
          <div className="flex flex-wrap gap-2">
            {postponeOptions.map((option, idx) => (
              <Button
                key={idx}
                variant={selectedDate && isSameDay(selectedDate, option.date) ? "default" : "outline"}
                size="sm"
                onClick={() => handleQuickOptionSelect(option)}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
        
        {/* Custom Date Picker */}
        <div className="grid gap-4 py-2">
          <div className="grid grid-cols-4 items-center gap-4">
            <div className="text-sm font-medium col-span-4">
              Custom date and time:
            </div>
            
            <div className="col-span-2">
              <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !selectedDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {selectedDate ? format(selectedDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0">
                  <Calendar
                    mode="single"
                    selected={selectedDate || undefined}
                    onSelect={(date: Date | undefined) => {
                      setSelectedDate(date || null);
                      setCalendarOpen(false);
                    }}
                    initialFocus
                    disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
                  />
                </PopoverContent>
              </Popover>
            </div>
            
            {!task.isAllDay && (
              <div className="col-span-2">
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-gray-500" />
                  <Input
                    type="time"
                    value={time}
                    onChange={(e) => setTime(e.target.value)}
                    className="w-full"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
        
        {/* Show existing events on selected date */}
        {selectedDate && existingEvents.length > 0 && (
          <div className="mt-2">
            <div className="text-sm font-medium mb-2">
              Existing events on {format(selectedDate, "MMMM d, yyyy")}:
            </div>
            <ScrollArea className="h-[100px] rounded-md border p-2">
              {existingEvents.map((event: Task) => (
                <div key={event.id} className="mb-2 last:mb-0">
                  <div className="flex items-center">
                    <Badge variant="outline" className="mr-2">
                      {event.isAllDay 
                        ? 'All day' 
                        : format(new Date(event.date), 'h:mm a')}
                    </Badge>
                    <span className="text-sm font-medium">{event.title}</span>
                  </div>
                </div>
              ))}
            </ScrollArea>
          </div>
        )}
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            onClick={handlePostpone}
            disabled={!selectedDate || isUpdatingTask}
          >
            Reschedule Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}