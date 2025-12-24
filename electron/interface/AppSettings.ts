export interface AppSettings {
  id: number;
  camera_device_id?: string;
  resolution: string;
  countdown_duration: number;
  enable_flash: boolean;
  enable_sound: boolean;
  save_directory?: string;
  photo_format: string;
  photo_quality: number;
  created_at: string;
  updated_at: string;
}