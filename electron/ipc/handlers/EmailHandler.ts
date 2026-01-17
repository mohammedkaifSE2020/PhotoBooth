import { ipcMain } from "electron";
import log from "electron-log";
import { EmailService, EmailConfig, EmailOptions } from "../../services/EmailService";

export function registerEmailHandler(): void {
    const emailService = new EmailService();

    // Get email configuration
    ipcMain.handle('email:get-config', async () => {
        try {
            const config: EmailConfig = await emailService.getEmailConfig();
            return config;
        } catch (error) {
            log.error('Error getting email config:', error);
            throw error;
        }
    });

    // Update email configuration
    ipcMain.handle('email:update-config', async (_, updates: Partial<EmailConfig>) => {
        try {
            const updatedConfig: EmailConfig = await emailService.updateEmailConfig(updates);
            return updatedConfig;
        } catch (error) {
            log.error('Error updating email config:', error);
            throw error;
        }
    });

    // Send email with attachments
    ipcMain.handle('email:send', async (_, options: EmailOptions) => {
        try {
            const result: boolean = await emailService.sendEmail(options);
            return result;
        } catch (error) {
            log.error('Error sending email:', error);
            throw error;
        }
    });

    // Send photo via email
    ipcMain.handle('email:send-photo', async (_, photoPath: string, toEmail: string, guestName?: string) => {
        try {
            const result: boolean = await emailService.sendPhoto(photoPath, toEmail, guestName);
            return result;
        } catch (error) {
            log.error('Error sending photo email:', error);
            throw error;
        }
    });

    // Test email configuration
    ipcMain.handle('email:test-config', async () => {
        try {
            const result: boolean = await emailService.testEmailConfig();
            return result;
        } catch (error) {
            log.error('Error testing email config:', error);
            throw error;
        }
    });
}