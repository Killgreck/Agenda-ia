// MongoDB models based on the provided schemas
import mongoose, { Schema } from 'mongoose';

// User schema
export interface IUser extends mongoose.Document {
  id: number;
  username: string;
  password: string;
  email: string | null;
  phoneNumber: string | null;
  name: string | null;
  address: string | null;
  city: string | null;
  state: string | null;
  zipCode: string | null;
  country: string | null;
  birthdate: Date | null;
  gender: string | null;
  occupation: string | null;
  company: string | null;
  timezone: string | null;
  profileImage: string | null;
  preferredLanguage: string | null;
  createdAt: Date;
  lastLogin: Date | null;
  isActive: boolean;
  accountType: string;
  language: string | null;
}

const userSchema = new Schema<IUser>({
  id: { type: Number, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  email: { type: String, default: null },
  phoneNumber: { type: String, default: null },
  name: { type: String, default: null },
  address: { type: String, default: null },
  city: { type: String, default: null },
  state: { type: String, default: null },
  zipCode: { type: String, default: null },
  country: { type: String, default: null },
  birthdate: { type: Date, default: null },
  gender: { type: String, default: null },
  occupation: { type: String, default: null },
  company: { type: String, default: null },
  timezone: { type: String, default: 'UTC' },
  profileImage: { type: String, default: null },
  preferredLanguage: { type: String, default: null },
  createdAt: { type: Date, default: Date.now },
  lastLogin: { type: Date, default: null },
  isActive: { type: Boolean, default: true },
  accountType: { type: String, default: 'free' },
  language: { type: String, default: null }
});

// User Settings schema
export interface IUserSettings extends mongoose.Document {
  id: number;
  userId: number;
  theme: string;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
  calendar: {
    defaultView: string;
    firstDayOfWeek: number;
    workingHoursStart: string;
    workingHoursEnd: string;
  };
  privacySettings: {
    profileVisibility: string;
    shareTaskCompletions: boolean;
    shareProductivityStats: boolean;
  };
  dateFormat: string;
  timeFormat: string;
  customWorkDays: number[];
}

const userSettingsSchema = new Schema<IUserSettings>({
  id: { type: Number, required: true, unique: true },
  userId: { type: Number, required: true, unique: true },
  theme: { type: String, default: 'light' },
  notifications: {
    email: { type: Boolean, default: true },
    push: { type: Boolean, default: true },
    sms: { type: Boolean, default: false }
  },
  calendar: {
    defaultView: { type: String, default: 'week' },
    firstDayOfWeek: { type: Number, default: 0 },
    workingHoursStart: { type: String, default: '09:00' },
    workingHoursEnd: { type: String, default: '17:00' }
  },
  privacySettings: {
    profileVisibility: { type: String, default: 'private' },
    shareTaskCompletions: { type: Boolean, default: false },
    shareProductivityStats: { type: Boolean, default: false }
  },
  dateFormat: { type: String, default: 'MM/DD/YYYY' },
  timeFormat: { type: String, default: '12h' },
  customWorkDays: { type: [Number], default: [1, 2, 3, 4, 5] }
});

// AI Preferences schema
export interface IAiPreferences extends mongoose.Document {
  id: number;
  userId: number;
  usageConsent: boolean;
  suggestionsEnabled: boolean;
  productivityAnalysisEnabled: boolean;
  taskOptimizationEnabled: boolean;
  learningPreferences: {
    adaptToBehavior: boolean;
    suggestionFrequency: string;
    suggestionStyle: string;
  };
  featurePreferences: {
    suggestDeadlines: boolean;
    suggestPriorities: boolean;
    autoCategorizeTasks: boolean;
    suggestRelatedTasks: boolean;
  };
  lastUpdated: Date;
}

const aiPreferencesSchema = new Schema<IAiPreferences>({
  id: { type: Number, required: true, unique: true },
  userId: { type: Number, required: true, unique: true },
  usageConsent: { type: Boolean, default: true },
  suggestionsEnabled: { type: Boolean, default: true },
  productivityAnalysisEnabled: { type: Boolean, default: true },
  taskOptimizationEnabled: { type: Boolean, default: true },
  learningPreferences: {
    adaptToBehavior: { type: Boolean, default: true },
    suggestionFrequency: { type: String, default: 'medium' },
    suggestionStyle: { type: String, default: 'balanced' }
  },
  featurePreferences: {
    suggestDeadlines: { type: Boolean, default: true },
    suggestPriorities: { type: Boolean, default: true },
    autoCategorizeTasks: { type: Boolean, default: true },
    suggestRelatedTasks: { type: Boolean, default: true }
  },
  lastUpdated: { type: Date, default: Date.now }
});

// Analytics schema
export interface IAnalytics extends mongoose.Document {
  id: number;
  userId: number;
  startDate: Date;
  endDate: Date;
  productivityScore: number;
  tasksCreated: number;
  tasksCompleted: number;
  totalFocusTime: number;
  taskBreakdown: {
    personal: number;
    work: number;
    health: number;
    other: number;
  };
  peakProductivityHours: number[];
  mostProductiveDay: string;
  insights: string[];
  improvementAreas: string[];
}

const analyticsSchema = new Schema<IAnalytics>({
  id: { type: Number, required: true, unique: true },
  userId: { type: Number, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  productivityScore: { type: Number, default: 0 },
  tasksCreated: { type: Number, default: 0 },
  tasksCompleted: { type: Number, default: 0 },
  totalFocusTime: { type: Number, default: 0 },
  taskBreakdown: {
    personal: { type: Number, default: 0 },
    work: { type: Number, default: 0 },
    health: { type: Number, default: 0 },
    other: { type: Number, default: 0 }
  },
  peakProductivityHours: { type: [Number], default: [] },
  mostProductiveDay: { type: String, default: null },
  insights: { type: [String], default: [] },
  improvementAreas: { type: [String], default: [] }
});

// Events (Tasks) schema
export interface IEvent extends mongoose.Document {
  id: number;
  userId: number;
  title: string;
  description: string | null;
  date: Date;
  endDate: Date | null;
  priority: string;
  completed: boolean;
  location: string | null;
  isAllDay: boolean;
  status: string;
  category: string | null;
  tags: string[];
  color: string | null;
  notes: string | null;
  attachments: string[];
  reminderTime: Date | null;
  recurrenceRule: string | null;
  recurrenceType: string | null;
}

const eventSchema = new Schema<IEvent>({
  id: { type: Number, required: true, unique: true },
  userId: { type: Number, required: true },
  title: { type: String, required: true },
  description: { type: String, default: null },
  date: { type: Date, required: true },
  endDate: { type: Date, default: null },
  priority: { type: String, default: 'medium' },
  completed: { type: Boolean, default: false },
  location: { type: String, default: null },
  isAllDay: { type: Boolean, default: false },
  status: { type: String, default: 'pending' },
  category: { type: String, default: null },
  tags: { type: [String], default: [] },
  color: { type: String, default: null },
  notes: { type: String, default: null },
  attachments: { type: [String], default: [] },
  reminderTime: { type: Date, default: null },
  recurrenceRule: { type: String, default: null },
  recurrenceType: { type: String, default: null }
});

// Event Recurrences schema
export interface IEventRecurrence extends mongoose.Document {
  id: number;
  eventId: number;
  userId: number;
  pattern: string;
  interval: number;
  daysOfWeek: number[];
  monthDay: number | null;
  endType: string;
  endDate: Date | null;
  endCount: number | null;
  exceptions: Date[];
}

const eventRecurrenceSchema = new Schema<IEventRecurrence>({
  id: { type: Number, required: true, unique: true },
  eventId: { type: Number, required: true },
  userId: { type: Number, required: true },
  pattern: { type: String, required: true },
  interval: { type: Number, default: 1 },
  daysOfWeek: { type: [Number], default: [] },
  monthDay: { type: Number, default: null },
  endType: { type: String, default: 'never' },
  endDate: { type: Date, default: null },
  endCount: { type: Number, default: null },
  exceptions: { type: [Date], default: [] }
});

// Event Reminders schema
export interface IEventReminder extends mongoose.Document {
  id: number;
  eventId: number;
  userId: number;
  reminderType: string;
  reminderTime: Date;
  notificationType: string[];
  sent: boolean;
  customMessage: string | null;
}

const eventReminderSchema = new Schema<IEventReminder>({
  id: { type: Number, required: true, unique: true },
  eventId: { type: Number, required: true },
  userId: { type: Number, required: true },
  reminderType: { type: String, required: true },
  reminderTime: { type: Date, required: true },
  notificationType: { type: [String], default: ['app'] },
  sent: { type: Boolean, default: false },
  customMessage: { type: String, default: null }
});

// Tags schema
export interface ITag extends mongoose.Document {
  id: number;
  userId: number;
  name: string;
  color: string;
  description: string | null;
  priorityLevel: number;
  taskCount: number;
  createdAt: Date;
  isActive: boolean;
}

const tagSchema = new Schema<ITag>({
  id: { type: Number, required: true, unique: true },
  userId: { type: Number, required: true },
  name: { type: String, required: true },
  color: { type: String, required: true },
  description: { type: String, default: null },
  priorityLevel: { type: Number, default: 0 },
  taskCount: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now },
  isActive: { type: Boolean, default: true }
});

// Integrations schema
export interface IIntegration extends mongoose.Document {
  id: number;
  userId: number;
  serviceType: string;
  serviceName: string;
  connectionStatus: string;
  lastSynced: Date | null;
  authToken: string | null;
  refreshToken: string | null;
  tokenExpiry: Date | null;
  settings: Record<string, any>;
  syncPreferences: {
    importEvents: boolean;
    exportEvents: boolean;
    syncFrequency: string;
  }
}

const integrationSchema = new Schema<IIntegration>({
  id: { type: Number, required: true, unique: true },
  userId: { type: Number, required: true },
  serviceType: { type: String, required: true },
  serviceName: { type: String, required: true },
  connectionStatus: { type: String, default: 'disconnected' },
  lastSynced: { type: Date, default: null },
  authToken: { type: String, default: null },
  refreshToken: { type: String, default: null },
  tokenExpiry: { type: Date, default: null },
  settings: { type: Schema.Types.Mixed, default: {} },
  syncPreferences: {
    importEvents: { type: Boolean, default: true },
    exportEvents: { type: Boolean, default: true },
    syncFrequency: { type: String, default: 'hourly' }
  }
});

// Define models with collection names matching the counter names
export const User = mongoose.model<IUser>('User', userSchema, 'users');
export const UserSettings = mongoose.model<IUserSettings>('UserSettings', userSettingsSchema, 'userSettings');
export const AiPreferences = mongoose.model<IAiPreferences>('AiPreferences', aiPreferencesSchema, 'aiPreferences');
export const Analytics = mongoose.model<IAnalytics>('Analytics', analyticsSchema, 'analytics');
export const Event = mongoose.model<IEvent>('Event', eventSchema, 'events');
export const EventRecurrence = mongoose.model<IEventRecurrence>('EventRecurrence', eventRecurrenceSchema, 'eventRecurrences');
export const EventReminder = mongoose.model<IEventReminder>('EventReminder', eventReminderSchema, 'eventReminders');
export const Tag = mongoose.model<ITag>('Tag', tagSchema, 'tags');
export const Integration = mongoose.model<IIntegration>('Integration', integrationSchema, 'integrations');