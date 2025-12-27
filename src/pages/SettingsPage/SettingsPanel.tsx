import { useState, useEffect } from "react";

interface Settings {
    resolution: string;
    countdown_duration: number;
    enable_flash: boolean;
    enable_sound: boolean;
    save_directory?: string;
    photo_format: string;
    photo_quality: number;
}

export default function SettingsPanel() {
    const [settings, setSettings] = useState<Settings | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        try {
            setLoading(true);
            const fetchedSettings = await window.electronAPI.settings.get();
            setSettings(fetchedSettings);
        } catch (error) {
            console.error('Error loading settings:', error);
            showMessage('error', 'Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const saveSettings = async () => {
        if (!settings) return;

        try {
            setSaving(true);
            await window.electronAPI.settings.update(settings);
            showMessage('success', 'Settings saved successfully!');
        } catch (error) {
            console.error('Error saving settings:', error);
            showMessage('error', 'Failed to save settings');
        } finally {
            setSaving(false);
        }
    };

    const selectDirectory = async () => {
        try {
            const directory = await window.electronAPI.file.selectDirectory();
            if (directory) {
                setSettings({ ...settings!, save_directory: directory });
            }
        } catch (error) {
            console.error('Error selecting directory:', error);
            showMessage('error', 'Failed to select directory');
        }
    };

    const resetSettings = async () => {
        if (!confirm('Are you sure you want to reset all settings to defaults?')) {
            return;
        }

        try {
            setSaving(true);
            const defaultSettings = await window.electronAPI.settings.get();
            setSettings(defaultSettings);
            showMessage('success', 'Settings reset to defaults');
        } catch (error) {
            console.error('Error resetting settings:', error);
            showMessage('error', 'Failed to reset settings');
        } finally {
            setSaving(false);
        }
    };

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 3000);
    };

    if (loading) {
        return (
            <div className="h-full flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
                    <p className="text-gray-400">Loading settings...</p>
                </div>
            </div>
        );
    }

    if (!settings) {
        return (
            <div className="h-full flex items-center justify-center">
                <p className="text-red-400">Failed to load settings</p>
            </div>
        );
    }


    return (
        <div>
            <div className="w-full h-full overflow-y-auto">
                <div className="max-w-2xl mx-auto p-8 pb-20">
                    <h2 className="text-3xl font-bold mb-2">Settings</h2>
                    <p className="text-gray-400 mb-8">Configure your PhotoBooth preferences</p>

                    {/* Success/Error Message */}
                    {message && (
                        <div
                            className={`mb-6 p-4 rounded-lg ${message.type === 'success'
                                ? 'bg-green-600 text-white'
                                : 'bg-red-600 text-white'
                                }`}
                        >
                            {message.text}
                        </div>
                    )}

                    {/* Camera Settings */}
                    <div className="bg-gray-800 rounded-lg p-6 mb-6">
                        <h3 className="text-xl font-semibold mb-4">📷 Camera Settings</h3>

                        <div className="space-y-4">
                            {/* Resolution */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Resolution</label>
                                <select
                                    value={settings.resolution}
                                    onChange={(e) => setSettings({ ...settings, resolution: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="1920x1080">1920x1080 (Full HD)</option>
                                    <option value="1280x720">1280x720 (HD)</option>
                                    <option value="3840x2160">3840x2160 (4K)</option>
                                </select>
                            </div>

                            {/* Countdown Duration */}
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Countdown Duration: {settings.countdown_duration}s
                                </label>
                                <input
                                    type="range"
                                    min="0"
                                    max="10"
                                    value={settings.countdown_duration}
                                    onChange={(e) =>
                                        setSettings({ ...settings, countdown_duration: parseInt(e.target.value) })
                                    }
                                    className="w-full"
                                />
                                <div className="flex justify-between text-xs text-gray-400 mt-1">
                                    <span>0s (Instant)</span>
                                    <span>10s</span>
                                </div>
                            </div>

                            {/* Flash Effect */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <label className="block text-sm font-medium">Flash Effect</label>
                                    <p className="text-xs text-gray-400">Screen flash when capturing</p>
                                </div>
                                <button
                                    onClick={() => setSettings({ ...settings, enable_flash: !settings.enable_flash })}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.enable_flash ? 'bg-blue-600' : 'bg-gray-600'
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.enable_flash ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>

                            {/* Sound Effects */}
                            <div className="flex items-center justify-between">
                                <div>
                                    <label className="block text-sm font-medium">Sound Effects</label>
                                    <p className="text-xs text-gray-400">Countdown beeps and shutter sound</p>
                                </div>
                                <button
                                    onClick={() => setSettings({ ...settings, enable_sound: !settings.enable_sound })}
                                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${settings.enable_sound ? 'bg-blue-600' : 'bg-gray-600'
                                        }`}
                                >
                                    <span
                                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${settings.enable_sound ? 'translate-x-6' : 'translate-x-1'
                                            }`}
                                    />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Storage Settings */}
                    <div className="bg-gray-800 rounded-lg p-6 mb-6">
                        <h3 className="text-xl font-semibold mb-4">💾 Storage Settings</h3>

                        <div className="space-y-4">
                            {/* Save Directory */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Save Directory</label>
                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        value={settings.save_directory || 'Default location'}
                                        readOnly
                                        className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg"
                                    />
                                    <button
                                        onClick={selectDirectory}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                    >
                                        Browse
                                    </button>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">
                                    Photos are saved in folders organized by date (YYYY-MM-DD)
                                </p>
                            </div>

                            {/* Photo Format */}
                            <div>
                                <label className="block text-sm font-medium mb-2">Photo Format</label>
                                <select
                                    value={settings.photo_format}
                                    onChange={(e) => setSettings({ ...settings, photo_format: e.target.value })}
                                    className="w-full px-4 py-2 bg-gray-700 text-white rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                >
                                    <option value="jpg">JPG</option>
                                    <option value="png">PNG</option>
                                </select>
                            </div>

                            {/* Photo Quality */}
                            <div>
                                <label className="block text-sm font-medium mb-2">
                                    Photo Quality: {settings.photo_quality}%
                                </label>
                                <input
                                    type="range"
                                    min="60"
                                    max="100"
                                    value={settings.photo_quality}
                                    onChange={(e) =>
                                        setSettings({ ...settings, photo_quality: parseInt(e.target.value) })
                                    }
                                    className="w-full"
                                />
                                <div className="flex justify-between text-xs text-gray-400 mt-1">
                                    <span>60% (Smaller files)</span>
                                    <span>100% (Best quality)</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-4">
                        <button
                            onClick={saveSettings}
                            disabled={saving}
                            className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {saving ? 'Saving...' : '💾 Save Settings'}
                        </button>

                        <button
                            onClick={resetSettings}
                            disabled={saving}
                            className="px-6 py-3 bg-gray-700 text-white rounded-lg hover:bg-gray-600 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            🔄 Reset to Defaults
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}