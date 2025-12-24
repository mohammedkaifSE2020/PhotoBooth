"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const electron_1 = require("electron");
// Define the API that will be exposed to the renderer process
const electronAPI = {
    // Photo APIs
    photo: {
        save: (photoData) => electron_1.ipcRenderer.invoke('photo:save', photoData),
        getAll: (limit, offset) => electron_1.ipcRenderer.invoke('photo:get-all', limit, offset),
        getById: (id) => electron_1.ipcRenderer.invoke('photo:get-by-id', id),
        delete: (id) => electron_1.ipcRenderer.invoke('photo:delete', id),
    },
    // Settings APIs
    settings: {
        get: () => electron_1.ipcRenderer.invoke('settings:get'),
        update: (settings) => electron_1.ipcRenderer.invoke('settings:update', settings),
    },
    // File System APIs
    file: {
        selectDirectory: () => electron_1.ipcRenderer.invoke('file:select-directory'),
    },
    // Event listeners
    on: (channel, callback) => {
        const subscription = (_event, ...args) => callback(...args);
        electron_1.ipcRenderer.on(channel, subscription);
        return () => {
            electron_1.ipcRenderer.removeListener(channel, subscription);
        };
    },
};
// Expose the API to the renderer process
electron_1.contextBridge.exposeInMainWorld('electronAPI', electronAPI);
//# sourceMappingURL=preload.js.map