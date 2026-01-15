import { CapturedPhoto, CustomOverlays, Template, WorkflowStep } from '../types';
import { usePhotoCapture } from '@/hooks/usePhotoCapture';
import { useSettings } from '@/hooks/useSettings';
import { useEffect, useState } from 'react';

interface CameraStepProps {
  onPhotoCaptured: (photo: CapturedPhoto) => void;
  onError: (error: string) => void;
}

export function CameraStep({ onPhotoCaptured, onError }: CameraStepProps) {
  const { settings } = useSettings();
  const { videoRef, startCamera, stopCamera, cameraError, capturePhoto, countDown, isCapturing } = usePhotoCapture(
    settings ? settings.resolution : '1280x720'
  );

  useEffect(() => {
    if (settings) {
      startCamera();
    }
    return () => stopCamera();
  }, [settings, startCamera, stopCamera]);

  useEffect(() => {
    if (cameraError) {
      onError(cameraError);
    }
  }, [cameraError, onError]);

  const handleCapture = async () => {
    const photo = await capturePhoto();
    if (photo) {
      onPhotoCaptured(photo);
    }
  };

  if (cameraError) {
    return (
      <div className="h-full flex items-center justify-center p-8">
        <div className="text-center text-red-500">
          <p className="text-xl mb-4">{cameraError}</p>
          <button
            onClick={startCamera}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Retry Camera
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col items-center justify-center p-8">
      <div className="relative max-w-4xl w-full aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="w-full h-full object-cover"
        />

        {countDown !== null && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm">
            <div className="text-9xl font-bold text-white animate-bounce-in">
              {countDown}
            </div>
          </div>
        )}

        <div className="absolute inset-0 pointer-events-none border-4 border-white border-opacity-20 rounded-lg"></div>
      </div>

      <button
        onClick={handleCapture}
        disabled={isCapturing}
        className={`mt-8 w-20 h-20 rounded-full border-4 border-white shadow-2xl relative transition-all hover:scale-110 ${
          isCapturing ? 'bg-gray-500 cursor-not-allowed opacity-50' : 'bg-red-600 hover:bg-red-700'
        }`}
      >
        <div className="absolute inset-2 rounded-full bg-white"></div>
      </button>
    </div>
  );
}
