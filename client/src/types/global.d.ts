import { Task } from "@shared/schema";

declare global {
  interface Window {
    handleTaskEdit: (task: Task) => void;
    handleTaskPostpone: (task: Task) => void;
  }
}

export {};