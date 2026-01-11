import { ipcMain } from 'electron';
import log from 'electron-log';
import { TemplateService } from '../../services/TemplateService';
import { PhotoService } from '../../services/PhotoService';

export function registerTemplateHandler(): void {
    const templateService = new TemplateService();
    const photoService = new PhotoService();

    ipcMain.handle('template:get-all', async () => {
        try {
            return await templateService.getAllTemplates();
        } catch (error: any) {
            log.error('Error getting templates:', error);
            throw new Error(error.message);
        }
    });

    ipcMain.handle('template:get-by-id', async (_, id: string) => {
        try {
            return await templateService.getTemplateById(id);
        } catch (error: any) {
            log.error(`Error getting template ${id}:`, error);
            throw new Error(error.message);
        }
    });

    ipcMain.handle('template:create', async (_, templateData) => {
        try {
            log.info('Creating template:', templateData.name);
            return await templateService.createTemplate(templateData);
        } catch (error: any) {
            log.error('Error creating template:', error);
            throw new Error(error.message);
        }
    });

    // Update template
    ipcMain.handle('template:update', async (_, id: string, updates) => {
        try {
            log.info(`Updating template ${id}`);
            return await templateService.updateTemplate(id, updates);
        } catch (error: any) {
            log.error(`Error updating template ${id}:`, error);
            throw new Error(error.message);
        }
    });

    ipcMain.handle('template:delete', async (_, id: string) => {
        try {
            return await templateService.deleteTemplate(id);
        } catch (error: any) {
            log.error(`Error deleting template ${id}:`, error);
            throw new Error(error.message);
        }
    });

    ipcMain.handle('template:apply', async (_, photoId: string, templateId: string, customOverlays) => {
        try {
            const photo = await photoService.getPhotoById(photoId);
            if (!photo) {
                throw new Error('Photo not found');
            }

            const compositeBuffer = await templateService.applyTemplateToPhoto(
                photo.filepath,
                templateId,
                customOverlays
            );

            // Save composite as new photo
            const newPhoto = await photoService.savePhoto({
                imageBuffer: compositeBuffer,
                layout_type: 'template',
                metadata: {
                    original_photo_id: photoId,
                    template_id: templateId,
                    custom_overlays: customOverlays,
                    created_at: new Date().toISOString(),
                },
            });

            return newPhoto;
        } catch (error: any) {
            log.error('Error applying template:', error);
            throw new Error(error.message);
        }
    });

    ipcMain.handle('template:init-defaults', async () => {
        try {
            await templateService.initializeDefaultTemplates();
            return { success: true };
        } catch (error: any) {
            log.error('Error initializing default templates:', error);
            throw new Error(error.message);
        }
    });

    log.info('Template handlers registered');

}