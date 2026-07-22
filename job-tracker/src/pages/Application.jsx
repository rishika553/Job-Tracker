import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { applicationsApi } from "../services/applicationsApi";
import { useJobTracker } from "../context/JobTrackerContext";
import ApplicationModal from "../components/ApplicationModal";
import { 
  Search, 
  MapPin, 
  DollarSign, 
  Calendar, 
  Trash2, 
  Edit3, 
  ChevronDown, 
  ChevronUp, 
  Bookmark, 
  User, 
  SlidersHorizontal, 
  FolderSync,
  LayoutGrid,
  List,
  Plus,
  Filter,
  Zap,
  Loader2,
  AlertCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function Application() {
  const { applications: contextApps, fetchApplications: refreshContextApps } = useJobTracker();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const fetchApplications = async (statusFilter = null) => {
    setLoading(true);
    setError(null);
    try {
      const data = await applicationsApi.listApplications(statusFilter);
      setApplications(data);
      refreshContextApps?.();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load job applications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchApplications();
  }, []);

  useEffect(() => {
    if (contextApps && contextApps.length > 0) {
      setApplications(contextApps);
    }
  }, [contextApps]);

  // Delete via API
  const handleDeleteApp = async (id) => {
    if (!confirm("Delete this application?")) return;
    try {
      await applicationsApi.deleteApplication(id);
      setApplications(prev => prev.filter(a => a.id !== id));
    } catch {
      alert("Failed to delete application.");
    }
  };

  // Quick status update via API
  const handleQuickUpdate = async (id, fields) => {
    try {
      const updated = await applicationsApi.updateApplication(id, fields);
      setApplications(prev => prev.map(a => a.id === id ? updated : a));
    } catch { /* ignore */ }
  };

  // Grid or List view layout
  const [viewMode, setViewMode] = useState("grid"); // "grid" or "list"
  
  // Collapsible Filters Panel
  const [filtersOpen, setFiltersOpen] = useState(true);

  // Filter States
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedPlatform, setSelectedPlatform] = useState("All");
  const [selectedStatus, setSelectedStatus] = useState("All");
  const [selectedLocation, setSelectedLocation] = useState("All");
  const [selectedRemote, setSelectedRemote] = useState("All");
  const [selectedSalary, setSelectedSalary] = useState("All");
  const [selectedSort, setSelectedSort] = useState("newest"); // "newest", "oldest", "alphabetical", "salary-desc"
  const [onlyBookmarked, setOnlyBookmarked] = useState(false);

  // Modals states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingApp, setEditingApp] = useState(null);

  // Helper: Numeric Salary Parsing
  const getSalaryNumeric = (salaryStr) => {
    if (!salaryStr || salaryStr === "-") return 0;
    const isHourly = salaryStr.toLowerCase().includes("hour") || salaryStr.toLowerCase().includes("hr") || salaryStr.includes("/");
    
    // Find all numbers in the string
    const numbers = salaryStr.match(/\d+[\d,]*/g);
    if (!numbers || numbers.length === 0) return 0;
    
    let firstVal = parseInt(numbers[0].replace(/,/g, ""), 10);
    
    // Scale hourly wage to annual
    if (isHourly && firstVal < 500) {
      firstVal = firstVal * 2000;
    }
    return firstVal;
  };

  // Helper: Remote Type Parsing
  const getRemoteType = (locationStr) => {
    if (!locationStr || locationStr === "—" || locationStr === "Not specified") return "Not specified";
    const loc = locationStr.toLowerCase();
    if (loc.includes("remote")) return "Remote";
    if (loc.includes("hybrid")) return "Hybrid";
    return "On-site";
  };

  // Helper: Recruiter Name Parsing
  const getRecruiterName = (app) => {
    if (app.notes && app.notes.toLowerCase().includes("recruiter (")) {
      const match = app.notes.match(/recruiter \(([^)]+)\)/i);
      if (match) return match[1];
    }
    return "Not specified";
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

  const cleanText = (str) => {
    if (!str) return "";
    return str
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&nbsp;/g, " ");
  };

  const formatDateStr = (dateStr) => {
    if (!dateStr || dateStr === "—") return "—";
    try {
      const parts = dateStr.split("T")[0].split("-");
      if (parts.length === 3) {
        const d = new Date(parts[0], parts[1] - 1, parts[2]);
        return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      }
      return dateStr.split("T")[0];
    } catch {
      return dateStr.split("T")[0];
    }
  };

  const normalizeStatus = (statusStr) => {
    if (!statusStr) return "applied";
    const s = statusStr.toLowerCase();
    if (s.includes("interview")) return "interview";
    if (s.includes("offer")) return "offer";
    if (s.includes("reject")) return "rejected";
    if (s.includes("wish")) return "wishlist";
    return "applied";
  };

  // Stage pipeline percentages
  const getPipelinePercentage = (status) => {
    const norm = normalizeStatus(status);
    switch (norm) {
      case "wishlist": return 25;
      case "applied": return 50;
      case "interview": return 75;
      case "offer": return 100;
      default: return 50;
    }
  };

  // Filters Chains
  const filteredApplications = applications.filter(app => {
    const matchSearch = (app.company || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
                        (app.title || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchPlatform = selectedPlatform === "All" || (app.source && app.source.toLowerCase().includes(selectedPlatform.toLowerCase()));
    
    const normStatus = normalizeStatus(app.status);
    const matchStatus = selectedStatus === "All" || normStatus === normalizeStatus(selectedStatus);

    const remoteType = getRemoteType(app.location);
    const matchRemote = selectedRemote === "All" || remoteType === selectedRemote;
    const matchLocation = selectedLocation === "All" ||
      ((app.location || "").toLowerCase().includes(selectedLocation.toLowerCase()));
    const salVal = getSalaryNumeric(app.salary_range);
    let matchSalary = true;
    if (selectedSalary === ">$50k") matchSalary = salVal >= 50000;
    else if (selectedSalary === ">$100k") matchSalary = salVal >= 100000;
    else if (selectedSalary === ">$150k") matchSalary = salVal >= 150000;
    const matchBookmark = !onlyBookmarked || app.bookmarked;
    return matchSearch && matchPlatform && matchStatus && matchRemote && matchLocation && matchSalary && matchBookmark;
  });

  // Sorting
  const sortedApplications = [...filteredApplications].sort((a, b) => {
    if (selectedSort === "alphabetical") return (a.company || '').localeCompare(b.company || '');
    if (selectedSort === "salary-desc") return getSalaryNumeric(b.salary_range) - getSalaryNumeric(a.salary_range);
    const dateA = a.applied_at ? a.applied_at.split("T")[0] : "1970-01-01";
    const dateB = b.applied_at ? b.applied_at.split("T")[0] : "1970-01-01";
    if (selectedSort === "oldest") return dateA.localeCompare(dateB);
    return dateB.localeCompare(dateA); // newest
  });

  const allPlatforms = ["All", ...new Set(applications.map(a => a.source).filter(Boolean))];
  const allLocations = ["All", ...new Set(applications.map(a => (a.location || "").split(",")[0].trim()).filter(l => l))];

  const handleDelete = (id) => {
    handleDeleteApp(id);
  };

  const toggleBookmark = (id, currentVal, e) => {
    e.stopPropagation();
    // bookmarked is a local UI concept — not in backend schema, just toggle locally
    setApplications(prev => prev.map(a => a.id === id ? { ...a, bookmarked: !currentVal } : a));
  };

  const handleQuickStatusChange = (id, newStatus, e) => {
    e.stopPropagation();
    handleQuickUpdate(id, { status: newStatus });
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case "wishlist": return "bg-brand-100 text-brand-600 border-brand-200";
      case "applied": return "bg-amber-50 text-amber-700 border-amber-200";
      case "interview": return "bg-blue-50 text-blue-700 border-blue-200";
      case "offer": return "bg-emerald-50 text-emerald-700 border-emerald-200";
      case "rejected": return "bg-brand-50 text-brand-400 border-brand-200";
      default: return "bg-brand-50 text-brand-700 border-brand-100";
    }
  };

  const getSourceStyle = (source) => {
    switch (source) {
      case "Gmail Sync": return "bg-purple-50 text-purple-700 border-purple-200/50";
      case "LinkedIn": return "bg-blue-50 text-blue-700 border-blue-200/50";
      case "Referral": return "bg-indigo-50 text-indigo-700 border-indigo-200/50";
      case "Workday": return "bg-orange-50 text-orange-700 border-orange-200/50";
      case "Greenhouse":
      case "Lever": return "bg-teal-50 text-teal-700 border-teal-200/50";
      default: return "bg-brand-50 text-brand-700 border-brand-200/50";
    }
  };

  const handleResetFilters = () => {
    setSearchTerm("");
    setSelectedPlatform("All");
    setSelectedStatus("All");
    setSelectedLocation("All");
    setSelectedRemote("All");
    setSelectedSalary("All");
    setSelectedSort("newest");
    setOnlyBookmarked(false);
  };

  return (
    <div className="space-y-6 relative min-h-[85vh] pb-12 animate-fade-in">
      
      {/* CRM Heading Block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-brand-200/60 rounded-2xl p-6 shadow-premium">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-brand-950 tracking-tight flex items-center gap-2">
            <span>Active Hunt CRM</span>
            <span className="text-xs font-extrabold text-brand-500 bg-brand-100 px-2 py-0.5 rounded-full">
              {filteredApplications.length} tracked
            </span>
          </h1>
          <p className="text-xs text-brand-500 mt-1 max-w-2xl">
            Filter, sort, and manage candidate pipelines. Click on any card to access its details profile.
          </p>
        </div>

        {/* View mode toggle & Add Job */}
        <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
          {/* Grid/List selector */}
          <div className="flex border border-brand-200 bg-white rounded-xl p-0.5 shadow-premium">
            <button
              onClick={() => setViewMode("grid")}
              className={`p-2 rounded-lg transition duration-200 ${viewMode === "grid" ? "bg-brand-950 text-white shadow-3xs" : "text-brand-400 hover:text-brand-600"}`}
              title="Grid View"
            >
              <LayoutGrid size={15} />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-2 rounded-lg transition duration-200 ${viewMode === "list" ? "bg-brand-950 text-white shadow-3xs" : "text-brand-400 hover:text-brand-600"}`}
              title="List View"
            >
              <List size={15} />
            </button>
          </div>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-950 hover:bg-brand-900 border border-brand-900 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer hover-lift"
          >
            <Plus size={14} />
            <span>Add Application</span>
          </button>
        </div>
      </div>

      {/* Stage Category Quick Tabs Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {[
          { id: "All", label: "All Submitted", count: applications.length, color: "bg-brand-950 text-white" },
          { id: "applied", label: "Applied", count: applications.filter(a => normalizeStatus(a.status) === "applied").length, color: "bg-amber-500 text-white" },
          { id: "interview", label: "Interviewing", count: applications.filter(a => normalizeStatus(a.status) === "interview").length, color: "bg-blue-500 text-white" },
          { id: "offer", label: "Offers", count: applications.filter(a => normalizeStatus(a.status) === "offer").length, color: "bg-emerald-500 text-white" },
          { id: "wishlist", label: "Wishlist", count: applications.filter(a => normalizeStatus(a.status) === "wishlist").length, color: "bg-purple-500 text-white" },
          { id: "rejected", label: "Rejected", count: applications.filter(a => normalizeStatus(a.status) === "rejected").length, color: "bg-stone-500 text-white" },
        ].map((tab) => {
          const isActive = selectedStatus === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setSelectedStatus(tab.id)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer border ${
                isActive
                  ? "bg-white text-brand-950 border-amber-400 shadow-sm ring-1 ring-amber-400/20"
                  : "bg-white/80 hover:bg-white text-brand-600 border-brand-200/80 hover:border-brand-300"
              }`}
            >
              <span>{tab.label}</span>
              <span className={`px-1.5 py-0.2 rounded-md text-[10px] font-mono font-extrabold ${tab.color}`}>
                {tab.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Collapsible Search and Filter Panel */}
      <div className="bg-white border border-brand-200/60 rounded-2xl shadow-premium overflow-hidden transition-all duration-300">
        
        {/* Toggle Bar */}
        <div 
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="p-4 flex items-center justify-between border-b border-brand-50 hover:bg-brand-50/30 cursor-pointer select-none"
        >
          <div className="flex items-center gap-2">
            <SlidersHorizontal size={14} className="text-brand-500" />
            <span className="text-xs font-bold text-brand-850 uppercase tracking-wider">CRM Filter Panel</span>
          </div>
          <span className="text-brand-400">
            {filtersOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </span>
        </div>

        {/* Filters Panel Body */}
        <AnimatePresence initial={false}>
          {filtersOpen && (
            <motion.div
              initial={{ height: 0 }}
              animate={{ height: "auto" }}
              exit={{ height: 0 }}
              className="overflow-hidden"
            >
              <div className="p-5 border-t border-brand-50 bg-brand-50/10 space-y-4">
                
                {/* Search and Sort row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  
                  {/* Search */}
                  <div className="flex items-center bg-white border border-brand-200 rounded-xl px-3 py-2 shadow-2xs">
                    <Search size={15} className="text-brand-400 mr-2 shrink-0" />
                    <input
                      type="text"
                      placeholder="Search company, role or tags..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full text-xs text-brand-800 outline-none placeholder-brand-400"
                    />
                  </div>

                  {/* Sort */}
                  <div className="flex items-center bg-white border border-brand-200 rounded-xl px-3 py-2 shadow-2xs">
                    <span className="text-xs text-brand-400 mr-2 font-bold whitespace-nowrap">Sort:</span>
                    <select
                      value={selectedSort}
                      onChange={(e) => setSelectedSort(e.target.value)}
                      className="w-full bg-transparent text-xs text-brand-700 outline-none cursor-pointer font-bold"
                    >
                      <option value="newest">Applied Date (Newest)</option>
                      <option value="oldest">Applied Date (Oldest)</option>
                      <option value="alphabetical">Company Name (A-Z)</option>
                      <option value="salary-desc">Salary (Highest)</option>
                    </select>
                  </div>

                  {/* Bookmarks toggle checkbox */}
                  <div className="flex items-center gap-2 px-1">
                    <label className="flex items-center gap-2 text-xs font-bold text-brand-700 cursor-pointer select-none">
                      <input 
                        type="checkbox"
                        checked={onlyBookmarked}
                        onChange={(e) => setOnlyBookmarked(e.target.checked)}
                        className="w-4 h-4 rounded text-amber-500 border-brand-300 cursor-pointer accent-amber-500"
                      />
                      <Bookmark size={13} className={onlyBookmarked ? "text-amber-500 fill-amber-500" : "text-brand-400"} />
                      <span>Show Bookmarked Only</span>
                    </label>
                  </div>

                </div>

                {/* Dropdown Filters row */}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3.5 pt-1">
                  
                  {/* Platform */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-extrabold text-brand-400 uppercase tracking-widest pl-1">Platform</span>
                    <select
                      value={selectedPlatform}
                      onChange={(e) => setSelectedPlatform(e.target.value)}
                      className="border border-brand-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-brand-700 bg-white outline-none cursor-pointer"
                    >
                      <option value="All">All Platforms</option>
                      {allPlatforms.filter(p => p !== "All").map(plat => (
                        <option key={plat} value={plat}>{plat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Status */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-extrabold text-brand-400 uppercase tracking-widest pl-1">Status</span>
                    <select
                      value={selectedStatus}
                      onChange={(e) => setSelectedStatus(e.target.value)}
                      className="border border-brand-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-brand-700 bg-white outline-none cursor-pointer"
                    >
                      <option value="All">All Stages</option>
                      <option value="wishlist">Wishlist</option>
                      <option value="applied">Applied</option>
                      <option value="interview">Interviewing</option>
                      <option value="offer">Offer Received</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  {/* Location */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-extrabold text-brand-400 uppercase tracking-widest pl-1">Location</span>
                    <select
                      value={selectedLocation}
                      onChange={(e) => setSelectedLocation(e.target.value)}
                      className="border border-brand-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-brand-700 bg-white outline-none cursor-pointer"
                    >
                      <option value="All">All Locations</option>
                      {allLocations.map(loc => (
                        <option key={loc} value={loc}>{loc}</option>
                      ))}
                    </select>
                  </div>

                  {/* Remote */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-extrabold text-brand-400 uppercase tracking-widest pl-1">Remote Type</span>
                    <select
                      value={selectedRemote}
                      onChange={(e) => setSelectedRemote(e.target.value)}
                      className="border border-brand-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-brand-700 bg-white outline-none cursor-pointer"
                    >
                      <option value="All">All Workspaces</option>
                      <option value="Remote">Remote</option>
                      <option value="Hybrid">Hybrid</option>
                      <option value="On-site">On-site</option>
                    </select>
                  </div>

                  {/* Salary */}
                  <div className="flex flex-col gap-1">
                    <span className="text-[10px] font-extrabold text-brand-400 uppercase tracking-widest pl-1">Salary</span>
                    <select
                      value={selectedSalary}
                      onChange={(e) => setSelectedSalary(e.target.value)}
                      className="border border-brand-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-brand-700 bg-white outline-none cursor-pointer"
                    >
                      <option value="All">Any Compensation</option>
                      <option value=">$50k">&gt; $50,000 /yr</option>
                      <option value=">$100k">&gt; $100,000 /yr</option>
                      <option value=">$150k">&gt; $150,000 /yr</option>
                    </select>
                  </div>

                </div>

              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Grid View Canvas */}
      {viewMode === "grid" && sortedApplications.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {sortedApplications.map((app) => {
            const remoteType = getRemoteType(app.location);
            const recruiter = getRecruiterName(app);
            const progress = getPipelinePercentage(app.status);
            const cleanCompany = cleanText(app.company);
            const cleanTitle = cleanText(app.title);

            return (
              <motion.div
                key={app.id}
                layoutId={`card-${app.id}`}
                onClick={() => navigate(`/applications/${app.id}`)}
                className="bg-white border border-brand-200/70 rounded-2xl p-5 shadow-premium hover:shadow-premium-hover hover:border-amber-400/40 cursor-pointer relative group transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  {/* Company & Role Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-3.5 items-start min-w-0 flex-1">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getGradBackground(cleanCompany)} text-white font-extrabold text-sm uppercase flex items-center justify-center shadow-3xs shrink-0 mt-0.5`}>
                        {cleanCompany[0] || 'C'}
                      </div>
                      <div className="min-w-0 flex-1 text-left">
                        <h4 className="text-sm font-black text-brand-950 group-hover:text-amber-600 transition-colors truncate">
                          {cleanCompany}
                        </h4>
                        <p className="text-xs font-semibold text-brand-600 leading-snug mt-0.5 line-clamp-2">
                          {cleanTitle}
                        </p>
                      </div>
                    </div>

                    <button
                      onClick={(e) => toggleBookmark(app.id, app.bookmarked, e)}
                      className="p-1.5 hover:bg-brand-50 rounded-lg text-brand-350 hover:text-amber-500 transition shrink-0 cursor-pointer"
                      title="Bookmark"
                    >
                      <Bookmark size={15} className={app.bookmarked ? "text-amber-500 fill-amber-500" : ""} />
                    </button>
                  </div>

                  {/* Metadata Grid */}
                  <div className="grid grid-cols-2 gap-2 mt-4 text-xs text-brand-500 border-t border-b border-brand-100/60 py-3 text-left">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <MapPin size={12} className="text-brand-400 shrink-0" />
                      <span className="truncate">{app.location || "Not specified"}</span>
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0 font-mono text-[11px] font-bold">
                      <DollarSign size={12} className="text-brand-400 shrink-0" />
                      <span className="truncate">{app.salary_range || "—"}</span>
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <Calendar size={12} className="text-brand-400 shrink-0" />
                      <span className="truncate">Applied {formatDateStr(app.applied_at)}</span>
                    </div>
                    <div className="flex items-center gap-1.5 min-w-0">
                      <FolderSync size={12} className="text-brand-400 shrink-0" />
                      <span className="truncate">{remoteType}</span>
                    </div>
                  </div>

                  {/* Badges Row */}
                  <div className="flex items-center justify-between gap-2 mt-3.5">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[9px] font-black uppercase px-2.5 py-0.5 rounded-md border tracking-wider ${getStatusStyle(normalizeStatus(app.status))}`}>
                        {normalizeStatus(app.status)}
                      </span>
                      <span className={`text-[9px] font-bold px-2 py-0.5 rounded-md border ${getSourceStyle(app.source)}`}>
                        {app.source || "Gmail Sync"}
                      </span>
                    </div>

                    <span className="text-[10px] font-bold text-brand-400 flex items-center gap-1">
                      <User size={11} />
                      <span className="truncate max-w-[90px]">{recruiter}</span>
                    </span>
                  </div>

                  {/* Stage Progress Bar */}
                  <div className="mt-4 pt-1">
                    <div className="flex items-center justify-between text-[10px] font-extrabold text-brand-400 mb-1">
                      <span className="uppercase tracking-wider">Pipeline Stage</span>
                      <span className="font-mono">{progress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-brand-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          normalizeStatus(app.status) === 'offer' ? 'bg-emerald-500' :
                          normalizeStatus(app.status) === 'interview' ? 'bg-blue-500' :
                          normalizeStatus(app.status) === 'applied' ? 'bg-amber-400' :
                          'bg-brand-400'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Card Actions Footer */}
                <div className="mt-4 pt-3 border-t border-brand-100/60 flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {['wishlist', 'applied', 'interview', 'offer'].map(st => (
                      st !== normalizeStatus(app.status) && (
                        <button
                          key={st}
                          onClick={(e) => handleQuickStatusChange(app.id, st, e)}
                          className="px-1.5 py-0.5 bg-brand-100 hover:bg-brand-200 text-brand-700 rounded text-[9px] font-bold uppercase transition cursor-pointer"
                          title={`Move to ${st}`}
                        >
                          {st[0]}
                        </button>
                      )
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingApp(app);
                        setIsEditModalOpen(true);
                      }}
                      className="p-1.5 hover:bg-brand-50 rounded-lg text-brand-450 hover:text-brand-850 transition cursor-pointer"
                      title="Edit"
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(app.id);
                      }}
                      className="p-1.5 hover:bg-brand-50 rounded-lg text-brand-400 hover:text-rose-600 transition cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

              </motion.div>
            );
          })}
        </div>
      )}

      {/* List View Canvas */}
      {viewMode === "list" && sortedApplications.length > 0 && (
        <div className="space-y-4">
          {sortedApplications.map((app) => {
            const recruiter = getRecruiterName(app);
            const progress = getPipelinePercentage(app.status);
            const remoteType = getRemoteType(app.location);
            const cleanCompany = cleanText(app.company);
            const cleanTitle = cleanText(app.title);

            return (
              <motion.div
                key={app.id}
                layoutId={`card-list-${app.id}`}
                onClick={() => navigate(`/applications/${app.id}`)}
                className="bg-white border border-brand-200/70 rounded-xl p-4 shadow-premium hover:shadow-premium-hover hover:border-amber-400/40 cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-4 group transition-all duration-300 relative"
              >
                
                {/* Left Side: Logo & Titles */}
                <div className="flex items-center gap-3.5 min-w-[260px] text-left">
                  <button
                    onClick={(e) => toggleBookmark(app.id, app.bookmarked, e)}
                    className="text-brand-350 hover:text-amber-500 transition shrink-0 cursor-pointer"
                  >
                    <Bookmark size={15} className={app.bookmarked ? "text-amber-500 fill-amber-500" : ""} />
                  </button>

                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getGradBackground(cleanCompany)} text-white font-extrabold text-xs uppercase flex items-center justify-center shadow-3xs shrink-0`}>
                    {cleanCompany[0] || 'C'}
                  </div>

                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs md:text-sm font-extrabold text-brand-950 truncate">
                      {cleanCompany}
                    </h4>
                    <p className="text-xs font-semibold text-brand-600 truncate mt-0.5">
                      {cleanTitle}
                    </p>
                  </div>
                </div>

                {/* Middle Info */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 flex-1 text-xs text-brand-500 text-left">
                    <span className="flex items-center gap-1.5 min-w-0">
                      <MapPin size={12} className="text-brand-400 shrink-0" />
                      <span className="truncate">{app.location || "Not specified"}</span>
                    </span>
                  <span className="flex items-center gap-1.5 font-mono text-[11px] font-bold min-w-0">
                    <DollarSign size={12} className="text-brand-400 shrink-0" />
                    <span className="truncate">{app.salary_range || "—"}</span>
                  </span>
                  <span className="flex items-center gap-1.5 min-w-0">
                    <Calendar size={12} className="text-brand-400 shrink-0" />
                    <span className="truncate">{formatDateStr(app.applied_at)}</span>
                  </span>
                  <span className="flex items-center gap-1.5 min-w-0">
                    <FolderSync size={12} className="text-brand-400 shrink-0" />
                    <span className="truncate">{remoteType}</span>
                  </span>
                </div>

                {/* Stage Indicators */}
                <div className="flex items-center gap-4 min-w-[200px] border-t md:border-t-0 pt-3 md:pt-0">
                  <div className="w-24 shrink-0 text-left">
                    <span className={`inline-block text-[9px] font-black uppercase px-2 py-0.5 rounded border ${getStatusStyle(normalizeStatus(app.status))}`}>
                      {normalizeStatus(app.status)}
                    </span>
                    <span className="block text-[9px] font-bold text-brand-400 mt-1 truncate">
                      via {app.source || "Gmail Sync"}
                    </span>
                  </div>

                  <div className="flex-1">
                    <div className="flex justify-between text-[9px] font-bold text-brand-400 mb-0.5">
                      <span>Pipeline</span>
                      <span className="font-mono">{progress}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-brand-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full transition-all duration-300 ${
                          normalizeStatus(app.status) === 'offer' ? 'bg-emerald-500' :
                          normalizeStatus(app.status) === 'interview' ? 'bg-blue-500' :
                          normalizeStatus(app.status) === 'applied' ? 'bg-amber-400' :
                          'bg-brand-400'
                        }`}
                        style={{ width: `${progress}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Right Side Actions */}
                <div className="flex items-center justify-between md:justify-end gap-5 border-t md:border-t-0 pt-3 md:pt-0 min-w-[130px]">
                  <span className="text-[10px] font-bold text-brand-400 flex items-center gap-1.5">
                    <User size={11} />
                    <span className="truncate max-w-[80px]">{recruiter}</span>
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingApp(app);
                        setIsEditModalOpen(true);
                      }}
                      className="p-1.5 hover:bg-brand-50 rounded-lg text-brand-450 hover:text-brand-850 transition cursor-pointer"
                      title="Edit"
                    >
                      <Edit3 size={13} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(app.id);
                      }}
                      className="p-1.5 hover:bg-brand-50 rounded-lg text-brand-400 hover:text-rose-600 transition cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>

              </motion.div>
            );
          })}
        </div>
      )}

      {/* Empty State */}
      {sortedApplications.length === 0 && (
        <div className="bg-white border border-brand-200/60 rounded-2xl p-8 text-center max-w-xl mx-auto shadow-premium space-y-5 py-12 mt-8">
          <div className="w-12 h-12 bg-amber-50 rounded-full border border-amber-200 flex items-center justify-center text-amber-500 mx-auto">
            <Filter size={20} />
          </div>
          <div>
            <h3 className="text-sm font-bold text-brand-850">No applications match your query</h3>
            <p className="text-xs text-brand-500 mt-2 max-w-sm mx-auto leading-relaxed">
              We couldn't find any job tracks matching your active filters. Try searching for different terms or clear the filter panels.
            </p>
          </div>
          
          <div className="flex justify-center gap-3">
            <button
              onClick={handleResetFilters}
              className="px-4 py-2 bg-brand-950 hover:bg-brand-900 text-white font-bold rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5 hover-lift"
            >
              <span>Clear Filters</span>
            </button>
            {applications.length === 0 && (
              <button
                onClick={() => setIsAddModalOpen(true)}
                className="px-4 py-2 bg-white border border-brand-200 hover:border-brand-300 text-brand-700 font-semibold rounded-xl text-xs transition cursor-pointer"
              >
                Load Demo Hunt
              </button>
            )}
          </div>
        </div>
      )}

      {/* Add Modal */}
      <ApplicationModal 
        isOpen={isAddModalOpen} 
        onClose={() => setIsAddModalOpen(false)}
        onSaved={() => fetchApplications()}
      />

      {/* Edit Modal */}
      <ApplicationModal 
        isOpen={isEditModalOpen} 
        onClose={() => { setIsEditModalOpen(false); setEditingApp(null); }} 
        appToEdit={editingApp}
        onSaved={() => fetchApplications()}
      />
    </div>
  );
}