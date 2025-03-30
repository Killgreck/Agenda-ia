import {
  users, type User, type InsertUser,
  tasks, type Task, type InsertTask,
  checkIns, type CheckIn, type InsertCheckIn,
  chatMessages, type ChatMessage, type InsertChatMessage,
  aiSuggestions, type AiSuggestion, type InsertAiSuggestion,
  statistics, type Statistic, type InsertStatistic
} from "@shared/schema";
import { eq, and, gte, lte, desc, asc } from "drizzle-orm";
import { db } from "./db";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<Omit<InsertUser, 'password'>>): Promise<User | undefined>;
  
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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private tasks: Map<number, Task>;
  private checkIns: Map<number, CheckIn>;
  private chatMessages: Map<number, ChatMessage>;
  private aiSuggestions: Map<number, AiSuggestion>;
  private statistics: Map<number, Statistic>;
  
  private currentUserIds: number;
  private currentTaskIds: number;
  private currentCheckInIds: number;
  private currentChatMessageIds: number;
  private currentAiSuggestionIds: number;
  private currentStatisticsIds: number;

  constructor() {
    this.users = new Map();
    this.tasks = new Map();
    this.checkIns = new Map();
    this.chatMessages = new Map();
    this.aiSuggestions = new Map();
    this.statistics = new Map();
    
    this.currentUserIds = 1;
    this.currentTaskIds = 1;
    this.currentCheckInIds = 1;
    this.currentChatMessageIds = 1;
    this.currentAiSuggestionIds = 1;
    this.currentStatisticsIds = 1;
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

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserIds++;
    const user: User = { ...insertUser, id };
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

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
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
}

// Use the database storage for production
export const storage = new DatabaseStorage();
