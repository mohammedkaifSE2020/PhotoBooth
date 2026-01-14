import { useRef, useState } from 'react';

export const useCamera = (resolution: string) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);

  const startCamera = async () => {
    try {
      const cameras = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = cameras.filter(d => d.kind === 'videoinput');
      const physicalCamera = videoDevices.find(d => 
        !d.label.toLowerCase().includes('virtual')) || videoDevices[0];

      const [width, height] = resolution.split('x').map(Number);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { deviceId: { exact: physicalCamera.deviceId }, width, height }
      });

      if (videoRef.current) videoRef.current.srcObject = stream;
      streamRef.current = stream;
    } catch (err) {
      setCameraError("Camera access denied.");
    }
  };

  const stopCamera = () => {
    streamRef.current?.getTracks().forEach(t => t.stop());
  };

  return { videoRef, startCamera, stopCamera, cameraError };
};