import { relations } from "drizzle-orm";
import { integer, pgTable, serial, text, timestamp, boolean } from "drizzle-orm/pg-core";

// Define 'users' table
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  uid: text("uid").notNull().unique(), // Firebase Auth UID
  email: text("email").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Define 'memories' table linked to 'users'
export const memories = pgTable("memories", {
  id: text("id").primaryKey(), // We use client-generated or unique IDs
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  category: text("category").notNull(), // 'user_preference' | 'interaction_fact' | 'code_snippet' | 'custom_note'
  content: text("content").notNull(),
  importance: text("importance").notNull(), // 'high' | 'medium' | 'low'
  timestamp: timestamp("timestamp").defaultNow(),
});

// Define 'tasks' table linked to 'users'
export const tasks = pgTable("tasks", {
  id: text("id").primaryKey(),
  userId: integer("user_id")
    .references(() => users.id, { onDelete: "cascade" })
    .notNull(),
  title: text("title").notNull(),
  project: text("project").default("General"),
  progress: integer("progress").default(0).notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Define 'task_steps' table linked to 'tasks'
export const taskSteps = pgTable("task_steps", {
  id: serial("id").primaryKey(),
  taskId: text("task_id")
    .references(() => tasks.id, { onDelete: "cascade" })
    .notNull(),
  title: text("title").notNull(),
  description: text("description").notNull(),
  estimatedMinutes: integer("estimated_minutes").default(15).notNull(),
  completed: boolean("completed").default(false).notNull(),
});

// Relationships
export const usersRelations = relations(users, ({ many }) => ({
  memories: many(memories),
  tasks: many(tasks),
}));

export const memoriesRelations = relations(memories, ({ one }) => ({
  user: one(users, {
    fields: [memories.userId],
    references: [users.id],
  }),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  user: one(users, {
    fields: [tasks.userId],
    references: [users.id],
  }),
  steps: many(taskSteps),
}));

export const taskStepsRelations = relations(taskSteps, ({ one }) => ({
  task: one(tasks, {
    fields: [taskSteps.taskId],
    references: [tasks.id],
  }),
}));
