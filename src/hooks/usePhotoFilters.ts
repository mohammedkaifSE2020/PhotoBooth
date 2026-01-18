import { useState, useRef, useCallback } from 'react';

export type FilterType = 'none' | 'grayscale' | 'sepia' | 'brightness' | 'contrast' | 'invert';

export interface FilterSettings {
    type: FilterType;
    brightness: number;
    contrast: number;
}

const DEFAULT_FILTER_SETTINGS: FilterSettings = {
    type: 'none',
    brightness: 100,
    contrast: 100,
};

export const usePhotoFilters = () => {
    const [filterSettings, setFilterSettings] = useState<FilterSettings>(DEFAULT_FILTER_SETTINGS);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const originalImageRef = useRef<HTMLImageElement | null>(null);

    const applyGrayscaleFilter = (data: Uint8ClampedArray) => {
        for (let i = 0; i < data.length; i += 4) {
            const avg = (data[i] + data[i + 1] + data[i + 2]) / 3;
            data[i] = avg;     // Red
            data[i + 1] = avg; // Green
            data[i + 2] = avg; // Blue
        }
    };

    const applySepiaFilter = (data: Uint8ClampedArray) => {
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];

            data[i] = Math.min(255, r * 0.393 + g * 0.769 + b * 0.189);
            data[i + 1] = Math.min(255, r * 0.349 + g * 0.686 + b * 0.168);
            data[i + 2] = Math.min(255, r * 0.272 + g * 0.534 + b * 0.131);
        }
    };

    const applyInvertFilter = (data: Uint8ClampedArray) => {
        for (let i = 0; i < data.length; i += 4) {
            data[i] = 255 - data[i];
            data[i + 1] = 255 - data[i + 1];
            data[i + 2] = 255 - data[i + 2];
        }
    };

    const applyBrightnessAdjustment = (data: Uint8ClampedArray, brightness: number) => {
        const brightnessFactor = brightness / 100;
        for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, data[i] * brightnessFactor);
            data[i + 1] = Math.min(255, data[i + 1] * brightnessFactor);
            data[i + 2] = Math.min(255, data[i + 2] * brightnessFactor);
        }
    };

    const applyContrastAdjustment = (data: Uint8ClampedArray, contrast: number) => {
        const contrastFactor = contrast / 100;
        const intercept = 128 * (1 - contrastFactor);
        for (let i = 0; i < data.length; i += 4) {
            data[i] = Math.min(255, Math.max(0, data[i] * contrastFactor + intercept));
            data[i + 1] = Math.min(255, Math.max(0, data[i + 1] * contrastFactor + intercept));
            data[i + 2] = Math.min(255, Math.max(0, data[i + 2] * contrastFactor + intercept));
        }
    };

    const applyFilter = useCallback((imageSrc: string, photoId?: string) => {
        if (!canvasRef.current) return;

        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) return;

        const img = new Image();
        const expectedId = photoId;
        img.src = imageSrc;
        originalImageRef.current = img;

        img.onload = () => {
            if (photoId && expectedId !== photoId) return;

            canvas.width = img.naturalWidth;
            canvas.height = img.naturalHeight;

            ctx.filter = 'none';
            ctx.drawImage(img, 0, 0);

            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;

            // Apply type filters
            switch (filterSettings.type) {
                case 'grayscale':
                    applyGrayscaleFilter(data);
                    break;
                case 'sepia':
                    applySepiaFilter(data);
                    break;
                case 'invert':
                    applyInvertFilter(data);
                    break;
            }

            // Apply adjustments
            applyBrightnessAdjustment(data, filterSettings.brightness);
            applyContrastAdjustment(data, filterSettings.contrast);

            ctx.putImageData(imageData, 0, 0);
        };

        img.onerror = (err) => {
            console.error('Failed to load image for editing', err);
        };
    }, [filterSettings]);

    const resetFilters = useCallback(() => {
        setFilterSettings(DEFAULT_FILTER_SETTINGS);
    }, []);

    const updateFilterType = useCallback((type: FilterType) => {
        setFilterSettings(prev => ({ ...prev, type }));
    }, []);

    const updateBrightness = useCallback((brightness: number) => {
        setFilterSettings(prev => ({ ...prev, brightness }));
    }, []);

    const updateContrast = useCallback((contrast: number) => {
        setFilterSettings(prev => ({ ...prev, contrast }));
    }, []);

    return {
        filterSettings,
        setFilterSettings,
        canvasRef,
        originalImageRef,
        applyFilter,
        resetFilters,
        updateFilterType,
        updateBrightness,
        updateContrast,
    };
};
