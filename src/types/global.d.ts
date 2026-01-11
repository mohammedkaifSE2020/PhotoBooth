// src/types/electron.d.ts

export {};

declare global {
  interface ElectronAPI {
    photo: {
      save: (photoData: {
        imageBuffer: ArrayBuffer; // IMPORTANT: not Buffer in frontend
        session_id?: string;
        layout_type?: string;
        metadata?: Record<string, any>;
      }) => Promise<any>;
      getAll: (limit?: number, offset?: number) => Promise<any[]>;
      getById: (id: string) => Promise<any>;
      delete: (id: string) => Promise<boolean>;
    };

    settings: {
      get: () => Promise<any>;
      update: (settings: any) => Promise<any>;
      reset: () => Promise<any>;
    };

    file: {
      selectDirectory: () => Promise<string | null>;
    };

    template: {
      getAll: (activeOnly?: boolean) => Promise<any[]>;
      getById: (id: string) => Promise<any>;
      create: (templateData: any) => Promise<any>;
      update: (id: string, updates: any) => Promise<any>;
      delete: (id: string) => Promise<boolean>;
      apply: (photoId: string, templateId: string, customOverlays?: any) => Promise<any>;
      initDefaults: () => Promise<void>;
    };

    on: (channel: string, callback: (...args: any[]) => void) => () => void;
  }

  interface Window {
    electronAPI: ElectronAPI;
  }
}
