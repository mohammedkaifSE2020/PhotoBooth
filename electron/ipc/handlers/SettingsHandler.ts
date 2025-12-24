import { ipcMain } from 'electron';
import log from 'electron-log';
import { SettingsService } from '../../services/SettingsService';


export function registerSettingsHandlers(): void {
  // Initialize service
  const settingsService = new SettingsService();
  
  // Get settings
  ipcMain.handle('settings:get', async () => {
    try {
      return await settingsService.getSettings();
    } catch (error: any) {
      log.error('Error getting settings:', error);
      throw new Error(error.message);
    }
  });

  // Update settings
  ipcMain.handle('settings:update', async (_, settings) => {
    try {
      log.info('Updating settings:', settings);
      return await settingsService.updateSettings(settings);
    } catch (error: any) {
      log.error('Error updating settings:', error);
      throw new Error(error.message);
    }
  });

  // Reset settings
  ipcMain.handle('settings:reset', async () => {
    try {
      return await settingsService.resetSettings();
    } catch (error: any) {
      log.error('Error resetting settings:', error);
      throw new Error(error.message);
    }
  });

  log.info('Settings IPC handlers registered');
}
