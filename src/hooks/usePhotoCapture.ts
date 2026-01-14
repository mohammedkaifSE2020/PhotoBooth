import { useState } from 'react';
import { useCamera } from './useCamera';
import { useSettings } from './useSettings';
import { playBeep, playShutter, showFlash } from '@/utils/helpers';

interface CapturedPhoto {
  dataUrl: string;
  timestamp: Date;
}

export const usePhotoCapture = (resolution: string = '1280x720') => {
  const { videoRef, startCamera, stopCamera, cameraError } = useCamera(resolution);
  const { settings } = useSettings();
  const [countDown, setCountDown] = useState<number | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);

  const capturePhoto = async (): Promise<CapturedPhoto | null | undefined> => {
    if (!videoRef.current || isCapturing || !settings) return null;

    // Check if video is actually transmitting data
    if (videoRef.current.readyState < 2) {
      console.error('Video stream not ready');
      return null;
    }

    setIsCapturing(true);

    try {
      const countDownDuration = settings.countDownDuration || 3;
      for (let i = countDownDuration; i > 0; i--) {
        setCountDown(i);
        // Play sound if enabled
        if (settings.enable_sound) {
          playBeep();
        }
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
      setCountDown(null);

      if (settings.enable_flash) {
        showFlash();
      }

      if (settings.enable_sound) {
        playShutter();
      }

      // Capture photo logic
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const context = canvas.getContext('2d');

      if (context) {
        context.drawImage(videoRef.current, 0, 0);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.95);

        return {
          dataUrl,
          timestamp: new Date(),
        };
      }
    } catch (error) {
      console.error('Error capturing photo:', error);
      alert('Failed to capture photo: ' + error);
      return null;
    } finally {
      setIsCapturing(false);
    }
  };

  return { 
    capturePhoto, 
    countDown, 
    setCountDown, 
    videoRef, 
    isCapturing, 
    startCamera, 
    stopCamera,
    cameraError 
  };
};
