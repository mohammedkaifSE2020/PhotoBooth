import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

// Define the API that will be exposed to the renderer process
const electronAPI = {
  // Photo APIs
  photo: {
    save: (photoData: {
      imageBuffer: Buffer;
      session_id?: string;
      layout_type?: string;
      metadata?: Record<string, any>;
    }) => ipcRenderer.invoke('photo:save', photoData),
    
    getAll: (limit?: number, offset?: number) => 
      ipcRenderer.invoke('photo:get-all', limit, offset),
    
    getById: (id: string) => 
      ipcRenderer.invoke('photo:get-by-id', id),
    
    delete: (id: string) => 
      ipcRenderer.invoke('photo:delete', id),
  },

  // Settings APIs
  settings: {
    get: () => ipcRenderer.invoke('settings:get'),
    update: (settings: any) => ipcRenderer.invoke('settings:update', settings),
  },

  // File System APIs
  file: {
    selectDirectory: () => ipcRenderer.invoke('file:select-directory'),
  },

  // Event listeners
  on: (channel: string, callback: (...args: any[]) => void) => {
    const subscription = (_event: IpcRendererEvent, ...args: any[]) => 
      callback(...args);
    ipcRenderer.on(channel, subscription);
    
    return () => {
      ipcRenderer.removeListener(channel, subscription);
    };
  },
};

// Expose the API to the renderer process
contextBridge.exposeInMainWorld('electronAPI', electronAPI);

// Type definitions for TypeScript
export type ElectronAPI = typeof electronAPI;