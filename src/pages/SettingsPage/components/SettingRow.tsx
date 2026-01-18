import React from 'react';

interface SettingRowProps {
    icon: React.ReactNode;
    title: string;
    description: string;
    children?: React.ReactNode;
}

export const SettingRow: React.FC<SettingRowProps> = ({ icon, title, description, children }) => {
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
};
