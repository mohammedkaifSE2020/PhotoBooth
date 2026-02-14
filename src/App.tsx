import { useEffect, useState, Suspense } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation, Link } from 'react-router-dom'
import { Circle, Camera, Menu } from "lucide-react";
import { routeConfig } from '@/config/routes';
import React from 'react';
import Sidebar from './components/SideBar/Sidebar';

function App() {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    if (window.electronAPI) {
      setIsReady(true);
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
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  );
}

function AppContent() {
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="h-screen bg-[#0a0a0c] text-slate-100 flex flex-col selection:bg-blue-500/30">
      {/* 🛰️ Sleek Header */}
      <Header 
      currentPath={location.pathname} 
      onMenuClick = {() => setIsSidebarOpen((prev)=> !prev)}
      />

      {/* 🖼️ Immersive Main Content */}
      <main className="flex-1 overflow-hidden relative">

        {/* 🚪 The Slide-out Sidebar */}
        <Sidebar 
          isOpen={isSidebarOpen} 
          onClose={() => setIsSidebarOpen(false)} 
          currentPath={location.pathname} 
        />
        {/* Subtle background glow to give depth */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-1/2 bg-blue-600/5 blur-[120px] pointer-events-none" />

        <div className="h-full w-full overflow-y-auto custom-scrollbar">
          <Suspense fallback={<LoadingScreen />}>
            <Routes>
              {routeConfig.map((route) => (
                <Route
                  key={route.key}
                  path={route.path}
                  element={<route.component />}
                />
              ))}
              {/* Default redirect */}
              <Route path="/" element={<Navigate to="/capture" replace />} />
              {/* Catch-all for undefined routes */}
              <Route path="*" element={<Navigate to="/capture" replace />} />
            </Routes>
          </Suspense>
        </div>
      </main>

    </div>
  );
}

function Header({ currentPath, onMenuClick }: { currentPath: string, onMenuClick: () => void }) {
  return (
    // Reduced height from py-4 to h-14 (56px)
    <header className="z-50 h-14 bg-gray-900/80 backdrop-blur-md border-b border-white/5 px-6 flex-shrink-0 shadow-2xl flex items-center">
      <div className="w-full max-w-[1600px] mx-auto flex items-center justify-between">
        {/* 🍔 Hamburger Button */}
        <button 
          onClick={onMenuClick}
          className="p-2 -ml-2 hover:bg-white/5 rounded-lg transition-colors text-gray-400 hover:text-white"
        >
          <Menu className="size-6" />
        </button>

        {/* Brand */}
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center size-8 bg-blue-600 rounded-lg shadow-lg shadow-blue-600/20">
            <Camera className="size-5 text-white" />
          </div>
          <div className="hidden sm:block"> {/* Hide text on very small screens */}
            <h1 className="text-sm font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 leading-tight">
              PhotoBooth <span className="text-blue-500 font-black">PRO</span>
            </h1>
            <div className="flex items-center gap-1">
              <Circle className="size-1.5 fill-green-500 text-green-500 animate-pulse" />
              <span className="text-[8px] uppercase tracking-tighter text-gray-500 font-bold">Live</span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}



function NavLink({ to, active, icon, label }: { to: string, active: boolean, icon: React.ReactNode, label: string }) {
  return (
    <Link
      to={to}
      title={label}
      className={`
        relative group flex items-center justify-center size-9 rounded-lg transition-all duration-300
        ${active 
          ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' 
          : 'text-gray-500 hover:text-white hover:bg-white/5'
        }
      `}
    >
      {/* Scaling the icon slightly for better fit */}
      {React.isValidElement(icon) && 
        React.cloneElement(icon as React.ReactElement, { className: "size-4.5" })
      }
      
      {/* Indicator dot for active state */}
      {active && (
        <span className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 bg-white rounded-full shadow-[0_0_5px_white]" />
      )}
    </Link>
  );
}

// ⏳ Loading Screen Component
function LoadingScreen() {
  return (
    <div className="flex items-center justify-center h-full bg-gray-900 text-white">
      <div className="text-center">
        <div className="text-2xl mb-4">Loading...</div>
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto"></div>
      </div>
    </div>
  );
}

export default App
