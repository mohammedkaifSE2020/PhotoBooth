import React, { useEffect, useState } from 'react';
import { Plus, Image as ImageIcon, Trash2, FilePlus, RefreshCcw } from 'lucide-react';
import { Button } from '../../../shared/components/ui/button';
import { Card } from '../../../shared/components/ui/card';
import { ScrollArea } from '../../../shared/components/ui/scroll-area';
import { Badge } from '../../../shared/components/ui/badge';
import { getMediaUrl } from '../GalleryPage/utils';

interface FrameAsset {
    id: string;
    name: string;
    filepath: string;
    width: number;
    height: number;
    aspect_ratio: number;
}

export const ImportFrameGallery: React.FC = () => {
    const [frames, setFrames] = useState<FrameAsset[]>([]);
    const [isLoading, setIsLoading] = useState(false);

    const loadFrames = async () => {
        setIsLoading(true);
        try {
            const data = await window.electronAPI.layout.getAllFrames();
            if(data && Array.isArray(data)) {
                setFrames(data);
            } else {                
                console.warn("Unexpected frame data format:", data);
                setFrames([]);
            }
            setFrames(data);
        } catch (error) {
            console.error("Failed to load frames:", error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadFrames();
    }, []);

    const handleImportFrame = async () => {
        try {
            // 1. Native File Dialog
            const sourcePath = await window.electronAPI.file.SelectImage();
            if (!sourcePath) return;

            // 2. Extract name
            const fileName = sourcePath.split(/[\\/]/).pop()?.split('.')[0] || 'New Frame';

            // 3. Backend Call to copy file and save to DB
            await window.electronAPI.layout.importFrame(sourcePath, fileName);
            
            // 4. Refresh List
            loadFrames();
        } catch (error) {
            console.error("Import failed:", error);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Are you sure you want to delete this frame?")) {
            await window.electronAPI.layout.deleteFrame(id);
            loadFrames();
        }
    };

    return (
        <div className="flex flex-col h-full bg-[#0d0d0f] text-slate-200">
            {/* --- Header Area --- */}
            <header className="h-20 border-b border-white/5 flex items-center justify-between px-8 bg-black/20 backdrop-blur-xl shrink-0">
                <div className="flex items-center gap-4">
                    <div className="size-10 bg-blue-600/10 rounded-xl flex items-center justify-center border border-blue-500/20">
                        <ImageIcon className="text-blue-500 size-5" />
                    </div>
                    <div>
                        <h2 className="text-lg font-bold tracking-tight">Frame Library</h2>
                        <p className="text-[10px] text-slate-500 uppercase font-bold tracking-widest">Overlay Assets</p>
                    </div>
                </div>

                <div className="flex items-center gap-3">
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={loadFrames} 
                        className={`text-slate-400 hover:text-white ${isLoading ? 'animate-spin' : ''}`}
                    >
                        <RefreshCcw className="size-4" />
                    </Button>
                    <Button 
                        onClick={handleImportFrame}
                        className="bg-blue-600 hover:bg-blue-500 text-white gap-2 rounded-xl shadow-lg shadow-blue-600/20 px-6"
                    >
                        <FilePlus className="size-4" />
                        <span className="text-xs font-bold uppercase tracking-wider">Import Frame</span>
                    </Button>
                </div>
            </header>

            {/* --- Gallery Grid --- */}
            <ScrollArea className="flex-1">
                <div className="p-8">
                    {frames.length === 0 && !isLoading ? (
                        <div className="flex flex-col items-center justify-center py-32 border-2 border-dashed border-white/5 rounded-3xl">
                            <ImageIcon className="size-12 text-slate-700 mb-4" />
                            <p className="text-slate-500 font-medium">No frames imported yet.</p>
                            <Button variant="link" onClick={handleImportFrame} className="text-blue-500">Click here to start</Button>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
                            {frames.map((frame) => (
                                <Card key={frame.id} className="group relative bg-slate-900/40 border-white/5 overflow-hidden rounded-2xl hover:border-blue-500/50 transition-all duration-300">
                                    {/* Checkerboard Preview Area */}
                                    <div className="aspect-[3/4] checkerboard-bg relative flex items-center justify-center p-4">
                                        <img 
                                            src={getMediaUrl(frame.filepath)} 
                                            alt={frame.name}
                                            className="max-w-full max-h-full object-contain drop-shadow-2xl transition-transform duration-500 group-hover:scale-105"
                                        />
                                        
                                        {/* Overlay Actions */}
                                        <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 backdrop-blur-sm">
                                            <Button 
                                                variant="destructive" 
                                                size="icon" 
                                                onClick={() => handleDelete(frame.id)}
                                                className="rounded-full size-10 shadow-xl"
                                            >
                                                <Trash2 className="size-4" />
                                            </Button>
                                        </div>
                                    </div>

                                    {/* Frame Info */}
                                    <div className="p-4 bg-black/40 border-t border-white/5">
                                        <p className="text-xs font-bold text-slate-200 truncate mb-1">{frame.name}</p>
                                        <div className="flex items-center justify-between">
                                            <Badge variant="outline" className="text-[9px] border-white/10 text-slate-500 font-mono">
                                                {frame.width}x{frame.height}
                                            </Badge>
                                            <span className="text-[9px] text-slate-600 font-bold uppercase tracking-tighter">
                                                PNG Asset
                                            </span>
                                        </div>
                                    </div>
                                </Card>
                            ))}
                        </div>
                    )}
                </div>
            </ScrollArea>
        </div>
    );
};