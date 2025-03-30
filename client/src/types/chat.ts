/**
 * Chat message type definitions
 */

export type MessageSender = 'ai' | 'user' | 'system';

export interface ChatMessage {
  id: number;
  content: string;
  timestamp: string;
  sender: MessageSender;
}