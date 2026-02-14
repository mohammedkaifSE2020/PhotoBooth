import { create } from 'zustand';

interface GroupState {
    isSelectionMode: boolean;
    selectedPhotos: any[]; // Replace 'any' with your Photo type
    setSelectionMode: (active: boolean) => void;
    togglePhoto: (photo: any) => void;
    clearSelection: () => void;
}

export const useGroupStore = create<GroupState>((set) => ({
    isSelectionMode: false,
  selectedPhotos: [],
  
  setSelectionMode: (active) => set({ 
    isSelectionMode: active, 
    selectedPhotos: [] // Clear selection when starting/stopping
  }),

  togglePhoto: (photo) => set((state) => {
    const isAlreadySelected = state.selectedPhotos.some(p => p.id === photo.id);
    
    if (isAlreadySelected) {
      return { selectedPhotos: state.selectedPhotos.filter(p => p.id !== photo.id) };
    }
    
    // Limit to 6 photos as per your requirement
    if (state.selectedPhotos.length < 6) {
      return { selectedPhotos: [...state.selectedPhotos, photo] };
    }
    
    return state;
  }),

  clearSelection: () => set({ selectedPhotos: [], isSelectionMode: false }),
}));