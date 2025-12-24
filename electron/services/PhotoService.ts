import { IpcMain, dialog } from "electron";
import log from "electron-log";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";
import { app } from "electron";
import { Photo } from "@electron/interface/Photo";
import { PhotoInput } from "@electron/interface/PhotoInput";
import { getDatabase } from "../database/connection";

export class PhotoService {
    private db = getDatabase();

    //get default save directory
    private getDefaultSaveDurectrory(): string {
        const userDataPath = app.getPath('userData');
        return path.join(userDataPath, 'photos');
    }

    //save a new photo
    async savePhoto(input: PhotoInput): Promise<any> {
        const photoId = uuidv4();
        const timestamp = new Date().toISOString();
        const dateFolder = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        try {
            //see if the directory to save photos exists
            const settingsRow = this.db.prepare("SELECT save_directory, photo_format, photo_quality FROM settings WHERE id = 1")
                .get() as any;

            let saveDirectory = settingsRow?.save_directory || this.getDefaultSaveDurectrory();
            const photoDir = path.join(saveDirectory, dateFolder);

            //ensure directory exists
            if (!fs.existsSync(photoDir)) {
                fs.mkdirSync(photoDir, { recursive: true });
            }

            //Gebnerate randomm filename
            const randomString = Math.random().toString(36).substring(2, 8);
            const format = settingsRow?.photo_format || 'jpg';
            const filename = `photo_${Date.now()}_${randomString}.${format}`;
            const filepath = path.join(photoDir, filename);
            const thumbnailPath = path.join(photoDir, `thumb_${filename}`);

            //Process and save the image using sharp
            let image = sharp(input.imageBuffer);
            const metaData = await image.metadata();

            await image
                .toFormat(format, { quality: settingsRow?.photo_quality || 80 })
                .toFile(filepath);

            // Generate thumbnail
            await sharp(input.imageBuffer)
                .resize(300, 300, { fit: 'cover' })
                .jpeg({ quality: 80 })
                .toFile(thumbnailPath);

            // Get file size
            const stats = fs.statSync(filepath);

            // Save to database
            const photo: Photo = {
                id: photoId,
                session_id: input.session_id,
                filename,
                filepath,
                thumbnail_path: thumbnailPath,
                width: metaData.width || 0,
                height: metaData.height || 0,
                file_size: stats.size,
                taken_at: timestamp,
                layout_type: input.layout_type || 'single',
                metadata: input.metadata ? JSON.stringify(input.metadata) : undefined,
            };

            this.db.prepare(`
        INSERT INTO photos (
          id, session_id, filename, filepath, thumbnail_path,
          width, height, file_size, taken_at, layout_type, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
                photo.id,
                photo.session_id || null,
                photo.filename,
                photo.filepath,
                photo.thumbnail_path,
                photo.width,
                photo.height,
                photo.file_size,
                photo.taken_at,
                photo.layout_type,
                photo.metadata || null
            );

            log.info(`Photo saved: ${photoId} at ${filepath}`);
            return photo;

        } catch (error: Error | any) {
            log.error('Error saving photo:', error);
            throw new Error(`Failed to save photo: ${error.message}`);
        }
    }

    async getAllPhotos(limit = 100, offset = 0): Promise<Photo[]> {
        try {
            const photos = this.db
                .prepare(`
                    SELECT * FROM photos 
                    ORDER BY taken_at DESC 
                    LIMIT ? OFFSET ?
                `)
                .all(limit, offset) as Photo[];

            return photos;
        } catch (error) {
            log.error('Error getting all photos:', error);
            throw error;
        }
    }

    /**
     * Get photo by ID
     */
    async getPhotoById(id: string): Promise<Photo | null> {
        try {
            const photo = this.db
                .prepare('SELECT * FROM photos WHERE id = ?')
                .get(id) as Photo | undefined;

            return photo || null;
        } catch (error) {
            log.error(`Error getting photo ${id}:`, error);
            throw error;
        }
    }

    /**
     * Delete a photo
     */
    async deletePhoto(id: string): Promise<boolean> {
        try {
            const photo = await this.getPhotoById(id);
            if (!photo) {
                throw new Error('Photo not found');
            }

            // Delete files
            if (fs.existsSync(photo.filepath)) {
                fs.unlinkSync(photo.filepath);
            }
            if (photo.thumbnail_path && fs.existsSync(photo.thumbnail_path)) {
                fs.unlinkSync(photo.thumbnail_path);
            }

            // Delete from database
            this.db.prepare('DELETE FROM photos WHERE id = ?').run(id);

            log.info(`Photo deleted: ${id}`);
            return true;
        } catch (error) {
            log.error(`Error deleting photo ${id}:`, error);
            throw error;
        }
    }
}

