import { app, ipcMain, BrowserWindow } from 'electron';
import path from 'path';
import log from 'electron-log';
import { initializeDatabase } from './database/connection';
import { registerIPCHandlers } from './ipc/handlers';

//configure logging
log.transports.file.level = 'info';
log.transports.console.level = 'debug';

let mainWindow: BrowserWindow | null = null;

const isDevelopment = !app.isPackaged;
const VITE_DEV_SERVER_URL = 'http://localhost:5173';

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1280,
        height: 800,
        minWidth: 1024,
        minHeight: 768,
        title: 'PhotoBooth Pro',
        backgroundColor: '#1a1a1a',
        show: false, // Don't show until ready
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false, // Security best practice
            contextIsolation: true, // Security best practice
            sandbox: false, // Needed for some native modules
            webSecurity: true,
        },
    })


    //load the app
    if (isDevelopment && mainWindow !== null) {
        mainWindow.loadURL(VITE_DEV_SERVER_URL);
        mainWindow.webContents.openDevTools();
    } else {
        mainWindow.loadFile(
            path.join(__dirname, '../../dist/renderer/index.html')
        );

    }

    //show window when ready
    mainWindow.once('ready-to-show', () => {
        mainWindow?.show();
        log.info('Application window is ready to show.');
    });

    mainWindow.on('closed', () => {
        mainWindow = null;
    });

    //handle navigation securely
    mainWindow.webContents.on('will-navigate', (event, url) => {
        const allowedOrigins = [VITE_DEV_SERVER_URL];
        const urlOrigin = new URL(url).origin;

        if (!allowedOrigins.includes(urlOrigin)) {
            event.preventDefault();
            log.warn(`Navigation blocked to: ${url}`);
        }
    });
}

async function initializeApp() {
    try {
        log.info('Initializing PhotoBooth application...');

        // Initialize database
        await initializeDatabase();
        log.info('Database initialized');

        // Register all IPC handlers
        registerIPCHandlers();
        log.info('IPC handlers registered');

        // Create main window
        createWindow();
    } catch (error) {
        log.error('Failed to initialize application:', error);
        app.quit();
    }
}

// App lifecycle events
app.on('ready', initializeApp);

app.on('window-all-closed', () => {
    // On macOS, keep app running until user quits explicitly
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('activate', () => {
    // On macOS, recreate window when dock icon is clicked
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
    log.error('Uncaught exception:', error);
});

process.on('unhandledRejection', (reason, promise) => {
    log.error('Unhandled rejection at:', promise, 'reason:', reason);
});

// Cleanup on quit
app.on('before-quit', async () => {
    log.info('Application shutting down...');
    // Cleanup resources here (close database, save state, etc.)
});

export { mainWindow };
