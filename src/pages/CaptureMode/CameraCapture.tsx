import { useState, useEffect, useRef } from "react"
import { useNavigate } from 'react-router-dom';

import { Camera, CameraOff, Sparkles, CheckCircle2, Info } from 'lucide-react';
import { Button } from "../../../../PhotoBooth/shared/components/ui/button";
import { Badge } from "../../../../PhotoBooth/shared/components/ui/badge";
import { Card } from "../../../../PhotoBooth/shared/components/ui/card";
import { resolve } from "path";

type LayoutType = 'single' | 'strip-3' | 'strip-4';

interface CapturedPhoto {
    dataUrl: string;
    timestamp: Date;
}

export default function CameraCapture() {
    const [isCapturing, setIsCapturing] = useState(false)
    const [countDown, setCountDown] = useState<number | null>(null)
    const [lastPhoto, setLastPhoto] = useState<string | null>(null)
    const [cameraError, setCameraError] = useState<string | null>(null)
    const [settings, setSettings] = useState<any>(null);

    const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);
    const [showPreview, setShowPreview] = useState(false);
    const [selectedLayout, setSelectedLayout] = useState<LayoutType>('single');
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

    //const navigate = useNavigate();

    //load settings
    useEffect(() => {
        loadSettings();
    }, []);

    //start camera
    useEffect(() => {
        if (settings) {
            startCamera();
        }

        return () => {
            stopCamera();
        }
    }, [settings]);

    //keyboard shortcuts
    useEffect(() => {
        const handleKeyPress = (event: KeyboardEvent) => {
            if (event.code === 'Space') {
                event.preventDefault();
                capturePhoto();
            } else if (event.code === 'Escape' && showPreview) {
                handleRetake();
            } else if (event.code === 'Enter' && showPreview) {
                handleKeepPhotos();
            }
        };
        window.addEventListener('keydown', handleKeyPress);
        return () => window.removeEventListener('keydown', handleKeyPress);
    }, [isCapturing, showPreview]);

    const loadSettings = async () => {
        try {
            const currentSettings = await window.electronAPI.settings.get();
            setSettings(currentSettings);
        } catch (error) {
            console.error("Failed to load settings:", error);
        }
    }

    const startCamera = async () => {
        try {
            setCameraError(null);

            const cameras = await navigator.mediaDevices.enumerateDevices();
            const videoDevices: any = cameras.filter(device => device.kind === 'videoinput');

            const physicalCamera = videoDevices.find((d: any) =>
                !d.label.toLowerCase().includes('hitpaw') &&
                !d.label.toLowerCase().includes('virtual')
            ) || videoDevices[0];

            const [width, height] = settings.resolution.split('x').map(Number);

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    deviceId: physicalCamera ? { exact: physicalCamera.deviceId } : undefined,
                    width: { ideal: width },
                    height: { ideal: height }
                },
                audio: false
            })

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                streamRef.current = stream;
            }
        } catch (error) {
            console.error('Error accessing camera:', error);
            setCameraError('Could not access camera. Please check permissions.');
        }
    }


    const stopCamera = () => {
        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    };

    const startPhotoSesssion = async () => {
        setCapturedPhotos([]);
        setCurrentPhotoIndex(0);

        //get the number of photos based on Layout
        let photoCount = selectedLayout === 'single' ? 1 : selectedLayout === 'strip-3' ? 3 : 4;

        const photos: CapturedPhoto[] = [];

        //start for loop to capture the photos in series inside a lop
        for (let i = 0; i < photoCount; i++) {
            setCurrentPhotoIndex(i + 1);
            const photo = await capturePhoto();
            console.log(photo);
            if (photo) {
                photos.push(photo);
                console.log(photo);
                //wait for some time for processing but not for the last photo
                if (i < photoCount - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1500))
                }
            }
        }
        console.log(photos);
        setCapturedPhotos(photos);
        setShowPreview(true);
        setCurrentPhotoIndex(0);
    }

    const capturePhoto = async (): Promise<CapturedPhoto | null | undefined> => {
        if (!videoRef.current || isCapturing || !settings) return null;

        // Check if video is actually transmitting data
        if (videoRef.current.readyState < 2) {
            console.error("Video stream not ready");
            return null;
        }
        console.log("hi")
        setIsCapturing(true);

        try {
            const countDownDuration = settings.countDownDuration || 3;
            for (let i = countDownDuration; i > 0; i--) {
                setCountDown(i);
                // Play sound if enabled
                if (settings.enable_sound) {
                    playBeep();
                }
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            setCountDown(null);

            if (settings.enable_flash) {
                showFlash();
            }

            if (settings.enable_sound) {
                playShutter();
            }

            //capture photo logic
            const canvas = document.createElement('canvas');
            canvas.width = videoRef.current.videoWidth;
            canvas.height = videoRef.current.videoHeight;
            const context = canvas.getContext('2d');

            if (context) {
                context.drawImage(videoRef.current, 0, 0);
                const dataUlr = canvas.toDataURL('image/jpeg', 0.95);

                console.log({
                    dataUrl: dataUlr,
                    timestamp: new Date(),
                })

                return {
                    dataUrl: dataUlr,
                    timestamp: new Date(),
                }
            }
        } catch (error) {
            console.error('Error capturing photo:', error);
            alert('Failed to save photo: ' + error);
            return null;
        } finally {
            setIsCapturing(false);
        }
    }

    function playBeep() {
        const audioContext = new AudioContext();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 800;
        gainNode.gain.value = 0.1;

        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.1);
    };

    function playShutter() {
        const audioContext = new AudioContext();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value = 1200;
        gainNode.gain.value = 0.15;

        oscillator.start();
        oscillator.stop(audioContext.currentTime + 0.15);
    };

    function showFlash() {
        const flash = document.createElement('div');
        flash.className = 'fixed inset-0 bg-white z-50 pointer-events-none';
        flash.style.animation = 'flash 0.3s ease-out';
        document.body.appendChild(flash);
        setTimeout(() => flash.remove(), 300);
    };

    const handleKeepPhotos = async () => {
        // Create composite image based on layout
        const compositeDataUrl = await createCompositeImage();

        // Split the base64 string to get the actual data
        const base64Data = compositeDataUrl.split(',')[1];

        // Convert base64 string directly to an ArrayBuffer
        const binaryString = window.atob(base64Data);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        const arrayBuffer = bytes.buffer;

        //save photo using electron API
        const photo = await window.electronAPI.photo.save({
            imageBuffer: arrayBuffer,
            layout_type: 'single',
            metadata: {
                timestamp: new Date().toISOString(),
                photoCount: capturedPhotos.length,
            },
        })

        // Show preview
        const imageDataUrl = compositeDataUrl;
        setLastPhoto(imageDataUrl);

        // Hide preview after 3 seconds
        setTimeout(() => setLastPhoto(null), 3000);

        setShowPreview(false);
        startCamera();

    }

    const handleRetake = () => {
        setCapturedPhotos([]);
        setShowPreview(false);
        setCurrentPhotoIndex(0);
        startCamera();
    }

    const createCompositeImage = async (): Promise<string> => {
        if (selectedLayout === 'single') {
            console.log("CompositeImage", capturedPhotos)
            return capturedPhotos[0].dataUrl;
        }

        const photoWidth = 600;
        const photoHeight = 400;
        const spacing = 10;
        const padding = 20;

        const photosCount = capturedPhotos.length;

        // Create strip layout
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        // Vertical strip layout
        canvas.width = photoWidth + (padding * 2);
        canvas.height = (photoHeight * photosCount) + (spacing * (photosCount - 1)) + (padding * 2);

        // White background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw photos
        for (let i = 0; i < capturedPhotos.length; i++) {
            const img = new Image();
            await new Promise((resolve) => {
                img.onload = resolve;
                img.src = capturedPhotos[i].dataUrl;
            });

            const y = padding + (i * (photoHeight + spacing));
            ctx.drawImage(img, padding, y, photoWidth, photoHeight);

            // Add border
            ctx.strokeStyle = '#e5e7eb';
            ctx.lineWidth = 2;
            ctx.strokeRect(padding, y, photoWidth, photoHeight);
        }

        // Add watermark
        ctx.fillStyle = '#9ca3af';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PhotoBooth Pro', canvas.width / 2, canvas.height - 8);

        return canvas.toDataURL('image/jpeg', 0.95);
    }

    if (cameraError) {
        return (
            <div className="h-full flex flex-col items-center justify-center p-8 bg-background">
                <Card className="max-w-md p-8 text-center border-destructive/50 bg-destructive/5 shadow-2xl animate-in zoom-in duration-300">
                    <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CameraOff className="w-10 h-10 text-destructive" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Camera Unavailable</h2>
                    <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
                        {cameraError || "We couldn't access your camera. Please check your system permissions and try again."}
                    </p>
                    <Button onClick={startCamera} size="lg" className="w-full">
                        Grant Access & Retry
                    </Button>
                </Card>
            </div>
        );


    }
    return (
        <div className="h-full flex flex-col">
            {/* Layout Selector */}
            {!isCapturing && !showPreview && (
                <div className="flex-shrink-0 bg-gray-800 border-b border-gray-700 px-6 py-3">
                    <div className="flex items-center justify-center gap-4">
                        <span className="text-sm text-gray-400">Layout:</span>
                        {(['single', 'strip-3', 'strip-4'] as LayoutType[]).map((layout) => (
                            <button
                                key={layout}
                                onClick={() => setSelectedLayout(layout)}
                                className={`px-4 py-2 rounded-lg font-medium transition-all ${selectedLayout === layout
                                    ? 'bg-blue-600 text-white shadow-lg scale-105'
                                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                                    }`}
                            >
                                {layout === 'single' ? '📷 Single' :
                                    layout === 'strip-3' ? '📸 3-Strip' : '🎞️ 4-Strip'}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* Camera Preview or Photo Preview */}
            <div className="flex-1 flex items-center justify-center p-8 relative">
                {!showPreview ? (
                    // Camera Preview
                    <div className="relative max-w-6xl w-full aspect-video bg-black rounded-lg overflow-hidden shadow-2xl">
                        <video
                            ref={videoRef}
                            autoPlay
                            playsInline
                            muted
                            className="w-full h-full object-cover"
                        />

                        {/* Countdown Overlay */}
                        {countDown !== null && (
                            <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-70 backdrop-blur-sm">
                                <div className="text-9xl font-bold text-white animate-bounce-in">
                                    {countDown}
                                </div>
                                {selectedLayout !== 'single' && (
                                    <div className="mt-4 text-2xl text-white">
                                        Photo {currentPhotoIndex} of {selectedLayout === 'strip-3' ? 3 : 4}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Frame overlay */}
                        <div className="absolute inset-0 pointer-events-none border-4 border-white border-opacity-20 rounded-lg"></div>
                    </div>
                ) : (
                    // Photo Preview with Retake Option
                    <div className="max-w-4xl w-full">
                        <div className="bg-gray-800 rounded-lg p-6 shadow-2xl animate-fade-in">
                            <h3 className="text-2xl font-bold mb-4 text-center">Preview Your Photos</h3>

                            <div className="grid gap-4 mb-6">
                                {selectedLayout === 'single' ? (
                                    <img
                                        src={capturedPhotos[0]?.dataUrl}
                                        alt="Captured"
                                        className="w-full rounded-lg shadow-lg"
                                    />
                                ) : (
                                    <div className="grid grid-cols-2 gap-4">
                                        {capturedPhotos.map((photo, index) => (
                                            <div key={index} className="relative">
                                                <img
                                                    src={photo.dataUrl}
                                                    alt={`Photo ${index + 1}`}
                                                    className="w-full rounded-lg shadow-lg"
                                                />
                                                <div className="absolute top-2 left-2 bg-black bg-opacity-70 text-white px-2 py-1 rounded text-sm">
                                                    {index + 1}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="flex gap-4">
                                <button
                                    onClick={handleRetake}
                                    className="flex-1 px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-all transform hover:scale-105 font-medium"
                                >
                                    🔄 Retake (ESC)
                                </button>
                                <button
                                    onClick={handleKeepPhotos}
                                    className="flex-1 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-all transform hover:scale-105 font-medium"
                                >
                                    ✓ Keep Photos (ENTER)
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Capture Button */}
            {!showPreview && (
                <div className="flex-shrink-0 pb-8">
                    <div className="flex flex-col items-center gap-4">
                        <button
                            onClick={startPhotoSesssion}
                            disabled={isCapturing}
                            className={`
                relative w-20 h-20 rounded-full border-4 border-white shadow-2xl
                transition-all duration-200 transform hover:scale-110 active:scale-95
                ${isCapturing
                                    ? 'bg-gray-500 cursor-not-allowed opacity-50'
                                    : 'bg-red-600 hover:bg-red-700 animate-pulse-slow'
                                }
              `}
                        >
                            <div className="absolute inset-2 rounded-full bg-white"></div>
                        </button>

                        <div className="bg-gray-800 bg-opacity-90 px-6 py-2 rounded-lg backdrop-blur-sm">
                            <p className="text-white text-center text-sm">
                                Press <kbd className="px-2 py-1 bg-gray-700 rounded mx-1">SPACE</kbd> to capture
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

