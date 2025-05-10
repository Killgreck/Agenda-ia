// Import from mongoStorage.ts as the primary storage mechanism
import { MongoDBStorage } from './mongoStorage';
import { log } from './vite';
import session from "express-session";

export interface IStorage {
  // Session store para autenticación
  sessionStore: session.Store;
  
  // User operations
  getUser(id: number): Promise<any>;
  getUserByUsername(username: string): Promise<any>;
  getUserByEmail(email: string): Promise<any>;
  getUserByVerificationToken(token: string): Promise<any>;
  getUserByPasswordResetToken(token: string): Promise<any>;
  createUser(user: any): Promise<any>;
  updateUser(id: number, userData: any): Promise<any>;
  setEmailVerificationToken(userId: number, token: string, expires: Date): Promise<boolean>;
  verifyEmail(token: string): Promise<any>;
  setPasswordResetToken(userId: number, token: string, expires: Date): Promise<boolean>;
  resetPassword(token: string, newPassword: string): Promise<any>;
  
  // Task operations
  createTask(task: any): Promise<any>;
  updateTask(id: number, task: any): Promise<any>;
  deleteTask(id: number): Promise<boolean>;
  getTask(id: number): Promise<any>;
  getTasks(filters?: { startDate?: Date; endDate?: Date; userId?: number }): Promise<any[]>;
  
  // Check-in operations
  createCheckIn(checkIn: any): Promise<any>;
  getCheckIns(startDate: Date, endDate: Date, userId?: number): Promise<any[]>;
  getLatestCheckIn(userId?: number): Promise<any>;
  
  // Chat operations
  createChatMessage(message: any): Promise<any>;
  getChatMessages(limit?: number, userId?: number): Promise<any[]>;
  
  // AI Suggestion operations
  createAiSuggestion(suggestion: any): Promise<any>;
  updateAiSuggestion(id: number, accepted: boolean): Promise<any>;
  getAiSuggestions(limit?: number, userId?: number): Promise<any[]>;
  
  // Statistics operations
  createStatistics(stats: any): Promise<any>;
  getStatisticsForWeek(weekStart: Date, weekEnd: Date, userId?: number): Promise<any>;
  getLatestStatistics(limit?: number, userId?: number): Promise<any[]>;
  
  // Notification operations
  createNotification(notification: any): Promise<any>;
  markNotificationAsRead(id: number): Promise<any>;
  dismissNotification(id: number): Promise<any>;
  getNotifications(userId: number, limit?: number, includeRead?: boolean): Promise<any[]>;
  getUnreadNotificationCount(userId: number): Promise<number>;
  markAllNotificationsAsRead(userId: number): Promise<void>;
}

// Siempre usamos MongoDB como almacenamiento primario
let isMongoAvailable = true;

// Simple method to check MongoDB connection and set the appropriate storage
export const setMongoAvailability = (available: boolean) => {
  // Siempre mantener MongoDB como disponible, ignorando el parámetro
  isMongoAvailable = true;
  log(`Storage: Usando MongoDB como almacenamiento principal`, 'storage');
};

// Create a MongoDB storage instance and use it exclusively
const mongoStorage = new MongoDBStorage();

// Export MongoDB storage as the only storage option
export const storage = mongoStorage;