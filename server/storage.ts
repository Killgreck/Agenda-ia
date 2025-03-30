import {
  users, type User, type InsertUser,
  tasks, type Task, type InsertTask,
  checkIns, type CheckIn, type InsertCheckIn,
  chatMessages, type ChatMessage, type InsertChatMessage,
  aiSuggestions, type AiSuggestion, type InsertAiSuggestion,
  statistics, type Statistic, type InsertStatistic
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Task operations
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;
  getTask(id: number): Promise<Task | undefined>;
  getTasks(filters?: { startDate?: Date; endDate?: Date }): Promise<Task[]>;
  
  // Check-in operations
  createCheckIn(checkIn: InsertCheckIn): Promise<CheckIn>;
  getCheckIns(startDate: Date, endDate: Date): Promise<CheckIn[]>;
  getLatestCheckIn(): Promise<CheckIn | undefined>;
  
  // Chat operations
  createChatMessage(message: InsertChatMessage): Promise<ChatMessage>;
  getChatMessages(limit?: number): Promise<ChatMessage[]>;
  
  // AI Suggestion operations
  createAiSuggestion(suggestion: InsertAiSuggestion): Promise<AiSuggestion>;
  updateAiSuggestion(id: number, accepted: boolean): Promise<AiSuggestion | undefined>;
  getAiSuggestions(limit?: number): Promise<AiSuggestion[]>;
  
  // Statistics operations
  createStatistics(stats: InsertStatistic): Promise<Statistic>;
  getStatisticsForWeek(weekStart: Date, weekEnd: Date): Promise<Statistic | undefined>;
  getLatestStatistics(limit?: number): Promise<Statistic[]>;
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

export const storage = new MemStorage();
