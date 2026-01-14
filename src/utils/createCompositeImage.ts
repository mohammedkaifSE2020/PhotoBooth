interface CapturedPhoto {
    dataUrl: string;
    timestamp: Date;
}
export const createCompositeImage = async (photos: CapturedPhoto[], layout: string): Promise<string> => {
    if (layout === 'single') return photos[0].dataUrl;

    const photoWidth = 600;
        const photoHeight = 400;
        const spacing = 10;
        const padding = 20;

        const photosCount = photos.length;

        // Create strip layout
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        // Vertical strip layout
        canvas.width = photoWidth + (padding * 2);
        canvas.height = (photoHeight * photosCount) + (spacing * (photosCount - 1)) + (padding * 2);

        // White background
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Draw photos
        for (let i = 0; i < photos.length; i++) {
            const img = new Image();
            await new Promise((resolve) => {
                img.onload = resolve;
                img.src = photos[i].dataUrl;
            });

            const y = padding + (i * (photoHeight + spacing));
            ctx.drawImage(img, padding, y, photoWidth, photoHeight);

            // Add border
            ctx.strokeStyle = '#e5e7eb';
            ctx.lineWidth = 2;
            ctx.strokeRect(padding, y, photoWidth, photoHeight);
        }

        // Add watermark
        ctx.fillStyle = '#9ca3af';
        ctx.font = '14px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('PhotoBooth Pro', canvas.width / 2, canvas.height - 8);

        return canvas.toDataURL('image/jpeg', 0.95);
};