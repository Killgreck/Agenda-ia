import { Schema, model, Document, Model, connect } from 'mongoose';
import { z } from 'zod';

// User Schema
export interface IUser extends Document {
  id: number;
  name?: string;
  email: string;
  passwordHash: string;
  timezone?: string;
  preferences?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<IUser>({
  id: { type: Number, required: true, unique: true },
  name: { type: String },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String, required: true },
  timezone: { type: String, default: 'UTC' },
  preferences: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { collection: 'users' });

// User Settings Schema
export interface IUserSetting extends Document {
  id: number;
  userId: number;
  displayPreferences?: Record<string, any>;
  notificationPreferences?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const userSettingSchema = new Schema<IUserSetting>({
  id: { type: Number, required: true, unique: true },
  userId: { type: Number, required: true, unique: true },
  displayPreferences: { type: Schema.Types.Mixed },
  notificationPreferences: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { collection: 'userSettings' });

// AI Preferences Schema
export interface IAiPreference extends Document {
  id: number;
  userId: number;
  learningPatterns?: Record<string, any>;
  optimizationRules?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

const aiPreferenceSchema = new Schema<IAiPreference>({
  id: { type: Number, required: true, unique: true },
  userId: { type: Number, required: true, unique: true },
  learningPatterns: { type: Schema.Types.Mixed },
  optimizationRules: { type: Schema.Types.Mixed },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { collection: 'aiPreferences' });

// Analytics Schema
export interface IAnalytic extends Document {
  id: number;
  userId: number;
  date: Date;
  productivityScore: number;
  eventCompletionRate: number;
  createdAt: Date;
}

const analyticSchema = new Schema<IAnalytic>({
  id: { type: Number, required: true, unique: true },
  userId: { type: Number, required: true },
  date: { type: Date, required: true },
  productivityScore: { type: Number, required: true },
  eventCompletionRate: { type: Number, required: true },
  createdAt: { type: Date, default: Date.now }
}, { collection: 'analytics' });

// Event Schema
export interface IEvent extends Document {
  id: number;
  userId: number;
  title: string;
  description?: string;
  startTime: Date;
  endTime?: Date;
  location?: string;
  isAllDay: boolean;
  priority: number;
  status: string;
  recurrenceRule?: string;
  createdAt: Date;
  updatedAt: Date;
}

const eventSchema = new Schema<IEvent>({
  id: { type: Number, required: true, unique: true },
  userId: { type: Number, required: true },
  title: { type: String, required: true },
  description: { type: String },
  startTime: { type: Date, required: true },
  endTime: { type: Date },
  location: { type: String },
  isAllDay: { type: Boolean, default: false },
  priority: { type: Number, default: 2 },
  status: { type: String, required: true },
  recurrenceRule: { type: String },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { collection: 'events' });

// Event Recurrence Schema
export interface IEventRecurrence extends Document {
  id: number;
  eventId: number;
  patternType: string;
  interval: number;
  count?: number;
  untilDate?: Date;
  createdAt: Date;
}

const eventRecurrenceSchema = new Schema<IEventRecurrence>({
  id: { type: Number, required: true, unique: true },
  eventId: { type: Number, required: true },
  patternType: { type: String, required: true },
  interval: { type: Number, required: true },
  count: { type: Number },
  untilDate: { type: Date },
  createdAt: { type: Date, default: Date.now }
}, { collection: 'eventRecurrences' });

// Event Reminder Schema
export interface IEventReminder extends Document {
  id: number;
  eventId: number;
  reminderType: string;
  reminderTime: Date;
  status: string;
  createdAt: Date;
}

const eventReminderSchema = new Schema<IEventReminder>({
  id: { type: Number, required: true, unique: true },
  eventId: { type: Number, required: true },
  reminderType: { type: String, required: true },
  reminderTime: { type: Date, required: true },
  status: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}, { collection: 'eventReminders' });

// Tags Schema
export interface ITag extends Document {
  id: number;
  name: string;
  color: string;
  createdAt: Date;
}

const tagSchema = new Schema<ITag>({
  id: { type: Number, required: true, unique: true },
  name: { type: String, required: true },
  color: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}, { collection: 'tags' });

// Event Tags (Junction) Schema
export interface IEventTag extends Document {
  eventId: number;
  tagId: number;
}

const eventTagSchema = new Schema<IEventTag>({
  eventId: { type: Number, required: true },
  tagId: { type: Number, required: true }
}, { collection: 'eventTags' });

// Integration Schema
export interface IIntegration extends Document {
  id: number;
  userId: number;
  serviceName: string;
  accessToken: string;
  refreshToken?: string;
  status: string;
  createdAt: Date;
  updatedAt: Date;
}

const integrationSchema = new Schema<IIntegration>({
  id: { type: Number, required: true, unique: true },
  userId: { type: Number, required: true },
  serviceName: { type: String, required: true },
  accessToken: { type: String, required: true },
  refreshToken: { type: String },
  status: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
}, { collection: 'integrations' });

// Create Zod schemas for validation
export const insertUserSchema = z.object({
  id: z.number().int().optional(),
  name: z.string().optional(),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  timezone: z.string().optional().default("UTC"),
  preferences: z.record(z.any()).optional()
});

export const insertUserSettingSchema = z.object({
  id: z.number().int().optional(),
  userId: z.number().int().positive(),
  displayPreferences: z.record(z.any()).optional(),
  notificationPreferences: z.record(z.any()).optional()
});

export const insertAiPreferenceSchema = z.object({
  id: z.number().int().optional(),
  userId: z.number().int().positive(),
  learningPatterns: z.record(z.any()).optional(),
  optimizationRules: z.record(z.any()).optional()
});

export const insertAnalyticSchema = z.object({
  id: z.number().int().optional(),
  userId: z.number().int().positive(),
  date: z.string(),
  productivityScore: z.number().int().min(0),
  eventCompletionRate: z.number().min(0).max(1)
});

export const insertEventSchema = z.object({
  id: z.number().int().optional(),
  userId: z.number().int().positive(),
  title: z.string(),
  description: z.string().optional(),
  startTime: z.string(),
  endTime: z.string().optional(),
  location: z.string().optional(),
  isAllDay: z.boolean().optional().default(false),
  priority: z.number().int().min(1).max(5).optional().default(2),
  status: z.string(),
  recurrenceRule: z.string().optional()
});

export const insertEventRecurrenceSchema = z.object({
  id: z.number().int().optional(),
  eventId: z.number().int().positive(),
  patternType: z.string(),
  interval: z.number().int().positive(),
  count: z.number().int().positive().optional(),
  untilDate: z.string().optional()
});

export const insertEventReminderSchema = z.object({
  id: z.number().int().optional(),
  eventId: z.number().int().positive(),
  reminderType: z.string(),
  reminderTime: z.string(),
  status: z.string()
});

export const insertTagSchema = z.object({
  id: z.number().int().optional(),
  name: z.string(),
  color: z.string()
});

export const insertEventTagSchema = z.object({
  eventId: z.number().int().positive(),
  tagId: z.number().int().positive()
});

export const insertIntegrationSchema = z.object({
  id: z.number().int().optional(),
  userId: z.number().int().positive(),
  serviceName: z.string(),
  accessToken: z.string(),
  refreshToken: z.string().optional(),
  status: z.string()
});

// Mongoose models
export const UserModel: Model<IUser> = model<IUser>('User', userSchema);
export const UserSettingModel: Model<IUserSetting> = model<IUserSetting>('UserSetting', userSettingSchema);
export const AiPreferenceModel: Model<IAiPreference> = model<IAiPreference>('AiPreference', aiPreferenceSchema);
export const AnalyticModel: Model<IAnalytic> = model<IAnalytic>('Analytic', analyticSchema);
export const EventModel: Model<IEvent> = model<IEvent>('Event', eventSchema);
export const EventRecurrenceModel: Model<IEventRecurrence> = model<IEventRecurrence>('EventRecurrence', eventRecurrenceSchema);
export const EventReminderModel: Model<IEventReminder> = model<IEventReminder>('EventReminder', eventReminderSchema);
export const TagModel: Model<ITag> = model<ITag>('Tag', tagSchema);
export const EventTagModel: Model<IEventTag> = model<IEventTag>('EventTag', eventTagSchema);
export const IntegrationModel: Model<IIntegration> = model<IIntegration>('Integration', integrationSchema);

// TypeScript Types based on Zod schemas
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertUserSetting = z.infer<typeof insertUserSettingSchema>;
export type InsertAiPreference = z.infer<typeof insertAiPreferenceSchema>;
export type InsertAnalytic = z.infer<typeof insertAnalyticSchema>;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type InsertEventRecurrence = z.infer<typeof insertEventRecurrenceSchema>;
export type InsertEventReminder = z.infer<typeof insertEventReminderSchema>;
export type InsertTag = z.infer<typeof insertTagSchema>;
export type InsertEventTag = z.infer<typeof insertEventTagSchema>;
export type InsertIntegration = z.infer<typeof insertIntegrationSchema>;