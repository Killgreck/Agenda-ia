import { Task, CheckIn, ChatMessage, AiSuggestion, Statistic } from "@shared/schema";

export interface WeeklyStats {
  tasksCompletionRate: number;
  productivityScore: number;
  aiSuggestionsRate: number;
}

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  tasks?: Task[];
}

export interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  allDay: boolean;
  color?: string;
  priority?: string;
}

export interface ChatConversation {
  messages: ChatMessage[];
}

export interface CheckInHistory {
  checkIns: CheckIn[];
  averageRating: number;
}

export interface AiSuggestionWithMetadata extends AiSuggestion {
  metadata: {
    taskId?: number;
    forDate?: string;
    category?: string;
    [key: string]: any;
  }
}
