"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerSettingsHandlers = registerSettingsHandlers;
const electron_1 = require("electron");
const electron_log_1 = __importDefault(require("electron-log"));
const SettingsService_1 = require("../../services/SettingsService");
function registerSettingsHandlers() {
    // Initialize service
    const settingsService = new SettingsService_1.SettingsService();
    // Get settings
    electron_1.ipcMain.handle('settings:get', async () => {
        try {
            return await settingsService.getSettings();
        }
        catch (error) {
            electron_log_1.default.error('Error getting settings:', error);
            throw new Error(error.message);
        }
    });
    // Update settings
    electron_1.ipcMain.handle('settings:update', async (_, settings) => {
        try {
            electron_log_1.default.info('Updating settings:', settings);
            return await settingsService.updateSettings(settings);
        }
        catch (error) {
            electron_log_1.default.error('Error updating settings:', error);
            throw new Error(error.message);
        }
    });
    // Reset settings
    electron_1.ipcMain.handle('settings:reset', async () => {
        try {
            return await settingsService.resetSettings();
        }
        catch (error) {
            electron_log_1.default.error('Error resetting settings:', error);
            throw new Error(error.message);
        }
    });
    electron_log_1.default.info('Settings IPC handlers registered');
}
//# sourceMappingURL=SettingsHandler.js.map