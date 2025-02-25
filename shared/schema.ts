import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const repositories = pgTable("repositories", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  fullName: text("full_name").notNull(),
  description: text("description"),
  url: text("url").notNull(),
  stars: integer("stars").default(0),
  isPrivate: boolean("is_private").default(false),
  forks: integer("forks").default(0),
  openIssues: integer("open_issues").default(0),
  watchers: integer("watchers").default(0),
  lastCommitDate: timestamp("last_commit_date"),
  language: text("language"),
  topics: text("topics").array().default(Array()),
  contributorsCount: integer("contributors_count").default(0),
  weeklyCommitCount: integer("weekly_commit_count").default(0),
  webhookSecret: text("webhook_secret"),
  webhookEnabled: boolean("webhook_enabled").default(false),
});

export const webhookEvents = pgTable("webhook_events", {
  id: serial("id").primaryKey(),
  repositoryId: integer("repository_id").notNull(),
  type: text("type").notNull(), // 'push', 'pull_request'
  action: text("action"), // for pull_request events: 'opened', 'closed', etc.
  sender: text("sender").notNull(),
  payload: text("payload").notNull(), // JSON stringified data
  createdAt: timestamp("created_at").defaultNow(),
});

export const insertUserSchema = createInsertSchema(users)
  .pick({
    username: true,
    password: true,
  })
  .extend({
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

export const insertRepositorySchema = createInsertSchema(repositories).pick({
  name: true,
  fullName: true,
  description: true,
  url: true,
  stars: true,
  isPrivate: true,
});

export const insertWebhookEventSchema = createInsertSchema(webhookEvents).pick({
  repositoryId: true,
  type: true,
  action: true,
  sender: true,
  payload: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type Repository = typeof repositories.$inferSelect;
export type InsertRepository = z.infer<typeof insertRepositorySchema>;
export type WebhookEvent = typeof webhookEvents.$inferSelect;
export type InsertWebhookEvent = z.infer<typeof insertWebhookEventSchema>;