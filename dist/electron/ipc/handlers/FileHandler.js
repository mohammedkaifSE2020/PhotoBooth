"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerFileHandlers = registerFileHandlers;
const electron_1 = require("electron");
const electron_log_1 = __importDefault(require("electron-log"));
function registerFileHandlers() {
    electron_1.ipcMain.handle('file:select-directory', async () => {
        try {
            const result = await electron_1.dialog.showOpenDialog({
                properties: ['openDirectory', 'createDirectory'],
                title: 'Select Photo Save Directory',
            });
            if (result.canceled || result.filePaths.length === 0) {
                return null;
            }
            return result.filePaths[0];
        }
        catch (error) {
            electron_log_1.default.error('Error selecting directory:', error);
            throw new Error(error.message);
        }
    });
    electron_log_1.default.info('File IPC handlers registered');
}
//# sourceMappingURL=FileHandler.js.map