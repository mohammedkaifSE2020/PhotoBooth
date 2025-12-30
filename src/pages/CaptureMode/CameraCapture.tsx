import { useState, useEffect, useRef } from "react"

import { Camera, CameraOff, Sparkles, CheckCircle2, Info } from 'lucide-react';
import { Button } from "../../../../PhotoBooth/shared/components/ui/button";
import { Badge } from "../../../../PhotoBooth/shared/components/ui/badge";
import { Card } from "../../../../PhotoBooth/shared/components/ui/card";

export default function CameraCapture() {
    const [isCapturing, setIsCapturing] = useState(false)
    const [countDown, setCountDown] = useState<number | null>(null)
    const [lastPhoto, setLastPhoto] = useState<string | null>(null)
    const [cameraError, setCameraError] = useState<string | null>(null)
    const [settings, setSettings] = useState<any>(null);

    const videoRef = useRef<HTMLVideoElement>(null);
    const streamRef = useRef<MediaStream | null>(null);

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
            console.log(cameras)
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
            console.log(physicalCamera)

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

    const capturePhoto = async () => {
        if (!videoRef.current || isCapturing || !settings) return;

        // Check if video is actually transmitting data
        if (videoRef.current.readyState < 2) {
            console.error("Video stream not ready");
            return;
        }

        console.log(videoRef.current.videoWidth);

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

                //convert to blob
                const blob = await new Promise<Blob | null>((resolve) => {
                    canvas.toBlob((blob) =>
                        resolve(blob!), 'image/jpeg', 0.95);
                })
                console.log(blob)
                const arrayBuffer = await blob!.arrayBuffer();
                //const buffer = Buffer.from(arrayBuffer);

                //save photo using electron API
                const photo = await window.electronAPI.photo.save({
                    imageBuffer: arrayBuffer,
                    layout_type: 'single',
                    metadata: {
                        timestamp: new Date().toISOString(),
                        resolution: `${canvas.width}x${canvas.height}`,
                    },
                })

                console.log('✅ Photo saved:', photo);

                // Show preview
                const imageDataUrl = canvas.toDataURL('image/jpeg', 0.95);
                setLastPhoto(imageDataUrl);

                // Hide preview after 3 seconds
                setTimeout(() => setLastPhoto(null), 3000);
            }
        } catch (error) {
            console.error('Error capturing photo:', error);
            alert('Failed to save photo: ' + error);
        } finally {
            setIsCapturing(false);
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


    }
    return (
        <div className="h-screen flex flex-col bg-[#0a0a0a] overflow-hidden">
            {/* 1. Header Overlay */}
            <div className="absolute top-0 inset-x-0 h-20 bg-gradient-to-b from-black/80 to-transparent z-50 px-8 flex items-center justify-between pointer-events-none">
                <div className="flex items-center gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                    <span className="text-white/70 text-sm font-medium tracking-widest uppercase text-xs">Live Feed</span>
                </div>
            </div>

            {/* 2. Main Viewport Area */}
            <div className="flex-1 min-h-0 relative flex flex-col items-center justify-center p-4 pb-0">
                <div className="relative h-full max-h-full aspect-video bg-zinc-900 rounded-3xl overflow-hidden shadow-2xl border border-white/10">
                    <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full h-full object-cover scale-x-[-1]"
                    />

                    {/* Countdown Overlay */}
                    {countDown !== null && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-sm z-30">
                            <span className="text-[12rem] font-black text-white animate-in zoom-in">{countDown}</span>
                        </div>
                    )}
                </div>

                {/* 3. THE OVERLAP BRIDGE */}
                {/* -translate-y-1/2 moves the button up by 50% of its own height */}
                <div className="relative z-50 -translate-y-1/2">
                    <div className="relative group">
                        {/* Decorative Outer Ring */}
                        <div className="absolute inset-0 rounded-full border-2 border-white/40 scale-125 group-hover:scale-150 transition-all duration-500 bg-black/20 backdrop-blur-md" />

                        <button
                            onClick={capturePhoto}
                            disabled={isCapturing || countDown !== null}
                            className={`
                        relative w-24 h-24 rounded-full border-4 border-zinc-900 shadow-[0_0_30px_rgba(0,0,0,0.5)] flex items-center justify-center
                        transition-all duration-300 active:scale-90
                        ${(isCapturing || countDown !== null)
                                    ? 'bg-zinc-700'
                                    : 'bg-white hover:bg-zinc-100'}
                    `}
                        >
                            <div className={`
                        rounded-full transition-all duration-300
                        ${(isCapturing || countDown !== null)
                                    ? 'w-8 h-8 bg-zinc-500 rounded-sm'
                                    : 'w-20 h-20 bg-transparent border-2 border-zinc-900'}
                    `} />

                            {(!isCapturing && countDown === null) && (
                                <Camera className="absolute w-10 h-10 text-zinc-900 opacity-20 group-hover:opacity-100 transition-opacity" />
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* 4. Bottom Control Bar (Reduced height since button is overlapping) */}
            <div className="h-24 flex-shrink-0 bg-zinc-950 flex flex-col items-center justify-center border-t border-white/5">
                <p className="text-[10px] text-zinc-500 font-bold tracking-[0.3em] uppercase">
                    {isCapturing ? "Processing..." : "Capture Moment"}
                </p>
            </div>
        </div>
    )
}

