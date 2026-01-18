import React from 'react';
import { Monitor, Zap, Volume2 } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../shared/components/ui/card';
import { Label } from '../../../../shared/components/ui/label';
import { Switch } from '../../../../shared/components/ui/switch';
import { Slider } from '../../../../shared/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../shared/components/ui/select';
import { Separator } from '../../../../shared/components/ui/separator';
import { SettingRow } from './SettingRow';
import { Settings } from '../useSettings';

interface CameraSettingsTabProps {
    settings: Settings;
    onSettingChange: (key: keyof Settings, value: any) => void;
}

export const CameraSettingsTab: React.FC<CameraSettingsTabProps> = ({ settings, onSettingChange }) => {
    return (
        <Card className="border-white/5 bg-zinc-900/40 backdrop-blur-xl shadow-2xl">
            <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                    <Monitor className="w-5 h-5 text-blue-500" /> Output Configuration
                </CardTitle>
                <CardDescription className="text-zinc-500">Fine-tune your capture quality.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Resolution Section */}
                <div className="grid grid-cols-3 items-center gap-4">
                    <Label className="text-zinc-300 font-medium col-span-1">Resolution</Label>
                    <div className="col-span-2">
                        <Select
                            value={settings.resolution}
                            onValueChange={(val) => onSettingChange('resolution', val)}
                        >
                            <SelectTrigger className="bg-zinc-950/50 border-white/10 hover:bg-zinc-800 hover:text-white transition-all duration-200 shadow-inner">
                                <SelectValue placeholder="Select quality" />
                            </SelectTrigger>
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
                        onValueChange={([val]) => onSettingChange('countdown_duration', val)}
                    />
                </div>

                <Separator className="bg-white/5" />

                {/* Toggles Section */}
                <div className="space-y-2">
                    <SettingRow
                        icon={<Zap className={`w-4 h-4 transition-colors ${settings.enable_flash ? 'text-yellow-400' : 'text-zinc-600'}`} />}
                        title="Flash Effect"
                        description="Enable a white screen flash during photo capture"
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                                {settings.enable_flash ? 'Enabled' : 'Disabled'}
                            </span>
                            <Switch
                                checked={!!settings.enable_flash}
                                onCheckedChange={(c) => onSettingChange('enable_flash', c ? 1 : 0)}
                                className="w-16 h-8 data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-zinc-700"
                            />
                        </div>
                    </SettingRow>

                    <SettingRow
                        icon={<Volume2 className={`w-4 h-4 transition-colors ${settings.enable_sound ? 'text-blue-400' : 'text-zinc-600'}`} />}
                        title="System Audio"
                        description="Play countdown beeps and shutter sounds"
                    >
                        <div className="flex items-center gap-3">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500">
                                {settings.enable_sound ? 'Enabled' : 'Disabled'}
                            </span>
                            <Switch
                                checked={!!settings.enable_sound}
                                onCheckedChange={(c) => onSettingChange('enable_sound', c ? 1 : 0)}
                                className="w-16 h-8 data-[state=checked]:bg-green-600 data-[state=unchecked]:bg-zinc-700"
                            />
                        </div>
                    </SettingRow>
                </div>
            </CardContent>
        </Card>
    );
};
