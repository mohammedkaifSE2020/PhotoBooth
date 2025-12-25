import { getDatabase } from '../database/connection';
import log from 'electron-log';
import { app } from 'electron';
import * as path from 'path';
import { AppSettings } from '../interface/AppSettings';


export class SettingsService {
  private db = getDatabase();

  /**
   * Get current settings
   */
  async getSettings(): Promise<AppSettings> {
    try {
      const settings = this.db
        .prepare('SELECT * FROM settings WHERE id = 1')
        .get() as AppSettings | undefined;
      
      if (!settings) {
        // Initialize default settings if not exists
        return await this.initializeDefaultSettings();
      }
      
      return settings;
    } catch (error) {
      log.error('Error getting settings:', error);
      throw error;
    }
  }

  /**
   * Update settings
   */
  async updateSettings(updates: Partial<AppSettings>): Promise<AppSettings> {
    try {
      const currentSettings = await this.getSettings();
      const timestamp = new Date().toISOString();

      // Build update query dynamically
      const updateFields: string[] = [];
      const values: any[] = [];

      Object.entries(updates).forEach(([key, value]) => {
        if (key !== 'id' && key !== 'created_at' && value !== undefined) {
          updateFields.push(`${key} = ?`);
          values.push(value);
        }
      });

      if (updateFields.length === 0) {
        return currentSettings;
      }

      // Add updated_at
      updateFields.push('updated_at = ?');
      values.push(timestamp);
      values.push(1); // WHERE id = 1

      const query = `UPDATE settings SET ${updateFields.join(', ')} WHERE id = ?`;
      this.db.prepare(query).run(...values);

      log.info('Settings updated:', updates);
      return await this.getSettings();
      
    } catch (error) {
      log.error('Error updating settings:', error);
      throw error;
    }
  }

  /**
   * Reset to default settings
   */
  async resetSettings(): Promise<AppSettings> {
    try {
      const userDataPath = app.getPath('userData');
      const defaultSaveDir = path.join(userDataPath, 'photos');

      this.db.prepare(`
        UPDATE settings 
        SET 
          camera_device_id = NULL,
          resolution = '1920x1080',
          countdown_duration = 3,
          enable_flash = 1,
          enable_sound = 1,
          save_directory = ?,
          photo_format = 'jpg',
          photo_quality = 95,
          updated_at = ?
        WHERE id = 1
      `).run(defaultSaveDir, new Date().toISOString());

      log.info('Settings reset to defaults');
      return await this.getSettings();
      
    } catch (error) {
      log.error('Error resetting settings:', error);
      throw error;
    }
  }

  /**
   * Initialize default settings
   */
  private async initializeDefaultSettings(): Promise<AppSettings> {
    try {
      const userDataPath = app.getPath('userData');
      const defaultSaveDir = path.join(userDataPath, 'photos');
      const timestamp = new Date().toISOString();

      this.db.prepare(`
        INSERT OR REPLACE INTO settings (
          id, resolution, countdown_duration, enable_flash, enable_sound,
          save_directory, photo_format, photo_quality, created_at, updated_at
        ) VALUES (1, '1920x1080', 3, 1, 1, ?, 'jpg', 95, ?, ?)
      `).run(defaultSaveDir, timestamp, timestamp);

      log.info('Default settings initialized');
      return await this.getSettings();
      
    } catch (error) {
      log.error('Error initializing default settings:', error);
      throw error;
    }
  }
}
