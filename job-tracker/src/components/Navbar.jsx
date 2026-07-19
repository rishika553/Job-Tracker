import React from "react";
import { useLocation } from "react-router-dom";
import { useJobTracker } from "../context/JobTrackerContext";
import { 
  Menu, 
  Search, 
  RefreshCw, 
  Bell
} from "lucide-react";

export default function Navbar({ setMobileMenuOpen }) {
  const { 
    gmailStatus, 
    syncGmail, 
    setCommandPaletteOpen 
  } = useJobTracker();
  const location = useLocation();

  // Dynamically resolve page titles
  const getPageTitle = () => {
    switch (location.pathname) {
      case "/":
        return "Overview";
      case "/applications":
        return "Applications Board";
      case "/ai":
        return "AI Prep Hub";
      case "/settings":
        return "Settings";
      default:
        return "CareerTrack";
    }
  };

  return (
    <header className="h-16 bg-[#0c0a09] border-b border-slate-850 flex items-center justify-between px-4 md:px-6 lg:px-8 shrink-0 select-none sticky top-0 z-30">
      {/* Mobile Menu & Page Title */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className="lg:hidden p-2 -ml-2 rounded-lg text-slate-400 hover:bg-slate-900 hover:text-white transition cursor-pointer"
        >
          <Menu size={20} />
        </button>
        
        <h1 className="text-sm font-bold text-white md:text-base">
          {getPageTitle()}
        </h1>
      </div>

      {/* Center Actions (Command Palette Trigger Input) */}
      <div className="hidden md:flex items-center flex-1 max-w-sm mx-8">
        <button
          onClick={() => setCommandPaletteOpen(true)}
          className="w-full flex items-center gap-2 px-3 py-1.5 bg-slate-900 border border-slate-800/80 hover:border-slate-700 rounded-lg text-left text-xs font-semibold text-slate-500 hover:text-slate-300 transition cursor-pointer"
        >
          <Search size={14} className="text-slate-500" />
          <span>Search company, role or cmd...</span>
          <kbd className="ml-auto font-mono text-[9px] bg-slate-850 border border-slate-800 px-1 py-0.5 rounded shadow-3xs text-slate-500">
            ⌘K
          </kbd>
        </button>
      </div>

      {/* Right-hand Action Bar */}
      <div className="flex items-center gap-3">
        {/* Gmail Sync Button Indicator */}
        {gmailStatus.connected && (
          <div className="flex items-center gap-1.5">
            <span className="hidden sm:inline-block text-[11px] text-slate-500">
              Synced {gmailStatus.lastSync}
            </span>
            <button
              onClick={syncGmail}
              disabled={gmailStatus.isScanning}
              className={`flex items-center gap-1.5 px-3 py-1.5 border border-slate-850 rounded-lg text-xs font-bold text-slate-300 bg-slate-900 hover:bg-slate-850 hover:text-white cursor-pointer disabled:bg-slate-900/50 disabled:cursor-not-allowed transition`}
            >
              <RefreshCw 
                size={12} 
                className={`text-primary-500 ${gmailStatus.isScanning ? "animate-spin" : ""}`} 
              />
              <span>{gmailStatus.isScanning ? "Scanning..." : "Sync Gmail"}</span>
            </button>
          </div>
        )}

        {/* Notifications Icon (Mock) */}
        <button className="relative p-2 border border-slate-850 rounded-lg text-slate-400 hover:text-white bg-slate-900 hover:bg-slate-850 transition cursor-pointer">
          <Bell size={16} />
          <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary-500 rounded-full" />
        </button>

        {/* Profile Avatar Wrapper */}
        <div className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-xs font-bold text-primary-500 shrink-0 select-none">
          R
        </div>
      </div>
    </header>
  );
}