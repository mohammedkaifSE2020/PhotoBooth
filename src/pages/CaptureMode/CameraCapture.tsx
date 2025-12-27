import { useState, useEffect, useRef } from "react"

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
            const videoDevices:any = cameras.filter(device => device.kind === 'videoinput');

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
                <div className="h-full flex items-center justify-center p-8">
                    <div className="text-center max-w-md">
                        <div className="text-6xl mb-4">📷</div>
                        <h2 className="text-2xl font-bold mb-2">Camera Not Available</h2>
                        <p className="text-gray-400 mb-6">{cameraError}</p>
                        <button
                            onClick={startCamera}
                            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Try Again
                        </button>
                    </div>
                </div>
            );
        }


    }
    return (
        <div className="h-full flex items-center justify-center p-8 relative">
            {/* Camera Preview */}
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
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-60 backdrop-blur-sm">
                        <div className="text-9xl font-bold text-white animate-pulse">
                            {countDown}
                        </div>
                    </div>
                )}

                {/* Last Photo Preview */}
                {lastPhoto && (
                    <div className="absolute top-4 right-4 w-48 h-36 rounded-lg overflow-hidden border-4 border-green-500 shadow-xl animate-fade-in">
                        <img src={lastPhoto} alt="Last captured" className="w-full h-full object-cover" />
                        <div className="absolute bottom-0 left-0 right-0 bg-green-500 text-white text-center py-1 text-sm font-semibold">
                            ✓ Photo Saved!
                        </div>
                    </div>
                )}

                {/* Frame overlay for better UX */}
                <div className="absolute inset-0 pointer-events-none border-4 border-white border-opacity-20 rounded-lg"></div>
            </div>

            {/* Capture Button */}
            <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2">
                <button
                    onClick={capturePhoto}
                    disabled={isCapturing}
                    className={`
                                    relative w-20 h-20 rounded-full border-4 border-white shadow-2xl
                                    transition-all duration-200 transform hover:scale-110 active:scale-95
                                    ${isCapturing
                            ? 'bg-gray-500 cursor-not-allowed opacity-50'
                            : 'bg-red-600 hover:bg-red-700'
                        }
                                 `}
                >
                    <div className="absolute inset-2 rounded-full bg-white"></div>
                </button>
            </div>

            {/* Instructions */}
            {!isCapturing && !countDown && (
                <div className="absolute top-8 left-1/2 transform -translate-x-1/2 bg-gray-800 bg-opacity-90 px-6 py-3 rounded-lg backdrop-blur-sm">
                    <p className="text-white text-center font-medium">
                        Click the red button or press <kbd className="px-2 py-1 bg-gray-700 rounded">SPACE</kbd> to capture
                    </p>
                </div>
            )}
        </div>
    )
}

