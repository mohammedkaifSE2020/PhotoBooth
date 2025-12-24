"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsService = void 0;
const connection_1 = require("../database/connection");
const electron_log_1 = __importDefault(require("electron-log"));
const electron_1 = require("electron");
const path = __importStar(require("path"));
class SettingsService {
    constructor() {
        this.db = (0, connection_1.getDatabase)();
    }
    /**
     * Get current settings
     */
    async getSettings() {
        try {
            const settings = this.db
                .prepare('SELECT * FROM settings WHERE id = 1')
                .get();
            if (!settings) {
                // Initialize default settings if not exists
                return await this.initializeDefaultSettings();
            }
            return settings;
        }
        catch (error) {
            electron_log_1.default.error('Error getting settings:', error);
            throw error;
        }
    }
    /**
     * Update settings
     */
    async updateSettings(updates) {
        try {
            const currentSettings = await this.getSettings();
            const timestamp = new Date().toISOString();
            // Build update query dynamically
            const updateFields = [];
            const values = [];
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
            electron_log_1.default.info('Settings updated:', updates);
            return await this.getSettings();
        }
        catch (error) {
            electron_log_1.default.error('Error updating settings:', error);
            throw error;
        }
    }
    /**
     * Reset to default settings
     */
    async resetSettings() {
        try {
            const userDataPath = electron_1.app.getPath('userData');
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
            electron_log_1.default.info('Settings reset to defaults');
            return await this.getSettings();
        }
        catch (error) {
            electron_log_1.default.error('Error resetting settings:', error);
            throw error;
        }
    }
    /**
     * Initialize default settings
     */
    async initializeDefaultSettings() {
        try {
            const userDataPath = electron_1.app.getPath('userData');
            const defaultSaveDir = path.join(userDataPath, 'photos');
            const timestamp = new Date().toISOString();
            this.db.prepare(`
        INSERT OR REPLACE INTO settings (
          id, resolution, countdown_duration, enable_flash, enable_sound,
          save_directory, photo_format, photo_quality, created_at, updated_at
        ) VALUES (1, '1920x1080', 3, 1, 1, ?, 'jpg', 95, ?, ?)
      `).run(defaultSaveDir, timestamp, timestamp);
            electron_log_1.default.info('Default settings initialized');
            return await this.getSettings();
        }
        catch (error) {
            electron_log_1.default.error('Error initializing default settings:', error);
            throw error;
        }
    }
}
exports.SettingsService = SettingsService;
//# sourceMappingURL=SettingsService.js.map