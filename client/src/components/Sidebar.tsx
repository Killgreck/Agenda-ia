import { CheckCircle, BarChart, CheckSquare, MessageSquare } from "lucide-react";
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useCheckin } from "@/hooks/useTaskManager";
import { useStats } from "@/hooks/useStats";
import { Task } from "@shared/schema";
import { useTasks } from "@/hooks/useTaskManager";
import { TaskMenu } from "@/components/ui/task-menu";
import { Link } from "wouter";

export default function Sidebar() {
  const { toast } = useToast();
  const { submitCheckin, isCheckingIn } = useCheckin();
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const { stats } = useStats();
  const { upcomingTasks } = useTasks();
  
  const handleMoodSelection = (rating: number) => {
    setSelectedRating(rating);
    
    submitCheckin({
      date: new Date().toISOString(),
      productivityRating: rating,
      notes: "",
      userId: 1 // Assuming the current user has ID 1 for now
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
    <aside className="w-full lg:w-64 bg-white border-r border-gray-200 flex-shrink-0 overflow-y-auto custom-scrollbar">
      <div className="p-4">
        {/* Daily Check-in */}
        <div className="mb-6 bg-blue-50 rounded-lg p-4">
          <h2 className="font-medium text-blue-800 flex items-center">
            <CheckCircle className="mr-2 h-5 w-5 text-blue-600" />
            Daily Check-in
          </h2>
          <p className="text-sm text-gray-600 mt-2">How productive do you feel today?</p>
          <div className="flex justify-between mt-3">
            {[1, 2, 3, 4, 5].map((value) => (
              <Button 
                key={value}
                variant="ghost" 
                size="sm"
                className="p-1 rounded hover:bg-gray-100"
                onClick={() => handleMoodSelection(value)}
                disabled={isCheckingIn}
              >
                <span className={getMoodIcon(value, selectedRating)}>
                  {value === 1 && "😞"}
                  {value === 2 && "😕"}
                  {value === 3 && "😐"}
                  {value === 4 && "🙂"}
                  {value === 5 && "😁"}
                </span>
              </Button>
            ))}
          </div>
        </div>

        {/* Weekly Statistics */}
        <div className="mb-6">
          <h2 className="font-medium text-gray-700 flex items-center">
            <BarChart className="mr-2 h-5 w-5 text-primary" />
            Weekly Statistics
          </h2>
          <div className="mt-3 bg-gray-50 rounded-lg p-3">
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
              className="mt-3 w-full text-xs text-primary font-medium"
              onClick={() => toast({
                title: "Coming Soon",
                description: "Detailed reports will be available soon!",
              })}
            >
              View detailed report
            </Button>
          </div>
        </div>

        {/* AI Assistant Chat */}
        <div className="mb-6">
          <h2 className="font-medium text-gray-700 flex items-center">
            <MessageSquare className="mr-2 h-5 w-5 text-primary" />
            AI Assistant
          </h2>
          <Link href="/chat">
            <Button 
              variant="outline" 
              className="mt-3 w-full text-sm border-primary/30 text-primary hover:bg-primary/10"
            >
              Conversar con el asistente
            </Button>
          </Link>
        </div>
        
        {/* Upcoming Tasks */}
        <div>
          <h2 className="font-medium text-gray-700 flex items-center">
            <CheckSquare className="mr-2 h-5 w-5 text-primary" />
            Upcoming Tasks
          </h2>
          
          {upcomingTasks.length === 0 ? (
            <div className="mt-3 text-sm text-gray-500 text-center py-6 italic">
              No upcoming tasks
            </div>
          ) : (
            upcomingTasks.map((task: Task) => (
              <Card key={task.id} className="mt-3 hover:shadow transition">
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
                        } else {
                          toast({
                            title: "Task Edit",
                            description: "Edit functionality is being initialized. Please try again.",
                            variant: "destructive"
                          });
                        }
                      }} 
                    />
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </aside>
  );
}
