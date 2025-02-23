import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { MessageRetryHandler } from "./retry-handler";
import crypto from "crypto";

// Initialize SQS client
const sqsClient = new SQSClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// Initialize retry handler
const retryHandler = new MessageRetryHandler(sqsClient, {
  maxAttempts: 3,
  baseDelay: 2000,  // Start with 2 seconds
  maxDelay: 30000   // Max delay of 30 seconds
});

export async function sendToQueue(message: any) {
  try {
    if (!process.env.AWS_QUEUE_URL) {
      throw new Error("AWS_QUEUE_URL environment variable is not set");
    }

    const messageId = crypto.randomUUID();
    const command = new SendMessageCommand({
      QueueUrl: process.env.AWS_QUEUE_URL,
      MessageBody: JSON.stringify(message),
      MessageAttributes: {
        "MessageType": {
          DataType: "String",
          StringValue: "RepositoryEvent"
        },
        "MessageId": {
          DataType: "String",
          StringValue: messageId
        }
      }
    });

    await sqsClient.send(command);
    console.log("Message sent to SQS queue successfully:", {
      messageId,
      queueUrl: process.env.AWS_QUEUE_URL,
      messageType: "RepositoryEvent"
    });
  } catch (error) {
    console.error("Error sending message to SQS:", error);
    // Log additional context for debugging
    console.error("SQS Configuration:", {
      region: process.env.AWS_REGION,
      queueUrl: process.env.AWS_QUEUE_URL,
      hasAccessKey: !!process.env.AWS_ACCESS_KEY_ID,
      hasSecretKey: !!process.env.AWS_SECRET_ACCESS_KEY
    });

    // Add to retry queue
    const messageId = crypto.randomUUID();
    await retryHandler.addToRetryQueue(messageId, message);
    throw error;
  }
}

// Export retry handler for status checking
export const getRetryQueueStatus = () => retryHandler.getRetryQueueStatus();