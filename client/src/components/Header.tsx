import { CalendarDays, Plus, Bell, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import TaskModal from "./TaskModal";

export default function Header() {
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const notificationCount = 3; // In a real app, this would come from a notification state/API
  
  return (
    <>
      <header className="bg-primary text-white py-2 px-4 shadow-md z-10">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center space-x-2">
            <CalendarDays className="h-6 w-6" />
            <h1 className="text-xl font-medium">AI Calendar Assistant</h1>
          </div>
          <div className="flex items-center space-x-4">
            <Button 
              variant="default" 
              size="sm" 
              className="flex items-center bg-primary-dark hover:bg-primary-light rounded-full"
              onClick={() => setIsTaskModalOpen(true)}
            >
              <Plus className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">New Task</span>
            </Button>
            <div className="relative">
              <Button 
                variant="default" 
                size="icon" 
                className="bg-primary-dark hover:bg-primary-light rounded-full w-8 h-8 p-1"
              >
                <Bell className="h-5 w-5" />
              </Button>
              {notificationCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-destructive text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                  {notificationCount}
                </span>
              )}
            </div>
            <Button 
              variant="default" 
              size="icon" 
              className="w-8 h-8 rounded-full bg-white text-primary flex items-center justify-center p-1"
            >
              <User className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>
      
      {isTaskModalOpen && (
        <TaskModal open={isTaskModalOpen} onClose={() => setIsTaskModalOpen(false)} />
      )}
    </>
  );
}
