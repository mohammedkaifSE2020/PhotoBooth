"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerIPCHandlers = registerIPCHandlers;
const electron_log_1 = __importDefault(require("electron-log"));
const PhotoHandler_1 = require("./PhotoHandler");
const SettingsHandler_1 = require("./SettingsHandler");
const FileHandler_1 = require("./FileHandler");
function registerIPCHandlers() {
    electron_log_1.default.info('Registering IPC handlers...');
    (0, PhotoHandler_1.registerPhotoHandlers)();
    (0, SettingsHandler_1.registerSettingsHandlers)();
    (0, FileHandler_1.registerFileHandlers)();
    electron_log_1.default.info('All IPC handlers registered successfully');
}
//# sourceMappingURL=index.js.map