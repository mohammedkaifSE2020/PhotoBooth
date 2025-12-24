export interface PhotoInput {
  imageBuffer: Buffer;
  session_id?: string;
  layout_type?: string;
  metadata?: Record<string, any>;
}