import React from 'react';
import { HardDrive, FolderOpen, Image as ImageIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../../../shared/components/ui/card';
import { Label } from '../../../../shared/components/ui/label';
import { Slider } from '../../../../shared/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../../../shared/components/ui/select';
import { Input } from '../../../../shared/components/ui/input';
import { Button } from '../../../../shared/components/ui/button';
import { Separator } from '../../../../shared/components/ui/separator';
import { Settings } from '../useSettings';

interface StorageSettingsTabProps {
    settings: Settings;
    onSettingChange: (key: keyof Settings, value: any) => void;
    onSelectDirectory: () => Promise<void>;
}

export const StorageSettingsTab: React.FC<StorageSettingsTabProps> = ({
    settings,
    onSettingChange,
    onSelectDirectory,
}) => {
    return (
        <Card className="border-white/5 bg-zinc-900/40 backdrop-blur-xl shadow-2xl">
            <CardHeader>
                <CardTitle className="text-xl flex items-center gap-2">
                    <HardDrive className="w-5 h-5 text-green-500" /> Storage Management
                </CardTitle>
                <CardDescription className="text-zinc-500">Define photo save paths and encoding.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Save Directory Section */}
                <div className="space-y-3">
                    <Label className="text-zinc-300">Save Directory</Label>
                    <div className="flex gap-2">
                        <Input
                            value={settings.save_directory || 'Default'}
                            readOnly
                            className="bg-zinc-950/50 border-white/10 text-zinc-400 font-mono text-xs"
                        />
                        <Button
                            variant="secondary"
                            onClick={onSelectDirectory}
                            className="hover:bg-zinc-700"
                        >
                            <FolderOpen className="w-4 h-4 mr-2" /> Browse
                        </Button>
                    </div>
                </div>

                <Separator className="bg-white/5" />

                {/* Format & Quality Section */}
                <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-3">
                        <Label className="text-zinc-300 flex items-center gap-2">
                            <ImageIcon className="w-4 h-4" /> File Type
                        </Label>
                        <Select
                            value={settings.photo_format}
                            onValueChange={(val) => onSettingChange('photo_format', val)}
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
                                min={60}
                                max={100}
                                step={1}
                                onValueChange={([val]) => onSettingChange('photo_quality', val)}
                            />
                            <span className="text-xs font-bold text-zinc-500 w-8">{settings.photo_quality}%</span>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
};
