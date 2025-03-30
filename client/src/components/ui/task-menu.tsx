import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Pencil, Trash, Calendar, Clock } from "lucide-react";
import { Task } from "@shared/schema";
import { useTasks } from "@/hooks/useTaskManager";
import { useToast } from "@/hooks/use-toast";

interface TaskMenuProps {
  task: Task;
  onEdit: (task: Task) => void;
  className?: string;
}

export function TaskMenu({ task, onEdit, className = "" }: TaskMenuProps) {
  const { deleteTask, isDeletingTask } = useTasks();
  const { toast } = useToast();

  const handleDelete = async () => {
    try {
      await deleteTask(task.id);
      toast({
        title: "Task deleted",
        description: "The task has been successfully deleted",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete the task. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handlePostpone = () => {
    // Use the global handleTaskPostpone function to open the postpone modal
    if (window.handleTaskPostpone) {
      window.handleTaskPostpone(task);
    } else {
      // Fallback if the global function isn't available yet
      toast({
        title: "Postpone feature",
        description: "The postpone feature is being initialized. Please try again.",
      });
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className={`h-6 w-6 p-0 ${className}`}>
          <MoreHorizontal className="h-4 w-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => onEdit(task)} className="cursor-pointer">
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </DropdownMenuItem>
        <DropdownMenuItem onClick={handlePostpone} className="cursor-pointer">
          <Calendar className="mr-2 h-4 w-4" />
          Reschedule Task
        </DropdownMenuItem>
        <DropdownMenuItem 
          onClick={handleDelete} 
          className="text-red-500 cursor-pointer"
          disabled={isDeletingTask}
        >
          <Trash className="mr-2 h-4 w-4" />
          Delete
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}