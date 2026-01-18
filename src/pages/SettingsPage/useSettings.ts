import { useState, useCallback } from 'react';

export interface Settings {
    resolution: string;
    countdown_duration: number;
    enable_flash: boolean | number | undefined;
    enable_sound: number | boolean | undefined;
    save_directory?: string;
    photo_format: string;
    photo_quality: number;
}

export const useSettings = () => {
    const [settings, setSettings] = useState<Settings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const loadSettings = useCallback(async () => {
        try {
            setLoading(true);
            const fetchedSettings = await window.electronAPI.settings.get();
            setSettings(fetchedSettings);
            return fetchedSettings;
        } catch (error) {
            console.error('Error loading settings:', error);
            throw new Error('Failed to load settings');
        } finally {
            setLoading(false);
        }
    }, []);

    const saveSettings = useCallback(async (settingsToSave: Settings) => {
        try {
            setSaving(true);
            await window.electronAPI.settings.update(settingsToSave);
            setSettings(settingsToSave);
            return true;
        } catch (error) {
            console.error('Error saving settings:', error);
            throw new Error('Failed to save settings');
        } finally {
            setSaving(false);
        }
    }, []);

    const resetSettings = useCallback(async () => {
        try {
            setSaving(true);
            const defaultSettings = await window.electronAPI.settings.reset();
            setSettings(defaultSettings);
            return defaultSettings;
        } catch (error) {
            console.error('Error resetting settings:', error);
            throw new Error('Failed to reset settings');
        } finally {
            setSaving(false);
        }
    }, []);

    const selectDirectory = useCallback(async () => {
        try {
            const directory = await window.electronAPI.file.selectDirectory();
            return directory;
        } catch (error) {
            console.error('Error selecting directory:', error);
            throw new Error('Failed to select directory');
        }
    }, []);

    const updateSetting = useCallback((key: keyof Settings, value: any) => {
        if (settings) {
            setSettings({ ...settings, [key]: value });
        }
    }, [settings]);

    const updateSettings = useCallback((updates: Partial<Settings>) => {
        if (settings) {
            setSettings({ ...settings, ...updates });
        }
    }, [settings]);

    return {
        settings,
        setSettings,
        loading,
        saving,
        loadSettings,
        saveSettings,
        resetSettings,
        selectDirectory,
        updateSetting,
        updateSettings,
    };
};
