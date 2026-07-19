import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useJobTracker } from "../context/JobTrackerContext";
import { Search, Briefcase, FileText, Settings, RefreshCw, Plus, Sparkles, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";

export default function CommandPalette() {
  const { 
    applications, 
    commandPaletteOpen, 
    setCommandPaletteOpen, 
    setSelectedAppId, 
    syncGmail 
  } = useJobTracker();
  
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef(null);
  const containerRef = useRef(null);

  // Close command palette on Escape and toggle on Ctrl/Cmd + K
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
      if (e.key === "Escape") {
        setCommandPaletteOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  // Focus input when palette opens
  useEffect(() => {
    if (commandPaletteOpen) {
      setQuery("");
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [commandPaletteOpen]);

  // Handle clicking outside to close
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setCommandPaletteOpen(false);
      }
    };
    if (commandPaletteOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  // Navigation actions list
  const navigationItems = [
    { icon: <Briefcase size={16} />, label: "Go to Dashboard", action: () => navigate("/") },
    { icon: <FileText size={16} />, label: "Go to Applications Board", action: () => navigate("/applications") },
    { icon: <Sparkles size={16} />, label: "Go to AI Prep & Insights", action: () => navigate("/ai") },
    { icon: <Settings size={16} />, label: "Go to Settings", action: () => navigate("/settings") },
  ];

  // Quick Action items list
  const actionItems = [
    { 
      icon: <RefreshCw size={16} className="text-indigo-600 animate-spin-slow" />, 
      label: "Sync Gmail (Auto-scan)", 
      action: () => {
        syncGmail();
        setCommandPaletteOpen(false);
      }
    }
  ];

  // Filter application results
  const filteredApps = query.trim() === "" 
    ? [] 
    : applications.filter(app => 
        app.company.toLowerCase().includes(query.toLowerCase()) ||
        app.role.toLowerCase().includes(query.toLowerCase())
      );

  // Group everything together for keyboard navigation
  const results = [
    ...filteredApps.map(app => ({
      type: "app",
      label: `${app.company} — ${app.role}`,
      icon: <Briefcase size={16} className="text-slate-500" />,
      action: () => {
        setSelectedAppId(app.id);
        navigate("/applications");
      }
    })),
    ...navigationItems.map(item => ({ type: "nav", ...item })),
    ...actionItems.map(item => ({ type: "action", ...item }))
  ];

  // Handle keyboard navigation inside list
  const handleKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % results.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + results.length) % results.length);
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (results[selectedIndex]) {
        results[selectedIndex].action();
        setCommandPaletteOpen(false);
      }
    }
  };

  return (
    <AnimatePresence>
      {commandPaletteOpen && (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] px-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px]"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.97, y: -8 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            ref={containerRef}
            className="w-full max-w-xl bg-white rounded-xl shadow-overlay border border-slate-100 overflow-hidden flex flex-col relative z-10"
          >
            {/* Search Input Area */}
            <div className="flex items-center gap-3 px-4 border-b border-slate-100 h-14">
              <Search className="text-slate-400 shrink-0" size={20} />
              <input
                ref={inputRef}
                type="text"
                placeholder="Search jobs, navigate pages, or scan Gmail..."
                className="w-full h-full text-slate-800 placeholder-slate-400 text-[15px] outline-none border-none"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleKeyDown}
              />
              <button 
                onClick={() => setCommandPaletteOpen(false)}
                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition"
              >
                <X size={16} />
              </button>
            </div>

            {/* Results Area */}
            <div className="max-h-[360px] overflow-y-auto p-2">
              {/* Applications matching search query */}
              {query.trim() !== "" && filteredApps.length > 0 && (
                <div className="px-3 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                  Matching Applications
                </div>
              )}
              
              {query.trim() !== "" && filteredApps.length === 0 && (
                <div className="p-4 text-center text-sm text-slate-500">
                  No applications found matching "{query}"
                </div>
              )}

              {/* Display items list */}
              <div className="space-y-0.5">
                {results.map((item, idx) => {
                  const isSelected = idx === selectedIndex;
                  return (
                    <button
                      key={idx}
                      onClick={() => {
                        item.action();
                        setCommandPaletteOpen(false);
                      }}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-left transition ${
                        isSelected 
                          ? "bg-primary-50 text-primary-700" 
                          : "text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={isSelected ? "text-primary-600" : "text-slate-400"}>
                          {item.icon}
                        </span>
                        <span className="text-[14px] font-medium">{item.label}</span>
                      </div>
                      
                      {isSelected && (
                        <span className="text-[11px] bg-primary-100 text-primary-700 px-1.5 py-0.5 rounded font-mono">
                          Enter
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer Help */}
            <div className="bg-slate-50 px-4 py-2.5 border-t border-slate-100 flex justify-between items-center text-[11px] text-slate-400">
              <div className="flex gap-4">
                <span><span className="bg-white px-1.5 py-0.5 border rounded shadow-sm font-mono text-[9px]">↑↓</span> to navigate</span>
                <span><span className="bg-white px-1.5 py-0.5 border rounded shadow-sm font-mono text-[9px]">Enter</span> to select</span>
              </div>
              <div>
                <span><span className="bg-white px-1.5 py-0.5 border rounded shadow-sm font-mono text-[9px]">ESC</span> to close</span>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
