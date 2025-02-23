import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

interface RetryConfig {
  maxAttempts: number;
  baseDelay: number; // in milliseconds
  maxDelay: number; // in milliseconds
}

interface RetryMessage {
  message: any;
  attempt: number;
  lastAttempt: Date;
}

export class MessageRetryHandler {
  private retryQueue: Map<string, RetryMessage>;
  private config: RetryConfig;
  private sqsClient: SQSClient;

  constructor(sqsClient: SQSClient, config?: Partial<RetryConfig>) {
    this.sqsClient = sqsClient;
    this.retryQueue = new Map();
    this.config = {
      maxAttempts: 3,
      baseDelay: 1000, // 1 second
      maxDelay: 60000, // 1 minute
      ...config
    };
  }

  private calculateBackoff(attempt: number): number {
    const delay = Math.min(
      this.config.baseDelay * Math.pow(2, attempt - 1),
      this.config.maxDelay
    );
    // Add jitter to prevent thundering herd
    return delay + Math.random() * 1000;
  }

  async addToRetryQueue(messageId: string, message: any): Promise<void> {
    this.retryQueue.set(messageId, {
      message,
      attempt: 1,
      lastAttempt: new Date()
    });
    
    console.log(`Message ${messageId} added to retry queue. Will retry in ${this.calculateBackoff(1)}ms`);
    this.scheduleRetry(messageId);
  }

  private async scheduleRetry(messageId: string): Promise<void> {
    const retryMessage = this.retryQueue.get(messageId);
    if (!retryMessage) return;

    const backoff = this.calculateBackoff(retryMessage.attempt);
    
    setTimeout(async () => {
      try {
        const command = new SendMessageCommand({
          QueueUrl: process.env.AWS_QUEUE_URL!,
          MessageBody: JSON.stringify(retryMessage.message),
          MessageAttributes: {
            "MessageType": {
              DataType: "String",
              StringValue: "RepositoryEvent"
            },
            "RetryAttempt": {
              DataType: "Number",
              StringValue: retryMessage.attempt.toString()
            }
          }
        });

        await this.sqsClient.send(command);
        console.log(`Retry attempt ${retryMessage.attempt} successful for message ${messageId}`);
        this.retryQueue.delete(messageId);
      } catch (error) {
        console.error(`Retry attempt ${retryMessage.attempt} failed for message ${messageId}:`, error);
        
        if (retryMessage.attempt < this.config.maxAttempts) {
          this.retryQueue.set(messageId, {
            ...retryMessage,
            attempt: retryMessage.attempt + 1,
            lastAttempt: new Date()
          });
          this.scheduleRetry(messageId);
        } else {
          console.error(`Max retry attempts (${this.config.maxAttempts}) reached for message ${messageId}. Message will be dropped.`);
          this.retryQueue.delete(messageId);
        }
      }
    }, backoff);
  }

  getRetryQueueStatus(): { queueSize: number; messages: Array<{ id: string, attempts: number }> } {
    return {
      queueSize: this.retryQueue.size,
      messages: Array.from(this.retryQueue.entries()).map(([id, msg]) => ({
        id,
        attempts: msg.attempt
      }))
    };
  }
}
