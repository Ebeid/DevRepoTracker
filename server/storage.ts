import { users, repositories, webhookEvents, passwordResetTokens, type User, type InsertUser, type Repository, type InsertRepository, type WebhookEvent, type InsertWebhookEvent, type PasswordResetToken } from "@shared/schema";
import { db } from "./db";
import { eq, and, gt } from "drizzle-orm";
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

  // Password reset methods
  createPasswordResetToken(userId: number): Promise<{ token: string, expiresAt: Date }>;
  validatePasswordResetToken(token: string): Promise<User | null>;
  updateUserPassword(userId: number, hashedPassword: string): Promise<void>;
  markTokenAsUsed(token: string): Promise<void>;

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

  // Password reset methods
  async createPasswordResetToken(userId: number): Promise<{ token: string, expiresAt: Date }> {
    // Generate a unique token
    const token = crypto.randomBytes(32).toString('hex');

    // Set expiration time (1 hour from now)
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 1);

    // Insert the token into the database
    await db.insert(passwordResetTokens).values({
      userId,
      token,
      expiresAt,
      used: false
    });

    return { token, expiresAt };
  }

  async validatePasswordResetToken(token: string): Promise<User | null> {
    // Get the current date
    const now = new Date();

    // Find the token that is valid (not expired and not used)
    const [resetToken] = await db
      .select()
      .from(passwordResetTokens)
      .where(
        and(
          eq(passwordResetTokens.token, token),
          eq(passwordResetTokens.used, false),
          gt(passwordResetTokens.expiresAt, now)
        )
      );

    if (!resetToken) {
      return null;
    }

    // Get the user associated with this token
    const user = await this.getUser(resetToken.userId);
    return user || null;
  }

  async updateUserPassword(userId: number, hashedPassword: string): Promise<void> {
    await db
      .update(users)
      .set({ password: hashedPassword })
      .where(eq(users.id, userId));
  }

  async markTokenAsUsed(token: string): Promise<void> {
    await db
      .update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.token, token));
  }
}

export const storage = new DatabaseStorage();