import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Keep the users table at the top since other tables reference it
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  email: text("email").unique(),
  name: text("name"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  email: true,
  name: true,
}).extend({
  password: z.string().min(6, "Password must be at least 6 characters"),
  email: z.string().email("Invalid email address").optional().nullable(),
  name: z.string().optional().nullable(),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Tasks table
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  title: text("title").notNull(),
  description: text("description"),
  date: timestamp("date").notNull(),
  endDate: timestamp("end_date"),
  priority: text("priority").default("medium").notNull(), // low, medium, high
  completed: boolean("completed").default(false).notNull(),
  location: text("location"),
  isAllDay: boolean("is_all_day").default(false).notNull(),
  reminder: integer("reminder").array(), // minutes before event [15, 60, etc]
  isRecurring: boolean("is_recurring").default(false).notNull(),
  recurringDays: text("recurring_days").array(), // days of week: ['monday', 'wednesday', etc]
  skipHolidays: boolean("skip_holidays").default(false).notNull(),
  holidayCountry: text("holiday_country"), // 'US', 'CO' for Colombia
  recurrenceStartDate: timestamp("recurrence_start_date"), // When recurring events start
  recurrenceEndDate: timestamp("recurrence_end_date"), // When recurring events end
  recurrenceType: text("recurrence_type"), // 'daily', 'weekly'
});

// Create the base insert schema
const baseInsertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
});

// Extend it to handle string date inputs that will be converted to timestamps in the database
export const insertTaskSchema = baseInsertTaskSchema.extend({
  userId: z.number().int().positive().optional(), // Optional because it will be set from session on the server
  date: z.string(),
  endDate: z.string().optional(),
  recurrenceStartDate: z.string().optional(),
  recurrenceEndDate: z.string().optional(),
});

// Check-ins table
export const checkIns = pgTable("check_ins", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  date: timestamp("date").notNull(),
  productivityRating: integer("productivity_rating").notNull(), // 1-5
  notes: text("notes"),
});

// Create the base check-in insert schema
const baseInsertCheckInSchema = createInsertSchema(checkIns).omit({
  id: true,
});

// Extend it to handle string date input
export const insertCheckInSchema = baseInsertCheckInSchema.extend({
  userId: z.number().int().positive(),
  date: z.string(),
});

// Chat messages table
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").notNull(),
  sender: text("sender").notNull(), // 'user' or 'ai'
});

// Create the base chat message insert schema
const baseInsertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
});

// Extend it to handle string timestamp input
export const insertChatMessageSchema = baseInsertChatMessageSchema.extend({
  userId: z.number().int().positive(),
  timestamp: z.string(),
});

// AI suggestions table
export const aiSuggestions = pgTable("ai_suggestions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  suggestion: text("suggestion").notNull(),
  timestamp: timestamp("timestamp").notNull(),
  accepted: boolean("accepted").default(false).notNull(),
  type: text("type").notNull(), // 'task', 'timeblock', etc
  metadata: json("metadata"), // Any additional context
});

// Create the base AI suggestion insert schema
const baseInsertAiSuggestionSchema = createInsertSchema(aiSuggestions).omit({
  id: true,
});

// Extend it to handle string timestamp input
export const insertAiSuggestionSchema = baseInsertAiSuggestionSchema.extend({
  userId: z.number().int().positive(),
  timestamp: z.string(),
});

// Statistics table for weekly reports
export const statistics = pgTable("statistics", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  weekStart: timestamp("week_start").notNull(),
  weekEnd: timestamp("week_end").notNull(),
  tasksCompleted: integer("tasks_completed").notNull(),
  tasksTotal: integer("tasks_total").notNull(),
  avgProductivity: integer("avg_productivity").notNull(), // 1-5
  aiSuggestionsAccepted: integer("ai_suggestions_accepted").notNull(),
  aiSuggestionsTotal: integer("ai_suggestions_total").notNull(),
});

// Create the base statistics insert schema
const baseInsertStatisticsSchema = createInsertSchema(statistics).omit({
  id: true,
});

// Extend it to handle string date inputs
export const insertStatisticsSchema = baseInsertStatisticsSchema.extend({
  userId: z.number().int().positive(),
  weekStart: z.string(),
  weekEnd: z.string(),
});

// Export types
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type CheckIn = typeof checkIns.$inferSelect;
export type InsertCheckIn = z.infer<typeof insertCheckInSchema>;

export type ChatMessage = typeof chatMessages.$inferSelect;
export type InsertChatMessage = z.infer<typeof insertChatMessageSchema>;

export type AiSuggestion = typeof aiSuggestions.$inferSelect;
export type InsertAiSuggestion = z.infer<typeof insertAiSuggestionSchema>;

export type Statistic = typeof statistics.$inferSelect;
export type InsertStatistic = z.infer<typeof insertStatisticsSchema>;
