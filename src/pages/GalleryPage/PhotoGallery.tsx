import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { RefreshCw } from "lucide-react";
import { Button } from "../../../shared/components/ui/button";

import { usePhotoFilters } from "../../hooks/usePhotoFilters";
import { usePhotoOperations, Photo } from "../../hooks/usePhotoOperations";
import { PhotoGrid } from "./PhotoGrid";
import { PhotoDetailsPanel } from "./PhotoDetailsPanel";
import { getMediaUrl } from "./utils";

export default function PhotoGallery() {
    const navigate = useNavigate();
    const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

    // Photo operations hook
    const { 
        photos, 
        loading, 
        loadPhotos, 
        deletePhoto: deletePhotoOp, 
        saveEditedPhoto 
    } = usePhotoOperations();

    // Filter functionality hook
    const {
        filterSettings,
        canvasRef,
        originalImageRef,
        applyFilter,
        resetFilters,
        updateFilterType,
        updateBrightness,
        updateContrast,
    } = usePhotoFilters();

    const [isEditing, setIsEditing] = useState(false);

    // Load photos on mount
    useEffect(() => {
        loadPhotos();
    }, [loadPhotos]);

    // Apply filter when settings change or editing state changes
    useEffect(() => {
        if (selectedPhoto && isEditing) {
            applyFilter(getMediaUrl(selectedPhoto.filepath), selectedPhoto.id);
        }
    }, [selectedPhoto, isEditing, filterSettings, applyFilter]);

    const startEditing = () => {
        setIsEditing(true);
        resetFilters();
    };

    const stopEditing = () => {
        setIsEditing(false);
        resetFilters();
    };

    const handleSaveEditedPhoto = async () => {
        if (!canvasRef.current || !selectedPhoto) return;
        const success = await saveEditedPhoto(canvasRef.current, selectedPhoto, filterSettings);
        if (success) {
            stopEditing();
        }
    };

    const handleDeletePhoto = async () => {
        if (!selectedPhoto) return;
        const success = await deletePhotoOp(selectedPhoto.id);
        if (success && selectedPhoto?.id === selectedPhoto.id) {
            setSelectedPhoto(null);
        }
    };

    const navigateToExport = () => {
        if (selectedPhoto) {
            navigate(`/share-export?id=${selectedPhoto.id}&path=${encodeURIComponent(selectedPhoto.filepath)}`);
        }
    };

    // Loading state
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

    // Empty state
    if (photos.length === 0) {
        return (
            <div className="h-full flex items-center justify-center p-8">
                <div className="text-center max-w-md">
                    <div className="text-6xl mb-4">📷</div>
                    <h2 className="text-2xl font-bold mb-2">No Photos Yet</h2>
                    <p className="text-gray-400 mb-6">
                        Capture your first photo to see it here
                    </p>
                    <Button
                        onClick={loadPhotos}
                        className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Refresh
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="h-screen flex bg-[#0d0d0f] text-slate-200 overflow-hidden select-none">
            {/* Photo Grid with Sync Button */}
            <div className="flex-1 flex flex-col">
                <header className="h-16 border-b border-white/5 flex items-center justify-between px-8 bg-black/20 backdrop-blur-xl shrink-0">
                    <div />
                    <Button 
                        variant="ghost" 
                        size="sm" 
                        onClick={loadPhotos} 
                        className="h-9 gap-2 hover:bg-white/5 text-slate-400 hover:text-white transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                        <span className="text-xs font-medium">Sync Library</span>
                    </Button>
                </header>
                <PhotoGrid
                    photos={photos}
                    selectedPhoto={selectedPhoto}
                    onSelectPhoto={(photo) => {
                        setSelectedPhoto(photo);
                        setIsEditing(false);
                    }}
                />
            </div>

            {/* Details & Editor Sidebar */}
            {selectedPhoto && (
                <PhotoDetailsPanel
                    selectedPhoto={selectedPhoto}
                    isEditing={isEditing}
                    filterSettings={filterSettings}
                    canvasRef={canvasRef}
                    originalImageRef={originalImageRef}
                    onClose={() => setSelectedPhoto(null)}
                    onEditClick={startEditing}
                    onStopEditing={stopEditing}
                    onFilterTypeChange={updateFilterType}
                    onBrightnessChange={updateBrightness}
                    onContrastChange={updateContrast}
                    onSaveEdit={handleSaveEditedPhoto}
                    onDelete={handleDeletePhoto}
                    onNavigateExport={navigateToExport}
                />
            )}
        </div>
    );
}