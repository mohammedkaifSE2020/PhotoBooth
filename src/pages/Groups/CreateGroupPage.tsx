import React, { useState } from 'react';
import { useGroupStore } from '@/store/useGroupStore';
import { useNavigate } from 'react-router-dom';
import { getMediaUrl } from '../GalleryPage/utils';

export default function CreateGroupPage() {
  const { selectedPhotos, clearSelection } = useGroupStore();
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const navigate = useNavigate();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name) return;

    try {
      // 1. Create the Group entry (Returning the new ID)
      // Use the first photo's thumbnail as the group cover
      console.log(selectedPhotos);
      const thumbnail = selectedPhotos[0].thumbnail_path || selectedPhotos[0].filepath;
      const groupId = await window.electronAPI.groups.create(name, desc, thumbnail);

      // 2. Link the photos to the group in the junction table
      const photoIds = selectedPhotos.map(p => p.id);
      await window.electronAPI.groups.addPhotos(groupId, photoIds);

      // 3. Success cleanup
      clearSelection();
      navigate('/groups'); 
    } catch (err) {
      console.error("Failed to save group", err);
    }
  };

  return (
    <div className="h-screen bg-[#0d0d0f] p-12 text-white">
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Left: Preview */}
        <div className="space-y-4">
          <h2 className="text-2xl font-bold">Review Selection</h2>
          <div className="grid grid-cols-2 gap-2">
            {selectedPhotos.map(p => (
              <img key={p.id} src={getMediaUrl(p.filepath)} className="rounded-lg aspect-square object-cover border border-white/10" />
            ))}
          </div>
        </div>

        {/* Right: Form */}
        <form onSubmit={handleSave} className="space-y-6 bg-white/5 p-8 rounded-2xl border border-white/5">
          <div>
            <label className="text-xs uppercase font-bold text-gray-500 tracking-widest">Group Name</label>
            <input 
              required
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 mt-2 focus:ring-2 focus:ring-blue-500 outline-none" 
              placeholder="e.g. Wedding Set A"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-xs uppercase font-bold text-gray-500 tracking-widest">Description (Optional)</label>
            <textarea 
              className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 mt-2 h-32 outline-none" 
              placeholder="Details about this photo set..."
              value={desc}
              onChange={e => setDesc(e.target.value)}
            />
          </div>
          <button type="submit" className="w-full bg-blue-600 py-4 rounded-xl font-bold hover:bg-blue-500 transition-all">
            Save Group & Finish
          </button>
        </form>
      </div>
    </div>
  );
}