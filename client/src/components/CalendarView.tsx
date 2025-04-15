import { useState, useEffect } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  LightbulbIcon,
  PlusCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useCalendar } from "@/hooks/useCalendar";
import { Task } from "@shared/schema";
import { useAiSuggestions } from "@/hooks/useAI";
import { useToast } from "@/hooks/use-toast";
import { useTasks } from "@/hooks/useTaskManager";
import { TaskMenu } from "@/components/ui/task-menu";

type CalendarViewProps = {
  onDayClick?: (date: Date) => void;
};

export default function CalendarView({ onDayClick }: CalendarViewProps) {
  const { toast } = useToast();
  const { 
    currentDate,
    setCurrentDate,
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
  
  const [view, setView] = useState<'day' | 'week' | 'month' | 'year'>('month');
  
  // Debug log when view changes
  useEffect(() => {
    console.log("View changed to:", view);
  }, [view]);
  const { tasks } = useTasks({ month: currentMonth, year: currentYear });
  const { 
    suggestions, 
    currentSuggestion, 
    acceptSuggestion, 
    rejectSuggestion,
    isAcceptingSuggestion 
  } = useAiSuggestions();
  
  // Filter for tasks on a specific date with timezone correction
  const getTasksForDate = (date: Date): Task[] => {
    return tasks.filter((task: Task) => {
      // Create date from task.date and adjust for timezone
      const taskDateStr = task.date;
      const taskDate = new Date(taskDateStr);
      
      // Create date strings for comparison in local timezone (YYYY-MM-DD format)
      const taskLocalDate = new Date(
        taskDate.getFullYear(),
        taskDate.getMonth(),
        taskDate.getDate()
      );
      
      const dateLocalDate = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate()
      );
      
      // Compare year, month, and day components in local timezone
      return taskLocalDate.getTime() === dateLocalDate.getTime();
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
            <h2 className="text-xl font-semibold">
              {(() => {
                switch(view) {
                  case 'year':
                    return currentYear;
                  case 'month':
                    return formatMonthYear(currentDate);
                  case 'week': {
                    // Get start and end of week
                    const startOfWeek = new Date(currentDate);
                    const dayOfWeek = startOfWeek.getDay(); // 0 = Sunday, 1 = Monday, etc.
                    startOfWeek.setDate(startOfWeek.getDate() - dayOfWeek); // Go to start of week (Sunday)
                    
                    const endOfWeek = new Date(startOfWeek);
                    endOfWeek.setDate(endOfWeek.getDate() + 6); // Go to end of week (Saturday)
                    
                    // Format the dates
                    const startMonth = startOfWeek.toLocaleDateString('default', { month: 'short' });
                    const endMonth = endOfWeek.toLocaleDateString('default', { month: 'short' });
                    
                    // If same month, just show once
                    if (startMonth === endMonth) {
                      return `${startMonth} ${startOfWeek.getDate()} - ${endOfWeek.getDate()}, ${endOfWeek.getFullYear()}`;
                    } else {
                      return `${startMonth} ${startOfWeek.getDate()} - ${endMonth} ${endOfWeek.getDate()}, ${endOfWeek.getFullYear()}`;
                    }
                  }
                  case 'day':
                    // Show full date for day view
                    return currentDate.toLocaleDateString('default', { 
                      weekday: 'long', 
                      month: 'long', 
                      day: 'numeric',
                      year: 'numeric'
                    });
                  default:
                    return formatMonthYear(currentDate);
                }
              })()}
            </h2>
            <div className="ml-4 flex space-x-1">
              <Button 
                variant="ghost" 
                size="icon" 
                className="p-1 rounded hover:bg-gray-100"
                onClick={() => {
                  switch(view) {
                    case 'day':
                      const prevDay = new Date(currentDate);
                      prevDay.setDate(prevDay.getDate() - 1);
                      setCurrentDate(prevDay);
                      break;
                    case 'week':
                      const prevWeek = new Date(currentDate);
                      prevWeek.setDate(prevWeek.getDate() - 7);
                      setCurrentDate(prevWeek);
                      break;
                    case 'month':
                      prevMonth();
                      break;
                    case 'year':
                      const prevYear = new Date(currentDate);
                      prevYear.setFullYear(prevYear.getFullYear() - 1);
                      setCurrentDate(prevYear);
                      break;
                  }
                }}
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon" 
                className="p-1 rounded hover:bg-gray-100"
                onClick={() => {
                  switch(view) {
                    case 'day':
                      const nextDay = new Date(currentDate);
                      nextDay.setDate(nextDay.getDate() + 1);
                      setCurrentDate(nextDay);
                      break;
                    case 'week':
                      const nextWeek = new Date(currentDate);
                      nextWeek.setDate(nextWeek.getDate() + 7);
                      setCurrentDate(nextWeek);
                      break;
                    case 'month':
                      nextMonth();
                      break;
                    case 'year':
                      const nextYear = new Date(currentDate);
                      nextYear.setFullYear(nextYear.getFullYear() + 1);
                      setCurrentDate(nextYear);
                      break;
                  }
                }}
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
              variant={view === 'day' ? 'default' : 'ghost'} 
              className={view === 'day' ? 'bg-primary text-white' : 'bg-white hover:bg-gray-100'}
              onClick={() => setView('day')}
            >
              Day
            </Button>
            <Button 
              variant={view === 'week' ? 'default' : 'ghost'} 
              className={view === 'week' ? 'bg-primary text-white' : 'bg-white hover:bg-gray-100'}
              onClick={() => setView('week')}
            >
              Week
            </Button>
            <Button 
              variant={view === 'month' ? 'default' : 'ghost'} 
              className={view === 'month' ? 'bg-primary text-white' : 'bg-white hover:bg-gray-100'}
              onClick={() => setView('month')}
            >
              Month
            </Button>
            <Button 
              variant={view === 'year' ? 'default' : 'ghost'} 
              className={view === 'year' ? 'bg-primary text-white' : 'bg-white hover:bg-gray-100'}
              onClick={() => setView('year')}
            >
              Year
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <Card className="bg-white rounded-lg shadow">
          {view === 'month' && (
            <>
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
            </>
          )}
          
          {view === 'week' && (
            <div className="p-4">
              <div className="grid grid-cols-7 gap-2">
                {Array.from({ length: 7 }).map((_, index) => {
                  // Calculate the day for this column (starting from current week's Sunday)
                  const currentDay = new Date(currentDate);
                  const dayOfWeek = currentDay.getDay();
                  currentDay.setDate(currentDay.getDate() - dayOfWeek + index);
                  
                  const dayTasks = getTasksForDate(currentDay);
                  const isToday = isCurrentDay(currentDay);
                  
                  return (
                    <div key={`week-day-${index}`} className="flex flex-col">
                      <div className={`text-center p-2 mb-2 rounded-md ${isToday ? 'bg-primary text-white' : 'bg-gray-50'}`}>
                        <div className="font-semibold">{['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][index]}</div>
                        <div className="text-sm">{currentDay.getDate()}</div>
                      </div>
                      
                      <div className="flex-1 flex flex-col gap-2">
                        {dayTasks.length === 0 ? (
                          <div className="text-gray-400 text-center text-sm p-4">No events</div>
                        ) : (
                          dayTasks.map((task: Task) => (
                            <div 
                              key={`week-task-${task.id}`} 
                              className={`p-2 rounded-md text-sm ${getPriorityClass(task.priority)} relative`}
                              onClick={() => onDayClick?.(currentDay)}
                            >
                              <div className="flex justify-between items-start">
                                <div className="font-medium">{task.title}</div>
                                <TaskMenu 
                                  task={task} 
                                  onEdit={(taskToEdit) => {
                                    toast({
                                      title: "Task Edit",
                                      description: `Editing task "${taskToEdit.title}"`
                                    });
                                  }} 
                                  className="absolute top-1 right-1"
                                />
                              </div>
                              {task.isAllDay ? (
                                <div className="text-xs">All day</div>
                              ) : (
                                <div className="text-xs">
                                  {new Date(task.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                  {task.endDate && ` - ${new Date(task.endDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {view === 'day' && (
            <div className="p-4">
              <div className="flex flex-col gap-2">
                <div className={`text-center p-3 mb-2 rounded-md bg-primary text-white`}>
                  <div className="font-semibold">{['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][currentDate.getDay()]}</div>
                  <div className="text-sm">{currentDate.toLocaleDateString()}</div>
                </div>
                
                <div className="grid grid-cols-1 gap-3">
                  {Array.from({ length: 24 }).map((_, hour) => {
                    const hourTasks = tasks.filter((task: Task) => {
                      // Create date from task.date and adjust for timezone
                      const taskDate = new Date(task.date);
                      
                      // First check if the date matches (year, month, day)
                      const taskLocalDate = new Date(
                        taskDate.getFullYear(),
                        taskDate.getMonth(),
                        taskDate.getDate()
                      );
                      
                      const currentLocalDate = new Date(
                        currentDate.getFullYear(),
                        currentDate.getMonth(),
                        currentDate.getDate()
                      );
                      
                      // Check if it's the same day and the same hour
                      return taskLocalDate.getTime() === currentLocalDate.getTime() && 
                             taskDate.getHours() === hour;
                    });
                    
                    return (
                      <div key={`hour-${hour}`} className="flex border-b border-gray-100 pb-2">
                        <div className="w-16 text-right pr-4 font-medium text-gray-500">
                          {hour === 0 ? '12 AM' : hour < 12 ? `${hour} AM` : hour === 12 ? '12 PM' : `${hour - 12} PM`}
                        </div>
                        <div className="flex-1">
                          {hourTasks.length > 0 ? (
                            hourTasks.map((task: Task) => (
                              <div 
                                key={`day-task-${task.id}`} 
                                className={`p-2 mb-1 rounded-md text-sm ${getPriorityClass(task.priority)} relative`}
                                onClick={() => onDayClick?.(currentDate)}
                              >
                                <div className="flex justify-between items-start">
                                  <div className="font-medium">{task.title}</div>
                                  <TaskMenu 
                                    task={task} 
                                    onEdit={(taskToEdit) => {
                                      if (window.handleTaskEdit) {
                                        window.handleTaskEdit(taskToEdit);
                                      }
                                    }} 
                                    className="absolute top-1 right-1"
                                  />
                                </div>
                                {!task.isAllDay && (
                                  <div className="text-xs">
                                    {new Date(task.date).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                    {task.endDate && ` - ${new Date(task.endDate).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`}
                                  </div>
                                )}
                                {task.location && <div className="text-xs mt-1">📍 {task.location}</div>}
                              </div>
                            ))
                          ) : (
                            <div className="h-6"></div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
          
          {view === 'year' && (
            <div className="p-4 grid grid-cols-3 gap-6">
              {Array.from({ length: 12 }).map((_, monthIndex) => {
                const monthDate = new Date(currentYear, monthIndex, 1);
                const daysInMonth = new Date(currentYear, monthIndex + 1, 0).getDate();
                const firstDayOfMonth = new Date(currentYear, monthIndex, 1).getDay();
                
                return (
                  <div key={`year-month-${monthIndex}`} className="border rounded-md overflow-hidden">
                    <div className="bg-primary-light text-primary font-medium p-2 text-center">
                      {new Date(currentYear, monthIndex).toLocaleString('default', { month: 'long' })}
                    </div>
                    <div className="grid grid-cols-7 text-xs">
                      {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                        <div key={`year-month-${monthIndex}-day-${i}`} className="text-center p-1 text-gray-500">
                          {day}
                        </div>
                      ))}
                      
                      {/* Empty cells for days before the first day of month */}
                      {Array.from({ length: firstDayOfMonth }).map((_, i) => (
                        <div key={`year-month-${monthIndex}-empty-${i}`} className="p-1"></div>
                      ))}
                      
                      {/* Actual days */}
                      {Array.from({ length: daysInMonth }).map((_, day) => {
                        const date = new Date(currentYear, monthIndex, day + 1);
                        const hasEventsOnDay = hasEvents(date);
                        const isToday = isCurrentDay(date);
                        
                        return (
                          <div 
                            key={`year-month-${monthIndex}-day-${day + 1}`} 
                            className={`text-center p-1 cursor-pointer
                              ${isToday ? 'bg-primary text-white rounded-full' : ''} 
                              ${hasEventsOnDay ? 'font-bold text-primary' : ''}
                            `}
                            onClick={() => {
                              const newDate = new Date(currentYear, monthIndex, day + 1);
                              onDayClick?.(newDate);
                            }}
                          >
                            {day + 1}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
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
