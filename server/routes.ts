import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertRepositorySchema } from "@shared/schema";
import crypto from "crypto";

function verifyGithubWebhook(secret: string, signature: string | undefined, body: any): boolean {
  if (!signature) return false;
  const hmac = crypto.createHmac('sha256', secret);
  const digest = 'sha256=' + hmac.update(JSON.stringify(body)).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

export async function registerRoutes(app: Express): Promise<Server> {
  setupAuth(app);

  app.get("/api/repositories", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const repositories = await storage.getRepositories(req.user.id);

    // Add mock analytics data for demonstration
    const repositoriesWithAnalytics = repositories.map(repo => ({
      ...repo,
      forks: Math.floor(Math.random() * 100),
      openIssues: Math.floor(Math.random() * 50),
      watchers: Math.floor(Math.random() * 200),
      lastCommitDate: new Date().toISOString(),
      language: ["TypeScript", "JavaScript", "Python", "Go"][Math.floor(Math.random() * 4)],
      topics: ["web", "react", "nodejs", "api"].slice(0, Math.floor(Math.random() * 4)),
      contributorsCount: Math.floor(Math.random() * 20),
      weeklyCommitCount: Math.floor(Math.random() * 100),
    }));

    res.json(repositoriesWithAnalytics);
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

  // Webhook management endpoints
  app.post("/api/repositories/:id/webhook/enable", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const repository = await storage.getRepository(Number(req.params.id));
    if (!repository || repository.userId !== req.user.id) {
      return res.sendStatus(404);
    }
    const { webhookSecret } = await storage.enableWebhook(repository.id);
    res.json({ webhookSecret });
  });

  app.post("/api/repositories/:id/webhook/disable", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const repository = await storage.getRepository(Number(req.params.id));
    if (!repository || repository.userId !== req.user.id) {
      return res.sendStatus(404);
    }
    await storage.disableWebhook(repository.id);
    res.sendStatus(200);
  });

  app.get("/api/repositories/:id/webhook/events", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    const repository = await storage.getRepository(Number(req.params.id));
    if (!repository || repository.userId !== req.user.id) {
      return res.sendStatus(404);
    }
    const events = await storage.getWebhookEvents(repository.id);
    res.json(events);
  });

  // GitHub webhook endpoint
  app.post("/api/webhook/:repositoryId", async (req, res) => {
    const repository = await storage.getRepository(Number(req.params.repositoryId));
    if (!repository || !repository.webhookEnabled || !repository.webhookSecret) {
      return res.sendStatus(404);
    }

    const signature = req.headers['x-hub-signature-256'] as string;
    if (!verifyGithubWebhook(repository.webhookSecret, signature, req.body)) {
      return res.sendStatus(401);
    }

    const event = req.headers['x-github-event'] as string;
    if (event === 'push' || event === 'pull_request') {
      await storage.addWebhookEvent({
        repositoryId: repository.id,
        type: event,
        action: event === 'pull_request' ? req.body.action : undefined,
        sender: req.body.sender.login,
        payload: JSON.stringify(req.body),
      });
    }

    res.sendStatus(200);
  });

  const httpServer = createServer(app);
  return httpServer;
}