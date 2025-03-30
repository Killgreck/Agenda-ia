import { useState, useEffect } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  LightbulbIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCalendar } from "@/hooks/useCalendar";
import { Task } from "@shared/schema";
import { useAiSuggestions } from "@/hooks/useAI";
import { useToast } from "@/hooks/use-toast";
import { useTasks } from "@/hooks/useTaskManager";

type CalendarViewProps = {
  onDayClick?: (date: Date) => void;
};

export default function CalendarView({ onDayClick }: CalendarViewProps) {
  const { toast } = useToast();
  const { 
    currentDate,
    currentMonth,
    currentYear, 
    daysInMonth,
    firstDayOfMonth,
    nextMonth,
    prevMonth,
    goToToday,
    isCurrentMonth,
    isCurrentDay,
    formatMonthYear,
    getDaysInMonth 
  } = useCalendar();
  
  const [view, setView] = useState<'month' | 'week' | 'day'>('month');
  const { tasks } = useTasks({ month: currentMonth, year: currentYear });
  const { 
    suggestions, 
    currentSuggestion, 
    acceptSuggestion, 
    rejectSuggestion,
    isAcceptingSuggestion 
  } = useAiSuggestions();
  
  // Filter for tasks on a specific date
  const getTasksForDate = (date: Date): Task[] => {
    return tasks.filter((task: Task) => {
      const taskDate = new Date(task.date);
      return taskDate.getDate() === date.getDate() && 
             taskDate.getMonth() === date.getMonth() && 
             taskDate.getFullYear() === date.getFullYear();
    });
  };
  
  // Check if a date has events
  const hasEvents = (date: Date): boolean => {
    return getTasksForDate(date).length > 0;
  };
  
  // Handle accept suggestion
  const handleAcceptSuggestion = async () => {
    if (!currentSuggestion) return;
    
    try {
      await acceptSuggestion(currentSuggestion.id);
      toast({
        title: "Suggestion accepted",
        description: "The suggestion has been applied to your calendar.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to apply the suggestion.",
        variant: "destructive",
      });
    }
  };
  
  // Handle reject suggestion
  const handleRejectSuggestion = async () => {
    if (!currentSuggestion) return;
    
    try {
      await rejectSuggestion(currentSuggestion.id);
      toast({
        title: "Suggestion rejected",
        description: "The suggestion has been dismissed.",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to dismiss the suggestion.",
        variant: "destructive",
      });
    }
  };
  
  // Helper to get the priority color class
  const getPriorityClass = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'bg-destructive bg-opacity-10 text-destructive';
      case 'medium': return 'bg-warning bg-opacity-10 text-warning';
      case 'low': return 'bg-success bg-opacity-10 text-success';
      default: return 'bg-accent bg-opacity-10 text-accent-dark';
    }
  };
  
  // Function to render calendar grid for month view
  const renderMonthCalendar = () => {
    const calendarDays = [];
    const prevMonthDays = [];
    const nextMonthDays = [];
    
    // Calculate prev month days to display
    const prevMonth = new Date(currentYear, currentMonth, 0);
    const prevMonthDaysCount = prevMonth.getDate();
    const prevMonthStartDay = prevMonthDaysCount - firstDayOfMonth + 1;
    
    for (let i = prevMonthStartDay; i <= prevMonthDaysCount; i++) {
      prevMonthDays.push(
        <div key={`prev-${i}`} className="border border-gray-100 p-2 calendar-day relative">
          <p className="text-gray-400 text-sm">{i}</p>
        </div>
      );
    }
    
    // Calculate current month days
    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(currentYear, currentMonth, i);
      const isToday = isCurrentDay(date);
      const dayTasks = getTasksForDate(date);
      
      calendarDays.push(
        <div 
          key={`current-${i}`} 
          className={`border border-gray-100 p-2 calendar-day relative ${isToday ? 'bg-primary bg-opacity-10 font-semibold' : ''} ${hasEvents(date) ? 'calendar-day-has-event' : ''}`}
          onClick={() => onDayClick?.(date)}
        >
          <p className="text-sm">{i}</p>
          {dayTasks.slice(0, 2).map((task, index) => (
            <div 
              key={`task-${task.id}-${index}`} 
              className={`mt-1 text-xs ${getPriorityClass(task.priority)} px-1 py-0.5 rounded truncate`}
            >
              {task.title}
            </div>
          ))}
          {dayTasks.length > 2 && (
            <div className="mt-1 text-xs text-gray-500 text-center">+{dayTasks.length - 2} more</div>
          )}
        </div>
      );
    }
    
    // Calculate next month days to display
    const nextMonthDaysToShow = 42 - (prevMonthDays.length + calendarDays.length); // 42 = 6 rows * 7 days
    
    for (let i = 1; i <= nextMonthDaysToShow; i++) {
      nextMonthDays.push(
        <div key={`next-${i}`} className="border border-gray-100 p-2 calendar-day relative">
          <p className="text-gray-400 text-sm">{i}</p>
        </div>
      );
    }
    
    return [...prevMonthDays, ...calendarDays, ...nextMonthDays];
  };
  
  return (
    <div className="flex-1 bg-white overflow-y-auto custom-scrollbar">
      <div className="p-4">
        {/* Calendar Header */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center">
            <h2 className="text-xl font-semibold">{formatMonthYear(currentDate)}</h2>
            <div className="ml-4 flex space-x-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="p-1 rounded hover:bg-gray-100"
                onClick={prevMonth}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="p-1 rounded hover:bg-gray-100"
                onClick={nextMonth}
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
              <Button 
                variant="secondary" 
                size="sm" 
                className="ml-2 text-sm text-white bg-primary-light hover:bg-primary"
                onClick={goToToday}
              >
                Today
              </Button>
            </div>
          </div>
          <div className="flex border rounded overflow-hidden">
            <Button 
              variant={view === 'month' ? 'default' : 'ghost'} 
              className={view === 'month' ? 'bg-primary text-white' : 'bg-white hover:bg-gray-100'}
              onClick={() => setView('month')}
            >
              Month
            </Button>
            <Button 
              variant={view === 'week' ? 'default' : 'ghost'} 
              className={view === 'week' ? 'bg-primary text-white' : 'bg-white hover:bg-gray-100'}
              onClick={() => setView('week')}
            >
              Week
            </Button>
            <Button 
              variant={view === 'day' ? 'default' : 'ghost'} 
              className={view === 'day' ? 'bg-primary text-white' : 'bg-white hover:bg-gray-100'}
              onClick={() => setView('day')}
            >
              Day
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <Card className="bg-white rounded-lg shadow">
          {/* Days of week */}
          <div className="grid grid-cols-7 border-b border-gray-200">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-sm text-gray-600 font-medium p-2 text-center">{day}</div>
            ))}
          </div>
          
          {/* Calendar Cells */}
          <div className="grid grid-cols-7">
            {renderMonthCalendar()}
          </div>
        </Card>

        {/* AI Suggestions Banner */}
        {currentSuggestion && (
          <div className="mt-6 bg-accent bg-opacity-5 border border-accent border-opacity-20 rounded-lg p-4 flex items-start">
            <div className="text-accent mr-3 mt-1">
              <LightbulbIcon className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-medium text-accent-dark">AI Suggestion</h3>
              <p className="text-sm text-gray-700 mt-1">{currentSuggestion.suggestion}</p>
              <div className="mt-3 flex space-x-3">
                <Button 
                  variant="default" 
                  className="px-3 py-1 bg-accent text-white text-sm rounded hover:bg-accent-dark"
                  onClick={handleAcceptSuggestion}
                  disabled={isAcceptingSuggestion}
                >
                  Yes, create time blocks
                </Button>
                <Button 
                  variant="outline" 
                  className="px-3 py-1 bg-white text-accent text-sm rounded border border-accent hover:bg-accent hover:bg-opacity-5"
                  onClick={handleRejectSuggestion}
                  disabled={isAcceptingSuggestion}
                >
                  No thanks
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
