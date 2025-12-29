import { useState, useEffect } from "react";

import { RefreshCw, Trash2, X, Maximize2, FileText, Calendar, HardDrive, Ruler } from 'lucide-react';
// Assuming these Shadcn components are installed
import {Button } from "../../../../PhotoBooth/shared/components/ui/button";
import { Card } from "../../../../PhotoBooth/shared/components/ui/card";
import { ScrollArea } from "../../../../PhotoBooth/shared/components/ui/scroll-area";
import { Separator } from "../../../../PhotoBooth/shared/components/ui/separator";
import { Badge } from "../../../../PhotoBooth/shared/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../../../PhotoBooth/shared/components/ui/tooltip";
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

export default function PhotoGallery() {
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

    useEffect(() => {
        loadPhotos();
    }, [])

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
                {/* 🛰️ Premium Header */}
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

                {/* 🖼️ Immersive Grid Area */}
                <ScrollArea className="flex-1">
                    <div className="p-8">
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {photos.map((photo) => (
                                <div key={photo.id} className="relative group">
                                    <Card 
                                        className={`group relative aspect-square overflow-hidden cursor-pointer border-0 transition-all duration-500 rounded-xl bg-slate-900 shadow-2xl ${
                                            selectedPhoto?.id === photo.id 
                                            ? 'ring-2 ring-blue-500 ring-offset-4 ring-offset-[#0d0d0f] scale-95' 
                                            : 'hover:scale-[1.02]'
                                        }`}
                                        onClick={() => setSelectedPhoto(photo)}
                                    >
                                        <img
                                            src={getMediaUrl(photo.thumbnail_path || photo.filepath)}
                                            alt={photo.filename}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                                            onError={(e) => (e.currentTarget.src = getMediaUrl(photo.filepath))}
                                        />
                                        
                                        {/* Dynamic Overlay */}
                                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent opacity-60 group-hover:opacity-100 transition-opacity" />
                                        
                                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                                            <div className="bg-white/10 backdrop-blur-md p-3 rounded-full border border-white/20">
                                                <Maximize2 className="text-white w-5 h-5" />
                                            </div>
                                        </div>

                                        <div className="absolute bottom-3 left-4 right-4">
                                            <p className="text-[10px] text-slate-300 truncate font-semibold uppercase tracking-widest drop-shadow-md">
                                                {photo.filename}
                                            </p>
                                        </div>
                                    </Card>
                                </div>
                            ))}
                        </div>
                    </div>
                </ScrollArea>
            </main>

            {/* 🔍 Details Sidebar */}
            {selectedPhoto && (
                <aside className="w-96 bg-[#0a0a0c] flex flex-col animate-in slide-in-from-right duration-500 shadow-[-20px_0_50px_rgba(0,0,0,0.5)]">
                    <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/20">
                        <div className="flex items-center gap-2">
                            <FileText className="w-4 h-4 text-blue-500" />
                            <h3 className="text-sm font-bold uppercase tracking-widest text-slate-400">Metadata</h3>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => setSelectedPhoto(null)} className="h-8 w-8 hover:bg-white/10 rounded-full">
                            <X className="w-4 h-4" />
                        </Button>
                    </div>

                    <ScrollArea className="flex-1">
                        <div className="p-8 space-y-8">
                            <div className="group relative rounded-2xl overflow-hidden border border-white/5 shadow-2xl">
                                <img
                                    src={getMediaUrl(selectedPhoto.filepath)}
                                    alt={selectedPhoto.filename}
                                    className="w-full h-auto bg-muted transition-transform duration-1000 group-hover:scale-105"
                                />
                                <div className="absolute top-4 right-4">
                                    <Badge className="bg-black/60 backdrop-blur-md border-white/10 text-[10px]">
                                        {'JPG'}
                                    </Badge>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-6">
                                <DetailItem icon={<FileText />} label="Asset Name" value={selectedPhoto.filename} />
                                <div className="grid grid-cols-2 gap-4">
                                    <DetailItem icon={<Ruler />} label="Resolution" value={`${selectedPhoto.width} × ${selectedPhoto.height}`} />
                                    <DetailItem icon={<HardDrive />} label="Weight" value={formatFileSize(selectedPhoto.file_size)} />
                                </div>
                                <DetailItem icon={<Calendar />} label="Creation Date" value={formatDate(selectedPhoto.taken_at)} />
                                <DetailItem icon={<Maximize2 />} label="Absolute Path" value={selectedPhoto.filepath} isPath />
                            </div>

                            <Separator className="bg-white/5" />

                            <div className="pt-4">
                                <Button 
                                    variant="destructive" 
                                    className="w-full h-12 gap-3 bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white border border-red-500/20 transition-all duration-300 shadow-lg shadow-red-500/5 rounded-xl" 
                                    onClick={() => deletePhoto(selectedPhoto.id)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                    <span className="text-xs font-bold uppercase tracking-widest">Destroy Asset</span>
                                </Button>
                            </div>
                        </div>
                    </ScrollArea>
                </aside>
            )}
        </div>
    )
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