export interface Photo {
  id: string;
  session_id?: string;
  filename: string;
  filepath: string;
  thumbnail_path?: string;
  width: number;
  height: number;
  file_size: number;
  taken_at: string;
  layout_type: string;
  metadata?: string;
}