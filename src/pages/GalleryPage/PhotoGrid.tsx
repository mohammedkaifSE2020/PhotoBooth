import React from 'react';
import { Maximize2, CheckCircle2, Circle } from 'lucide-react'; // Added icons
import { Card } from '../../../shared/components/ui/card';
import { ScrollArea } from '../../../shared/components/ui/scroll-area';
import { Badge } from '../../../shared/components/ui/badge';
import { getMediaUrl } from './utils';
import { Photo } from '../../hooks/usePhotoOperations';
import { useGroupStore } from '@/store/useGroupStore'; // Import your Zustand store

interface PhotoGridProps {
    photos: Photo[];
    selectedPhoto: Photo | null;
    onSelectPhoto: (photo: Photo) => void;
}

export const PhotoGrid: React.FC<PhotoGridProps> = ({
    photos,
    selectedPhoto,
    onSelectPhoto,
}) => {
    // 1. Pull state from Zustand
    const { isSelectionMode, selectedPhotos, togglePhoto } = useGroupStore();

    const handleItemClick = (photo: Photo) => {
        if (isSelectionMode) {
            // If in creation mode, toggle the photo in the group array
            togglePhoto(photo);
        } else {
            // Otherwise, keep the original preview selection behavior
            onSelectPhoto(photo);
        }
    };

    return (
        <main className="flex-1 flex flex-col min-w-0 border-r border-white/5 bg-[#0d0d0f]">
            <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-black/20 backdrop-blur-xl shrink-0">
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <h2 className="text-lg font-semibold tracking-tight">
                            {isSelectionMode ? 'Select Photos for Group' : 'Media Library'}
                        </h2>
                        <Badge variant="secondary" className="bg-blue-500/10 text-blue-400 border-none px-2 py-0 text-[10px] uppercase font-bold">
                            {isSelectionMode ? `${selectedPhotos.length} / 6 Selected` : `${photos.length} Total`}
                        </Badge>
                    </div>
                </div>
                
                {isSelectionMode && (
                    <Badge className="bg-blue-600 animate-pulse uppercase text-[10px] tracking-widest">
                        Selection Mode Active
                    </Badge>
                )}
            </header>

            <ScrollArea className="flex-1">
                <div className="p-8">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                        {photos.map((photo) => {
                            // Check if this specific photo is in the current selection
                            const isSelectedInGroup = selectedPhotos.some(p => p.id === photo.id);
                            const isMainSelected = selectedPhoto?.id === photo.id;

                            return (
                                <div key={photo.id} className="relative group">
                                    <Card
                                        className={`group relative aspect-square overflow-hidden cursor-pointer border-0 transition-all duration-500 rounded-xl bg-slate-900 shadow-2xl 
                                        ${isSelectedInGroup 
                                            ? 'ring-4 ring-blue-500 scale-95 shadow-[0_0_20px_rgba(59,130,246,0.5)]' 
                                            : isMainSelected 
                                                ? 'ring-2 ring-blue-500 ring-offset-4 ring-offset-[#0d0d0f] scale-95' 
                                                : 'hover:scale-[1.02]'
                                        }`}
                                        onClick={() => handleItemClick(photo)}
                                    >
                                        <img
                                            src={getMediaUrl(photo.thumbnail_path || photo.filepath)}
                                            alt={photo.filename}
                                            className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${
                                                isSelectedInGroup ? 'opacity-50' : ''
                                            }`}
                                        />

                                        {/* Selection Checkbox Overlay */}
                                        {isSelectionMode && (
                                            <div className="absolute top-3 right-3 z-10">
                                                {isSelectedInGroup ? (
                                                    <CheckCircle2 className="text-blue-500 fill-white rounded-full size-6 shadow-lg" />
                                                ) : (
                                                    <Circle className="text-white/40 size-6" />
                                                )}
                                            </div>
                                        )}

                                        {/* Gradient Overlay */}
                                        <div className={`absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent transition-opacity 
                                            ${isSelectedInGroup ? 'opacity-80' : 'opacity-40 group-hover:opacity-100'}`} 
                                        />

                                        {/* Original Maximize Icon (Only show if not in selection mode) */}
                                        {!isSelectionMode && (
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                                                <div className="bg-white/10 backdrop-blur-md p-3 rounded-full border border-white/20">
                                                    <Maximize2 className="text-white size-5" />
                                                </div>
                                            </div>
                                        )}
                                    </Card>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </ScrollArea>
        </main>
    );
};