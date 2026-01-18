import { useState, useEffect, useRef } from "react"

import { Camera, CameraOff, Sparkles, CheckCircle2, Info } from 'lucide-react';
import { Button } from "../../../../PhotoBooth/shared/components/ui/button";
import { Badge } from "../../../../PhotoBooth/shared/components/ui/badge";
import { Card } from "../../../../PhotoBooth/shared/components/ui/card";

import { useSettings } from "@/hooks/useSettings";
import { photoProcessingService } from "@/services/photoProcessingService";
import { usePhotoCapture } from "@/hooks/usePhotoCapture";


type LayoutType = 'single' | 'strip-3' | 'strip-4';

interface CapturedPhoto {
    dataUrl: string;
    timestamp: Date;
}

export default function CameraCapture() {
    const [lastPhoto, setLastPhoto] = useState<string | null>(null)

    const [capturedPhotos, setCapturedPhotos] = useState<CapturedPhoto[]>([]);
    const [showPreview, setShowPreview] = useState(false);
    const [selectedLayout, setSelectedLayout] = useState<LayoutType>('single');
    const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

    const { settings } = useSettings();
    const { videoRef, startCamera, stopCamera, cameraError, capturePhoto, countDown, isCapturing } = usePhotoCapture(
        settings ? settings.resolution : '1280x720'
    );

    //start camera
    useEffect(() => {
        if (settings) {
            startCamera();
        }
        return () => {
            stopCamera();
        }
    }, [settings, startCamera, stopCamera]);

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
        setCapturedPhotos(photos);
        setShowPreview(true);
        setCurrentPhotoIndex(0);
    }

    const handleKeepPhotos = async () => {
        const result = await photoProcessingService.saveAndProcessPhotos(capturedPhotos, selectedLayout);

        if (result.success && result.compositeDataUrl) {
            setLastPhoto(result.compositeDataUrl);
            // Hide preview after 3 seconds
            setTimeout(() => setLastPhoto(null), 3000);
            setShowPreview(false);
            startCamera();
        } else {
            alert(result.error || 'Failed to save photos');
        }
    }

    const handleRetake = () => {
        setCapturedPhotos([]);
        setShowPreview(false);
        setCurrentPhotoIndex(0);
        startCamera();
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
        <div className="h-screen flex flex-col bg-black overflow-hidden relative">

            {/* 1. Top Layout Selector - Absolute so it floats over the video */}
            {!isCapturing && !showPreview && (
                <div className="absolute top-0 left-0 right-0 z-20 bg-gradient-to-b from-black/60 to-transparent px-6 py-6">
                    <div className="flex items-center justify-center gap-4">
                        <span className="text-sm font-bold text-white uppercase tracking-widest drop-shadow-md">Layout:</span>
                        {(['single', 'strip-3', 'strip-4'] as LayoutType[]).map((layout) => (
                            <button
                                key={layout}
                                onClick={() => setSelectedLayout(layout)}
                                className={`px-5 py-2 rounded-full text-xs font-bold uppercase transition-all backdrop-blur-md border ${selectedLayout === layout
                                        ? 'bg-blue-600 border-blue-400 text-white shadow-[0_0_15px_rgba(37,99,235,0.5)] scale-105'
                                        : 'bg-black/40 border-white/20 text-gray-300 hover:bg-black/60'
                                    }`}
                            >
                                {layout === 'single' ? '📷 Single' : layout === 'strip-3' ? '📸 3-Strip' : '🎞️ 4-Strip'}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            {/* 2. Main Viewport Area */}
            <div className="flex-1 relative min-h-0 w-full h-full">
                {!showPreview ? (
                    <>
                        {/* Full Screen Camera Video */}
                        <div className="absolute inset-0 z-0">
                            <video
                                ref={videoRef}
                                autoPlay
                                playsInline
                                muted
                                className="w-full h-full object-cover mirror scale-x-[-1]" // 'mirror' class optional for natural feel
                            />

                            {/* Subtle Vignette Overlay for Depth */}
                            <div className="absolute inset-0 bg-[radial-gradient(circle,transparent_40%,rgba(0,0,0,0.4)_100%)] pointer-events-none" />
                        </div>

                        {/* Countdown Overlay */}
                        {countDown !== null && (
                            <div className="absolute inset-0 z-30 flex flex-col items-center justify-center bg-black/40 backdrop-blur-[2px]">
                                <div className="text-[12rem] font-black text-white animate-pulse drop-shadow-[0_0_30px_rgba(0,0,0,0.5)]">
                                    {countDown}
                                </div>
                                <Badge className="mt-4 bg-blue-600 text-lg px-6 py-1">
                                    Photo {currentPhotoIndex} of {selectedLayout === 'strip-3' ? 3 : 4}
                                </Badge>
                            </div>
                        )}
                    </>
                ) : (
                    /* Full Screen Preview Mode */
                    <div className="absolute inset-0 z-40 bg-[#0d0d0f] flex items-center justify-center p-8 overflow-y-auto">
                        <div className="max-w-4xl w-full animate-in fade-in zoom-in duration-500">
                            {/* ... (Keep your existing preview grid logic here) ... */}
                        </div>
                    </div>
                )}
            </div>

            {/* 3. Bottom Controls - Floating over the video */}
            {!showPreview && (
                <div className="absolute bottom-16 left-0 right-0 z-20 flex flex-col items-center gap-6">

                    {/* The Capture Button - Positioned to overlay the bottom area */}
                    <button
                        onClick={startPhotoSesssion}
                        disabled={isCapturing}
                        className={`
            relative group
            w-16 h-16 rounded-full border-[6px] border-white shadow-[0_0_30px_rgba(0,0,0,0.4)]
            transition-all duration-300 transform hover:scale-110 active:scale-90
            ${isCapturing ? 'bg-gray-500 cursor-not-allowed' : 'bg-red-600'}
          `}
                    >
                        <div className="absolute inset-2 rounded-full border-2 border-black/10 bg-white group-hover:bg-gray-100 transition-colors" />
                        {/* Outer Ring Animation */}
                        {!isCapturing && (
                            <div className="absolute -inset-4 rounded-full border-2 border-white/30 animate-ping pointer-events-none" />
                        )}
                    </button>

                    {/* Space Hint */}
                    <div className="px-4 py-1.5 rounded-full bg-black/60 backdrop-blur-md border border-white/10 shadow-xl">
                        <p className="text-white text-[10px] uppercase font-black tracking-[0.2em] opacity-80">
                            Press <span className="text-blue-400">Space</span>
                        </p>
                    </div>
                </div>
            )}
        </div>
    );

}

