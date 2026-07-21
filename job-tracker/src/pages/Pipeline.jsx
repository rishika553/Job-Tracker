import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useJobTracker } from "../context/JobTrackerContext";
import ApplicationModal from "../components/ApplicationModal";
import { 
  Plus, 
  Bookmark, 
  Calendar, 
  Clock, 
  User, 
  Search, 
  Zap, 
  AlertCircle
} from "lucide-react";

export default function Pipeline() {
  const { 
    applications: contextApplications, 
    updateApplication,
    loadDemoData
  } = useJobTracker();

  const navigate = useNavigate();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [onlyBookmarked, setOnlyBookmarked] = useState(false);
  
  // Track column being hovered over during a drag event
  const [dragOverColumn, setDragOverColumn] = useState(null);

  const applications = contextApplications || [];

  // Kanban Columns List (Attio Minimalist CRM Columns)
  const columns = [
    { id: "wishlist", label: "Wishlist", color: "bg-slate-50 border-slate-200" },
    { id: "applied", label: "Applied", color: "bg-amber-50/20 border-amber-200/50" },
    { id: "assessment", label: "Assessment", color: "bg-purple-50/20 border-purple-200/50" },
    { id: "interview", label: "Interview", color: "bg-blue-50/20 border-blue-200/50" },
    { id: "final_round", label: "Final Round", color: "bg-indigo-50/20 border-indigo-200/50" },
    { id: "offer", label: "Offer", color: "bg-emerald-50/20 border-emerald-200/50" },
    { id: "rejected", label: "Rejected", color: "bg-rose-50/10 border-rose-200/30" }
  ];

  // Filters
  const filteredApps = applications.filter(app => {
    const matchesSearch = (app.company || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                          (app.role || app.title || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBookmark = !onlyBookmarked || app.bookmarked;
    return matchesSearch && matchesBookmark;
  });

  // Helper: Dynamic Priority Logic
  const getCardPriority = (app) => {
    if (app.status === "offer" || app.status === "final_round") return "High";
    if (app.status === "interview" || app.status === "assessment") return "Medium";
    return "Low";
  };

  // Helper: Dynamic Deadline Calculation
  const getCardDeadline = (app) => {
    if (app.tasks && app.tasks.some(t => t.dueDate)) {
      const dates = app.tasks.filter(t => t.dueDate).map(t => t.dueDate);
      if (dates.length > 0) return dates.sort()[0];
    }
    if (app.appliedDate && app.appliedDate !== "-") {
      const d = new Date(app.appliedDate);
      d.setDate(d.getDate() + 14); // 2 weeks limit
      return d.toISOString().split("T")[0];
    }
    return "No deadline";
  };

  // Helper: Dynamic Recruiter Logic
  const getRecruiterName = (app) => {
    if (app.company === "Stripe") return "Marcus A.";
    if (app.company === "Vercel") return "Lee P.";
    if (app.company === "Linear") return "Karri K.";
    if (app.company === "Google") return "Sarah T.";
    if (app.company === "Microsoft") return "University Team";
    return "Talent Team";
  };

  // Dynamic Company Logo Background Colors
  const getGradBackground = (company) => {
    const colors = [
      "from-[#635BFF] to-[#8079FF]",
      "from-[#5E6AD2] to-[#7B88EB]",
      "from-[#0c0a09] to-[#292524]",
      "from-[#00A4EF] to-[#7FBA00]",
      "from-[#FF9900] to-[#146B93]",
      "from-[#10b981] to-[#047857]",
      "from-[#ec4899] to-[#be185d]"
    ];
    let sum = 0;
    for (let i = 0; i < company.length; i++) sum += company.charCodeAt(i);
    return colors[sum % colors.length];
  };

  // Native HTML5 Drag and Drop Handlers
  const handleDragStart = (e, appId) => {
    e.dataTransfer.setData("text/plain", appId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    if (dragOverColumn !== columnId) {
      setDragOverColumn(columnId);
    }
  };

  const handleDrop = (e, targetStatus) => {
    e.preventDefault();
    const appId = e.dataTransfer.getData("text/plain");
    updateApplication(appId, { status: targetStatus });
    setDragOverColumn(null);
  };

  const handleDragLeave = () => {
    setDragOverColumn(null);
  };

  const toggleBookmark = (appId, currentVal, e) => {
    e.stopPropagation();
    updateApplication(appId, { bookmarked: !currentVal });
  };

  const handleCardClick = (appId) => {
    navigate(`/applications/${appId}`);
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in select-none">
      
      {/* Playground Banner */}
      {applications.length === 0 && (
        <div className="bg-[#0c0a09] border border-amber-500/20 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-overlay">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-400/10 flex items-center justify-center text-amber-400 shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Your Pipeline Board is empty</h4>
              <p className="text-[11px] text-brand-400 mt-0.5 font-sans">No applications tracked. Click below to load demo hunt or add a new job to start tracking.</p>
            </div>
          </div>
          <button 
            onClick={loadDemoData}
            className="w-full sm:w-auto px-4 py-1.5 bg-amber-400 hover:bg-amber-500 text-brand-950 text-[11px] font-bold rounded-lg transition hover-lift cursor-pointer"
          >
            Load Demo Hunt
          </button>
        </div>
      )}

      {/* CRM Heading Block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-brand-200/60 rounded-2xl p-6 shadow-premium">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-brand-950 tracking-tight flex items-center gap-2">
            <span>CRM Pipeline Board</span>
            <span className="text-xs font-extrabold text-brand-500 bg-brand-100 px-2 py-0.5 rounded-full">
              {filteredApps.length} active
            </span>
          </h1>
          <p className="text-xs text-brand-500 mt-1 max-w-2xl">
            Attio-style minimalist workspace columns. Drag and drop cards between status boards to transition stages instantly.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-950 hover:bg-brand-900 border border-brand-900 text-white rounded-xl text-xs font-bold shadow-sm transition hover-lift cursor-pointer"
          >
            <Plus size={14} />
            <span>New Application</span>
          </button>
        </div>
      </div>

      {/* Search and Bookmarks Filters Row */}
      <div className="bg-white border border-brand-200/60 rounded-2xl p-4 shadow-premium flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
        <div className="flex items-center bg-brand-50/50 border border-brand-200 rounded-xl px-3 py-2 shadow-2xs w-full md:max-w-md">
          <Search size={15} className="text-brand-400 mr-2 shrink-0" />
          <input
            type="text"
            placeholder="Search company or role..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs text-brand-800 outline-none bg-transparent placeholder-brand-400"
          />
        </div>

        <div className="flex items-center gap-2 px-1 shrink-0">
          <label className="flex items-center gap-2 text-xs font-bold text-brand-700 cursor-pointer">
            <input 
              type="checkbox"
              checked={onlyBookmarked}
              onChange={(e) => setOnlyBookmarked(e.target.checked)}
              className="w-4 h-4 rounded text-amber-500 border-brand-300 cursor-pointer accent-amber-500"
            />
            <Bookmark size={13} className={onlyBookmarked ? "text-amber-500 fill-amber-500" : "text-brand-400"} />
            <span>Show Favorites Only</span>
          </label>
        </div>
      </div>

      {/* Attio-style Kanban Board Container */}
      <div className="flex overflow-x-auto gap-4 py-2 min-h-[60vh] select-none scrollbar-thin">
        {columns.map((col) => {
          const colApps = filteredApps.filter(app => app.status === col.id);
          const isDraggingOver = dragOverColumn === col.id;

          return (
            <div 
              key={col.id} 
              onDragOver={(e) => handleDragOver(e, col.id)}
              onDrop={(e) => handleDrop(e, col.id)}
              onDragLeave={handleDragLeave}
              className={`flex flex-col w-72 shrink-0 bg-white border rounded-2xl p-3.5 transition-all duration-200 ${
                isDraggingOver 
                  ? "border-amber-400 bg-amber-50/5 ring-2 ring-amber-400/10 shadow-overlay" 
                  : "border-brand-200/60"
              }`}
            >
              {/* Column Header */}
              <div className="flex items-center justify-between mb-4 pb-2 border-b border-brand-50 shrink-0">
                <span className="text-xs font-extrabold text-brand-850 uppercase tracking-widest pl-1">
                  {col.label}
                </span>
                <span className="text-[10px] font-mono font-bold text-brand-500 bg-brand-100 px-2 py-0.5 rounded-full">
                  {colApps.length}
                </span>
              </div>

              {/* Cards Container */}
              <div className="space-y-3 overflow-y-auto flex-1 pr-0.5 min-h-[48vh] scrollbar-none">
                {colApps.map((app) => {
                  const priority = getCardPriority(app);
                  const deadline = getCardDeadline(app);
                  const recruiter = getRecruiterName(app);

                  return (
                    <div
                      key={app.id}
                      draggable="true"
                      onDragStart={(e) => handleDragStart(e, app.id)}
                      onClick={() => handleCardClick(app.id)}
                      className="bg-white border border-brand-200/70 rounded-xl p-4 shadow-3xs hover:shadow-xs hover:border-brand-300 transition-all duration-250 cursor-grab active:cursor-grabbing hover-lift relative group"
                    >
                      {/* Logo and Star Header */}
                      <div className="flex items-start justify-between">
                        <div className="flex gap-2.5 items-start">
                          <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${getGradBackground(app.company || '?')} text-white font-extrabold text-xs uppercase flex items-center justify-center shadow-3xs shrink-0 mt-0.5`}>
                            {(app.company || '?')[0]}
                          </div>
                          <div className="min-w-0">
                            <h4 className="text-xs font-bold text-brand-900 group-hover:text-amber-600 transition-colors truncate">
                              {app.company}
                            </h4>
                            <p className="text-[10px] text-brand-500 truncate leading-snug font-medium">
                              {app.role}
                            </p>
                          </div>
                        </div>

                        <button
                          onClick={(e) => toggleBookmark(app.id, app.bookmarked, e)}
                          className="p-0.5 hover:bg-brand-50 rounded-md text-brand-300 hover:text-amber-500 transition cursor-pointer"
                        >
                          <Bookmark size={12} className={app.bookmarked ? "text-amber-500 fill-amber-500" : ""} />
                        </button>
                      </div>

                      {/* Attio Grid Style Details Table */}
                      <div className="mt-3.5 pt-3 border-t border-brand-50 space-y-2 text-[10px] text-brand-500 font-sans leading-none">
                        
                        {/* Platform / Source */}
                        <div className="flex items-center justify-between">
                          <span className="text-brand-400 font-bold uppercase tracking-wider">Platform</span>
                          <span className="font-semibold text-brand-800 bg-brand-50 border px-1.5 py-0.5 rounded">
                            {app.source}
                          </span>
                        </div>

                        {/* Applied Date */}
                        <div className="flex items-center justify-between">
                          <span className="text-brand-400 font-bold uppercase tracking-wider">Applied</span>
                          <span className="font-semibold text-brand-700 flex items-center gap-1">
                            <Calendar size={10} className="text-brand-400" />
                            {app.appliedDate}
                          </span>
                        </div>

                        {/* Priority */}
                        <div className="flex items-center justify-between">
                          <span className="text-brand-400 font-bold uppercase tracking-wider">Priority</span>
                          <span className={`font-extrabold px-1.5 py-0.5 rounded text-[9px] uppercase border ${
                            priority === 'High' ? 'bg-rose-50 border-rose-200/50 text-rose-700' :
                            priority === 'Medium' ? 'bg-amber-50 border-amber-200/50 text-amber-700' :
                            'bg-slate-50 border-slate-200/50 text-slate-600'
                          }`}>
                            {priority}
                          </span>
                        </div>

                        {/* Deadline */}
                        <div className="flex items-center justify-between">
                          <span className="text-brand-400 font-bold uppercase tracking-wider">Deadline</span>
                          <span className="font-semibold text-brand-700 flex items-center gap-1">
                            <Clock size={10} className="text-brand-400" />
                            {deadline}
                          </span>
                        </div>

                        {/* Recruiter */}
                        <div className="flex items-center justify-between">
                          <span className="text-brand-400 font-bold uppercase tracking-wider">Recruiter</span>
                          <span className="font-semibold text-brand-800 flex items-center gap-1">
                            <User size={10} className="text-brand-400" />
                            {recruiter}
                          </span>
                        </div>

                      </div>

                    </div>
                  );
                })}

                {colApps.length === 0 && (
                  <div className="border border-dashed border-brand-200/60 rounded-xl py-12 text-center text-xs text-brand-400 bg-brand-50/10">
                    Drop items here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Modal */}
      <ApplicationModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />

    </div>
  );
}
