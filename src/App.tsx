import { useEffect, useState } from 'react'
import CameraCapture from './pages/CaptureMode/CameraCapture'
import SettingsPanel from './pages/SettingsPage/SettingsPanel'
import PhotoGallery from './pages/GalleryPage/PhotoGallery'

type View = 'capture' | 'gallery' | 'settings';

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
    <div className="h-screen bg-gray-900 text-white flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex-shrink-0">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">📸 PhotoBooth Pro</h1>
          
          {/* Navigation */}
          <nav className="flex gap-2">
            <button
              onClick={() => setCurrentView('capture')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                currentView === 'capture'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              📷 Capture
            </button>
            <button
              onClick={() => setCurrentView('gallery')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                currentView === 'gallery'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              🖼️ Gallery
            </button>
            <button
              onClick={() => setCurrentView('settings')}
              className={`px-6 py-2 rounded-lg font-medium transition-all ${
                currentView === 'settings'
                  ? 'bg-blue-600 text-white shadow-lg'
                  : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
              }`}
            >
              ⚙️ Settings
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        {currentView === 'capture' && <CameraCapture />}
        {currentView === 'gallery' && <PhotoGallery />}
        {currentView === 'settings' && <SettingsPanel />}
      </main>

      {/* Footer */}
      <footer className="bg-gray-800 border-t border-gray-700 px-6 py-3 text-center text-sm text-gray-400 flex-shrink-0">
        PhotoBooth Pro v1.0.0 | Phase 1 MVP
      </footer>
    </div>
  )
}

export default App
