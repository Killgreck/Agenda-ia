export interface ChatMessage {
  id: number;
  content: string;
  timestamp: Date | string;
  sender: 'user' | 'ai' | 'system';
}