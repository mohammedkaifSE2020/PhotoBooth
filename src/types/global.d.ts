
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
      SelectImage: () => Promise<string | null>;
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

    email: {
      getConfig: () => Promise<any>;
      updateConfig: (updates: any) => Promise<any>;
      send: (options: any) => Promise<boolean>;
      sendPhoto: (photoPath: string, toEmail: string, guestName?: string) => Promise<boolean>;
      testConfig: () => Promise<boolean>;
    };

    groups: {
      getAll: () => Promise<any[]>;
      getById: (id: number) => Promise<any>;
      create: (name: string, description?: string, thumbnail_path?: string) => Promise<number>;
      update: (id: number, updates: Partial<Omit<any, 'id' | 'created_at' | 'photo_count'>>) => Promise<void>;
      delete: (id: number) => Promise<void>;
      updatePhotoCount: (groupId: number) => Promise<void>;
      addPhotos: (groupId: number, photoIds: number[]) => Promise<void>;
      removePhotos: (groupId: number, photoIds: number[]) => Promise<void>;
      getPhotos: (groupId: number) => Promise<any[]>;
    }

    layout: {
      importFrame: (sourcePath: string, name: string) => Promise<any>;
      getAllFrames: () => Promise<any[]>;
      save: (data: { name: string; canvas_width: number; canvas_height: number; frame_asset_id: string; config_json: any }) => Promise<string>;
      update: (id: string, updates: any) => Promise<boolean>;
      delete: (id: string) => Promise<boolean>;
      deleteFrame: (id: string) => Promise<boolean>;
    };

    on: (channel: string, callback: (...args: any[]) => void) => () => void;
  }

  interface Window {
    electronAPI: ElectronAPI;
  }
}
