import type { Express } from "express";
import { createServer, type Server } from "http";
import { setupAuth } from "./auth";
import { storage } from "./storage";
import { insertRepositorySchema } from "@shared/schema";
import crypto from "crypto";
import { sendToQueue, getRetryQueueStatus } from "./utils/sqs";
import { formatMessage } from "./utils/message-templates";
import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } from "@aws-sdk/client-sqs";

// Initialize SQS client for webhook processing
const sqsClient = new SQSClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// Add validation function for SQS messages
function validateSQSMessage(body: any): boolean {
  return body && 
         typeof body.Message === 'string' && 
         typeof body.MessageId === 'string' && 
         typeof body.Timestamp === 'string';
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

    // Send message to SQS queue about the new repository
    let sqsError = null;
    try {
      const messageText = formatMessage('repository_added', {
        repository,
        user: {
          id: req.user.id,
          username: req.user.username,
        }
      });

      await sendToQueue({
        event: 'repository_added',
        message: messageText,
        timestamp: new Date().toISOString(),
        repository: {
          id: repository.id,
          name: repository.name,
          fullName: repository.fullName,
          url: repository.url,
          userId: req.user.id,
        },
        user: {
          id: req.user.id,
          username: req.user.username,
        },
      });

      console.log(`Successfully sent message to SQS for repository: ${repository.name}`);
    } catch (error) {
      // Log the error but don't fail the request
      console.error('Failed to send message to SQS:', error);
      sqsError = error;
      res.setHeader('X-SQS-Error', 'Failed to send repository notification');
    }

    // Get retry queue status if there was an error
    const retryStatus = sqsError ? getRetryQueueStatus() : null;

    res.status(201).json({
      ...repository,
      notification: sqsError ? 'queued_with_errors' : 'queued',
      retryStatus: retryStatus ? {
        inRetryQueue: true,
        queueSize: retryStatus.queueSize,
        retryAttempts: retryStatus.messages.length
      } : null
    });
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
      // Store webhook event
      await storage.addWebhookEvent({
        repositoryId: repository.id,
        type: event,
        action: event === 'pull_request' ? req.body.action : undefined,
        sender: req.body.sender.login,
        payload: JSON.stringify(req.body),
      });

      // Send templated message to SQS
      try {
        const messageText = formatMessage(event as any, {
          repository,
          sender: req.body.sender.login,
          action: event === 'pull_request' ? req.body.action : undefined
        });

        await sendToQueue({
          event,
          message: messageText,
          timestamp: new Date().toISOString(),
          repository: {
            id: repository.id,
            name: repository.name,
            fullName: repository.fullName,
            url: repository.url
          },
          sender: req.body.sender.login,
          action: event === 'pull_request' ? req.body.action : undefined
        });
      } catch (error) {
        console.error(`Failed to send templated message to SQS for ${event} event:`, error);
      }
    }

    res.sendStatus(200);
  });

  // Add new route to check message retry status
  app.get("/api/message-retry-status", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(getRetryQueueStatus());
  });

  // Add new SQS webhook endpoint
  app.post("/api/webhook/sqs", async (req, res) => {
    console.log('Received SQS webhook:', req.body);

    if (!validateSQSMessage(req.body)) {
      console.error('Invalid SQS message format:', req.body);
      return res.status(400).json({ error: 'Invalid message format' });
    }

    try {
      const message = JSON.parse(req.body.Message);

      // Process message based on event type
      switch (message.event) {
        case 'repository_added':
        case 'push':
        case 'pull_request':
          // Update repository status if needed
          if (message.repository?.id) {
            const repository = await storage.getRepository(message.repository.id);
            if (repository) {
              console.log(`Processing ${message.event} event for repository ${repository.name}`);
              // Additional processing logic can be added here
            }
          }
          break;

        default:
          console.warn(`Unhandled event type: ${message.event}`);
      }

      // Acknowledge successful processing
      res.status(200).json({
        status: 'success',
        messageId: req.body.MessageId,
        event: message.event,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error processing SQS webhook:', error);
      res.status(500).json({ error: 'Failed to process message' });
    }
  });

  // Add endpoint to manually poll messages (for testing)
  app.get("/api/webhook/sqs/poll", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const command = new ReceiveMessageCommand({
        QueueUrl: process.env.AWS_QUEUE_URL,
        MaxNumberOfMessages: 10,
        WaitTimeSeconds: 0
      });

      const response = await sqsClient.send(command);
      const messages = response.Messages || [];

      res.json({
        messageCount: messages.length,
        messages: messages.map(msg => ({
          id: msg.MessageId,
          body: msg.Body ? JSON.parse(msg.Body) : null,
          receivedAt: new Date().toISOString()
        }))
      });
    } catch (error) {
      console.error('Error polling SQS messages:', error);
      res.status(500).json({ error: 'Failed to poll messages' });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}