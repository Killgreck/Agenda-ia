import { useState } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import CalendarView from "@/components/CalendarView";
import AIAssistant from "@/components/AIAssistant";
import TaskModal from "@/components/TaskModal";
import PostponeModal from "@/components/PostponeModal";
import { Task, InsertTask } from "@shared/schema";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, BarChart, CheckSquare, Calendar, MessageSquare } from "lucide-react";
import { useStats } from "@/hooks/useStats";
import { useCheckin, useTasks } from "@/hooks/useTaskManager";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { TaskMenu } from "@/components/ui/task-menu";

export default function Dashboard() {
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [taskToPostpone, setTaskToPostpone] = useState<Task | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const { toast } = useToast();
  const { submitCheckin, isCheckingIn, latestCheckIn } = useCheckin();
  const { stats } = useStats();
  const { upcomingTasks } = useTasks();

  // Global task edit handler - can be called from any component
  window.handleTaskEdit = (task: Task) => {
    setTaskToEdit(task);
    setIsEditMode(true);
    setIsTaskModalOpen(true);
  };
  
  // Global task postpone handler - can be called from any component
  window.handleTaskPostpone = (task: Task) => {
    setTaskToPostpone(task);
  };

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setIsEditMode(false);
    setIsViewMode(false);
    setTaskToEdit(null);
    setIsTaskModalOpen(true);
  };
  
  const handleMoodSelection = (rating: number) => {
    setSelectedRating(rating);
    
    // Get user ID from localStorage
    const authStorageStr = localStorage.getItem('auth-storage');
    const authStorage = authStorageStr ? JSON.parse(authStorageStr) : { state: { user: { id: 0 } } };
    const userId = authStorage?.state?.user?.id || 0;
    
    submitCheckin({
      date: new Date().toISOString(),
      productivityRating: rating,
      notes: "",
      userId
    });
    
    toast({
      title: "Check-in recorded",
      description: "Thank you for your daily productivity check-in!",
    });
  };
  
  const getMoodIcon = (value: number, selected: number | null) => {
    const baseClasses = "h-6 w-6";
    let colorClass = "text-gray-400";
    
    if (selected !== null && value === selected) {
      switch (value) {
        case 1: colorClass = "text-destructive"; break;
        case 2: colorClass = "text-warning"; break;
        case 3: colorClass = "text-gray-500"; break;
        case 4: colorClass = "text-secondary"; break;
        case 5: colorClass = "text-success"; break;
      }
    }
    
    return `${baseClasses} ${colorClass}`;
  };
  
  // Map priority to color class
  const getPriorityClass = (priority: string) => {
    switch (priority?.toLowerCase()) {
      case 'high': return 'bg-destructive';
      case 'medium': return 'bg-warning';
      case 'low': return 'bg-secondary';
      default: return 'bg-accent';
    }
  };
  
  // Format date display for upcoming tasks
  const getDateDisplay = (date: Date) => {
    const today = new Date();
    const tomorrow = new Date();
    tomorrow.setDate(today.getDate() + 1);
    
    if (date.toDateString() === today.toDateString()) return "Today";
    if (date.toDateString() === tomorrow.toDateString()) return "Tomorrow";
    
    // Return abbreviated day name for dates within a week
    const daysOfWeek = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    if (date.getTime() - today.getTime() < 7 * 24 * 60 * 60 * 1000) {
      return daysOfWeek[date.getDay()];
    }
    
    // Format as MM/DD for other dates
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header />
      
      <main className="flex-1 overflow-auto p-4">
        <Tabs defaultValue="home" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="home" className="flex items-center gap-1">
              <CheckSquare className="h-4 w-4" />
              Home
            </TabsTrigger>
            <TabsTrigger value="calendar" className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Calendar
            </TabsTrigger>
            <TabsTrigger value="assistant" className="flex items-center gap-1">
              <MessageSquare className="h-4 w-4" />
              AI Assistant
            </TabsTrigger>
          </TabsList>
          
          {/* Home Tab - Shows statistics, upcoming tasks, and daily check-in */}
          <TabsContent value="home" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Daily Check-in */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <CheckCircle className="mr-2 h-5 w-5 text-blue-600" />
                    Daily Check-in
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600 mb-3">How productive do you feel today?</p>
                  <div className="flex justify-between">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <Button 
                        key={value}
                        variant="ghost" 
                        size="sm"
                        className="p-1 rounded hover:bg-gray-100"
                        onClick={() => handleMoodSelection(value)}
                        disabled={isCheckingIn}
                      >
                        <span className={getMoodIcon(value, selectedRating || (latestCheckIn?.productivityRating || null))}>
                          {value === 1 && "😞"}
                          {value === 2 && "😕"}
                          {value === 3 && "😐"}
                          {value === 4 && "🙂"}
                          {value === 5 && "😁"}
                        </span>
                      </Button>
                    ))}
                  </div>
                  {latestCheckIn && (
                    <p className="text-xs text-gray-500 mt-3">
                      Last check-in: {new Date(latestCheckIn.date).toLocaleDateString()}
                    </p>
                  )}
                </CardContent>
              </Card>
              
              {/* Weekly Statistics */}
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <BarChart className="mr-2 h-5 w-5 text-primary" />
                    Weekly Statistics
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="mb-3">
                    <p className="text-xs text-gray-500">Tasks Completed</p>
                    <div className="flex items-center">
                      <Progress value={stats?.tasksCompletionRate || 0} className="flex-grow h-2" />
                      <span className="text-sm ml-2 font-medium">{stats?.tasksCompletionRate || 0}%</span>
                    </div>
                  </div>
                  <div className="mb-3">
                    <p className="text-xs text-gray-500">Productivity Score</p>
                    <div className="flex items-center">
                      <Progress value={stats?.productivityScore || 0} className="flex-grow h-2 bg-gray-200 [&>*]:bg-accent" />
                      <span className="text-sm ml-2 font-medium">{stats?.productivityScore || 0}%</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">AI Suggestions Used</p>
                    <div className="flex items-center">
                      <Progress value={stats?.aiSuggestionsRate || 0} className="flex-grow h-2 bg-gray-200 [&>*]:bg-blue-500" />
                      <span className="text-sm ml-2 font-medium">{stats?.aiSuggestionsRate || 0}%</span>
                    </div>
                  </div>
                  <Button 
                    variant="link" 
                    className="mt-2 px-0 text-xs text-primary font-medium"
                    onClick={() => toast({
                      title: "Coming Soon",
                      description: "Detailed reports will be available soon!",
                    })}
                  >
                    View detailed report
                  </Button>
                </CardContent>
              </Card>
              
              {/* Upcoming Tasks */}
              <Card className="md:col-span-1">
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg flex items-center">
                    <CheckSquare className="mr-2 h-5 w-5 text-primary" />
                    Upcoming Tasks
                  </CardTitle>
                </CardHeader>
                <CardContent className="max-h-[300px] overflow-y-auto custom-scrollbar">
                  {upcomingTasks.length === 0 ? (
                    <div className="text-sm text-gray-500 text-center py-6 italic">
                      No upcoming tasks
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {upcomingTasks.map((task: Task) => (
                        <Card key={task.id} className="hover:shadow transition">
                          <CardContent className="p-3">
                            <div className="flex justify-between items-start">
                              <h3 className="font-medium text-gray-800">{task.title}</h3>
                              <span className={`text-xs text-white ${getPriorityClass(task.priority || 'medium')} rounded-full px-2 py-0.5`}>
                                {getDateDisplay(new Date(task.date))}
                              </span>
                            </div>
                            
                            <p className="text-xs text-gray-500 mt-1">
                              {task.isAllDay ? 'All day' : new Date(task.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              {task.endDate && !task.isAllDay && ` - ${new Date(task.endDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`}
                            </p>
                            
                            <div className="flex justify-between items-center mt-2">
                              <div className="flex">
                                {task.location && (
                                  <>
                                    <span className="text-xs text-gray-400 mr-1">📍</span>
                                    <span className="text-xs text-gray-500">{task.location}</span>
                                  </>
                                )}
                              </div>
                              <TaskMenu 
                                task={task} 
                                onEdit={(taskToEdit) => {
                                  if (window.handleTaskEdit) {
                                    window.handleTaskEdit(taskToEdit);
                                  }
                                }} 
                              />
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
          
          {/* Calendar Tab */}
          <TabsContent value="calendar" className="h-[calc(100vh-160px)]">
            <Card className="h-full">
              <CardContent className="p-0 h-full">
                <CalendarView onDayClick={handleDayClick} />
              </CardContent>
            </Card>
          </TabsContent>
          
          {/* AI Assistant Tab */}
          <TabsContent value="assistant" className="h-[calc(100vh-160px)]">
            <Card className="h-full">
              <CardContent className="p-0 h-full">
                <AIAssistant />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
      
      {/* Task Modal - For creating or editing tasks */}
      {isTaskModalOpen && (
        <TaskModal 
          open={isTaskModalOpen} 
          onClose={() => {
            setIsTaskModalOpen(false);
            setSelectedDate(null);
            setTaskToEdit(null);
            setIsEditMode(false);
            setIsViewMode(false);
          }}
          taskToEdit={isEditMode && taskToEdit 
            ? {
                ...taskToEdit,
                date: typeof taskToEdit.date === 'string' 
                  ? taskToEdit.date 
                  : taskToEdit.date.toISOString(),
                endDate: taskToEdit.endDate 
                  ? (typeof taskToEdit.endDate === 'string'
                    ? taskToEdit.endDate
                    : taskToEdit.endDate.toISOString())
                  : undefined
              }
            : selectedDate 
              ? { 
                  title: "",
                  description: "",
                  date: selectedDate.toISOString().split('T')[0], // Format as YYYY-MM-DD string
                  priority: "medium",
                  completed: false,
                  isAllDay: false
                } 
              : undefined
          }
          viewOnly={isViewMode}
        />
      )}
      
      {/* Postpone Modal - For rescheduling tasks */}
      {taskToPostpone && (
        <PostponeModal
          open={!!taskToPostpone}
          onClose={() => setTaskToPostpone(null)}
          task={taskToPostpone}
        />
      )}
    </div>
  );
}
