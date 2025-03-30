import { useState } from "react";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import CalendarView from "@/components/CalendarView";
import AIAssistant from "@/components/AIAssistant";
import TaskModal from "@/components/TaskModal";

export default function Dashboard() {
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
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
      
      {/* Task Modal */}
      {isTaskModalOpen && (
        <TaskModal 
          open={isTaskModalOpen} 
          onClose={() => {
            setIsTaskModalOpen(false);
            setSelectedDate(null);
          }}
          taskToEdit={selectedDate ? { 
            title: "",
            description: "",
            date: selectedDate.toISOString().split('T')[0], // Format as YYYY-MM-DD string
            priority: "medium",
            completed: false,
            isAllDay: false
          } : undefined}
        />
      )}
    </div>
  );
}
