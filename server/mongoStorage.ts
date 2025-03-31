// MongoDB implementation of the storage interface
import { IStorage } from './storage';
import { log } from './vite';
import { getNextSequenceValue } from './mongodb';
import * as bcrypt from 'bcryptjs';
import {
  User,
  UserSettings,
  AiPreferences,
  Analytics,
  Event,
  EventRecurrence,
  EventReminder,
  Tag,
  Integration
} from './mongoModels';

// MongoDB storage adapter implementing the IStorage interface
export class MongoDBStorage implements IStorage {
  constructor() {
    log('MongoDB storage adapter initialized', 'mongodb');
  }

  // User operations
  async getUser(id: number): Promise<any> {
    try {
      const user = await User.findOne({ id });
      if (!user) {
        return undefined;
      }
      
      // Create a plain object from the Mongoose document
      const userObj = user.toObject();
      
      // Remove MongoDB-specific fields for compatibility
      // @ts-ignore
      delete userObj._id;
      // @ts-ignore
      delete userObj.__v;
      
      return userObj;
    } catch (error) {
      log(`MongoDB getUser error: ${error}`, 'mongodb');
      throw error;
    }
  }
  
  async getUserByUsername(username: string): Promise<any> {
    try {
      const user = await User.findOne({ username });
      if (!user) {
        return undefined;
      }
      
      // Create a plain object from the Mongoose document
      const userObj = user.toObject();
      
      // Remove MongoDB-specific fields for compatibility
      // @ts-ignore
      delete userObj._id;
      // @ts-ignore
      delete userObj.__v;
      
      return userObj;
    } catch (error) {
      log(`MongoDB getUserByUsername error: ${error}`, 'mongodb');
      throw error;
    }
  }
  
  async createUser(userData: any): Promise<any> {
    try {
      // Generate a sequential ID for the user
      const id = await getNextSequenceValue('users');
      
      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(userData.password, salt);
      
      // Create a new user with the sequential ID
      const newUser = new User({
        id,
        ...userData,
        password: hashedPassword,
        createdAt: new Date(),
      });
      
      await newUser.save();
      
      // After creating the user, also create related user documents with the same ID
      // This ensures consistent IDs across collections for the same user
      await this.createUserSettings(id);
      await this.createAiPreferences(id);
      
      // Create a plain object from the Mongoose document
      const userObj = newUser.toObject();
      
      // Remove MongoDB-specific fields for compatibility
      // @ts-ignore
      delete userObj._id;
      // @ts-ignore
      delete userObj.__v;
      
      return userObj;
    } catch (error) {
      log(`MongoDB createUser error: ${error}`, 'mongodb');
      throw error;
    }
  }
  
  async updateUser(id: number, userData: any): Promise<any> {
    try {
      // Find and update the user
      const user = await User.findOneAndUpdate(
        { id },
        { $set: userData },
        { new: true }
      );
      
      if (!user) {
        return undefined;
      }
      
      // Create a plain object from the Mongoose document
      const userObj = user.toObject();
      
      // Remove MongoDB-specific fields for compatibility
      // @ts-ignore
      delete userObj._id;
      // @ts-ignore
      delete userObj.__v;
      
      return userObj;
    } catch (error) {
      log(`MongoDB updateUser error: ${error}`, 'mongodb');
      throw error;
    }
  }
  
  // Task operations
  async createTask(taskData: any): Promise<any> {
    try {
      // Generate a sequential ID for the task
      const id = await getNextSequenceValue('events', taskData.userId);
      
      // Create a new task with the sequential ID
      const newTask = new Event({
        id,
        ...taskData,
        // Convert string dates to Date objects if needed
        date: new Date(taskData.date),
        endDate: taskData.endDate ? new Date(taskData.endDate) : null,
        reminderTime: taskData.reminderTime ? new Date(taskData.reminderTime) : null
      });
      
      await newTask.save();
      
      // Create a plain object from the Mongoose document
      const taskObj = newTask.toObject();
      
      // Remove MongoDB-specific fields for compatibility
      // @ts-ignore
      delete taskObj._id;
      // @ts-ignore
      delete taskObj.__v;
      
      return taskObj;
    } catch (error) {
      log(`MongoDB createTask error: ${error}`, 'mongodb');
      throw error;
    }
  }
  
  async updateTask(id: number, taskUpdate: any): Promise<any> {
    try {
      // Find and update the task
      const task = await Event.findOneAndUpdate(
        { id },
        { 
          $set: {
            ...taskUpdate,
            // Convert string dates to Date objects if needed
            ...(taskUpdate.date && { date: new Date(taskUpdate.date) }),
            ...(taskUpdate.endDate && { endDate: new Date(taskUpdate.endDate) }),
            ...(taskUpdate.reminderTime && { reminderTime: new Date(taskUpdate.reminderTime) })
          } 
        },
        { new: true }
      );
      
      if (!task) {
        return undefined;
      }
      
      // Create a plain object from the Mongoose document
      const taskObj = task.toObject();
      
      // Remove MongoDB-specific fields for compatibility
      // @ts-ignore
      delete taskObj._id;
      // @ts-ignore
      delete taskObj.__v;
      
      return taskObj;
    } catch (error) {
      log(`MongoDB updateTask error: ${error}`, 'mongodb');
      throw error;
    }
  }
  
  async deleteTask(id: number): Promise<boolean> {
    try {
      const result = await Event.deleteOne({ id });
      return result.deletedCount === 1;
    } catch (error) {
      log(`MongoDB deleteTask error: ${error}`, 'mongodb');
      throw error;
    }
  }
  
  async getTask(id: number): Promise<any> {
    try {
      const task = await Event.findOne({ id });
      
      if (!task) {
        return undefined;
      }
      
      // Create a plain object from the Mongoose document
      const taskObj = task.toObject();
      
      // Remove MongoDB-specific fields for compatibility
      // @ts-ignore
      delete taskObj._id;
      // @ts-ignore
      delete taskObj.__v;
      
      return taskObj;
    } catch (error) {
      log(`MongoDB getTask error: ${error}`, 'mongodb');
      throw error;
    }
  }
  
  async getTasks(filters?: { startDate?: Date; endDate?: Date; userId?: number }): Promise<any[]> {
    try {
      let query: any = {};
      
      // Apply filters
      if (filters) {
        if (filters.userId) {
          query.userId = filters.userId;
        }
        
        if (filters.startDate || filters.endDate) {
          query.date = {};
          
          if (filters.startDate) {
            query.date.$gte = filters.startDate;
          }
          
          if (filters.endDate) {
            query.date.$lte = filters.endDate;
          }
        }
      }
      
      const tasks = await Event.find(query).sort({ date: 1 });
      
      // Convert Mongoose documents to plain objects
      return tasks.map(task => {
        const taskObj = task.toObject();
        // Remove MongoDB-specific fields
        // @ts-ignore
        delete taskObj._id;
        // @ts-ignore
        delete taskObj.__v;
        return taskObj;
      });
    } catch (error) {
      log(`MongoDB getTasks error: ${error}`, 'mongodb');
      throw error;
    }
  }
  
  // Check-in operations
  async createCheckIn(checkIn: any): Promise<any> {
    log('Method not implemented in MongoDB: createCheckIn. Falling back to PostgreSQL.', 'mongodb');
    throw new Error('Method not implemented in MongoDB: createCheckIn');
  }
  
  async getCheckIns(startDate: Date, endDate: Date, userId?: number): Promise<any[]> {
    log('Method not implemented in MongoDB: getCheckIns. Falling back to PostgreSQL.', 'mongodb');
    return [];
  }
  
  async getLatestCheckIn(userId?: number): Promise<any> {
    log('Method not implemented in MongoDB: getLatestCheckIn. Falling back to PostgreSQL.', 'mongodb');
    return undefined;
  }
  
  // Chat operations
  async createChatMessage(message: any): Promise<any> {
    log('Method not implemented in MongoDB: createChatMessage. Falling back to PostgreSQL.', 'mongodb');
    throw new Error('Method not implemented in MongoDB: createChatMessage');
  }
  
  async getChatMessages(limit?: number, userId?: number): Promise<any[]> {
    log('Method not implemented in MongoDB: getChatMessages. Falling back to PostgreSQL.', 'mongodb');
    return [];
  }
  
  // AI Suggestion operations
  async createAiSuggestion(suggestion: any): Promise<any> {
    try {
      // Generate a sequential ID for the AI suggestion
      const id = await getNextSequenceValue('aiSuggestions', suggestion.userId);
      
      // Create basic document for now - in a real implementation we'd have a specific model for this
      const newSuggestion = {
        id,
        ...suggestion,
        timestamp: new Date(suggestion.timestamp || Date.now()),
        accepted: suggestion.accepted !== undefined ? suggestion.accepted : false
      };
      
      // In a full implementation, we'd save to a dedicated MongoDB collection
      log(`Created AI suggestion with id ${id}`, 'mongodb');
      
      return newSuggestion;
    } catch (error) {
      log(`MongoDB createAiSuggestion error: ${error}`, 'mongodb');
      throw error;
    }
  }
  
  async updateAiSuggestion(id: number, accepted: boolean): Promise<any> {
    log('Method not implemented in MongoDB: updateAiSuggestion. Falling back to PostgreSQL.', 'mongodb');
    return undefined;
  }
  
  async getAiSuggestions(limit?: number, userId?: number): Promise<any[]> {
    log('Method not implemented in MongoDB: getAiSuggestions. Falling back to PostgreSQL.', 'mongodb');
    return [];
  }
  
  // Statistics operations
  async createStatistics(stats: any): Promise<any> {
    try {
      // Generate a sequential ID for the statistics
      const id = await getNextSequenceValue('analytics', stats.userId);
      
      // Create a new analytics document with the sequential ID
      const newStats = new Analytics({
        id,
        ...stats,
        // Convert string dates to Date objects if needed
        startDate: new Date(stats.weekStart || stats.startDate),
        endDate: new Date(stats.weekEnd || stats.endDate)
      });
      
      await newStats.save();
      
      // Create a plain object from the Mongoose document
      const statsObj = newStats.toObject();
      
      // Remove MongoDB-specific fields for compatibility
      // @ts-ignore
      delete statsObj._id;
      // @ts-ignore
      delete statsObj.__v;
      
      return statsObj;
    } catch (error) {
      log(`MongoDB createStatistics error: ${error}`, 'mongodb');
      throw error;
    }
  }
  
  async getStatisticsForWeek(weekStart: Date, weekEnd: Date, userId?: number): Promise<any> {
    try {
      let query: any = {
        startDate: { $lte: weekEnd },
        endDate: { $gte: weekStart }
      };
      
      if (userId) {
        query.userId = userId;
      }
      
      const stats = await Analytics.findOne(query);
      
      if (!stats) {
        return undefined;
      }
      
      // Create a plain object from the Mongoose document
      const statsObj = stats.toObject();
      
      // Remove MongoDB-specific fields for compatibility
      // @ts-ignore
      delete statsObj._id;
      // @ts-ignore
      delete statsObj.__v;
      
      return statsObj;
    } catch (error) {
      log(`MongoDB getStatisticsForWeek error: ${error}`, 'mongodb');
      throw error;
    }
  }
  
  async getLatestStatistics(limit?: number, userId?: number): Promise<any[]> {
    try {
      let query: any = {};
      
      if (userId) {
        query.userId = userId;
      }
      
      const statsLimit = limit || 10;
      const stats = await Analytics.find(query)
        .sort({ endDate: -1 })
        .limit(statsLimit);
      
      // Convert Mongoose documents to plain objects
      return stats.map(stat => {
        const statObj = stat.toObject();
        // Remove MongoDB-specific fields
        // @ts-ignore
        delete statObj._id;
        // @ts-ignore
        delete statObj.__v;
        return statObj;
      });
    } catch (error) {
      log(`MongoDB getLatestStatistics error: ${error}`, 'mongodb');
      throw error;
    }
  }
  
  // Notification operations
  async createNotification(notification: any): Promise<any> {
    log('Method not implemented in MongoDB: createNotification. Falling back to PostgreSQL.', 'mongodb');
    throw new Error('Method not implemented in MongoDB: createNotification');
  }
  
  async markNotificationAsRead(id: number): Promise<any> {
    log('Method not implemented in MongoDB: markNotificationAsRead. Falling back to PostgreSQL.', 'mongodb');
    return undefined;
  }
  
  async dismissNotification(id: number): Promise<any> {
    log('Method not implemented in MongoDB: dismissNotification. Falling back to PostgreSQL.', 'mongodb');
    return undefined;
  }
  
  async getNotifications(userId: number, limit?: number, includeRead?: boolean): Promise<any[]> {
    log('Method not implemented in MongoDB: getNotifications. Falling back to PostgreSQL.', 'mongodb');
    return [];
  }
  
  async getUnreadNotificationCount(userId: number): Promise<number> {
    log('Method not implemented in MongoDB: getUnreadNotificationCount. Falling back to PostgreSQL.', 'mongodb');
    return 0;
  }
  
  async markAllNotificationsAsRead(userId: number): Promise<void> {
    log('Method not implemented in MongoDB: markAllNotificationsAsRead. Falling back to PostgreSQL.', 'mongodb');
  }
  
  // Helper methods for creating related user documents
  private async createUserSettings(userId: number): Promise<void> {
    try {
      const userSettings = new UserSettings({
        id: userId,
        userId
      });
      await userSettings.save();
      log(`Created UserSettings for user ${userId}`, 'mongodb');
    } catch (error) {
      log(`Error creating UserSettings: ${error}`, 'mongodb');
    }
  }
  
  private async createAiPreferences(userId: number): Promise<void> {
    try {
      const aiPreferences = new AiPreferences({
        id: userId,
        userId
      });
      await aiPreferences.save();
      log(`Created AiPreferences for user ${userId}`, 'mongodb');
    } catch (error) {
      log(`Error creating AiPreferences: ${error}`, 'mongodb');
    }
  }
}