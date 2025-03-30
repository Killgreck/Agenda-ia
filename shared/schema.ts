import { pgTable, text, serial, integer, boolean, timestamp, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Tasks table
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
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
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
});

// Check-ins table
export const checkIns = pgTable("check_ins", {
  id: serial("id").primaryKey(),
  date: timestamp("date").notNull(),
  productivityRating: integer("productivity_rating").notNull(), // 1-5
  notes: text("notes"),
});

export const insertCheckInSchema = createInsertSchema(checkIns).omit({
  id: true,
});

// Chat messages table
export const chatMessages = pgTable("chat_messages", {
  id: serial("id").primaryKey(),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").notNull(),
  sender: text("sender").notNull(), // 'user' or 'ai'
});

export const insertChatMessageSchema = createInsertSchema(chatMessages).omit({
  id: true,
});

// AI suggestions table
export const aiSuggestions = pgTable("ai_suggestions", {
  id: serial("id").primaryKey(),
  suggestion: text("suggestion").notNull(),
  timestamp: timestamp("timestamp").notNull(),
  accepted: boolean("accepted").default(false).notNull(),
  type: text("type").notNull(), // 'task', 'timeblock', etc
  metadata: json("metadata"), // Any additional context
});

export const insertAiSuggestionSchema = createInsertSchema(aiSuggestions).omit({
  id: true,
});

// Statistics table for weekly reports
export const statistics = pgTable("statistics", {
  id: serial("id").primaryKey(),
  weekStart: timestamp("week_start").notNull(),
  weekEnd: timestamp("week_end").notNull(),
  tasksCompleted: integer("tasks_completed").notNull(),
  tasksTotal: integer("tasks_total").notNull(),
  avgProductivity: integer("avg_productivity").notNull(), // 1-5
  aiSuggestionsAccepted: integer("ai_suggestions_accepted").notNull(),
  aiSuggestionsTotal: integer("ai_suggestions_total").notNull(),
});

export const insertStatisticsSchema = createInsertSchema(statistics).omit({
  id: true,
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

// Keep the users table as it was originally defined
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
