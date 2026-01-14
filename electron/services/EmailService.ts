import { getDatabase } from '../database/connection';
import log from 'electron-log';
import * as nodemailer from 'nodemailer';
import * as fs from 'fs';
import * as path from 'path';

export interface EmailConfig {
  id: number;
  smtp_host?: string;
  smtp_port?: number;
  smtp_secure: boolean;
  smtp_user?: string;
  smtp_password?: string;
  from_email?: string;
  from_name?: string;
  enabled: boolean;
}

export interface EmailOptions {
  to: string;
  subject: string;
  text?: string;
  html?: string;
  attachments?: Array<{
    filename: string;
    path: string;
  }>;
}

export class EmailService {
  private db = getDatabase();
  private transporter: nodemailer.Transporter | null = null;

  /**
   * Get email configuration
   */
  async getEmailConfig(): Promise<EmailConfig> {
    try {
      const config = this.db
        .prepare('SELECT * FROM email_config WHERE id = 1')
        .get() as EmailConfig | undefined;
      
      if (!config) {
        return await this.initializeEmailConfig();
      }
      
      return config;
    } catch (error) {
      log.error('Error getting email config:', error);
      throw error;
    }
  }

  /**
   * Update email configuration
   */
  async updateEmailConfig(updates: Partial<EmailConfig>): Promise<EmailConfig> {
    try {
      const updateFields: string[] = [];
      const values: any[] = [];

      Object.entries(updates).forEach(([key, value]) => {
        if (key !== 'id' && value !== undefined) {
          updateFields.push(`${key} = ?`);
          values.push(value);
        }
      });

      if (updateFields.length > 0) {
        values.push(1); // WHERE id = 1
        const query = `UPDATE email_config SET ${updateFields.join(', ')} WHERE id = ?`;
        this.db.prepare(query).run(...values);
      }

      // Reset transporter to apply new config
      this.transporter = null;

      log.info('Email config updated');
      return await this.getEmailConfig();
      
    } catch (error) {
      log.error('Error updating email config:', error);
      throw error;
    }
  }

  /**
   * Initialize default email configuration
   */
  private async initializeEmailConfig(): Promise<EmailConfig> {
    try {
      this.db.prepare(`
        INSERT OR REPLACE INTO email_config (
          id, smtp_host, smtp_port, smtp_secure, enabled
        ) VALUES (1, 'smtp.gmail.com', 587, 0, 0)
      `).run();

      return await this.getEmailConfig();
    } catch (error) {
      log.error('Error initializing email config:', error);
      throw error;
    }
  }

  /**
   * Initialize email transporter
   */
  private async getTransporter(): Promise<nodemailer.Transporter> {
    if (this.transporter) {
      return this.transporter;
    }

    const config = await this.getEmailConfig();
    
    if (!config.enabled || !config.smtp_host || !config.smtp_user || !config.smtp_password) {
      throw new Error('Email is not configured. Please configure SMTP settings.');
    }

    this.transporter = nodemailer.createTransport({
      host: config.smtp_host,
      port: config.smtp_port || 587,
      secure: config.smtp_secure,
      auth: {
        user: config.smtp_user,
        pass: config.smtp_password,
      },
    });

    return this.transporter;
  }

  /**
   * Send email with photo attachments
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      const config = await this.getEmailConfig();
      const transporter = await this.getTransporter();

      const mailOptions = {
        from: config.from_name 
          ? `"${config.from_name}" <${config.from_email}>`
          : config.from_email,
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html,
        attachments: options.attachments,
      };

      const info = await transporter.sendMail(mailOptions);
      
      log.info('Email sent:', info.messageId);
      return true;
      
    } catch (error: any) {
      log.error('Error sending email:', error);
      throw new Error(`Failed to send email: ${error.message}`);
    }
  }

  /**
   * Send photo via email
   */
  async sendPhoto(
    photoPath: string,
    toEmail: string,
    guestName?: string
  ): Promise<boolean> {
    try {
      const filename = path.basename(photoPath);
      
      const subject = `Your PhotoBooth Photo${guestName ? ` - ${guestName}` : ''}`;
      
      const html = `
        <html>
          <body style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>Your PhotoBooth Photo!</h2>
            ${guestName ? `<p>Hi ${guestName},</p>` : ''}
            <p>Thank you for using our PhotoBooth! Your photo is attached to this email.</p>
            <p>We hope you had a great time!</p>
            <br>
            <p style="color: #666;">Sent from PhotoBooth Pro</p>
          </body>
        </html>
      `;

      return await this.sendEmail({
        to: toEmail,
        subject,
        html,
        attachments: [
          {
            filename,
            path: photoPath,
          },
        ],
      });
      
    } catch (error: any) {
      log.error('Error sending photo email:', error);
      throw error;
    }
  }

  /**
   * Test email configuration
   */
  async testEmailConfig(): Promise<boolean> {
    try {
      const transporter = await this.getTransporter();
      await transporter.verify();
      log.info('Email configuration is valid');
      return true;
    } catch (error: any) {
      log.error('Email configuration test failed:', error);
      throw new Error(`Email test failed: ${error.message}`);
    }
  }
}