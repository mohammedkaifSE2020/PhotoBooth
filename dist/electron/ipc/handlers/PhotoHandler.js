"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerPhotoHandlers = registerPhotoHandlers;
const electron_1 = require("electron");
const electron_log_1 = __importDefault(require("electron-log"));
const PhotoService_1 = require("../../services/PhotoService");
function registerPhotoHandlers() {
    // Initialize service
    const photoService = new PhotoService_1.PhotoService();
    // Save photo
    electron_1.ipcMain.handle('photo:save', async (_, photoData) => {
        try {
            electron_log_1.default.info('Saving photo...');
            return await photoService.savePhoto(photoData);
        }
        catch (error) {
            electron_log_1.default.error('Error saving photo:', error);
            throw new Error(error.message);
        }
    });
    // Get all photos
    electron_1.ipcMain.handle('photo:get-all', async (_, limit, offset) => {
        try {
            return await photoService.getAllPhotos(limit, offset);
        }
        catch (error) {
            electron_log_1.default.error('Error getting photos:', error);
            throw new Error(error.message);
        }
    });
    // Get photo by ID
    electron_1.ipcMain.handle('photo:get-by-id', async (_, id) => {
        try {
            return await photoService.getPhotoById(id);
        }
        catch (error) {
            electron_log_1.default.error(`Error getting photo ${id}:`, error);
            throw new Error(error.message);
        }
    });
    // Delete photo
    electron_1.ipcMain.handle('photo:delete', async (_, id) => {
        try {
            return await photoService.deletePhoto(id);
        }
        catch (error) {
            electron_log_1.default.error(`Error deleting photo ${id}:`, error);
            throw new Error(error.message);
        }
    });
    electron_log_1.default.info('Photo IPC handlers registered');
}
//# sourceMappingURL=PhotoHandler.js.map