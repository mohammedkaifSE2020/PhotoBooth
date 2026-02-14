import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, FolderOpen, Calendar, Image as ImageIcon, ChevronRight } from 'lucide-react';
import { Button } from '../../../shared/components/ui/button';
import { Card } from '../../../shared/components/ui/card';
import { ScrollArea } from '../../../shared/components/ui/scroll-area';
import { Badge } from '../../../shared/components/ui/badge';
import { useGroupStore } from '../../store/useGroupStore';

const EmptyState = ({ onCreate }: { onCreate: () => void }) => (
  <div className="flex flex-col items-center justify-center h-96">
    <FolderOpen className="size-16 text-slate-500 mb-4" />
    <h2 className="text-lg font-semibold mb-2">No Groups Yet</h2>
    <p className="text-slate-400 mb-6">Create your first photo collection to get started</p>
    <Button onClick={onCreate} className="bg-blue-600 hover:bg-blue-500">
      <Plus className="size-4 mr-2" />
      Create Group
    </Button>
  </div>
);

export default function GroupsPage() {
  const navigate = useNavigate();
  const [groups, setGroups] = useState([]);
  const { setSelectionMode } = useGroupStore();

  useEffect(() => {
    loadGroups();
  }, []);

  const loadGroups = async () => {
    const data: any = await window.electronAPI.groups.getAll();
    setGroups(data);
  };

  const handleCreateNew = () => {
    // 1. Enable selection mode in Global State
    setSelectionMode(true);
    // 2. Navigate to Gallery to pick photos
    navigate('/gallery');
  };

  return (
    <div className="h-screen flex flex-col bg-[#0d0d0f] text-slate-200 overflow-hidden">
      {/* 🚀 Premium Header */}
      <header className="h-20 border-b border-white/5 flex items-center justify-between px-10 bg-black/20 backdrop-blur-xl shrink-0">
        <div className="flex items-center gap-4">
          <div className="size-12 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-600/20">
            <FolderOpen className="text-white size-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Photo Collections</h1>
            <p className="text-xs text-slate-500 uppercase font-bold tracking-widest">Manage your groupings</p>
          </div>
        </div>

        <Button 
          onClick={handleCreateNew}
          className="bg-blue-600 hover:bg-blue-500 text-white h-11 px-6 gap-2 rounded-xl shadow-lg shadow-blue-600/10 transition-all hover:scale-105"
        >
          <Plus className="size-4" />
          <span className="text-xs font-bold uppercase tracking-wider">Create New Group</span>
        </Button>
      </header>

      {/* 🖼️ Groups Grid */}
      <ScrollArea className="flex-1">
        <div className="p-10">
          {groups.length === 0 ? (
            <EmptyState onCreate={handleCreateNew} />
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {groups.map((group:any) => (
                <Card key={group.id} className="p-4 bg-slate-900/50 border-slate-700 hover:border-blue-600 transition-colors cursor-pointer">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <FolderOpen className="size-5 text-blue-600" />
                      <h3 className="font-semibold">{group.name}</h3>
                    </div>
                    <ChevronRight className="size-5 text-slate-500" />
                  </div>
                  <div className="flex items-center gap-4 text-xs text-slate-400">
                    <span className="flex items-center gap-1">
                      <ImageIcon className="size-4" />
                      {group.photo_count || 0} photos
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="size-4" />
                      {new Date(group.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}