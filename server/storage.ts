import { User, InsertUser, Repository, InsertRepository } from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  getRepositories(userId: number): Promise<Repository[]>;
  addRepository(userId: number, repo: InsertRepository): Promise<Repository>;
  searchRepositories(userId: number, query: string): Promise<Repository[]>;
  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private repositories: Map<number, Repository>;
  private currentUserId: number;
  private currentRepoId: number;
  sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.repositories = new Map();
    this.currentUserId = 1;
    this.currentRepoId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000,
    });
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getRepositories(userId: number): Promise<Repository[]> {
    return Array.from(this.repositories.values()).filter(
      (repo) => repo.userId === userId
    );
  }

  async addRepository(userId: number, repo: InsertRepository): Promise<Repository> {
    const id = this.currentRepoId++;
    const repository: Repository = { ...repo, id, userId };
    this.repositories.set(id, repository);
    return repository;
  }

  async searchRepositories(userId: number, query: string): Promise<Repository[]> {
    const lowercaseQuery = query.toLowerCase();
    return Array.from(this.repositories.values()).filter(
      (repo) =>
        repo.userId === userId &&
        (repo.name.toLowerCase().includes(lowercaseQuery) ||
          repo.description?.toLowerCase().includes(lowercaseQuery))
    );
  }
}

export const storage = new MemStorage();
