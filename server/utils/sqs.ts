import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

// Initialize SQS client
const sqsClient = new SQSClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

export async function sendToQueue(message: any) {
  try {
    if (!process.env.AWS_QUEUE_URL) {
      throw new Error("AWS_QUEUE_URL environment variable is not set");
    }

    const command = new SendMessageCommand({
      QueueUrl: process.env.AWS_QUEUE_URL,
      MessageBody: JSON.stringify(message),
      MessageAttributes: {
        "MessageType": {
          DataType: "String",
          StringValue: "RepositoryEvent"
        }
      }
    });

    await sqsClient.send(command);
    console.log("Message sent to SQS queue successfully:", {
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
    throw error;
  }
}