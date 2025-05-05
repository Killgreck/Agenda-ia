import { MailService } from '@sendgrid/mail';
import crypto from 'crypto';

// Initialize SendGrid service
if (!process.env.SENDGRID_API_KEY) {
  console.warn("WARNING: SENDGRID_API_KEY is not configured. Emails will not be sent.");
}

const mailService = new MailService();
if (process.env.SENDGRID_API_KEY) {
  mailService.setApiKey(process.env.SENDGRID_API_KEY);
}

// Sender email address (change to your verified email address in SendGrid)
const FROM_EMAIL = 'noreply@aicalendar.com';

interface EmailParams {
  to: string;
  subject: string;
  text?: string;
  html: string;
}

// Function to send email
export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    if (!process.env.SENDGRID_API_KEY) {
      console.error('Could not send email: SENDGRID_API_KEY is not configured');
      return false;
    }

    await mailService.send({
      to: params.to,
      from: FROM_EMAIL,
      subject: params.subject,
      text: params.text || '',
      html: params.html,
    });
    
    console.log(`Email successfully sent to ${params.to}`);
    return true;
  } catch (error) {
    console.error('Error sending email with SendGrid:', error);
    return false;
  }
}

// Function to generate a secure random token
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

// Email template for account verification
export function getVerificationEmailTemplate(username: string, verificationLink: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #4a5568; text-align: center;">Account Verification</h2>
      <p>Hello <strong>${username}</strong>,</p>
      <p>Thank you for registering with AI Calendar. Please verify your account by clicking the link below:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${verificationLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Verify my account</a>
      </div>
      <p>If you didn't request this verification, you can ignore this email.</p>
      <p>Regards,<br>The AI Calendar Team</p>
    </div>
  `;
}

// Email template for password reset
export function getPasswordResetEmailTemplate(username: string, resetLink: string): string {
  return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
      <h2 style="color: #4a5568; text-align: center;">Password Reset</h2>
      <p>Hello <strong>${username}</strong>,</p>
      <p>We received a request to reset your password. Click the link below to create a new password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; font-weight: bold;">Reset my password</a>
      </div>
      <p>If you didn't request this reset, you can ignore this email. For security, this link will expire in 1 hour.</p>
      <p>Regards,<br>The AI Calendar Team</p>
    </div>
  `;
}