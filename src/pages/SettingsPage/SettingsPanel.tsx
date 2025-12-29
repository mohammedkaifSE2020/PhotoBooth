import { useState, useEffect } from "react";

import { Camera, HardDrive, Save, RotateCcw, FolderOpen, Image as ImageIcon, Volume2, Zap, Loader2, Monitor } from 'lucide-react';
import { Button } from "../../../../PhotoBooth/shared/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../../../../PhotoBooth/shared/components/ui/card";
import { Label } from "../../../../PhotoBooth/shared/components/ui/label";
import { Switch } from "../../../../PhotoBooth/shared/components/ui/switch";
import { Slider } from "../../../../PhotoBooth/shared/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../../../../PhotoBooth/shared/components/ui/select";
import { Input } from "../../../../PhotoBooth/shared/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../../../PhotoBooth/shared/components/ui/tabs";
import { Separator } from "../../../../PhotoBooth/shared/components/ui/separator";

interface Settings {
    resolution: string;
    countdown_duration: number;
    enable_flash: boolean | number | undefined;
    enable_sound: number | boolean | undefined;
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
            const defaultSettings = await window.electronAPI.settings.reset();
            console.log('Default settings:', defaultSettings);
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
            <div className="h-full flex flex-col items-center justify-center space-y-4">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="text-muted-foreground animate-pulse">Loading preferences...</p>
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
        <div className="min-h-full bg-[#0a0a0a] bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900 via-[#0a0a0a] to-[#0a0a0a] overflow-y-auto">
            <div className="max-w-3xl mx-auto p-8 space-y-8">
                {/* Header Section */}
                <div className="space-y-2 pb-4">
                    <h2 className="text-4xl font-extrabold tracking-tight text-white">Settings</h2>
                    <p className="text-zinc-400 text-lg">Hardware and system preferences.</p>
                </div>

                <Tabs defaultValue="camera" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 bg-zinc-900/50 p-1 border border-white/5">
                        <TabsTrigger value="camera" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white">Camera</TabsTrigger>
                        <TabsTrigger value="storage" className="data-[state=active]:bg-zinc-800 data-[state=active]:text-white">Storage</TabsTrigger>
                    </TabsList>

                    {/* Camera Tab Content */}
                    <TabsContent value="camera" className="mt-6">
                        <Card className="border-white/5 bg-zinc-900/40 backdrop-blur-xl shadow-2xl">
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2"><Monitor className="w-5 h-5 text-blue-500" /> Output Configuration</CardTitle>
                                <CardDescription className="text-zinc-500">Fine-tune your capture quality.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                {/* ALIGNMENT FIX: Use a grid for label/input alignment */}
                                <div className="grid grid-cols-3 items-center gap-4">
                                    <Label className="text-zinc-300 font-medium col-span-1">Resolution</Label>
                                    <div className="col-span-2">
                                        <Select
                                            value={settings.resolution}
                                            onValueChange={(val) => setSettings({ ...settings, resolution: val })}
                                        >
                                            <SelectTrigger className="bg-zinc-950/50 border-white/10 hover:bg-zinc-800 hover:text-white transition-all duration-200 shadow-inner">
                                                <SelectValue placeholder="Select quality" />
                                            </SelectTrigger>

                                            {/* Added 'p-1' and 'shadow-2xl' for depth */}
                                            <SelectContent className="bg-zinc-900 border-white/10 text-zinc-300 p-1 shadow-2xl">
                                                <SelectItem value="1920x1080" className="hover:bg-blue-600/10 focus:bg-blue-600/20 transition-colors">
                                                    1920x1080 (Full HD)
                                                </SelectItem>
                                                <SelectItem value="1280x720" className="hover:bg-blue-600/10 focus:bg-blue-600/20 transition-colors">
                                                    1280x720 (HD)
                                                </SelectItem>
                                                <SelectItem value="3840x2160" className="hover:bg-blue-600/10 focus:bg-blue-600/20 transition-colors">
                                                    3840x2160 (4K Ultra HD)
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <Separator className="bg-white/5" />

                                {/* Countdown Section */}
                                <div className="space-y-4">
                                    <div className="flex justify-between items-center">
                                        <Label className="text-zinc-300">Countdown Duration</Label>
                                        <span className="text-blue-500 font-mono font-bold text-sm bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                                            {settings.countdown_duration}s
                                        </span>
                                    </div>
                                    <Slider
                                        defaultValue={[settings.countdown_duration]}
                                        max={10}
                                        step={1}
                                        className="py-4"
                                        onValueChange={([val]) => setSettings({ ...settings, countdown_duration: val })}
                                    />
                                </div>

                                <Separator className="bg-white/5" />

                                {/* HOVER EFFECT: Row-based interaction */}
                                <div className="space-y-2">
                                    <SettingRow
                                        icon={<Zap className={`w-4 h-4 transition-colors ${settings.enable_flash ? 'text-yellow-400' : 'text-zinc-600'}`} />}
                                        title="Flash Effect"
                                        description="Enable a white screen flash during photo capture"
                                    >
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                                            {settings.enable_flash ? 'Enabled' : 'Disabled'}
                                        </span>
                                        <Switch
                                            checked={!!settings.enable_flash}
                                            onCheckedChange={(c) => setSettings({ ...settings, enable_flash: c ? 1 : 0 })}
                                            // The magic fix: Explicitly setting ON/OFF colors
                                            className={`
                                                        w-16 h-8  /* Increased width (from 11 to 16) and height (from 6 to 8) */
                                                        data-[state=checked]:bg-green-600 
                                                        data-[state=unchecked]:bg-zinc-700
                                                    `}
                                        />
                                    </SettingRow>

                                    <SettingRow
                                        icon={<Volume2 className={`w-4 h-4 transition-colors ${settings.enable_sound ? 'text-blue-400' : 'text-zinc-600'}`} />}
                                        title="System Audio"
                                        description="Play countdown beeps and shutter sounds"
                                    >
                                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                                            {settings.enable_sound ? 'Enabled' : 'Disabled'}
                                        </span>
                                        <Switch
                                            checked={!!settings.enable_sound}
                                            onCheckedChange={(c) => setSettings({ ...settings, enable_sound: c ? 1 : 0 })}
                                            className={`
                                                        w-16 h-8  /* Increased width (from 11 to 16) and height (from 6 to 8) */
                                                        data-[state=checked]:bg-green-600 
                                                        data-[state=unchecked]:bg-zinc-700
                                                    `}
                                        />
                                    </SettingRow>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Storage Tab Content */}
                    <TabsContent value="storage" className="mt-6">
                        <Card className="border-white/5 bg-zinc-900/40 backdrop-blur-xl shadow-2xl">
                            <CardHeader>
                                <CardTitle className="text-xl flex items-center gap-2"><HardDrive className="w-5 h-5 text-green-500" /> Storage Management</CardTitle>
                                <CardDescription className="text-zinc-500">Define photo save paths and encoding.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-6">
                                <div className="space-y-3">
                                    <Label className="text-zinc-300">Save Directory</Label>
                                    <div className="flex gap-2">
                                        <Input
                                            value={settings.save_directory || 'Default'}
                                            readOnly
                                            className="bg-zinc-950/50 border-white/10 text-zinc-400 font-mono text-xs"
                                        />
                                        <Button variant="secondary" onClick={selectDirectory} className="hover:bg-zinc-700">
                                            <FolderOpen className="w-4 h-4 mr-2" /> Browse
                                        </Button>
                                    </div>
                                </div>

                                <Separator className="bg-white/5" />

                                <div className="grid grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <Label className="text-zinc-300">File Type</Label>
                                        <Select
                                            value={settings.photo_format}
                                            onValueChange={(val) => setSettings({ ...settings, photo_format: val })}
                                        >
                                            <SelectTrigger className="bg-zinc-950/50 border-white/10 hover:bg-zinc-800 transition-colors">
                                                <SelectValue />
                                            </SelectTrigger>
                                            <SelectContent className="bg-zinc-900 border-white/10 text-white">
                                                <SelectItem value="jpg">JPG</SelectItem>
                                                <SelectItem value="png">PNG</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <div className="space-y-3">
                                        <Label className="text-zinc-300">Compression Quality</Label>
                                        <div className="flex items-center gap-3">
                                            <Slider
                                                defaultValue={[settings.photo_quality]}
                                                min={60} max={100} step={1}
                                                onValueChange={([val]) => setSettings({ ...settings, photo_quality: val })}
                                            />
                                            <span className="text-xs font-bold text-zinc-500 w-8">{settings.photo_quality}%</span>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>

                {/* Footer Controls */}
                <div className="flex items-center justify-between pt-8 border-t border-white/5">
                    <Button variant="ghost" onClick={resetSettings} className="text-zinc-500 hover:text-white hover:bg-zinc-900 transition-all">
                        <RotateCcw className="w-4 h-4 mr-2" /> Reset Defaults
                    </Button>
                    <Button
                        onClick={saveSettings}
                        disabled={saving}
                        className="bg-blue-600 hover:bg-blue-500 text-white px-8 shadow-[0_0_20px_rgba(37,99,235,0.3)] transition-all"
                    >
                        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                        Apply Settings
                    </Button>
                </div>
            </div>
        </div>
    )
}

function SettingRow({ icon, title, description, children }: any) {
    return (
        <div className="flex items-center justify-between p-3 rounded-lg hover:bg-white/[0.03] transition-all group border border-transparent hover:border-white/5">
            <div className="flex items-center gap-4">
                <div className="p-2 bg-zinc-950 rounded-md border border-white/5">
                    {icon}
                </div>
                <div className="flex flex-col">
                    <span className="text-sm font-medium text-zinc-200">{title}</span>
                    <span className="text-xs text-zinc-500">{description}</span>
                </div>
            </div>
            {children}
        </div>
    );
}