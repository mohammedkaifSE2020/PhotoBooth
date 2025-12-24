import { ipcMain } from 'electron';
import log from 'electron-log';
import { PhotoService } from '../../services/PhotoService';



export function registerPhotoHandlers(): void {

  // Initialize service
  const photoService = new PhotoService();
  
  // Save photo
  ipcMain.handle('photo:save', async (_, photoData) => {
    try {
      log.info('Saving photo...');
      return await photoService.savePhoto(photoData);
    } catch (error: any) {
      log.error('Error saving photo:', error);
      throw new Error(error.message);
    }
  });

  // Get all photos
  ipcMain.handle('photo:get-all', async (_, limit?: number, offset?: number) => {
    try {
      return await photoService.getAllPhotos(limit, offset);
    } catch (error: any) {
      log.error('Error getting photos:', error);
      throw new Error(error.message);
    }
  });

  // Get photo by ID
  ipcMain.handle('photo:get-by-id', async (_, id: string) => {
    try {
      return await photoService.getPhotoById(id);
    } catch (error: any) {
      log.error(`Error getting photo ${id}:`, error);
      throw new Error(error.message);
    }
  });

  // Delete photo
  ipcMain.handle('photo:delete', async (_, id: string) => {
    try {
      return await photoService.deletePhoto(id);
    } catch (error: any) {
      log.error(`Error deleting photo ${id}:`, error);
      throw new Error(error.message);
    }
  });

  log.info('Photo IPC handlers registered');
}
