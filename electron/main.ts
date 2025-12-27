import { app, ipcMain, BrowserWindow, protocol, net } from 'electron';
import path from 'path';
import log from 'electron-log';
import { initializeDatabase } from './database/connection';
import { registerIPCHandlers } from './ipc/handlers';
import { pathToFileURL } from 'node:url';

//configure logging
log.transports.file.level = 'info';
log.transports.console.level = 'debug';

let mainWindow: BrowserWindow | null = null;

const isDevelopment = !app.isPackaged;
const VITE_DEV_SERVER_URL = 'http://localhost:5173';

// 1. MUST be called at the top level, before app is ready
protocol.registerSchemesAsPrivileged([
    {
        scheme: 'media',
        privileges: {
            standard: true,
            secure: true,
            supportFetchAPI: true
        }
    }
]);

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
            webSecurity: true // disabled for testing purpose , "true" in production,
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

        protocol.handle('media', (req) => {
            try {
                const { host, pathname } = new URL(req.url);

                // Match the host defined in your frontend
                if (host === 'local-resource') {
                    // Decode the path (handles spaces/special characters)
                    let decodedPath = decodeURIComponent(pathname);

                    // Windows fix: Remove leading slash (/C:/Users -> C:/Users)
                    if (process.platform === 'win32' && decodedPath.startsWith('/')) {
                        decodedPath = decodedPath.slice(1);
                    }

                    const pathToServe = path.normalize(decodedPath);

                    // Safety check: Ensure the path is absolute
                    if (!path.isAbsolute(pathToServe)) {
                        return new Response('Invalid Path', { status: 400 });
                    }

                    // Convert system path to file:// and fetch
                    return net.fetch(pathToFileURL(pathToServe).toString());
                }

                return new Response('Host Not Found', { status: 404 });
            } catch (err) {
                log.error('Media protocol error:', err);
                return new Response('Internal Error', { status: 500 });
            }
        });

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
// app.on('ready', initializeApp);
app.whenReady().then(() => {
    initializeApp();
});

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
