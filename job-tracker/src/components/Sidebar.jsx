import React from "react";
import { NavLink } from "react-router-dom";
import { useJobTracker } from "../context/JobTrackerContext";
import { useAuth } from "../context/AuthContext";
import { 
  LayoutDashboard, 
  Briefcase, 
  Sparkles, 
  Settings, 
  Mail, 
  ChevronRight, 
  X,
  Layers,
  TrendingUp,
  Calendar,
  Building2,
  FileText,
  Inbox
} from "lucide-react";

export default function Sidebar({ mobileMenuOpen, setMobileMenuOpen }) {
  const { gmailStatus } = useJobTracker();
  const { user } = useAuth();

  const displayName = user?.full_name || user?.email?.split("@")[0] || "User";
  const displayEmail = user?.email || "";
  const displayInitial = displayName[0]?.toUpperCase() || "U";

  const navigation = [
    { name: "Dashboard", to: "/", icon: <LayoutDashboard size={18} /> },
    { name: "Applications", to: "/applications", icon: <Briefcase size={18} /> },
    { name: "Pipeline Board", to: "/pipeline", icon: <Layers size={18} /> },
    { name: "Inbox", to: "/notifications", icon: <Inbox size={18} /> },
    { name: "Companies", to: "/companies", icon: <Building2 size={18} /> },
    { name: "Resume Manager", to: "/resume", icon: <FileText size={18} /> },
    { name: "Analytics", to: "/analytics", icon: <TrendingUp size={18} /> },
    { name: "Calendar", to: "/calendar", icon: <Calendar size={18} /> },
    { name: "AI Prep Hub", to: "/ai", icon: <Sparkles size={18} /> },
    { name: "Settings", to: "/settings", icon: <Settings size={18} /> },
  ];

  const sidebarContent = (
    <div className="flex flex-col h-full bg-[#0c0a09] border-r border-slate-800 text-slate-400 select-none">
      {/* Brand Header */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-slate-850">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-primary-500 flex items-center justify-center text-slate-950 shadow-sm font-black text-sm">
            C
          </div>
          <span className="font-bold text-white text-[15px] tracking-tight">
            CareerTrack
          </span>
          <span className="text-[9px] font-extrabold text-slate-950 bg-primary-500 px-1.5 py-0.5 rounded-md">
            Pro
          </span>
        </div>
        {mobileMenuOpen && (
          <button 
            onClick={() => setMobileMenuOpen(false)}
            className="lg:hidden p-1 hover:bg-slate-800 rounded text-slate-400 transition"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {/* Workspace Selector */}
      <div className="px-4 py-3">
        <button className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-slate-900/60 border border-transparent hover:border-slate-850 text-left transition group text-slate-300">
          <div className="flex items-center gap-2">
            <span className="w-5 h-5 rounded bg-primary-500 flex items-center justify-center text-[10px] font-black text-slate-950 shadow-xs">{displayInitial}</span>
            <span className="text-sm font-semibold">{displayName}'s Hunt</span>
          </div>
          <ChevronRight size={14} className="text-slate-500 group-hover:translate-x-0.5 transition-transform" />
        </button>
      </div>

      {/* Main Navigation Links */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
        <div className="px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          Workspace
        </div>
        
        {navigation.map((item) => (
          <NavLink
            key={item.name}
            to={item.to}
            onClick={() => setMobileMenuOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-[14px] font-semibold transition duration-150 ${
                isActive
                  ? "bg-slate-900 text-primary-500 border-l-2 border-primary-500 shadow-sm"
                  : "text-slate-400 hover:text-white hover:bg-slate-900/50"
              }`
            }
          >
            {item.icon}
            {item.name}
          </NavLink>
        ))}

        <div className="pt-6 px-3 py-1.5 text-[10px] font-bold text-slate-500 uppercase tracking-wider">
          Auto-Tracking
        </div>

        {/* Gmail Sync Health Widget */}
        <div className="mx-3 mt-1.5 p-3.5 bg-[#090908] border border-slate-850/80 rounded-xl shadow-premium">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-6 h-6 rounded-full bg-slate-900 flex items-center justify-center text-primary-500 border border-slate-850">
              <Mail size={12} />
            </div>
            <span className="text-xs font-semibold text-slate-300">Gmail Scan</span>
            <div className={`w-1.5 h-1.5 rounded-full ml-auto ${gmailStatus.connected ? "bg-emerald-500 animate-pulse" : "bg-slate-700"}`} />
          </div>
          <p className="text-[11px] text-slate-500 leading-normal mb-2.5">
            {gmailStatus.connected 
              ? `Tracking ${gmailStatus.account}` 
              : "Autotracking offline. Connect email."}
          </p>
          <div className="text-[10px] font-mono text-slate-500 flex justify-between">
            <span>Scan count:</span>
            <span className="font-semibold text-slate-400">{gmailStatus.jobsFound} jobs</span>
          </div>
        </div>
      </nav>

      {/* User Profile Card Footer */}
      <div className="p-4 border-t border-slate-850 bg-[#090908]">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-sm font-bold text-primary-500">
            {displayInitial}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-slate-300 truncate">
              {displayName}
            </p>
            <p className="text-xs text-slate-500 truncate">
              {displayEmail}
            </p>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sidebar (Permanent) */}
      <aside className="hidden lg:block w-64 h-screen shrink-0 sticky top-0 z-20">
        {sidebarContent}
      </aside>

      {/* Mobile Drawer (Overlay backdrop and side panel) */}
      <div className={`lg:hidden fixed inset-0 z-40 flex transition-opacity duration-300 ${mobileMenuOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"}`}>
        {/* Mobile Backdrop */}
        <div 
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs" 
        />
        
        {/* Mobile Side Drawer Panel */}
        <div className={`relative w-64 max-w-xs flex flex-col h-full bg-[#0c0a09] transform transition-transform duration-350 ease-out z-10 ${mobileMenuOpen ? "translate-x-0" : "-translate-x-full"}`}>
          {sidebarContent}
        </div>
      </div>
    </>
  );
}