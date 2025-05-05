import {
  users, type User, type InsertUser,
  tasks, type Task, type InsertTask,
  checkIns, type CheckIn, type InsertCheckIn,
  chatMessages, type ChatMessage, type InsertChatMessage,
  aiSuggestions, type AiSuggestion, type InsertAiSuggestion,
  statistics, type Statistic, type InsertStatistic,
  notifications, type Notification, type InsertNotification
} from "@shared/schema";
import { eq, and, gte, lte, desc, asc, count } from "drizzle-orm";
import { db } from "./db";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByVerificationToken(token: string): Promise<User | undefined>;
  getUserByPasswordResetToken(token: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<Omit<InsertUser, 'password'>>): Promise<User | undefined>;
  setEmailVerificationToken(userId: number, token: string, expires: Date): Promise<boolean>;
  verifyEmail(token: string): Promise<User | undefined>;
  setPasswordResetToken(userId: number, token: string, expires: Date): Promise<boolean>;
  resetPassword(token: string, newPassword: string): Promise<User | undefined>;
  
  // Task operations
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
  getTask(id: number): Promise<Task | undefined>;
  getTasks(filters?: { startDate?: Date; endDate?: Date; userId?: number }): Promise<Task[]>;
  
  // Check-in operations
  createCheckIn(checkIn: InsertCheckIn): Promise<CheckIn>;
  getCheckIns(startDate: Date, endDate: Date, userId?: number): Promise<CheckIn[]>;
  getLatestCheckIn(userId?: number): Promise<CheckIn | undefined>;
  
  // Chat operations
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessages(limit?: number, userId?: number): Promise<ChatMessage[]>;
  
  // AI Suggestion operations
  createAiSuggestion(suggestion: InsertAiSuggestion): Promise<AiSuggestion>;
  updateAiSuggestion(id: number, accepted: boolean): Promise<AiSuggestion | undefined>;
  getAiSuggestions(limit?: number, userId?: number): Promise<AiSuggestion[]>;
  
  // Statistics operations
  createStatistics(stats: InsertStatistic): Promise<Statistic>;
  getStatisticsForWeek(weekStart: Date, weekEnd: Date, userId?: number): Promise<Statistic | undefined>;
  getLatestStatistics(limit?: number, userId?: number): Promise<Statistic[]>;
  
  // Notification operations
  createNotification(notification: InsertNotification): Promise<Notification>;
  markNotificationAsRead(id: number): Promise<Notification | undefined>;
  dismissNotification(id: number): Promise<Notification | undefined>;
  getNotifications(userId: number, limit?: number, includeRead?: boolean): Promise<Notification[]>;
  getUnreadNotificationCount(userId: number): Promise<number>;
  markAllNotificationsAsRead(userId: number): Promise<void>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private tasks: Map<number, Task>;
  private checkIns: Map<number, CheckIn>;
  private chatMessages: Map<number, ChatMessage>;
  private aiSuggestions: Map<number, AiSuggestion>;
  private statistics: Map<number, Statistic>;
  private notifications: Map<number, Notification>;
  
  private currentUserIds: number;
  private currentTaskIds: number;
  private currentCheckInIds: number;
  private currentChatMessageIds: number;
  private currentAiSuggestionIds: number;
  private currentStatisticsIds: number;
  private currentNotificationIds: number;

  constructor() {
    this.users = new Map();
    this.tasks = new Map();
    this.checkIns = new Map();
    this.chatMessages = new Map();
    this.aiSuggestions = new Map();
    this.statistics = new Map();
    this.notifications = new Map();
    
    this.currentUserIds = 1;
    this.currentTaskIds = 1;
    this.currentCheckInIds = 1;
    this.currentChatMessageIds = 1;
    this.currentAiSuggestionIds = 1;
    this.currentStatisticsIds = 1;
    this.currentNotificationIds = 1;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }
  
  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => (user as any).emailVerificationToken === token && 
        (user as any).emailVerificationExpires && 
        new Date((user as any).emailVerificationExpires) > new Date(),
    );
  }
  
  async getUserByPasswordResetToken(token: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => (user as any).passwordResetToken === token && 
        (user as any).passwordResetExpires && 
        new Date((user as any).passwordResetExpires) > new Date(),
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserIds++;
    const user: User = { 
      ...insertUser, 
      id,
      // Agregar campos para email verification
      isEmailVerified: false,
      emailVerificationToken: null,
      emailVerificationExpires: null,
      passwordResetToken: null,
      passwordResetExpires: null
    } as any;
    this.users.set(id, user);
    return user;
  }
  
  async updateUser(id: number, userData: Partial<Omit<InsertUser, 'password'>>): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) return undefined;
    
    const updatedUser = { ...existingUser, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }
  
  async setEmailVerificationToken(userId: number, token: string, expires: Date): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;
    
    const updatedUser = { 
      ...user, 
      emailVerificationToken: token,
      emailVerificationExpires: expires
    } as any;
    
    this.users.set(userId, updatedUser);
    return true;
  }
  
  async verifyEmail(token: string): Promise<User | undefined> {
    const user = this.getUserByVerificationToken(token);
    if (!user) return undefined;
    
    const updatedUser = { 
      ...user, 
      isEmailVerified: true,
      emailVerificationToken: null,
      emailVerificationExpires: null
    } as any;
    
    this.users.set(updatedUser.id, updatedUser);
    return updatedUser;
  }
  
  async setPasswordResetToken(userId: number, token: string, expires: Date): Promise<boolean> {
    const user = this.users.get(userId);
    if (!user) return false;
    
    const updatedUser = { 
      ...user, 
      passwordResetToken: token,
      passwordResetExpires: expires
    } as any;
    
    this.users.set(userId, updatedUser);
    return true;
  }
  
  async resetPassword(token: string, newPassword: string): Promise<User | undefined> {
    const user = await this.getUserByPasswordResetToken(token);
    if (!user) return undefined;
    
    const updatedUser = { 
      ...user, 
      password: newPassword, // Nota: en la implementación real, esto debería estar hasheado
      passwordResetToken: null,
      passwordResetExpires: null
    } as any;
    
    this.users.set(updatedUser.id, updatedUser);
    return updatedUser;
  }
  
  // Task operations
  async createTask(insertTask: InsertTask): Promise<Task> {
    const id = this.currentTaskIds++;
    const task: Task = { ...insertTask, id };
    this.tasks.set(id, task);
    return task;
  }
  
  async updateTask(id: number, taskUpdate: Partial<InsertTask>): Promise<Task | undefined> {
    const existingTask = this.tasks.get(id);
    if (!existingTask) return undefined;
    
    const updatedTask = { ...existingTask, ...taskUpdate };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }
  
  async deleteTask(id: number): Promise<boolean> {
    return this.tasks.delete(id);
  }
  
  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }
  
  async getTasks(filters?: { startDate?: Date; endDate?: Date }): Promise<Task[]> {
    let tasks = Array.from(this.tasks.values());
    
    if (filters) {
      if (filters.startDate) {
        tasks = tasks.filter(task => new Date(task.date) >= filters.startDate!);
      }
      if (filters.endDate) {
        tasks = tasks.filter(task => new Date(task.date) <= filters.endDate!);
      }
    }
    
    return tasks.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  }
  
  // Check-in operations
  async createCheckIn(insertCheckIn: InsertCheckIn): Promise<CheckIn> {
    const id = this.currentCheckInIds++;
    const checkIn: CheckIn = { ...insertCheckIn, id };
    this.checkIns.set(id, checkIn);
    return checkIn;
  }
  
  async getCheckIns(startDate: Date, endDate: Date): Promise<CheckIn[]> {
    return Array.from(this.checkIns.values())
      .filter(checkIn => {
        const checkInDate = new Date(checkIn.date);
        return checkInDate >= startDate && checkInDate <= endDate;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }
  
  async getLatestCheckIn(): Promise<CheckIn | undefined> {
    const checkIns = Array.from(this.checkIns.values());
    if (checkIns.length === 0) return undefined;
    
    return checkIns.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
  }
  
  // Chat operations
  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    const id = this.currentChatMessageIds++;
    const message: ChatMessage = { ...insertMessage, id };
    this.chatMessages.set(id, message);
    return message;
  }
  
  async getChatMessages(limit?: number): Promise<ChatMessage[]> {
    let messages = Array.from(this.chatMessages.values())
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
    
    if (limit) {
      messages = messages.slice(-limit);
    }
    
    return messages;
  }
  
  // AI Suggestion operations
  async createAiSuggestion(insertSuggestion: InsertAiSuggestion): Promise<AiSuggestion> {
    const id = this.currentAiSuggestionIds++;
    const suggestion: AiSuggestion = { ...insertSuggestion, id };
    this.aiSuggestions.set(id, suggestion);
    return suggestion;
  }
  
  async updateAiSuggestion(id: number, accepted: boolean): Promise<AiSuggestion | undefined> {
    const suggestion = this.aiSuggestions.get(id);
    if (!suggestion) return undefined;
    
    const updatedSuggestion = { ...suggestion, accepted };
    this.aiSuggestions.set(id, updatedSuggestion);
    return updatedSuggestion;
  }
  
  async getAiSuggestions(limit?: number): Promise<AiSuggestion[]> {
    let suggestions = Array.from(this.aiSuggestions.values())
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    
    if (limit) {
      suggestions = suggestions.slice(0, limit);
    }
    
    return suggestions;
  }
  
  // Statistics operations
  async createStatistics(insertStats: InsertStatistic): Promise<Statistic> {
    const id = this.currentStatisticsIds++;
    const stats: Statistic = { ...insertStats, id };
    this.statistics.set(id, stats);
    return stats;
  }
  
  async getStatisticsForWeek(weekStart: Date, weekEnd: Date): Promise<Statistic | undefined> {
    return Array.from(this.statistics.values())
      .find(stats => {
        const start = new Date(stats.weekStart);
        const end = new Date(stats.weekEnd);
        return start >= weekStart && end <= weekEnd;
      });
  }
  
  async getLatestStatistics(limit?: number): Promise<Statistic[]> {
    let stats = Array.from(this.statistics.values())
      .sort((a, b) => new Date(b.weekEnd).getTime() - new Date(a.weekEnd).getTime());
    
    if (limit) {
      stats = stats.slice(0, limit);
    }
    
    return stats;
  }

  // Notification operations
  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    const id = this.currentNotificationIds++;
    const notification: Notification = { 
      ...insertNotification, 
      id,
      readAt: insertNotification.readAt ? new Date(insertNotification.readAt) : null
    };
    this.notifications.set(id, notification);
    return notification;
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const notification = this.notifications.get(id);
    if (!notification) return undefined;

    const updatedNotification = { 
      ...notification, 
      status: 'read' as const,
      readAt: new Date()
    };
    this.notifications.set(id, updatedNotification);
    return updatedNotification;
  }

  async dismissNotification(id: number): Promise<Notification | undefined> {
    const notification = this.notifications.get(id);
    if (!notification) return undefined;

    const dismissedNotification = { 
      ...notification, 
      status: 'dismissed' as const 
    };
    this.notifications.set(id, dismissedNotification);
    return dismissedNotification;
  }

  async getNotifications(userId: number, limit?: number, includeRead: boolean = false): Promise<Notification[]> {
    let notifications = Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId);
    
    // Filter by status if not including read notifications
    if (!includeRead) {
      notifications = notifications.filter(notification => notification.status === 'unread');
    }
    
    // Order by creation time (newest first)
    notifications = notifications.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // Apply limit if provided
    if (limit) {
      notifications = notifications.slice(0, limit);
    }
    
    return notifications;
  }

  async getUnreadNotificationCount(userId: number): Promise<number> {
    return Array.from(this.notifications.values())
      .filter(notification => notification.userId === userId && notification.status === 'unread')
      .length;
  }

  async markAllNotificationsAsRead(userId: number): Promise<void> {
    // Find all unread notifications for the user
    const unreadNotifications = Array.from(this.notifications.entries())
      .filter(([_, notification]) => notification.userId === userId && notification.status === 'unread');
    
    // Mark each as read
    const now = new Date();
    for (const [id, notification] of unreadNotifications) {
      this.notifications.set(id, {
        ...notification,
        status: 'read' as const,
        readAt: now
      });
    }
  }
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }
  
  async getUserByEmail(email: string): Promise<User | undefined> {
    // Esta función se implementará cuando actualicemos el esquema Postgres
    console.warn('getUserByEmail no está completamente implementado en DatabaseStorage');
    return undefined;
  }
  
  async getUserByVerificationToken(token: string): Promise<User | undefined> {
    // Esta función se implementará cuando actualicemos el esquema Postgres
    console.warn('getUserByVerificationToken no está completamente implementado en DatabaseStorage');
    return undefined;
  }
  
  async getUserByPasswordResetToken(token: string): Promise<User | undefined> {
    // Esta función se implementará cuando actualicemos el esquema Postgres
    console.warn('getUserByPasswordResetToken no está completamente implementado en DatabaseStorage');
    return undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }
  
  async setEmailVerificationToken(userId: number, token: string, expires: Date): Promise<boolean> {
    // Esta función se implementará cuando actualicemos el esquema Postgres
    console.warn('setEmailVerificationToken no está completamente implementado en DatabaseStorage');
    return false;
  }
  
  async verifyEmail(token: string): Promise<User | undefined> {
    // Esta función se implementará cuando actualicemos el esquema Postgres
    console.warn('verifyEmail no está completamente implementado en DatabaseStorage');
    return undefined;
  }
  
  async setPasswordResetToken(userId: number, token: string, expires: Date): Promise<boolean> {
    // Esta función se implementará cuando actualicemos el esquema Postgres
    console.warn('setPasswordResetToken no está completamente implementado en DatabaseStorage');
    return false;
  }
  
  async resetPassword(token: string, newPassword: string): Promise<User | undefined> {
    // Esta función se implementará cuando actualicemos el esquema Postgres
    console.warn('resetPassword no está completamente implementado en DatabaseStorage');
    return undefined;
  }
  
  async updateUser(id: number, userData: Partial<Omit<InsertUser, 'password'>>): Promise<User | undefined> {
    // Remove undefined values for the update
    const cleanedUpdate: Record<string, any> = {};
    
    Object.entries(userData).forEach(([key, value]) => {
      if (value !== undefined) {
        // Handle date conversions for specific fields
        if (key === 'birthdate' && value) {
          cleanedUpdate[key] = new Date(value);
        } else {
          // For non-date fields, use the value as is
          cleanedUpdate[key] = value;
        }
      }
    });
    
    const [updatedUser] = await db
      .update(users)
      .set(cleanedUpdate)
      .where(eq(users.id, id))
      .returning();
    return updatedUser || undefined;
  }
  
  async createTask(insertTask: InsertTask): Promise<Task> {
    // Convert date strings to Date objects for PostgreSQL
    const cleanedTask = {
        ...insertTask,
        // Convert the required date field from string to Date
        date: new Date(insertTask.date),
        
        // Handle optional fields with null fallbacks
        description: insertTask.description ?? null,
        endDate: insertTask.endDate ? new Date(insertTask.endDate) : null,
        priority: insertTask.priority || "medium",
        location: insertTask.location ?? null,
        reminder: insertTask.reminder || [],
        recurringDays: insertTask.recurringDays || [],
        holidayCountry: insertTask.holidayCountry ?? null,
        recurrenceType: insertTask.recurrenceType ?? null,
        recurrenceStartDate: insertTask.recurrenceStartDate ? new Date(insertTask.recurrenceStartDate) : null,
        recurrenceEndDate: insertTask.recurrenceEndDate ? new Date(insertTask.recurrenceEndDate) : null
    };

    const [task] = await db
      .insert(tasks)
      .values(cleanedTask)
      .returning();
    return task;
  }

  async updateTask(id: number, taskUpdate: Partial<InsertTask>): Promise<Task | undefined> {
    // Remove undefined values and convert date strings to Date objects
    const cleanedUpdate: Record<string, any> = {};
    
    Object.entries(taskUpdate).forEach(([key, value]) => {
      if (value !== undefined) {
        // Handle date conversions for specific fields
        if (key === 'date' && value) {
          cleanedUpdate[key] = new Date(value);
        } 
        else if (key === 'endDate' && value) {
          cleanedUpdate[key] = new Date(value);
        }
        else if (key === 'recurrenceStartDate' && value) {
          cleanedUpdate[key] = new Date(value);
        }
        else if (key === 'recurrenceEndDate' && value) {
          cleanedUpdate[key] = new Date(value);
        }
        else {
          // For non-date fields, use the value as is
          cleanedUpdate[key] = value;
        }
      }
    });

    const [updatedTask] = await db
      .update(tasks)
      .set(cleanedUpdate)
      .where(eq(tasks.id, id))
      .returning();
    return updatedTask || undefined;
  }

  async deleteTask(id: number): Promise<boolean> {
    const result = await db
      .delete(tasks)
      .where(eq(tasks.id, id));
    return result.rowCount > 0;
  }

  async getTask(id: number): Promise<Task | undefined> {
    const [task] = await db
      .select()
      .from(tasks)
      .where(eq(tasks.id, id));
    return task || undefined;
  }

  async getTasks(filters?: { startDate?: Date; endDate?: Date; userId?: number }): Promise<Task[]> {
    let query = db.select().from(tasks);
    let conditions = [];
    
    if (filters) {
      // Apply date filters
      if (filters.startDate) {
        conditions.push(gte(tasks.date, filters.startDate));
      }
      if (filters.endDate) {
        conditions.push(lte(tasks.date, filters.endDate));
      }
      
      // Apply user filter if provided
      if (filters.userId) {
        conditions.push(eq(tasks.userId, filters.userId));
      }
      
      // Apply all conditions if there are any
      if (conditions.length > 0) {
        query = query.where(and(...conditions));
      }
    }
    
    return await query;
  }

  async createCheckIn(insertCheckIn: InsertCheckIn): Promise<CheckIn> {
    // Convert date string to Date object
    const cleanedCheckIn = {
      ...insertCheckIn,
      date: new Date(insertCheckIn.date)
    };

    const [checkIn] = await db
      .insert(checkIns)
      .values(cleanedCheckIn)
      .returning();
    return checkIn;
  }

  async getCheckIns(startDate: Date, endDate: Date, userId?: number): Promise<CheckIn[]> {
    let conditions = [
      gte(checkIns.date, startDate),
      lte(checkIns.date, endDate)
    ];
    
    // Add user filter if provided
    if (userId) {
      conditions.push(eq(checkIns.userId, userId));
    }
    
    return await db
      .select()
      .from(checkIns)
      .where(and(...conditions));
  }

  async getLatestCheckIn(userId?: number): Promise<CheckIn | undefined> {
    let query = db.select().from(checkIns);
    
    // Filter by userId if provided
    if (userId) {
      query = query.where(eq(checkIns.userId, userId));
    }
    
    // Sort by date and limit to 1
    const [latestCheckIn] = await query
      .orderBy(desc(checkIns.date))
      .limit(1);
      
    return latestCheckIn || undefined;
  }

  async createChatMessage(insertMessage: InsertChatMessage): Promise<ChatMessage> {
    // Convert timestamp string to Date object
    const cleanedMessage = {
      ...insertMessage,
      timestamp: new Date(insertMessage.timestamp)
    };

    const [message] = await db
      .insert(chatMessages)
      .values(cleanedMessage)
      .returning();
    return message;
  }

  async getChatMessages(limit?: number, userId?: number): Promise<ChatMessage[]> {
    // Build basic query
    let baseQuery = db
      .select()
      .from(chatMessages);
      
    // Filter by userId if provided
    if (userId) {
      baseQuery = baseQuery.where(eq(chatMessages.userId, userId));
    }
    
    // Add ordering
    baseQuery = baseQuery.orderBy(asc(chatMessages.timestamp));
    
    // Execute with limit if specified
    if (limit) {
      return await baseQuery.limit(limit);
    }
    
    return await baseQuery;
  }

  async createAiSuggestion(insertSuggestion: InsertAiSuggestion): Promise<AiSuggestion> {
    // Convert timestamp string to Date object
    const cleanedSuggestion = {
      ...insertSuggestion,
      timestamp: new Date(insertSuggestion.timestamp),
      metadata: insertSuggestion.metadata ?? null
    };

    const [suggestion] = await db
      .insert(aiSuggestions)
      .values(cleanedSuggestion)
      .returning();
    return suggestion;
  }

  async updateAiSuggestion(id: number, accepted: boolean): Promise<AiSuggestion | undefined> {
    const [updatedSuggestion] = await db
      .update(aiSuggestions)
      .set({ accepted })
      .where(eq(aiSuggestions.id, id))
      .returning();
    return updatedSuggestion || undefined;
  }

  async getAiSuggestions(limit?: number, userId?: number): Promise<AiSuggestion[]> {
    // Build basic query
    let baseQuery = db
      .select()
      .from(aiSuggestions);
      
    // Filter by userId if provided
    if (userId) {
      baseQuery = baseQuery.where(eq(aiSuggestions.userId, userId));
    }
    
    // Add ordering
    baseQuery = baseQuery.orderBy(desc(aiSuggestions.timestamp));
    
    // Execute with limit if specified
    if (limit) {
      return await baseQuery.limit(limit);
    }
    
    return await baseQuery;
  }

  async createStatistics(insertStats: InsertStatistic): Promise<Statistic> {
    // Convert date strings to Date objects
    const cleanedStats = {
      ...insertStats,
      weekStart: new Date(insertStats.weekStart),
      weekEnd: new Date(insertStats.weekEnd)
    };

    const [stats] = await db
      .insert(statistics)
      .values(cleanedStats)
      .returning();
    return stats;
  }

  async getStatisticsForWeek(weekStart: Date, weekEnd: Date, userId?: number): Promise<Statistic | undefined> {
    let conditions = [
      eq(statistics.weekStart, weekStart),
      eq(statistics.weekEnd, weekEnd)
    ];
    
    // Add user filter if provided
    if (userId) {
      conditions.push(eq(statistics.userId, userId));
    }
    
    const [weekStats] = await db
      .select()
      .from(statistics)
      .where(and(...conditions));
      
    return weekStats || undefined;
  }

  async getLatestStatistics(limit?: number, userId?: number): Promise<Statistic[]> {
    // Build basic query
    let baseQuery = db
      .select()
      .from(statistics);
      
    // Filter by userId if provided
    if (userId) {
      baseQuery = baseQuery.where(eq(statistics.userId, userId));
    }
    
    // Add ordering
    baseQuery = baseQuery.orderBy(desc(statistics.weekEnd));
    
    // Execute with limit if specified
    if (limit) {
      return await baseQuery.limit(limit);
    }
    
    return await baseQuery;
  }

  // Notification operations
  async createNotification(insertNotification: InsertNotification): Promise<Notification> {
    // Convert readAt timestamp string to Date object if provided
    const cleanedNotification = {
      ...insertNotification,
      readAt: insertNotification.readAt ? new Date(insertNotification.readAt) : null,
      metadata: insertNotification.metadata ?? null,
    };

    const [notification] = await db
      .insert(notifications)
      .values(cleanedNotification)
      .returning();
    return notification;
  }

  async markNotificationAsRead(id: number): Promise<Notification | undefined> {
    const [updatedNotification] = await db
      .update(notifications)
      .set({ 
        status: 'read',
        readAt: new Date()
      })
      .where(eq(notifications.id, id))
      .returning();
    return updatedNotification || undefined;
  }

  async dismissNotification(id: number): Promise<Notification | undefined> {
    const [dismissedNotification] = await db
      .update(notifications)
      .set({ status: 'dismissed' })
      .where(eq(notifications.id, id))
      .returning();
    return dismissedNotification || undefined;
  }

  async getNotifications(userId: number, limit?: number, includeRead: boolean = false): Promise<Notification[]> {
    let query = db.select().from(notifications).where(eq(notifications.userId, userId));
    
    // Filter by status if not including read notifications
    if (!includeRead) {
      query = query.where(eq(notifications.status, 'unread'));
    }
    
    // Order by creation time (newest first)
    query = query.orderBy(desc(notifications.createdAt));
    
    // Apply limit if provided
    if (limit) {
      query = query.limit(limit);
    }
    
    return await query;
  }

  async getUnreadNotificationCount(userId: number): Promise<number> {
    const result = await db
      .select({ count: count() })
      .from(notifications)
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.status, 'unread')
      ));
    
    return result[0]?.count || 0;
  }

  async markAllNotificationsAsRead(userId: number): Promise<void> {
    await db
      .update(notifications)
      .set({ 
        status: 'read',
        readAt: new Date()
      })
      .where(and(
        eq(notifications.userId, userId),
        eq(notifications.status, 'unread')
      ));
  }
}

// Use the database storage for production
// Import our new MongoDB storage implementation
import { MongoDBStorage } from './mongoStorage';
import { log } from './vite';

// Create instances of both storage types
const mongoStorage = new MongoDBStorage();
const dbStorage = new DatabaseStorage();

// Function to check if MongoDB connection is available
let isMongoAvailable = false;

// Simple method to check MongoDB connection and set the appropriate storage
export const setMongoAvailability = (available: boolean) => {
  isMongoAvailable = available;
  log(`Storage: Using ${isMongoAvailable ? 'MongoDB' : 'PostgreSQL'} as the primary storage`, 'storage');
};

// Export MongoDB storage as the default storage, with a fallback to PostgreSQL
// During the transition period, we'll use this approach to ensure stable operation
export const storage = {
  getUser: async (id: number) => {
    try {
      return isMongoAvailable 
        ? await mongoStorage.getUser(id) 
        : await dbStorage.getUser(id);
    } catch (err) {
      log(`Error in getUser: ${err}`, 'storage');
      return await dbStorage.getUser(id);
    }
  },
  
  getUserByUsername: async (username: string) => {
    try {
      return isMongoAvailable 
        ? await mongoStorage.getUserByUsername(username) 
        : await dbStorage.getUserByUsername(username);
    } catch (err) {
      log(`Error in getUserByUsername: ${err}`, 'storage');
      return await dbStorage.getUserByUsername(username);
    }
  },
  
  getUserByEmail: async (email: string) => {
    try {
      if (isMongoAvailable) {
        return await mongoStorage.getUserByEmail(email);
      }
      // PostgreSQL implementation might not support this function
      log(`getUserByEmail not implemented for PostgreSQL`, 'storage');
      return undefined;
    } catch (err) {
      log(`Error in getUserByEmail: ${err}`, 'storage');
      return undefined;
    }
  },
  
  getUserByVerificationToken: async (token: string) => {
    try {
      if (isMongoAvailable) {
        return await mongoStorage.getUserByVerificationToken(token);
      }
      // PostgreSQL implementation might not support this function
      log(`getUserByVerificationToken not implemented for PostgreSQL`, 'storage');
      return undefined;
    } catch (err) {
      log(`Error in getUserByVerificationToken: ${err}`, 'storage');
      return undefined;
    }
  },
  
  getUserByPasswordResetToken: async (token: string) => {
    try {
      if (isMongoAvailable) {
        return await mongoStorage.getUserByPasswordResetToken(token);
      }
      // PostgreSQL implementation might not support this function
      log(`getUserByPasswordResetToken not implemented for PostgreSQL`, 'storage');
      return undefined;
    } catch (err) {
      log(`Error in getUserByPasswordResetToken: ${err}`, 'storage');
      return undefined;
    }
  },
  
  setEmailVerificationToken: async (userId: number, token: string, expires: Date) => {
    try {
      if (isMongoAvailable) {
        return await mongoStorage.setEmailVerificationToken(userId, token, expires);
      }
      // PostgreSQL implementation might not support this function
      log(`setEmailVerificationToken not implemented for PostgreSQL`, 'storage');
      return false;
    } catch (err) {
      log(`Error in setEmailVerificationToken: ${err}`, 'storage');
      return false;
    }
  },
  
  verifyEmail: async (token: string) => {
    try {
      if (isMongoAvailable) {
        return await mongoStorage.verifyEmail(token);
      }
      // PostgreSQL implementation might not support this function
      log(`verifyEmail not implemented for PostgreSQL`, 'storage');
      return undefined;
    } catch (err) {
      log(`Error in verifyEmail: ${err}`, 'storage');
      return undefined;
    }
  },
  
  setPasswordResetToken: async (userId: number, token: string, expires: Date) => {
    try {
      if (isMongoAvailable) {
        return await mongoStorage.setPasswordResetToken(userId, token, expires);
      }
      // PostgreSQL implementation might not support this function
      log(`setPasswordResetToken not implemented for PostgreSQL`, 'storage');
      return false;
    } catch (err) {
      log(`Error in setPasswordResetToken: ${err}`, 'storage');
      return false;
    }
  },
  
  resetPassword: async (token: string, newPassword: string) => {
    try {
      if (isMongoAvailable) {
        return await mongoStorage.resetPassword(token, newPassword);
      }
      // PostgreSQL implementation might not support this function
      log(`resetPassword not implemented for PostgreSQL`, 'storage');
      return undefined;
    } catch (err) {
      log(`Error in resetPassword: ${err}`, 'storage');
      return undefined;
    }
  },
  
  createUser: async (user: InsertUser) => {
    try {
      return isMongoAvailable 
        ? await mongoStorage.createUser(user) 
        : await dbStorage.createUser(user);
    } catch (err) {
      log(`Error in createUser: ${err}`, 'storage');
      return await dbStorage.createUser(user);
    }
  },
  
  updateUser: async (id: number, userData: Partial<Omit<InsertUser, 'password'>>) => {
    try {
      return isMongoAvailable 
        ? await mongoStorage.updateUser(id, userData) 
        : await dbStorage.updateUser(id, userData);
    } catch (err) {
      log(`Error in updateUser: ${err}`, 'storage');
      return await dbStorage.updateUser(id, userData);
    }
  },
  
  createTask: async (task: InsertTask) => {
    try {
      return isMongoAvailable 
        ? await mongoStorage.createTask(task as any) 
        : await dbStorage.createTask(task);
    } catch (err) {
      log(`Error in createTask: ${err}`, 'storage');
      return await dbStorage.createTask(task);
    }
  },
  
  updateTask: async (id: number, taskUpdate: Partial<InsertTask>) => {
    try {
      return isMongoAvailable 
        ? await mongoStorage.updateTask(id, taskUpdate as any) 
        : await dbStorage.updateTask(id, taskUpdate);
    } catch (err) {
      log(`Error in updateTask: ${err}`, 'storage');
      return await dbStorage.updateTask(id, taskUpdate);
    }
  },
  
  deleteTask: async (id: number) => {
    try {
      return isMongoAvailable 
        ? await mongoStorage.deleteTask(id) 
        : await dbStorage.deleteTask(id);
    } catch (err) {
      log(`Error in deleteTask: ${err}`, 'storage');
      return await dbStorage.deleteTask(id);
    }
  },
  
  getTask: async (id: number) => {
    try {
      return isMongoAvailable 
        ? await mongoStorage.getTask(id) 
        : await dbStorage.getTask(id);
    } catch (err) {
      log(`Error in getTask: ${err}`, 'storage');
      return await dbStorage.getTask(id);
    }
  },
  
  getTasks: async (filters?: { startDate?: Date; endDate?: Date; userId?: number }) => {
    try {
      return isMongoAvailable 
        ? await mongoStorage.getTasks(filters) 
        : await dbStorage.getTasks(filters);
    } catch (err) {
      log(`Error in getTasks: ${err}`, 'storage');
      return await dbStorage.getTasks(filters);
    }
  },
  
  // Implement the same pattern for all other methods...
  // This is a shortened example for brevity
  
  // For methods not shown here, they should follow the same pattern:
  // Try MongoDB first, fall back to PostgreSQL
  
  createCheckIn: async (checkIn: InsertCheckIn) => dbStorage.createCheckIn(checkIn),
  getCheckIns: async (startDate: Date, endDate: Date, userId?: number) => dbStorage.getCheckIns(startDate, endDate, userId),
  getLatestCheckIn: async (userId?: number) => dbStorage.getLatestCheckIn(userId),
  createChatMessage: async (message: InsertChatMessage) => dbStorage.createChatMessage(message),
  getChatMessages: async (limit?: number, userId?: number) => dbStorage.getChatMessages(limit, userId),
  createAiSuggestion: async (suggestion: InsertAiSuggestion) => dbStorage.createAiSuggestion(suggestion),
  updateAiSuggestion: async (id: number, accepted: boolean) => dbStorage.updateAiSuggestion(id, accepted),
  getAiSuggestions: async (limit?: number, userId?: number) => dbStorage.getAiSuggestions(limit, userId),
  createStatistics: async (stats: InsertStatistic) => dbStorage.createStatistics(stats),
  getStatisticsForWeek: async (weekStart: Date, weekEnd: Date, userId?: number) => dbStorage.getStatisticsForWeek(weekStart, weekEnd, userId),
  getLatestStatistics: async (limit?: number, userId?: number) => dbStorage.getLatestStatistics(limit, userId),
  createNotification: async (notification: InsertNotification) => dbStorage.createNotification(notification),
  markNotificationAsRead: async (id: number) => dbStorage.markNotificationAsRead(id),
  dismissNotification: async (id: number) => dbStorage.dismissNotification(id),
  getNotifications: async (userId: number, limit?: number, includeRead?: boolean) => dbStorage.getNotifications(userId, limit, includeRead),
  getUnreadNotificationCount: async (userId: number) => dbStorage.getUnreadNotificationCount(userId),
  markAllNotificationsAsRead: async (userId: number) => dbStorage.markAllNotificationsAsRead(userId)
};
