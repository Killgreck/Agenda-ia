import { useState } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import CalendarView from "@/components/CalendarView";
import AIAssistant from "@/components/AIAssistant";
import TaskModal from "@/components/TaskModal";
import PostponeModal from "@/components/PostponeModal";
import { Task, InsertTask } from "@shared/schema";

export default function Dashboard() {
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [taskToEdit, setTaskToEdit] = useState<Task | null>(null);
  const [taskToPostpone, setTaskToPostpone] = useState<Task | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [isViewMode, setIsViewMode] = useState(false);

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

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      <Header />
      
      <main className="flex-1 overflow-auto">
        <div className="min-h-full flex flex-col lg:flex-row">
          {/* Sidebar with productivity check-in, stats, and upcoming tasks */}
          <Sidebar />
          
          {/* Main calendar area */}
          <CalendarView onDayClick={handleDayClick} />
          
          {/* AI Assistant sidebar */}
          <AIAssistant />
        </div>
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
