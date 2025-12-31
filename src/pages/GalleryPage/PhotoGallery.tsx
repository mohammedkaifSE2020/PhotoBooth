import { useState, useEffect, useRef } from "react";

import {
    RefreshCw, Maximize2, FileText, X, Ruler, HardDrive,
    Calendar, Trash2, Palette, Save, Undo2, Wand2, Sun, Contrast
} from "lucide-react";
// Assuming these Shadcn components are installed
import { Button } from "../../../../PhotoBooth/shared/components/ui/button";
import { Card } from "../../../../PhotoBooth/shared/components/ui/card";
import { ScrollArea } from "../../../../PhotoBooth/shared/components/ui/scroll-area";
import { Separator } from "../../../../PhotoBooth/shared/components/ui/separator";
import { Badge } from "../../../../PhotoBooth/shared/components/ui/badge";
import { Slider } from "../../../../PhotoBooth/shared/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../../PhotoBooth/shared/components/ui/tabs";
import React from "react";
interface Photo {
    id: string;
    filepath: string;
    filename: string;
    height: number;
    width: number;
    taken_at: string;
    thumbnail_path: string;
    file_size: number;
}

type FilterType = 'none' | 'grayscale' | 'sepia' | 'brightness' | 'contrast' | 'invert';

interface FilterSettings {
    type: FilterType;
    brightness: number;
    contrast: number;
}

export default function PhotoGallery() {
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

    //filter functionality
    const [filterSettings, setFilterSettings] = useState<FilterSettings>({
        type: 'none',
        brightness: 100,
        contrast: 100,
    });
    const [isEditing, setIsEditing] = useState(false);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const originalImageRef = useRef<HTMLImageElement | null>(null);

    useEffect(() => {
        loadPhotos();
    }, [])

    useEffect(() => {
        if (selectedPhoto && isEditing) {
            ApplyFilter();
        }
    }, [selectedPhoto, isEditing, filterSettings])

    const startEditing = () => {
        setIsEditing(true);
        setFilterSettings({ type: 'none', brightness: 100, contrast: 100 });
    }

    const stopEditing = () => {
        setIsEditing(false);
        setFilterSettings({ type: 'none', brightness: 100, contrast: 100 });
        startEditing(); // re-apply original image to canvas
    }

    const ApplyFilter = () => {
        if (!canvasRef.current || !selectedPhoto) return;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', {
            willReadFrequently: true
        });

        if (!ctx) return;

        // Load image into an offscreen Image so this works even when the <img> is unmounted
        const img = new Image();
        const expectedId = selectedPhoto.id; // guard against race conditions
        img.src = getMediaUrl(selectedPhoto.filepath);
        // keep a reference for debugging or potential future use
        originalImageRef.current = img;

        img.onload = () => {
            // If the selected photo changed while the image was loading, abort
            if (selectedPhoto?.id !== expectedId) return;

            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;

            ctx.filter = 'none';
            ctx.drawImage(img, 0, 0);

            // Get image data
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            //apply filters
            switch (filterSettings.type) {
                case 'grayscale':
                    for (let i = 0; i < data.length; i += 4) {
                        const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
                        data[i] = avg;     // Red
                        data[i + 1] = avg; // Green
                        data[i + 2] = avg; // Blue
                    }
                    break;

                case 'sepia':
                    for (let i = 0; i < data.length; i += 4) {
                        const r = data[i];
                        const g = data[i + 1];
                        const b = data[i + 2];

                        data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
                        data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
                        data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
                    }
                    break;

                case 'invert':
                    for (let i = 0; i < data.length; i += 4) {
                        data[i] = 255 - data[i];
                        data[i + 1] = 255 - data[i + 1];
                        data[i + 2] = 255 - data[i + 2];
                    }
                    break;
            }

            // Apply brightness
            const brightnessFactor = filterSettings.brightness / 100;
            for (let i = 0; i < data.length; i += 4) {
                data[i] = Math.min(255, data[i] * brightnessFactor);
                data[i + 1] = Math.min(255, data[i + 1] * brightnessFactor);
                data[i + 2] = Math.min(255, data[i + 2] * brightnessFactor);
            }

            // Apply contrast
            const contrastFactor = (filterSettings.contrast / 100);
            const intercept = 128 * (1 - contrastFactor);
            for (let i = 0; i < data.length; i += 4) {
                data[i] = Math.min(255, Math.max(0, data[i] * contrastFactor + intercept));
                data[i + 1] = Math.min(255, Math.max(0, data[i + 1] * contrastFactor + intercept));
                data[i + 2] = Math.min(255, Math.max(0, data[i + 2] * contrastFactor + intercept));
            }

            ctx.putImageData(imageData, 0, 0);
        };

        img.onerror = (err) => {
            console.error('Failed to load image for editing', err);
        };
    }

    const saveEditedPhoto = async () => {
        if (!canvasRef.current || !selectedPhoto) return;

        try {
            const blob = await new Promise<Blob>((resolve) => {
                canvasRef.current!.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.95);
            });

            const arrayBuffer = await blob.arrayBuffer();

            // Save as new photo
            await window.electronAPI.photo.save({
                imageBuffer: arrayBuffer,
                layout_type: 'single',
                metadata: {
                    original_id: selectedPhoto.id,
                    filters: filterSettings,
                    edited_at: new Date().toISOString(),
                },
            });

            alert('✅ Edited photo saved!');
            stopEditing();
            loadPhotos();

        } catch (error) {
            console.error('Error saving edited photo:', error);
            alert('Failed to save edited photo');
        }
    }

    const loadPhotos = async () => {
        setLoading(true);
        try {
            const fetchedPhotos = await window.electronAPI.photo.getAll(100, 0);
            setPhotos(fetchedPhotos);
        } catch (error) {
            console.error("Error loading photos:", error);
            alert("Failed to load photos.");
        } finally {
            setLoading(false);
        }
    }

    const deletePhoto = async (photoId: string) => {
        if (!confirm('Are you sure you want to delete this photo?')) {
            return;
        }
        try {
            await window.electronAPI.photo.delete(photoId);
            setPhotos(photos.filter(photo => photo.id !== photoId));
            if (selectedPhoto && selectedPhoto.id === photoId) {
                setSelectedPhoto(null);
            }
            console.log('✅ Photo deleted');
        } catch (error) {
            console.error('Error deleting photo:', error);
            alert('Failed to delete photo');
        }
    };

    const formatFileSize = (bytes: number): string => {
        if (bytes < 1024) return bytes + ' B';
        if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
        return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    };

    const formatDate = (dateString: string): string => {
        const date = new Date(dateString);
        return date.toLocaleString();
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading photos...</p>
                </div>
            </div>
        );
    }

    if (photos.length === 0) {
        return (
            <div className="h-full flex items-center justify-center p-8">
                <div className="text-center max-w-md">
                    <div className="text-6xl mb-4">📷</div>
                    <h2 className="text-2xl font-bold mb-2">No Photos Yet</h2>
                    <p className="text-gray-400 mb-6">
                        Capture your first photo to see it here
                    </p>
                    <button
                        onClick={loadPhotos}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Refresh
                    </button>
                </div>
            </div>
        );
    }

    const getMediaUrl = (pathValue: string | undefined) => {
        if (!pathValue) return '';

        // 1. If it's already a correctly formatted media URL, return it
        if (pathValue.startsWith('media://local-resource/')) {
            return pathValue;
        }

        // 2. Strip ALL existing prefixes (media://, media://media//, etc.) 
        // to get back to the raw disk path
        let cleanPath = pathValue
            .replace(/^media:\/+/g, '')        // Remove media:/, media://, etc.
            .replace(/^local-resource\//g, '') // Remove accidental host repeat
            .replace(/\\/g, '/');              // Normalize Windows slashes

        // 3. Reconstruct exactly once
        return `media://local-resource/${cleanPath}`;
    };

    return (
        <div className="h-screen flex bg-[#0d0d0f] text-slate-200 overflow-hidden select-none">
            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0 border-r border-white/5">
                <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-black/20 backdrop-blur-xl shrink-0">
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <h2 className="text-lg font-semibold tracking-tight">Media Library</h2>
                            <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border-none px-2 py-0 text-[10px] uppercase font-bold">
                                {photos.length} Total
                            </Badge>
                        </div>
                    </div>

                    <div className="flex items-center gap-3">
                        <Button variant="ghost" size="sm" onClick={loadPhotos} className="h-9 gap-2 hover:bg-white/5 text-slate-400 hover:text-white transition-colors">
                            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                            <span className="text-xs font-medium">Sync Library</span>
                        </Button>
                    </div>
                </header>

                <ScrollArea className="flex-1">
                    <div className="p-8">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {photos.map((photo) => (
                                <div key={photo.id} className="relative group">
                                    <Card
                                        className={`group relative aspect-square overflow-hidden cursor-pointer border-0 transition-all duration-500 rounded-xl bg-slate-900 shadow-2xl ${selectedPhoto?.id === photo.id
                                            ? 'ring-2 ring-blue-500 ring-offset-4 ring-offset-[#0d0d0f] scale-95'
                                            : 'hover:scale-[1.02]'
                                            }`}
                                        onClick={() => {
                                            setSelectedPhoto(photo);
                                            setIsEditing(false); // Reset editing when switching photos
                                        }}
                                    >
                                        <img
                                            src={getMediaUrl(photo.thumbnail_path || photo.filepath)}
                                            alt={photo.filename}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                                            <div className="bg-white/10 backdrop-blur-md p-3 rounded-full border border-white/20">
                                                <Maximize2 className="text-white w-5 h-5" />
                                            </div>
                                        </div>
                                    </Card>
                                </div>
                            ))}
                        </div>
                    </div>
                </ScrollArea>
            </main>

            {/* 🔍 Details & Editor Sidebar */}
            {selectedPhoto && (
                <aside className="w-[400px] bg-[#0a0a0c] flex flex-col animate-in slide-in-from-right duration-500 shadow-[-20px_0_50px_rgba(0,0,0,0.5)] border-l border-white/5">
                    <div className="p-4 flex items-center justify-between bg-black/40">
                        <Tabs defaultValue="metadata" className="w-full" onValueChange={(v) => setIsEditing(v === 'edit')}>
                            <div className="flex items-center justify-between w-full">
                                <TabsList className="bg-black/40 p-1 rounded-xl backdrop-blur-md shadow-inner mb-5">
                                    <TabsTrigger
                                        value="metadata"
                                        className="
                                                    text-[10px] uppercase font-bold tracking-widest px-4 py-2 rounded-lg transition-all duration-300
                                                    data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-600/20
                                                    data-[state=inactive]:text-slate-500 data-[state=inactive]:hover:text-slate-200 data-[state=inactive]:hover:bg-white/5
                                                    "
                                    >
                                        <FileText className="w-3 h-3 mr-2" />
                                        Details
                                    </TabsTrigger>

                                    <TabsTrigger
                                        value="edit"
                                        className="
                                                    text-[10px] uppercase font-bold tracking-widest px-4 py-2 rounded-lg transition-all duration-300
                                                    data-[state=active]:bg-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg data-[state=active]:shadow-blue-600/20
                                                    data-[state=inactive]:text-slate-500 data-[state=inactive]:hover:text-slate-200 data-[state=inactive]:hover:bg-white/5
                                                    "
                                    >
                                        <Palette className="w-3 h-3 mr-2" />
                                        Lab
                                    </TabsTrigger>
                                </TabsList>
                                <Button variant="ghost" size="icon" onClick={() => setSelectedPhoto(null)} className="h-8 w-8 hover:bg-white/10 rounded-full">
                                    <X className="w-4 h-4" />
                                </Button>
                            </div>

                            <ScrollArea className="h-[calc(100vh-80px)] mt-4">
                                <div className="px-6 pb-8 space-y-6">
                                    {/* Large Preview */}
                                    <div className="group relative rounded-2xl overflow-hidden border border-white/5 shadow-2xl bg-slate-900">
                                        {isEditing ? (
                                            <canvas ref={canvasRef} className="w-full h-auto rounded-xl animate-in fade-in duration-300" />
                                        ) : (
                                            <img
                                                ref={originalImageRef}
                                                src={getMediaUrl(selectedPhoto.filepath)}
                                                alt={selectedPhoto.filename}
                                                className="w-full h-auto bg-muted transition-transform duration-1000 group-hover:scale-105"
                                            />
                                        )}
                                        <div className="absolute top-4 right-4">
                                            <Badge className="bg-black/60 backdrop-blur-md border-white/10 text-[10px]">
                                                {isEditing ? 'DEVELOPMENT MODE' : 'ORIGINAL JPG'}
                                            </Badge>
                                        </div>
                                    </div>

                                    <TabsContent value="metadata" className="mt-0 space-y-6 animate-in fade-in slide-in-from-bottom-2">
                                        <div className="grid grid-cols-1 gap-4">
                                            <DetailItem icon={<FileText />} label="Asset Name" value={selectedPhoto.filename} />
                                            <div className="grid grid-cols-2 gap-4">
                                                <DetailItem icon={<Ruler />} label="Resolution" value={`${selectedPhoto.width} × ${selectedPhoto.height}`} />
                                                <DetailItem icon={<HardDrive />} label="Weight" value={formatFileSize(selectedPhoto.file_size)} />
                                            </div>
                                            <DetailItem icon={<Calendar />} label="Creation Date" value={formatDate(selectedPhoto.taken_at)} />
                                        </div>

                                        <Separator className="bg-white/5" />

                                        <Button
                                            variant="destructive"
                                            onClick={() => deletePhoto(selectedPhoto.id)}
                                            className="
                                                        w-full h-11 
                                                        relative overflow-hidden
                                                        flex items-center justify-center gap-2.5 
                                                        bg-red-500/10 hover:bg-red-600 
                                                        text-red-500 hover:text-white 
                                                        border border-red-500/20 hover:border-red-400/50
                                                        transition-all duration-300 group
                                                        rounded-xl shadow-lg shadow-red-900/10
                                                    "
                                        >
                                            {/* The Icon - using a group-hover for a subtle shake/animation */}
                                            <Trash2 className="w-4 h-4 transition-transform group-hover:-rotate-12 group-hover:scale-110" />

                                            {/* The Text - centered with precise tracking */}
                                            <span className="text-[10px] font-black uppercase tracking-[0.15em] leading-none">
                                                Delete Permanent
                                            </span>

                                            {/* Subtle glass reflection effect on hover */}
                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-shimmer" />
                                        </Button>
                                    </TabsContent>

                                    <TabsContent value="edit" className="mt-0 space-y-8 animate-in fade-in slide-in-from-bottom-2">
                                        {/* Filter Presets */}
                                        <div className="space-y-4">
                                            <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                                <Wand2 className="w-3 h-3" /> Visual Presets
                                            </label>
                                            <div className="grid grid-cols-2 gap-2">
                                                {(['none', 'grayscale', 'sepia', 'invert'] as FilterType[]).map((f) => (
                                                    <Button
                                                        key={f}
                                                        variant={filterSettings.type === f ? "default" : "outline"}
                                                        className={`h-9 text-[11px] uppercase tracking-wider ${filterSettings.type === f ? 'bg-blue-600' : 'bg-transparent border-white/10'}`}
                                                        onClick={() => setFilterSettings({ ...filterSettings, type: f })}
                                                    >
                                                        {f}
                                                    </Button>
                                                ))}
                                            </div>
                                        </div>

                                        {/* Sliders */}
                                        <div className="space-y-6">
                                            <div className="space-y-3">
                                                <div className="flex justify-between">
                                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                                        <Sun className="w-3 h-3" /> Brightness
                                                    </label>
                                                    <span className="text-[10px] text-blue-400 font-mono">{filterSettings.brightness}%</span>
                                                </div>
                                                <Slider
                                                    value={[filterSettings.brightness]}
                                                    min={50} max={150} step={1}
                                                    onValueChange={([v]) => setFilterSettings({ ...filterSettings, brightness: v })}
                                                />
                                            </div>

                                            <div className="space-y-3">
                                                <div className="flex justify-between">
                                                    <label className="text-[10px] font-bold uppercase tracking-widest text-slate-500 flex items-center gap-2">
                                                        <Contrast className="w-3 h-3" /> Contrast
                                                    </label>
                                                    <span className="text-[10px] text-blue-400 font-mono">{filterSettings.contrast}%</span>
                                                </div>
                                                <Slider
                                                    value={[filterSettings.contrast]}
                                                    min={50} max={150} step={1}
                                                    onValueChange={([v]) => setFilterSettings({ ...filterSettings, contrast: v })}
                                                />
                                            </div>
                                        </div>

                                        <Separator className="bg-white/5" />

                                        <div className="flex gap-3">
                                            <Button
                                                className="flex-1 h-11 gap-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-600/20"
                                                onClick={saveEditedPhoto}
                                            >
                                                <Save className="w-4 h-4" />
                                                <span className="text-[10px] font-bold uppercase tracking-widest">Save New</span>
                                            </Button>
                                            <Button
                                                variant="outline"
                                                className="h-11 px-4 border-white/10 bg-white/5 rounded-xl hover:bg-white/10"
                                                onClick={stopEditing}
                                            >
                                                <Undo2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TabsContent>
                                </div>
                            </ScrollArea>
                        </Tabs>
                    </div>
                </aside>
            )}
        </div>
    );

}

function DetailItem({ icon, label, value, isPath = false }: { icon: React.ReactNode, label: string; value: string; isPath?: boolean }) {
    return (
        <div className="group space-y-2">
            <div className="flex items-center gap-2 text-slate-500 group-hover:text-blue-400 transition-colors">
                {React.cloneElement(icon as React.ReactElement, { className: "w-3 h-3" })}
                <span className="text-[10px] uppercase font-bold tracking-[0.15em]">{label}</span>
            </div>
            <p className={`leading-snug ${isPath ? 'text-[11px] break-all text-slate-500 font-mono bg-white/5 p-3 rounded-lg border border-white/5' : 'text-sm text-slate-200 font-medium'}`}>
                {value}
            </p>
        </div>
    );
}