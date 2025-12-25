import { useState, useEffect } from "react";

interface Photo {
    id: string;
    filePath: string;
    fileName: string;
    height: number;
    width: number;
    takenAt: string;
    thumbnailPath: string;
    fileSize: number;
}

export default function PhotoGallery() {
    const [photos, setPhotos] = useState<Photo[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [selectedPhoto, setSelectedPhoto] = useState<Photo | null>(null);

    useEffect(() => {
        loadPhotos();
    })

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

    return (
        <div className="h-full flex">
            {/* Photo Grid */}
            <div className="flex-1 overflow-y-auto p-6">
                <div className="mb-4 flex items-center justify-between">
                    <h2 className="text-xl font-semibold">
                        {photos.length} Photo{photos.length !== 1 ? 's' : ''}
                    </h2>
                    <button
                        onClick={loadPhotos}
                        className="px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                    >
                        🔄 Refresh
                    </button>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {photos.map((photo) => (
                        <div
                            key={photo.id}
                            onClick={() => setSelectedPhoto(photo)}
                            className={`
                                        relative aspect-square bg-gray-800 rounded-lg overflow-hidden cursor-pointer
                                        transition-all duration-200 hover:ring-2 hover:ring-blue-500 hover:scale-105
                                        ${selectedPhoto?.id === photo.id ? 'ring-2 ring-blue-500' : ''}
                                    `}
                        >
                            <img
                                src={`file://${photo.thumbnailPath || photo.filePath}`}
                                alt={photo.fileName}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                    // Fallback if thumbnail fails
                                    e.currentTarget.src = `file://${photo.filePath}`;
                                }}
                            />
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent p-2">
                                <p className="text-xs text-white truncate">{photo.fileName}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Photo Details Sidebar */}
            {selectedPhoto && (
                <div className="w-80 bg-gray-800 border-l border-gray-700 p-6 overflow-y-auto">
                    <div className="mb-4">
                        <img
                            src={`file://${selectedPhoto.filePath}`}
                            alt={selectedPhoto.fileName}
                            className="w-full rounded-lg"
                        />
                    </div>

                    <h3 className="text-lg font-semibold mb-4">Photo Details</h3>

                    <div className="space-y-3 text-sm">
                        <div>
                            <span className="text-gray-400">Filename:</span>
                            <p className="text-white break-all">{selectedPhoto.fileName}</p>
                        </div>

                        <div>
                            <span className="text-gray-400">Dimensions:</span>
                            <p className="text-white">
                                {selectedPhoto.width} × {selectedPhoto.height}
                            </p>
                        </div>

                        <div>
                            <span className="text-gray-400">File Size:</span>
                            <p className="text-white">{formatFileSize(selectedPhoto.fileSize)}</p>
                        </div>

                        <div>
                            <span className="text-gray-400">Taken:</span>
                            <p className="text-white">{formatDate(selectedPhoto.takenAt)}</p>
                        </div>

                        <div>
                            <span className="text-gray-400">Path:</span>
                            <p className="text-white text-xs break-all">{selectedPhoto.filePath}</p>
                        </div>
                    </div>

                    <div className="mt-6 space-y-2">
                        <button
                            onClick={() => deletePhoto(selectedPhoto.id)}
                            className="w-full px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                        >
                            🗑️ Delete Photo
                        </button>

                        <button
                            onClick={() => setSelectedPhoto(null)}
                            className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors"
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}