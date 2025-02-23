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
    const command = new SendMessageCommand({
      QueueUrl: process.env.AWS_QUEUE_URL,
      MessageBody: JSON.stringify(message),
    });

    await sqsClient.send(command);
    console.log("Message sent to SQS queue successfully");
  } catch (error) {
    console.error("Error sending message to SQS:", error);
    throw error;
  }
}
