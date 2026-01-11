import { useEffect, useState } from 'react'
import CameraCapture from './pages/CaptureMode/CameraCapture'
import SettingsPanel from './pages/SettingsPage/SettingsPanel'
import PhotoGallery from './pages/GalleryPage/PhotoGallery'
import TemplateEditor from './pages/Template/TemplateEditor'

import { Camera, Image, Settings, Circle } from "lucide-react";

type View = 'capture' | 'gallery' | 'settings' | 'Templates';

function App() {
  const [currentView, setCurrentView] = useState<View>('capture');
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (window.electronAPI) {
      setIsReady(true);
      console.log("Electron API is available.");
    } else {
      console.error("Electron API is not available.");
    }
  }, []);

  if (!isReady) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
        <div className="text-center">
          <div className="text-2xl mb-4">Loading PhotoBooth...</div>
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
        </div>
      </div>
    );
  }



  return (
    <div className="h-screen bg-[#0a0a0c] text-slate-100 flex flex-col selection:bg-blue-500/30">
      {/* 🛰️ Sleek Header */}
      <header className="z-50 bg-gray-900/80 backdrop-blur-md border-b border-white/5 px-8 py-4 flex-shrink-0 shadow-2xl">
        <div className="max-w-[1600px] mx-auto flex items-center justify-between">

          {/* Brand & Status */}
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center size-10 bg-blue-600 rounded-xl shadow-lg shadow-blue-600/20">
              <Camera className="size-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400">
                PhotoBooth <span className="text-blue-500">Pro</span>
              </h1>
              <div className="flex items-center gap-1.5">
                <Circle className="size-2 fill-green-500 text-green-500 animate-pulse" />
                <span className="text-[10px] uppercase tracking-widest text-gray-500 font-bold">System Live</span>
              </div>
            </div>
          </div>

          {/* 🧭 Premium Navigation */}
          <nav className="flex items-center bg-gray-800/50 p-1 rounded-2xl border border-white/5">
            <NavButton
              active={currentView === 'capture'}
              onClick={() => setCurrentView('capture')}
              icon={<Camera className="size-4" />}
              label="Capture"
            />
            <NavButton
              active={currentView === 'gallery'}
              onClick={() => setCurrentView('gallery')}
              icon={<Image className="size-4" />}
              label="Gallery"
            />
            <div className="w-px h-6 bg-white/10 mx-1" />
            <NavButton
              active={currentView === 'settings'}
              onClick={() => setCurrentView('settings')}
              icon={<Settings className="size-4" />}
              label="Settings"
            />
            <NavButton
              active={currentView === 'Templates'}
              onClick={() => setCurrentView('Templates')}
              icon={<Settings className="size-4" />}
              label="Templates"
            />
          </nav>
        </div>
      </header>

      {/* 🖼️ Immersive Main Content */}
      <main className="flex-1 overflow-hidden relative">
        {/* Subtle background glow to give depth */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1/2 bg-blue-600/5 blur-[120px] pointer-events-none" />

        <div className="h-full w-full overflow-y-auto custom-scrollbar">
          {currentView === 'capture' && <CameraCapture />}
          {currentView === 'gallery' && <PhotoGallery />}
          {currentView === 'settings' && <SettingsPanel />}
          {currentView === 'Templates' && <TemplateEditor />}
        </div>
      </main>

      {/* 📊 Minimal Footer */}
      <footer className="bg-gray-950/50 border-t border-white/5 px-8 py-2.5 flex justify-between items-center text-[11px] text-gray-500 font-medium uppercase tracking-widest flex-shrink-0">
        <div className="flex gap-4">
          <span>v1.0.0 Stable</span>
          <span className="text-gray-700">|</span>
          <span>Storage: 84% Free</span>
        </div>
        <div className="text-blue-500/50">
          &copy; 2025 PhotoBooth Pro Ecosystem
        </div>
      </footer>
    </div>
  );
}

// 🛠️ Reusable Nav Button Component
function NavButton({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button
      onClick={onClick}
      className={`
        flex items-center gap-2 px-5 py-2.5 rounded-xl font-semibold text-sm transition-all duration-300
        ${active 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20 scale-105' 
          : 'text-gray-400 hover:text-white hover:bg-white/5'
        }
      `}
    >
      {icon}
      <span>{label}</span>
    </button>
  );
}

export default App
