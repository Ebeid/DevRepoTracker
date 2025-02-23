import { users, repositories, webhookEvents, type User, type InsertUser, type Repository, type InsertRepository, type WebhookEvent, type InsertWebhookEvent } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";
import crypto from "crypto";

const PostgresSessionStore = connectPg(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getRepositories(userId: number): Promise<Repository[]>;
  addRepository(userId: number, repo: InsertRepository): Promise<Repository>;
  searchRepositories(userId: number, query: string): Promise<Repository[]>;
  enableWebhook(repositoryId: number): Promise<{ webhookSecret: string }>;
  disableWebhook(repositoryId: number): Promise<void>;
  addWebhookEvent(event: InsertWebhookEvent): Promise<WebhookEvent>;
  getWebhookEvents(repositoryId: number): Promise<WebhookEvent[]>;
  getRepository(id: number): Promise<Repository | undefined>;
  sessionStore: session.Store;
}

export class DatabaseStorage implements IStorage {
  sessionStore: session.Store;

  constructor() {
    this.sessionStore = new PostgresSessionStore({
      pool,
      createTableIfMissing: true,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async getRepositories(userId: number): Promise<Repository[]> {
    return db.select().from(repositories).where(eq(repositories.userId, userId));
  }

  async getRepository(id: number): Promise<Repository | undefined> {
    const [repository] = await db.select().from(repositories).where(eq(repositories.id, id));
    return repository;
  }

  async addRepository(userId: number, repo: InsertRepository): Promise<Repository> {
    const [repository] = await db
      .insert(repositories)
      .values({ ...repo, userId })
      .returning();
    return repository;
  }

  async searchRepositories(userId: number, query: string): Promise<Repository[]> {
    const lowercaseQuery = query.toLowerCase();
    const results = await db
      .select()
      .from(repositories)
      .where(eq(repositories.userId, userId));

    return results.filter(
      (repo) =>
        repo.name.toLowerCase().includes(lowercaseQuery) ||
        (repo.description?.toLowerCase() || '').includes(lowercaseQuery)
    );
  }

  async enableWebhook(repositoryId: number): Promise<{ webhookSecret: string }> {
    const webhookSecret = crypto.randomBytes(32).toString('hex');
    await db
      .update(repositories)
      .set({ webhookSecret, webhookEnabled: true })
      .where(eq(repositories.id, repositoryId));
    return { webhookSecret };
  }

  async disableWebhook(repositoryId: number): Promise<void> {
    await db
      .update(repositories)
      .set({ webhookSecret: null, webhookEnabled: false })
      .where(eq(repositories.id, repositoryId));
  }

  async addWebhookEvent(event: InsertWebhookEvent): Promise<WebhookEvent> {
    const [webhookEvent] = await db
      .insert(webhookEvents)
      .values(event)
      .returning();
    return webhookEvent;
  }

  async getWebhookEvents(repositoryId: number): Promise<WebhookEvent[]> {
    return db
      .select()
      .from(webhookEvents)
      .where(eq(webhookEvents.repositoryId, repositoryId))
      .orderBy(webhookEvents.createdAt);
  }
}

export const storage = new DatabaseStorage();