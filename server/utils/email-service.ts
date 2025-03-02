import sgMail from '@sendgrid/mail';
import { SESClient, SendEmailCommand } from "@aws-sdk/client-ses";
import { Repository } from "@shared/schema";

// Set up SendGrid with the API key (keeping for backward compatibility)
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

// Initialize SES client
const sesClient = new SESClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

// Use environment variables for email addresses or fallback to defaults
// Make sure to verify these email addresses in AWS SES console
const NOTIFICATION_EMAIL = process.env.NOTIFICATION_EMAIL || 'no-reply@example.com';
const FROM_EMAIL = process.env.FROM_EMAIL || NOTIFICATION_EMAIL;

// Function to send password reset emails using AWS SES
export async function sendPasswordResetEmail(
  to: string,
  resetToken: string,
  username: string
): Promise<boolean> {
  try {
    // Use APP_URL environment variable or fallback to a default URL
    const baseUrl = process.env.APP_URL || 'http://localhost:5000';
    const resetUrl = `${baseUrl}/auth/reset-password?token=${resetToken}`;

    // HTML content for the email
    const htmlBody = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Git-Plus Password Reset</h2>
        <p>Hello ${username},</p>
        <p>You requested to reset your password. Click the button below to reset your password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background-color: #4F46E5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">Reset Your Password</a>
        </div>
        <p><strong>This link will expire in 1 hour.</strong></p>
        <p>If you didn't request this, please ignore this email.</p>
        <p>Regards,<br/>Git-Plus Team</p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />
        <p style="color: #888; font-size: 12px;">If the button doesn't work, copy and paste this URL into your browser: ${resetUrl}</p>
      </div>
    `;

    // Plain text content as a fallback
    const textBody = `Hello ${username},\n\nYou requested to reset your password. Click the link below to reset your password:\n\n${resetUrl}\n\nThis link will expire in 1 hour.\n\nIf you didn't request this, please ignore this email.\n\nRegards,\nGit-Plus Team`;

    // Log email configuration for debugging
    console.log(`Attempting to send password reset email from ${NOTIFICATION_EMAIL} to ${to} using AWS SES in ${process.env.AWS_REGION} region`);

    // Create and send the email command
    const command = new SendEmailCommand({
      Destination: {
        ToAddresses: [to],
      },
      Message: {
        Body: {
          Html: {
            Charset: "UTF-8",
            Data: htmlBody,
          },
          Text: {
            Charset: "UTF-8",
            Data: textBody,
          },
        },
        Subject: {
          Charset: "UTF-8",
          Data: "Git-Plus Password Reset",
        },
      },
      Source: NOTIFICATION_EMAIL, // Use the same email for Source as we do for notifications since it's likely verified
    });

    await sesClient.send(command);
    console.log('Password reset email sent successfully via AWS SES');
    return true;
  } catch (error: any) {
    console.error('Failed to send password reset email via AWS SES:', error);
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
  } catch (error: any) {
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