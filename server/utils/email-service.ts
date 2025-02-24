import { MailService } from '@sendgrid/mail';
import { Repository } from '@shared/schema';

if (!process.env.SENDGRID_API_KEY) {
  throw new Error("SENDGRID_API_KEY environment variable must be set");
}

const mailService = new MailService();
mailService.setApiKey(process.env.SENDGRID_API_KEY);

const NOTIFICATION_EMAIL = 'esoliman@gmail.com';

export async function sendEmailNotification(
  messageText: string,
  repository: Repository,
  eventType: string
) {
  try {
    const emailContent = {
      to: NOTIFICATION_EMAIL,
      from: 'esoliman@gmail.com', // Use the same email as recipient for initial testing.  Change to verified sender in production.
      subject: `Repository Event: ${eventType}`,
      text: messageText,
      html: `
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
    };

    await mailService.send(emailContent);
    console.log('Email notification sent successfully');
    return true;
  } catch (error) {
    console.error('Failed to send email notification:', error);
    // Log detailed error information
    if (error.response) {
      console.error('SendGrid API Error Response:', {
        statusCode: error.response.statusCode || error.code, // Handle potential missing statusCode
        body: error.response.body,
        headers: error.response.headers
      });
    }
    return false;
  }
}