import { contextBridge, ipcRenderer, IpcRendererEvent } from 'electron';

// Define the API that will be exposed to the renderer process
const electronAPI = {
  // Photo APIs
  photo: {
    save: (photoData: {
      imageBuffer: ArrayBuffer;
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
    reset: () => ipcRenderer.invoke('settings:reset'),
    update: (settings: any) => ipcRenderer.invoke('settings:update', settings),
  },

  // File System APIs
  file: {
    selectDirectory: () => ipcRenderer.invoke('file:select-directory'),
  },

  // Template APIs
  template: {
    getAll: (activeOnly?: boolean) =>
      ipcRenderer.invoke('template:get-all', activeOnly),
    getById: (id: string) =>
      ipcRenderer.invoke('template:get-by-id', id),
    create: (templateData: any) =>
      ipcRenderer.invoke('template:create', templateData),
    update: (id: string, updates: any) =>
      ipcRenderer.invoke('template:update', id, updates),
    delete: (id: string) =>
      ipcRenderer.invoke('template:delete', id),
    apply: (photoId: string, templateId: string, customOverlays?: any) =>
      ipcRenderer.invoke('template:apply', photoId, templateId, customOverlays),
    initDefaults: () =>
      ipcRenderer.invoke('template:init-defaults'),
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