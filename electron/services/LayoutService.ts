import { app } from "electron";
import log from "electron-log";
import path from "path";
import fs from "fs";
import { v4 as uuidv4 } from "uuid";
import sharp from "sharp";
import { getDatabase } from "../database/connection";

export class LayoutService {
    private db = getDatabase();

    private getFramesDirectory(): string {
        const userDataPath = app.getPath('userData');
        const framesDir = path.join(userDataPath, 'frames');
        if (!fs.existsSync(framesDir)) {
            fs.mkdirSync(framesDir, { recursive: true });
        }
        return framesDir;
    }

    // --- FRAME ASSET OPERATIONS ---

    /**
     * Imports a PNG/JPG frame from a local directory into the app's internal storage
     */
    async importFrame(sourcePath: string, name: string): Promise<any> {
        const id = uuidv4();
        const framesDir = this.getFramesDirectory();
        
        try {
            const extension = path.extname(sourcePath);
            const filename = `frame_${Date.now()}_${id}${extension}`;
            const targetPath = path.join(framesDir, filename);

            // Use sharp to get dimensions and validate the image
            const image = sharp(sourcePath);
            const metadata = await image.metadata();

            // Copy file to internal storage
            fs.copyFileSync(sourcePath, targetPath);

            const frameAsset = {
                id,
                name,
                filepath: targetPath,
                width: metadata.width || 0,
                height: metadata.height || 0,
                aspect_ratio: metadata.width && metadata.height ? (metadata.width / metadata.height) : 1
            };

            this.db.prepare(`
                INSERT INTO frame_assets (id, name, filepath, width, height, aspect_ratio)
                VALUES (?, ?, ?, ?, ?, ?)
            `).run(frameAsset.id, frameAsset.name, frameAsset.filepath, frameAsset.width, frameAsset.height, frameAsset.aspect_ratio);

            log.info(`Frame asset imported: ${id} at ${targetPath}`);
            return frameAsset;
        } catch (error) {
            log.error('Error importing frame:', error);
            throw error;
        }
    }

    async getAllFrames(): Promise<any[]> {
        return this.db.prepare("SELECT * FROM frame_assets ORDER BY created_at DESC").all();
    }

    // --- LAYOUT (WORKSPACE) OPERATIONS ---

    /**
     * Saves a new layout configuration (canvas size + photo positions)
     */
    async saveLayout(data: { 
        name: string, 
        canvas_width: number, 
        canvas_height: number, 
        frame_asset_id: string, 
        config_json: any 
    }): Promise<string> {
        const id = uuidv4();
        try {
            this.db.prepare(`
                INSERT INTO layouts (id, name, canvas_width, canvas_height, frame_asset_id, config_json)
                VALUES (?, ?, ?, ?, ?, ?)
            `).run(
                id, 
                data.name, 
                data.canvas_width, 
                data.canvas_height, 
                data.frame_asset_id, 
                JSON.stringify(data.config_json)
            );

            log.info(`Layout saved: ${id}`);
            return id;
        } catch (error) {
            log.error('Error saving layout:', error);
            throw error;
        }
    }

    //delete frame asset
    async deleteFrame(id: string): Promise<void> {
        try {
            const frame = this.db.prepare("SELECT * FROM frame_assets WHERE id = ?").get(id) as any;
            if (frame) {
                fs.unlinkSync(frame.filepath);
                this.db.prepare("DELETE FROM frame_assets WHERE id = ?").run(id);
                log.info(`Frame asset deleted: ${id}`);
            }
        } catch (error) {
            log.error('Error deleting frame asset:', error);
            throw error;
        }
    }

    /**
     * Updates an existing layout (e.g., after dragging borders or photos)
     */
    async updateLayout(id: string, updates: any): Promise<void> {
        try {
            const allowedUpdates = ['name', 'canvas_width', 'canvas_height', 'config_json'];
            const keys = Object.keys(updates).filter(k => allowedUpdates.includes(k));
            
            const setClause = keys.map(k => `${k} = ?`).join(', ');
            const values = keys.map(k => k === 'config_json' ? JSON.stringify(updates[k]) : updates[k]);

            if (keys.length === 0) return;

            this.db.prepare(`
                UPDATE layouts 
                SET ${setClause}, updated_at = CURRENT_TIMESTAMP 
                WHERE id = ?
            `).run(...values, id);

            log.info(`Layout updated: ${id}`);
        } catch (error) {
            log.error(`Error updating layout ${id}:`, error);
            throw error;
        }
    }

    async deleteLayout(id: string): Promise<void> {
        this.db.prepare("DELETE FROM layouts WHERE id = ?").run(id);
        log.info(`Layout deleted: ${id}`);
    }
}