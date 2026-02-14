import { routeConfig } from "@/config/routes";
import { X, ChevronRight } from "lucide-react";
import React from "react";
import { Link } from "react-router-dom";

export default function Sidebar({ isOpen, onClose, currentPath }: { isOpen: boolean, onClose: () => void, currentPath: string }) {
  return (
    <>
      {/* Backdrop Overlay */}
      <div 
        className={`fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      />

      {/* Sidebar Panel */}
      <aside className={`fixed top-0 left-0 h-full w-72 bg-[#0d0d0f] border-r border-white/5 z-[70] transition-transform duration-300 ease-in-out shadow-2xl ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          {/* Top: Header inside sidebar */}
          <div className="h-16 flex items-center justify-between px-6 border-b border-white/5">
            <span className="text-sm font-bold tracking-widest text-blue-500 uppercase">Menu</span>
            <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-lg text-gray-400">
              <X className="size-5" />
            </button>
          </div>

          {/* Center: Navigation Links */}
          <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
            {routeConfig
              .filter(route => route.showInNav)
              .map(route => {
                const active = currentPath === route.path;
                return (
                  <Link
                    key={route.key}
                    to={route.path}
                    onClick={onClose}
                    className={`flex items-center justify-between p-3 rounded-xl transition-all group ${active ? 'bg-blue-600 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-white'}`}
                  >
                    <div className="flex items-center gap-4">
                      {React.isValidElement(route.icon) && 
                        React.cloneElement(route.icon as React.ReactElement, { className: "size-5" })
                      }
                      <span className="text-sm font-medium">{route.label}</span>
                    </div>
                    <ChevronRight className={`size-4 transition-transform ${active ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0'}`} />
                  </Link>
                );
              })}
          </nav>

          {/* Bottom: Version info */}
          <div className="p-6 border-t border-white/5 bg-black/20">
             <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">PhotoBooth Pro v1.2.0</p>
          </div>
        </div>
      </aside>
    </>
  );
}