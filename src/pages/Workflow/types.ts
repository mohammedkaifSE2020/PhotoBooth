export type WorkflowStep = 'camera' | 'template' | 'customize' | 'preview' | 'final';

export interface Template {
  id: string;
  name: string;
  description?: string;
  layout_type: string;
  thumbnail_path?: string;
}

export interface CapturedPhoto {
  dataUrl: string;
  timestamp: Date;
}

export interface CustomOverlays {
  guestName: string;
  eventDate: string;
  customText: string;
}
