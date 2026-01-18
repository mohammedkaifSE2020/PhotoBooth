import React from 'react';
import {
    FileText, X, Ruler, HardDrive, Calendar, Trash2, 
    Palette, Save, Undo2, Wand2, Sun, Contrast, Share2
} from 'lucide-react';
import { Button } from '../../../shared/components/ui/button';
import { ScrollArea } from '../../../shared/components/ui/scroll-area';
import { Separator } from '../../../shared/components/ui/separator';
import { Badge } from '../../../shared/components/ui/badge';
import { Slider } from '../../../shared/components/ui/slider';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../../shared/components/ui/tabs';
import { getMediaUrl, formatFileSize, formatDate } from './utils';
import { FilterType, FilterSettings } from '../../hooks/usePhotoFilters';
import { Photo } from '../../hooks/usePhotoOperations';

interface PhotoDetailsPanelProps {
    selectedPhoto: Photo;
    isEditing: boolean;
    filterSettings: FilterSettings;
    canvasRef: React.RefObject<HTMLCanvasElement>;
    originalImageRef: React.RefObject<HTMLImageElement>;
    onClose: () => void;
    onEditClick: () => void;
    onStopEditing: () => void;
    onFilterTypeChange: (type: FilterType) => void;
    onBrightnessChange: (brightness: number) => void;
    onContrastChange: (contrast: number) => void;
    onSaveEdit: () => void;
    onDelete: () => void;
    onNavigateExport: () => void;
}

const DetailItem = ({ 
    icon, 
    label, 
    value, 
    isPath = false 
}: { 
    icon: React.ReactNode; 
    label: string; 
    value: string; 
    isPath?: boolean 
}) => {
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
};

export const PhotoDetailsPanel: React.FC<PhotoDetailsPanelProps> = ({
    selectedPhoto,
    isEditing,
    filterSettings,
    canvasRef,
    originalImageRef,
    onClose,
    onEditClick,
    onStopEditing,
    onFilterTypeChange,
    onBrightnessChange,
    onContrastChange,
    onSaveEdit,
    onDelete,
    onNavigateExport,
}) => {
    const handleTabChange = (value: string) => {
        if (value === 'edit' && !isEditing) {
            onEditClick();
        }
    };

    return (
        <aside className="w-[400px] bg-[#0a0a0c] flex flex-col animate-in slide-in-from-right duration-500 shadow-[-20px_0_50px_rgba(0,0,0,0.5)] border-l border-white/5">
            <div className="p-4 flex items-center justify-between bg-black/40">
                <Tabs defaultValue="metadata" className="w-full" onValueChange={handleTabChange}>
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
                        <Button 
                            variant="ghost" 
                            size="icon" 
                            onClick={onClose} 
                            className="h-8 w-8 hover:bg-white/10 rounded-full"
                        >
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
                                    onClick={onNavigateExport}
                                    className="
                                        w-full h-11 
                                        relative overflow-hidden
                                        flex items-center justify-center gap-2.5 
                                        bg-blue-500/10 hover:bg-blue-600 
                                        text-blue-400 hover:text-white 
                                        border border-blue-500/20 hover:border-blue-400/50
                                        transition-all duration-300 group
                                        rounded-xl shadow-lg shadow-blue-900/10
                                    "
                                >
                                    <Share2 className="w-4 h-4 transition-transform group-hover:scale-110" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.15em] leading-none">
                                        Share & Export
                                    </span>
                                </Button>

                                <Button
                                    variant="destructive"
                                    onClick={onDelete}
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
                                    <Trash2 className="w-4 h-4 transition-transform group-hover:-rotate-12 group-hover:scale-110" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.15em] leading-none">
                                        Delete Permanent
                                    </span>
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
                                                onClick={() => onFilterTypeChange(f)}
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
                                            onValueChange={([v]) => onBrightnessChange(v)}
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
                                            onValueChange={([v]) => onContrastChange(v)}
                                        />
                                    </div>
                                </div>

                                <Separator className="bg-white/5" />

                                <div className="flex gap-3">
                                    <Button
                                        className="flex-1 h-11 gap-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl shadow-lg shadow-blue-600/20"
                                        onClick={onSaveEdit}
                                    >
                                        <Save className="w-4 h-4" />
                                        <span className="text-[10px] font-bold uppercase tracking-widest">Save New</span>
                                    </Button>
                                    <Button
                                        variant="outline"
                                        className="h-11 px-4 border-white/10 bg-white/5 rounded-xl hover:bg-white/10"
                                        onClick={onStopEditing}
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
    );
};
