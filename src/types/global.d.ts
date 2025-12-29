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

    on: (channel: string, callback: (...args: any[]) => void) => () => void;
  }

  interface Window {
    electronAPI: ElectronAPI;
  }
}
