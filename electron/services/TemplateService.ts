import { getDatabase } from '../database/connection';
import { v4 as uuidv4 } from 'uuid';
import * as path from 'path';
import * as fs from 'fs';
import sharp from 'sharp';
import log from 'electron-log';
import { app } from 'electron';

export interface TextOverlay {
    id: string;
    text: string;
    x: number;
    y: number;
    fontSize: number;
    color: string;
    fontFamily: string;
    align: 'left' | 'center' | 'right';
    rotation?: number;
}

export interface Template {
    id: string;
    name: string;
    description?: string;
    layout_type: string;
    frame_path?: string;
    background_color: string;
    width: number;
    height: number;
    text_overlays?: string;
    is_default: boolean;
    is_active: boolean;
    thumbnail_path?: string;
    created_at: string;
    updated_at: string;
}

export interface TemplateInput {
    name: string;
    description?: string;
    layout_type: string;
    frame_path?: string;
    background_color?: string;
    width?: number;
    height?: number;
    text_overlays?: TextOverlay[];
    is_default?: boolean;
}

export class TemplateService {
    private db = getDatabase();

    //create a directory to store the templates
    private getTemplateDirectory(): string {
        const userDataPath = app.getPath('userData');
        const templateDir = path.join(userDataPath, 'templates');

        if (!fs.existsSync(templateDir)) {
            fs.mkdirSync(templateDir, { recursive: true });
        }
        return templateDir
    }

    //add a new template
    async createTemplate(input: TemplateInput): Promise<Template> {
        const templateId = uuidv4();
        const timestamp = new Date().toISOString();

        try {
            const template: Template = {
                id: templateId,
                name: input.name,
                description: input.description,
                layout_type: input.layout_type,
                frame_path: input.frame_path,
                background_color: input.background_color || '#ffffff',
                width: input.width || 1800,
                height: input.height || 1200,
                text_overlays: input.text_overlays ? JSON.stringify(input.text_overlays) : undefined,
                is_default: input.is_default || false,
                is_active: true,
                created_at: timestamp,
                updated_at: timestamp,
            }

            //save the template to the database
            this.db.prepare(`
        INSERT INTO templates (
          id, name, description, layout_type, frame_path,
          background_color, width, height, text_overlays,
          is_default, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
                template.id,
                template.name,
                template.description || null,
                template.layout_type,
                template.frame_path || null,
                template.background_color,
                template.width,
                template.height,
                template.text_overlays || null,
                template.is_default ? 1 : 0,
                template.is_active ? 1 : 0,
                template.created_at,
                template.updated_at
            );

            log.info(`Template created: ${templateId}`);
            return template;
        } catch (error: Error | any) {
            log.error('Error creating template:', error);
            throw new Error(`Failed to create template: ${error.message}`);
        }
    }

    //get all Templates
    async getAllTemplates(activeOnly = true): Promise<Template[]> {
        try {
            const query = activeOnly
                ? 'SELECT * FROM templates WHERE is_active = 1 ORDER BY is_default DESC, created_at DESC'
                : 'SELECT * FROM templates ORDER BY created_at DESC';
            const templates = this.db.prepare(query).all() as Template[];
            return templates;
        } catch (error: Error | any) {
            log.error('Error fetching templates:', error);
            throw new Error(`Failed to fetch templates: ${error.message}`);
        }
    }

    //get Template by id
    async getTemplateById(templateId: string): Promise<Template | null> {
        try {
            const template: Template | any = this.db.prepare(`SELECT * FROM TEMPLATES WHERE ID = ?`).get(templateId);
            return template || null;
        } catch (error) {
            log.error(`Error getting template ${templateId}:`, error);
            throw error;
        }
    }

    //delete a template
    async deleteTemplate(id: string): Promise<boolean> {
        try {
            this.db.prepare('DELETE FROM templates WHERE id = ?').run(id);
            log.info(`Template deleted: ${id}`);
            return true;
        } catch (error) {
            log.error(`Error deleting template ${id}:`, error);
            throw error;
        }
    }

    //update a template
    async updateTemplate(id: string, updates: Partial<TemplateInput>): Promise<Template> {
        try {
            const timestamp = new Date().toISOString();

            const updateFields: string[] = [];
            const values: any[] = [];

            Object.entries(updates).forEach(([key, value]) => {
                if (value !== undefined) {
                    if (key === 'text_overlays') {
                        updateFields.push(`${key} = ?`);
                        values.push(JSON.stringify(value));
                    } else {
                        updateFields.push(`${key} = ?`);
                        values.push(value);
                    }
                }
            });

            if (updateFields.length === 0) {
                return (await this.getTemplateById(id))!;
            }

            updateFields.push('updated_at = ?');
            values.push(timestamp);
            values.push(id);

            const query = `UPDATE templates SET ${updateFields.join(', ')} WHERE id = ?`;
            this.db.prepare(query).run(...values);

            log.info(`Template updated: ${id}`);
            return (await this.getTemplateById(id))!;

        } catch (error) {
            log.error(`Error updating template ${id}:`, error);
            throw error;
        }
    }

    async applyTemplateToPhoto(
        photoPath: string,
        templateId: string,
        customOverlays?: { guestName?: string; eventDate?: string; customText?: string }
    ): Promise<Buffer> {
        try {
            const template = await this.getTemplateById(templateId);
            if (!template) {
                throw new Error('Template not found');
            }

            // Load the photo
            let composite = sharp(photoPath);
            const metadata = await composite.metadata();

            // Resize to template dimensions
            composite = composite.resize(template.width, template.height, {
                fit: 'cover',
                position: 'center',
            });

            // Create a canvas for drawing text overlays
            const canvas = await this.createCanvasWithOverlays(
                template,
                customOverlays
            );

            // Composite the overlays onto the photo
            const layers: sharp.OverlayOptions[] = [];

            // Add frame if exists
            if (template.frame_path && fs.existsSync(template.frame_path)) {
                layers.push({
                    input: template.frame_path,
                    gravity: 'center',
                });
            }

            // Add text overlay canvas
            if (canvas) {
                layers.push({
                    input: canvas,
                    gravity: 'center',
                });
            }

            if (layers.length > 0) {
                composite = composite.composite(layers);
            }

            return await composite.jpeg({ quality: 95 }).toBuffer();

        } catch (error: any) {
            log.error('Error applying template:', error);
            throw new Error(`Failed to apply template: ${error.message}`);
        }
    }

    private async createCanvasWithOverlays(
        template: Template,
        customOverlays?: { guestName?: string; eventDate?: string; customText?: string }
    ): Promise<Buffer | null> {
        try {
            const overlays: TextOverlay[] = template.text_overlays
                ? JSON.parse(template.text_overlays)
                : [];

            if (overlays.length === 0 && !customOverlays) {
                return null;
            }

            // Build SVG with text elements
            let svgContent = `
        <svg width="${template.width}" height="${template.height}" xmlns="http://www.w3.org/2000/svg">
      `;

            // Add configured overlays
            for (const overlay of overlays) {
                let text = overlay.text;

                // Replace placeholders
                if (customOverlays) {
                    text = text
                        .replace('{{guestName}}', customOverlays.guestName || '')
                        .replace('{{eventDate}}', customOverlays.eventDate || '')
                        .replace('{{customText}}', customOverlays.customText || '');
                }

                const textAnchor = overlay.align === 'center' ? 'middle' : overlay.align === 'right' ? 'end' : 'start';

                svgContent += `
          <text
            x="${overlay.x}"
            y="${overlay.y}"
            font-family="${overlay.fontFamily}"
            font-size="${overlay.fontSize}"
            fill="${overlay.color}"
            text-anchor="${textAnchor}"
            ${overlay.rotation ? `transform="rotate(${overlay.rotation} ${overlay.x} ${overlay.y})"` : ''}
          >
            ${this.escapeXml(text)}
          </text>
        `;
            }

            svgContent += '</svg>';

            return Buffer.from(svgContent);

        } catch (error: any) {
            log.error('Error creating overlay canvas:', error);
            throw error;
        }
    }

    /**
     * Escape XML special characters
     */
    private escapeXml(text: string): string {
        return text
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&apos;');
    }

    /**
     * Initialize default templates
     */
    async initializeDefaultTemplates(): Promise<void> {
        try {
            const existing = await this.getAllTemplates(false);
            if (existing.length > 0) {
                log.info('Default templates already exist');
                return;
            }

            // Create default templates
            const defaultTemplates: TemplateInput[] = [
                {
                    name: 'Classic Single',
                    description: 'Simple single photo with date overlay',
                    layout_type: 'single',
                    background_color: '#ffffff',
                    width: 1800,
                    height: 1200,
                    text_overlays: [
                        {
                            id: 'date',
                            text: '{{eventDate}}',
                            x: 900,
                            y: 1150,
                            fontSize: 36,
                            fontFamily: 'Arial',
                            color: '#666666',
                            align: 'center',
                        },
                    ],
                    is_default: true,
                },
                {
                    name: 'Photo Strip',
                    description: 'Vertical photo strip with branding',
                    layout_type: 'strip-4',
                    background_color: '#ffffff',
                    width: 600,
                    height: 1800,
                    text_overlays: [
                        {
                            id: 'branding',
                            text: 'PhotoBooth Pro',
                            x: 300,
                            y: 1750,
                            fontSize: 24,
                            fontFamily: 'Arial',
                            color: '#999999',
                            align: 'center',
                        },
                        {
                            id: 'guest',
                            text: '{{guestName}}',
                            x: 300,
                            y: 50,
                            fontSize: 32,
                            fontFamily: 'Arial',
                            color: '#333333',
                            align: 'center',
                        },
                    ],
                    is_default: true,
                },
            ];

            for (const template of defaultTemplates) {
                await this.createTemplate(template);
            }

            log.info('Default templates initialized');

        } catch (error) {
            log.error('Error initializing default templates:', error);
        }
    }
}