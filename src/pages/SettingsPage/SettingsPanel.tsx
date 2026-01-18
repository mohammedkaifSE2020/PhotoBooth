import { useEffect } from "react";
import { Save, RotateCcw, Loader2, Mail } from 'lucide-react';
import { Button } from "../../../shared/components/ui/button";
import EmailSettingsPanel from "../../components/settings/EmailSettingsPanel";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "../../../shared/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../shared/components/ui/tabs";

import { useSettings } from "./useSettings";
import { useSettingsUI } from "./useSettingsUI";
import { CameraSettingsTab } from "./components/CameraSettingsTab";
import { StorageSettingsTab } from "./components/StorageSettingsTab";

export default function SettingsPanel() {
    const {
        settings,
        loading,
        saving,
        loadSettings,
        saveSettings: saveSettingsAPI,
        resetSettings,
        selectDirectory,
        updateSetting,
    } = useSettings();

    const { message, showMessage } = useSettingsUI();

    useEffect(() => {
        loadSettings().catch(() => {
            showMessage('error', 'Failed to load settings');
        });
    }, []);

    const handleSaveSettings = async () => {
        if (!settings) return;
        try {
            await saveSettingsAPI(settings);
            showMessage('success', 'Settings saved successfully!');
        } catch (error) {
            showMessage('error', 'Failed to save settings');
        }
    };

    const handleSelectDirectory = async () => {
        try {
            const directory = await selectDirectory();
            if (directory) {
                updateSetting('save_directory', directory);
            }
        } catch (error) {
            showMessage('error', 'Failed to select directory');
        }
    };

    const handleResetSettings = async () => {
        if (!confirm('Are you sure you want to reset all settings to defaults?')) {
            return;
        }

        try {
            await resetSettings();
            showMessage('success', 'Settings reset to defaults');
        } catch (error) {
            showMessage('error', 'Failed to reset settings');
        }
    };

    // Loading state
    if (loading) {
        return (
            <div className="h-full flex flex-col items-center justify-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse">Loading preferences...</p>
            </div>
        );
    }

    // Error state
    if (!settings) {
        return (
            <div className="h-full flex items-center justify-center">
                <p className="text-red-400">Failed to load settings</p>
            </div>
        );
    }


    return (
        <div className="min-h-full bg-[#0a0a0a] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-[#0a0a0a] to-[#0a0a0a] overflow-y-auto">
            <div className="max-w-3xl mx-auto p-8 space-y-8">
                {/* Header Section */}
                <div className="space-y-2 pb-4">
                    <h2 className="text-4xl font-extrabold tracking-tight text-white">Settings</h2>
                    <p className="text-zinc-400 text-lg">Hardware and system preferences.</p>
                </div>

                {/* Message Display */}
                {message && (
                    <div
                        className={`p-4 rounded-lg border ${
                            message.type === 'success'
                                ? 'bg-green-500/10 border-green-500/20 text-green-400'
                                : 'bg-red-500/10 border-red-500/20 text-red-400'
                        }`}
                    >
                        {message.text}
                    </div>
                )}

                {/* Tabs */}
                <Tabs defaultValue="camera" className="w-full">
                    <TabsList className="grid w-full grid-cols-3 bg-zinc-900/50 p-1 border border-white/5">
                        <TabsTrigger value="camera" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white">
                            Camera
                        </TabsTrigger>
                        <TabsTrigger value="storage" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white">
                            Storage
                        </TabsTrigger>
                        <TabsTrigger value="email" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white">
                            Email
                        </TabsTrigger>
                    </TabsList>

                    {/* Camera Tab */}
                    <TabsContent value="camera" className="mt-6">
                        <CameraSettingsTab
                            settings={settings}
                            onSettingChange={updateSetting}
                        />
                    </TabsContent>

                    {/* Storage Tab */}
                    <TabsContent value="storage" className="mt-6">
                        <StorageSettingsTab
                            settings={settings}
                            onSettingChange={updateSetting}
                            onSelectDirectory={handleSelectDirectory}
                        />
                    </TabsContent>

                    {/* Email Tab */}
                    <TabsContent value="email" className="mt-6">
                        <Card className="border-white/5 bg-zinc-900/40 backdrop-blur-xl shadow-2xl">
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2">
                                    <Mail className="w-5 h-5 text-blue-500" /> Email Configuration
                                </CardTitle>
                                <CardDescription className="text-zinc-500">
                                    Configure SMTP settings for sending photos via email.
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <EmailSettingsPanel />
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Footer Controls */}
                <div className="flex items-center justify-between pt-8 border-t border-white/5">
                    <Button
                        variant="ghost"
                        onClick={handleResetSettings}
                        className="text-zinc-500 hover:text-white hover:bg-zinc-900 transition-all"
                    >
                        <RotateCcw className="w-4 h-4 mr-2" /> Reset Defaults
                    </Button>
                    <Button
                        onClick={handleSaveSettings}
                        disabled={saving}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-8 shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all"
                    >
                        {saving ? (
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                            <Save className="w-4 h-4 mr-2" />
                        )}
                        Apply Settings
                    </Button>
                </div>
            </div>
        </div>
    );
}