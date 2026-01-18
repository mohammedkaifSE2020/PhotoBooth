/**
 * Convert file path to media URL format
 * @param pathValue - File path to convert
 * @returns Properly formatted media URL
 */
export const getMediaUrl = (pathValue: string | undefined): string => {
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

/**
 * Format file size to human-readable format
 * @param bytes - File size in bytes
 * @returns Formatted file size string
 */
export const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
};

/**
 * Format ISO date string to locale string
 * @param dateString - ISO date string
 * @returns Formatted date string
 */
export const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleString();
};
