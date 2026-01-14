import { useEffect, useState } from 'react';

export function useSettings() {
    const [settings, setSettings] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [Settingserror, setError] = useState<string | null>(null);

    useEffect(() => {
        const loadSettings = async () => {
            try {
                const currentSettings = await window.electronAPI.settings.get();
                setSettings(currentSettings);
            } catch (err) {
                console.error('Failed to load settings:', err);
                setError('Failed to load settings');
            } finally {
                setLoading(false);
            }
        };

        loadSettings();
    }, []);

    return {
        settings,
        loading,
        Settingserror,
    };
}
