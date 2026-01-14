import log from "electron-log";
import { getDatabase } from "../database/connection";
import { v4 as uuidv4 } from 'uuid';

import * as fs from 'fs';
import * as path from 'path';
import * as archiver from 'archiver';

export interface Session {
    id: string;
    name?: string;
    started_at: string;
    ended_at?: string;
    photo_count: number;
    status: 'active' | 'completed' | 'cancelled';
}

export interface SessionExportOptions {
    format: 'zip' | 'folder';
    includeOriginals: boolean;
    includeProcessed: boolean;
    destination: string;
}

export class SessionService {
    private db = getDatabase();

    //create a new session
    async createSession(name?: string): Promise<Session> {
        const id: string = uuidv4();
        const started_at = new Date().toISOString();
        const photo_count = 0;
        const status: Session['status'] = 'active';

        try {
            const session: Session = {
                id: id,
                name: name || `Session ${new Date().toLocaleString()}`,
                started_at,
                photo_count,
                status
            };

            this.db.prepare(`INSERT INTO sessions (id, name, started_at, photo_count, status) VALUES (?, ?, ?, ?, ?)`).run(
                session.id,
                session.name,
                session.started_at,
                session.photo_count,
                session.status
            );

            log.info(`Session created: ${id}`);
            return session;
        } catch (error: Error | any) {
            log.error('Error creating session:', error);
            throw new Error(`Failed to create session: ${error.message}`);
        }
    }

    //get Active session on create one
    async getActiveSession(): Promise<Session> {
        try {
            const activeSession = this.db
                .prepare('SELECT * FROM sessions WHERE status = ? ORDER BY started_at DESC LIMIT 1')
                .get('active') as Session | undefined;

            if (activeSession) {
                return activeSession;
            }

            return this.createSession();
        } catch (error) {
            log.error('Error getting active session:', error);
            throw error;
        }
    }

    //Get all sessions
    async getAllSessions(): Promise<Session[]> {
        try {
            const sessions = this.db.prepare('SELECT * FROM sessions ORDER BY started_at DESC').all() as Session[];
            if (sessions.length === 0) {
                log.info('No sessions found in the database.');
                return [];
            }
            return sessions;
        } catch (error) {
            log.error('Error getting all sessions:', error);
            throw error;
        }
    }

    //get Sesisoin by ID
    async getSessionById(id: string): Promise<Session | null> {
        try {
            const session = this.db.prepare('SELECT * FROM sessions WHERE id = ?').get(id) as Session | undefined;
            return session || null;
        } catch (error) {
            log.error(`Error getting session by ID (${id}):`, error);
            throw error;
        }
    }

    //End Session
    async endSession(id: string): Promise<void> {
        try {
            const ended_at = new Date().toISOString();
            this.db.prepare(`UPDATE sessions SET ended_at = ?, status = ? WHERE id = ?`).run(ended_at, 'completed', id);
        } catch (error) {
            log.error(`Error ending session (${id}):`, error);
            throw error;
        }
    }

    //Update session photo count
    async updatePhotoCount(sessionId: string): Promise<void> {
        try {
            const count = this.db
                .prepare('SELECT COUNT(*) as count FROM photos WHERE session_id = ?')
                .get(sessionId) as { count: number };

            this.db.prepare('UPDATE sessions SET photo_count = ? WHERE id = ?')
                .run(count.count, sessionId);

        } catch (error) {
            log.error(`Error updating photo count for session ${sessionId}:`, error);
            throw error;
        }
    }

    //export session photos
    async exportSessionPhotos(sessionId: string, options: SessionExportOptions): Promise<string> {
        try {
            const session = await this.getSessionById(sessionId);
            if (!session) {
                throw new Error('Session not found');
            }

            //get all photos for the session
            const photos = this.db
                .prepare('SELECT * FROM photos WHERE session_id = ? ORDER BY taken_at ASC')
                .all(sessionId) as any[];

            if (photos.length === 0) {
                throw new Error('No photos in session');
            }

            // Create export directory
            const exportDir = path.join(options.destination, `session_${sessionId}_${Date.now()}`);

            if (options.format === 'folder') {
                // Export as folder
                if (!fs.existsSync(exportDir)) {
                    fs.mkdirSync(exportDir, { recursive: true });
                }

                for (const photo of photos) {
                    const destPath = path.join(exportDir, path.basename(photo.filepath));
                    fs.copyFileSync(photo.filepath, destPath);
                }

                log.info(`Session exported to folder: ${exportDir}`);
                return exportDir;

            } else {
                // Export as ZIP
                const zipPath = `${exportDir}.zip`;

                await this.createZipArchive(photos, zipPath);

                log.info(`Session exported to ZIP: ${zipPath}`);
                return zipPath;
            }
        } catch (error: Error | any) {
            log.error(`Error exporting session ${sessionId}:`, error);
            throw new Error(`Failed to export session: ${error.message}`);
        }
    }

    private async createZipArchive(photos: any[], zipPath: string): Promise<void> {
        return new Promise((resolve, reject) => {
            const output = fs.createWriteStream(zipPath);
            const archive = archiver.create('zip', { zlib: { level: 9 } });

            output.on('close', () => {
                log.info(`ZIP created: ${archive.pointer()} bytes`);
                resolve();
            });

            archive.on('error', (err: Error) => {
                log.error('Archive error:', err);
                reject(err);
            });

            archive.pipe(output);

            // Add photos to archive
            for (const photo of photos) {
                if (fs.existsSync(photo.filepath)) {
                    archive.file(photo.filepath, { name: path.basename(photo.filepath) });
                }
            }

            archive.finalize();
        });
    }

    async deleteSession(id: string): Promise<boolean> {
        try {
            // Get photos to delete files
            const photos = this.db
                .prepare('SELECT * FROM photos WHERE session_id = ?')
                .all(id) as any[];

            // Delete photo files
            for (const photo of photos) {
                if (fs.existsSync(photo.filepath)) {
                    fs.unlinkSync(photo.filepath);
                }
                if (photo.thumbnail_path && fs.existsSync(photo.thumbnail_path)) {
                    fs.unlinkSync(photo.thumbnail_path);
                }
            }

            // Delete from database (cascade will handle photos)
            this.db.prepare('DELETE FROM sessions WHERE id = ?').run(id);

            log.info(`Session deleted: ${id}`);
            return true;

        } catch (error) {
            log.error(`Error deleting session ${id}:`, error);
            throw error;
        }
    }

    async getSessionStats(id: string): Promise<{
        photoCount: number;
        duration: number;
        avgPhotosPerMinute: number;
    }> {
        try {
            const session = await this.getSessionById(id);
            if (!session) {
                throw new Error('Session not found');
            }

            const photoCount = session.photo_count;

            const endTime = session.ended_at
                ? new Date(session.ended_at).getTime()
                : Date.now();
            const startTime = new Date(session.started_at).getTime();
            const duration = (endTime - startTime) / 1000; // seconds

            const avgPhotosPerMinute = duration > 0
                ? (photoCount / duration) * 60
                : 0;

            return {
                photoCount,
                duration,
                avgPhotosPerMinute,
            };

        } catch (error) {
            log.error(`Error getting session stats for ${id}:`, error);
            throw error;
        }
    }

}