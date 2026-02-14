import { ipcMain, dialog } from 'electron';
import log from 'electron-log';

export function registerFileHandlers(): void {
  ipcMain.handle('file:select-directory', async () => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openDirectory', 'createDirectory'],
        title: 'Select Photo Save Directory',
      });

      if (result.canceled || result.filePaths.length === 0) {
        return null;
      }

      return result.filePaths[0];
    } catch (error: any) {
      log.error('Error selecting directory:', error);
      throw new Error(error.message);
    }
  });

  ipcMain.handle('file:select-image', async () => {
    try {
      const result = await dialog.showOpenDialog({
        properties: ['openFile'],
        title: 'Select Photo Frame',
        filters: [
          { name: 'Images', extensions: ['png', 'jpg', 'jpeg', 'webp'] }
        ]
      });

      if (result.canceled || result.filePaths.length === 0) {
        return null;
      }

      return result.filePaths[0]; // Returns the full local path
    } catch (error: any) {
      log.error('Error selecting file:', error);
      throw new Error(error.message);
    }
  });

  log.info('File IPC handlers registered');
}
