"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.mainWindow = void 0;
const electron_1 = require("electron");
const path_1 = __importDefault(require("path"));
const electron_log_1 = __importDefault(require("electron-log"));
const connection_1 = require("./database/connection");
const handlers_1 = require("./ipc/handlers");
//configure logging
electron_log_1.default.transports.file.level = 'info';
electron_log_1.default.transports.console.level = 'debug';
let mainWindow = null;
exports.mainWindow = mainWindow;
const isDevelopment = !electron_1.app.isPackaged;
const VITE_DEV_SERVER_URL = 'http://localhost:5173';
function createWindow() {
    exports.mainWindow = mainWindow = new electron_1.BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 1024,
        minHeight: 768,
        title: 'PhotoBooth Pro',
        backgroundColor: '#1a1a1a',
        show: false, // Don't show until ready
        webPreferences: {
            preload: path_1.default.join(__dirname, 'preload.js'),
            nodeIntegration: false, // Security best practice
            contextIsolation: true, // Security best practice
            sandbox: false, // Needed for some native modules
            webSecurity: true,
        },
    });
    //load the app
    if (isDevelopment && mainWindow !== null) {
        mainWindow.loadURL(VITE_DEV_SERVER_URL);
        mainWindow.webContents.openDevTools();
    }
    else {
        mainWindow.loadFile(path_1.default.join(__dirname, '../../dist/renderer/index.html'));
    }
    //show window when ready
    mainWindow.once('ready-to-show', () => {
        mainWindow?.show();
        electron_log_1.default.info('Application window is ready to show.');
    });
    mainWindow.on('closed', () => {
        exports.mainWindow = mainWindow = null;
    });
    //handle navigation securely
    mainWindow.webContents.on('will-navigate', (event, url) => {
        const allowedOrigins = [VITE_DEV_SERVER_URL];
        const urlOrigin = new URL(url).origin;
        if (!allowedOrigins.includes(urlOrigin)) {
            event.preventDefault();
            electron_log_1.default.warn(`Navigation blocked to: ${url}`);
        }
    });
}
async function initializeApp() {
    try {
        electron_log_1.default.info('Initializing PhotoBooth application...');
        // Initialize database
        await (0, connection_1.initializeDatabase)();
        electron_log_1.default.info('Database initialized');
        // Register all IPC handlers
        (0, handlers_1.registerIPCHandlers)();
        electron_log_1.default.info('IPC handlers registered');
        // Create main window
        createWindow();
    }
    catch (error) {
        electron_log_1.default.error('Failed to initialize application:', error);
        electron_1.app.quit();
    }
}
// App lifecycle events
electron_1.app.on('ready', initializeApp);
electron_1.app.on('window-all-closed', () => {
    // On macOS, keep app running until user quits explicitly
    if (process.platform !== 'darwin') {
        electron_1.app.quit();
    }
});
electron_1.app.on('activate', () => {
    // On macOS, recreate window when dock icon is clicked
    if (electron_1.BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});
// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    electron_log_1.default.error('Uncaught exception:', error);
});
process.on('unhandledRejection', (reason, promise) => {
    electron_log_1.default.error('Unhandled rejection at:', promise, 'reason:', reason);
});
// Cleanup on quit
electron_1.app.on('before-quit', async () => {
    electron_log_1.default.info('Application shutting down...');
    // Cleanup resources here (close database, save state, etc.)
});
//# sourceMappingURL=main.js.map