import { useState, useEffect } from "react";

import { RefreshCw, Trash2, X, Maximize2, Info } from 'lucide-react';
// Assuming these Shadcn components are installed
import {Button } from "../../../../PhotoBooth/shared/components/ui/button";
import { Card } from "../../../../PhotoBooth/shared/components/ui/card";
import { ScrollArea } from "../../../../PhotoBooth/shared/components/ui/scroll-area";
import { Separator } from "../../../../PhotoBooth/shared/components/ui/separator";
import { Badge } from "../../../../PhotoBooth/shared/components/ui/badge";
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
        <div className="h-screen flex bg-background text-foreground overflow-hidden">
            {/* Main Content Area */}
            <main className="flex-1 flex flex-col min-w-0">
                {/* Header Section */}
                <header className="h-16 border-b flex items-center justify-between px-6 bg-card/50 backdrop-blur">
                    <div className="flex items-center gap-2">
                        <h2 className="text-xl font-bold tracking-tight">Gallery</h2>
                        <Badge variant="secondary" className="rounded-full">
                            {photos.length} Photos
                        </Badge>
                    </div>
                    <Button variant="outline" size="sm" onClick={loadPhotos} className="gap-2">
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </Button>
                </header>

                {/* Grid Area */}
                <ScrollArea className="flex-1 p-6">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                        {photos.map((photo) => (
                            <Card 
                                key={photo.id}
                                className={`group relative aspect-square overflow-hidden cursor-pointer border-2 transition-all hover:shadow-xl ${
                                    selectedPhoto?.id === photo.id ? 'border-primary' : 'border-transparent'
                                }`}
                                onClick={() => setSelectedPhoto(photo)}
                            >
                                <img
                                    src={getMediaUrl(photo.thumbnail_path || photo.filepath)}
                                    alt={photo.filename}
                                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 rounded-md"
                                    onError={(e) => (e.currentTarget.src = getMediaUrl(photo.filepath))}
                                />
                                {/* Hover Overlay */}
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                    <Maximize2 className="text-white w-8 h-8 opacity-70" />
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/80 to-transparent">
                                    <p className="text-[10px] text-white truncate font-medium">{photo.filename}</p>
                                </div>
                            </Card>
                        ))}
                    </div>
                </ScrollArea>
            </main>

            {/* Photo Details Sidebar */}
            {selectedPhoto && (
                <aside className="w-80 border-l bg-card flex flex-col animate-in slide-in-from-right duration-300">
                    <div className="p-4 border-b flex items-center justify-between">
                        <h3 className="font-semibold">Photo Details</h3>
                        <Button variant="ghost" size="icon" onClick={() => setSelectedPhoto(null)}>
                            <X className="w-4 h-4" />
                        </Button>
                    </div>

                    <ScrollArea className="flex-1 p-6">
                        <div className="space-y-6">
                            <div className="rounded-lg overflow-hidden border shadow-sm">
                                <img
                                    src={getMediaUrl(selectedPhoto.filepath)}
                                    alt={selectedPhoto.filename}
                                    className="w-full h-auto bg-muted"
                                />
                            </div>

                            <div className="space-y-4">
                                <DetailItem label="Filename" value={selectedPhoto.filename} />
                                <DetailItem label="Dimensions" value={`${selectedPhoto.width} × ${selectedPhoto.height}`} />
                                <DetailItem label="File Size" value={formatFileSize(selectedPhoto.file_size)} />
                                <DetailItem label="Taken" value={formatDate(selectedPhoto.taken_at)} />
                                <DetailItem label="Location" value={selectedPhoto.filepath} isPath />
                            </div>

                            <Separator />

                            <div className="pt-2 space-y-2">
                                <Button 
                                    variant="destructive" 
                                    className="w-full gap-2" 
                                    onClick={() => deletePhoto(selectedPhoto.id)}
                                >
                                    <Trash2 className="w-4 h-4" />
                                    Delete Photo
                                </Button>
                            </div>
                        </div>
                    </ScrollArea>
                </aside>
            )}
        </div>
    )
}

// Helper for clean UI items
function DetailItem({ label, value, isPath = false }: { label: string; value: string; isPath?: boolean }) {
    return (
        <div className="space-y-1">
            <span className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">{label}</span>
            <p className={`text-sm leading-snug ${isPath ? 'text-xs break-all text-muted-foreground italic' : 'text-foreground font-medium'}`}>
                {value}
            </p>
        </div>
    );
}