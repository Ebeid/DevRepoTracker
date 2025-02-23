import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertRepositorySchema } from "@shared/schema";

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  app.get("/api/repositories", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const repositories = await storage.getRepositories(req.user.id);
    res.json(repositories);
  });

  app.post("/api/repositories", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    
    const parsed = insertRepositorySchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json(parsed.error);
    }

    const repository = await storage.addRepository(req.user.id, parsed.data);
    res.status(201).json(repository);
  });

  app.get("/api/repositories/search", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const query = req.query.q as string;
    if (!query) {
      return res.status(400).json({ message: "Search query required" });
    }
    const repositories = await storage.searchRepositories(req.user.id, query);
    res.json(repositories);
  });

  const httpServer = createServer(app);
  return httpServer;
}
