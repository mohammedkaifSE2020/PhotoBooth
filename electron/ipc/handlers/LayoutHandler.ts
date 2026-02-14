import { ipcMain } from 'electron';
import log from 'electron-log';
import { LayoutService } from '../../services/LayoutService';

export function registerLayoutHandlers(): void {
    const layoutService = new LayoutService();

    // Import frame
    ipcMain.handle('layout:import-frame', async (_, sourcePath: string, name: string) => {
        try {
            log.info('Importing frame asset...');
            return await layoutService.importFrame(sourcePath, name);
        } catch (error: any) {
            log.error('Error importing frame asset:', error);
            throw new Error(error.message);
        }
    });

    // Get all frames
    ipcMain.handle('layout:get-all-frames', async () => {
        try {
            return await layoutService.getAllFrames();
        } catch (error: any) {
            log.error('Error fetching frame assets:', error);
            throw new Error(error.message);
        }
    });

    // Save new layout
    ipcMain.handle('layout:save', async (_, data: any) => {
        try {
            log.info('Saving new layout configuration...');
            return await layoutService.saveLayout(data);
        } catch (error: any) {
            log.error('Error saving layout:', error);
            throw new Error(error.message);
        }
    });

    // Update existing layout
    ipcMain.handle('layout:update', async (_, id: string, updates: any) => {
        try {
            log.info(`Updating layout: ${id}`);
            return await layoutService.updateLayout(id, updates);
        } catch (error: any) {
            log.error(`Error updating layout ${id}:`, error);
            throw new Error(error.message);
        }
    });

    // Delete layout
    ipcMain.handle('layout:delete', async (_, id: string) => {
        try {
            log.info(`Deleting layout: ${id}`);
            return await layoutService.deleteLayout(id);
        } catch (error: any) {
            log.error(`Error deleting layout ${id}:`, error);
            throw new Error(error.message);
        }
    });

    // Delete frame asset
    ipcMain.handle('layout:delete-frame', async (_, id: string) => {
        try {
            log.info(`Deleting frame asset: ${id}`);
            return await layoutService.deleteFrame(id);
        } catch (error: any) {
            log.error(`Error deleting frame asset ${id}:`, error);
            throw new Error(error.message);
        }
    });
}