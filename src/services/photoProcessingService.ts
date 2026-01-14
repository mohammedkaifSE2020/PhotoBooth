import { createCompositeImage } from '@/utils/createCompositeImage';
import { processImageForSaving } from '@/utils/helpers';

interface CapturedPhoto {
  dataUrl: string;
  timestamp: Date;
}

type LayoutType = 'single' | 'strip-3' | 'strip-4';

interface PhotoSaveResult {
  success: boolean;
  compositeDataUrl?: string;
  error?: string;
}

export const photoProcessingService = {
 
  async saveAndProcessPhotos(
    photos: CapturedPhoto[],
    layout: LayoutType
  ): Promise<PhotoSaveResult> {
    try {
      if (!photos || photos.length === 0) {
        return { success: false, error: 'No photos to process' };
      }

      // Create composite image based on layout
      const compositeDataUrl = await createCompositeImage(photos, layout);

      // Process image for saving
      const arrayBuffer = processImageForSaving(compositeDataUrl);

      // Save photo using electron API
      const photo = await window.electronAPI.photo.save({
        imageBuffer: arrayBuffer,
        layout_type: layout,
        metadata: {
          timestamp: new Date().toISOString(),
          photoCount: photos.length,
        },
      });

      console.log('Photo saved successfully:', photo);

      return {
        success: true,
        compositeDataUrl,
      };
    } catch (error) {
      console.error('Error saving photo:', error);
      return {
        success: false,
        error: `Failed to save photo: ${error}`,
      };
    }
  },
};
