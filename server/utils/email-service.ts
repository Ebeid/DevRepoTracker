import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { Repository } from "@shared/schema";

// Initialize SES client
const sesClient = new SESClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const NOTIFICATION_EMAIL = 'esoliman@gmail.com';

export async function sendEmailNotification(
  messageText: string,
  repository: Repository,
  eventType: string
) {
  try {
    const command = new SendEmailCommand({
      Destination: {
        ToAddresses: [NOTIFICATION_EMAIL],
      },
      Message: {
        Body: {
          Html: {
            Charset: "UTF-8",
            Data: `
              <h2>Repository Event Notification</h2>
              <p>${messageText}</p>
              <hr>
              <h3>Event Details:</h3>
              <ul>
                <li>Repository: ${repository.name}</li>
                <li>Event Type: ${eventType}</li>
                <li>Time: ${new Date().toLocaleString()}</li>
              </ul>
              <p>View repository: <a href="${repository.url}">${repository.url}</a></p>
            `,
          },
          Text: {
            Charset: "UTF-8",
            Data: messageText,
          },
        },
        Subject: {
          Charset: "UTF-8",
          Data: `Repository Event: ${eventType}`,
        },
      },
      Source: NOTIFICATION_EMAIL, // The sender email must be verified in SES
    });

    await sesClient.send(command);
    console.log('Email notification sent successfully via AWS SES');
    return true;
  } catch (error) {
    console.error('Failed to send email notification via AWS SES:', error);
    // Log detailed error information
    if (error.response) {
      console.error('AWS SES Error Response:', {
        statusCode: error.$metadata?.httpStatusCode,
        message: error.message,
        requestId: error.$metadata?.requestId
      });
    }
    return false;
  }
}