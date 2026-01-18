import React from 'react';
import { Maximize2 } from 'lucide-react';
import { Card } from '../../../shared/components/ui/card';
import { ScrollArea } from '../../../shared/components/ui/scroll-area';
import { Badge } from '../../../shared/components/ui/badge';
import { getMediaUrl } from './utils';
import { Photo } from '../../hooks/usePhotoOperations';

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
    return (
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
            </header>

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
                                    onClick={() => onSelectPhoto(photo)}
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
    );
};
