import { useState, useCallback } from 'react';
import { FilterSettings } from './usePhotoFilters';

export interface Photo {
    id: string;
    filepath: string;
    filename: string;
    height: number;
    width: number;
    taken_at: string;
    thumbnail_path: string;
    file_size: number;
}

export const usePhotoOperations = () => {
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [loading, setLoading] = useState<boolean>(true);

    const loadPhotos = useCallback(async () => {
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
    }, []);

    const deletePhoto = useCallback(async (photoId: string) => {
        if (!confirm('Are you sure you want to delete this photo?')) {
            return false;
        }
        try {
            await window.electronAPI.photo.delete(photoId);
            setPhotos(prevPhotos => prevPhotos.filter(photo => photo.id !== photoId));
            console.log('✅ Photo deleted');
            return true;
        } catch (error) {
            console.error('Error deleting photo:', error);
            alert('Failed to delete photo');
            return false;
        }
    }, []);

    const saveEditedPhoto = useCallback(async (
        canvas: HTMLCanvasElement,
        photo: Photo,
        filterSettings: FilterSettings
    ) => {
        try {
            const blob = await new Promise<Blob>((resolve) => {
                canvas.toBlob((blob) => resolve(blob!), 'image/jpeg', 0.95);
            });

            const arrayBuffer = await blob.arrayBuffer();

            // Save as new photo
            await window.electronAPI.photo.save({
                imageBuffer: arrayBuffer,
                layout_type: 'single',
                metadata: {
                    original_id: photo.id,
                    filters: filterSettings,
                    edited_at: new Date().toISOString(),
                },
            });

            alert('✅ Edited photo saved!');
            await loadPhotos();
            return true;
        } catch (error) {
            console.error('Error saving edited photo:', error);
            alert('Failed to save edited photo');
            return false;
        }
    }, [loadPhotos]);

    return {
        photos,
        setPhotos,
        loading,
        setLoading,
        loadPhotos,
        deletePhoto,
        saveEditedPhoto,
    };
};
