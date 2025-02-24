import { SQSClient, ReceiveMessageCommand, DeleteMessageCommand } from "@aws-sdk/client-sqs";
import { storage } from "../storage";
import type { Repository } from "@shared/schema";

// Initialize SQS client
const sqsClient = new SQSClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

interface QueueMessage {
  event: string;
  message: string;
  timestamp: string;
  repository: {
    id: number;
    name: string;
    fullName: string;
    url: string;
  };
  sender?: string;
  action?: string;
}

async function processMessage(message: QueueMessage, repository: Repository) {
  console.log(`Processing ${message.event} event for repository ${repository.name}`);
  
  switch (message.event) {
    case 'repository_added':
      console.log('New repository added:', repository.name);
      break;
    
    case 'push':
      console.log('Push event received for:', repository.fullName);
      break;
    
    case 'pull_request':
      console.log('Pull request event:', message.action, 'by', message.sender);
      break;
    
    default:
      console.warn('Unhandled event type:', message.event);
  }
}

async function deleteMessage(receiptHandle: string) {
  try {
    await sqsClient.send(new DeleteMessageCommand({
      QueueUrl: process.env.AWS_QUEUE_URL,
      ReceiptHandle: receiptHandle
    }));
    console.log('Successfully deleted message');
  } catch (error) {
    console.error('Error deleting message:', error);
  }
}

export async function startConsumer() {
  console.log('Starting SQS consumer...');
  
  while (true) {
    try {
      const command = new ReceiveMessageCommand({
        QueueUrl: process.env.AWS_QUEUE_URL,
        MaxNumberOfMessages: 10,
        WaitTimeSeconds: 20,
        AttributeNames: ['All'],
        MessageAttributeNames: ['All']
      });

      const response = await sqsClient.send(command);
      const messages = response.Messages || [];

      for (const msg of messages) {
        try {
          if (!msg.Body) continue;
          
          const messageData: QueueMessage = JSON.parse(msg.Body);
          const repository = await storage.getRepository(messageData.repository.id);
          
          if (!repository) {
            console.warn(`Repository ${messageData.repository.id} not found`);
            continue;
          }

          await processMessage(messageData, repository);
          await deleteMessage(msg.ReceiptHandle!);
          
        } catch (error) {
          console.error('Error processing message:', error);
          // Message will return to queue after visibility timeout
        }
      }
    } catch (error) {
      console.error('Error polling messages:', error);
      // Wait before retrying on error
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }
}
