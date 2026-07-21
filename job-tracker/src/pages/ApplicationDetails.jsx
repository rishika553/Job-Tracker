import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { applicationsApi } from "../services/applicationsApi";
import { useJobTracker } from "../context/JobTrackerContext";
import ApplicationModal from "../components/ApplicationModal";
import { 
  ArrowLeft,
  AlertCircle,
  Briefcase, 
  MapPin, 
  DollarSign, 
  Calendar, 
  Tag, 
  Bookmark, 
  User, 
  Link as LinkIcon, 
  FileText, 
  CheckSquare, 
  Mail, 
  Clock, 
  Archive, 
  Edit3, 
  Trash2, 
  Play, 
  Plus, 
  Check, 
  ChevronRight,
  TrendingUp,
  Award,
  Video,
  FileDown,
  Layers,
  ChevronDown,
  ChevronUp,
  Loader2
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ApplicationDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { deleteApplication, updateApplication, addTask, toggleTask, applications: contextApplications } = useJobTracker();
  const [app, setApp] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchApplicationDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await applicationsApi.getApplicationById(id);
      setApp(data);
    } catch (err) {
      // Fallback: try to find the app in local context (e.g. demo data)
      const contextApp = contextApplications.find(a => a.id === id);
      if (contextApp) {
        setApp(contextApp);
      } else {
        setError(err.response?.data?.detail || "Application not found.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchApplicationDetails();
    }
  }, [id]);

  // isFallback: true when app came from local context, not the backend API
  const isFallback = app ? !app.created_at : false;

  // Local state for modals & text inputs
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [notesText, setNotesText] = useState(app?.notes || "");
  const [newTaskText, setNewTaskText] = useState("");
  const [newTaskDueDate, setNewTaskDueDate] = useState("");
  const [expandedEmailId, setExpandedEmailId] = useState(null);

  useEffect(() => {
    if (app) {
      setNotesText(app.notes || "");
    }
  }, [app]);

  const handleNotesChange = (e) => {
    const val = e.target.value;
    setNotesText(val);
    if (!isFallback) {
      updateApplication(app.id, { notes: val });
    }
  };

  const handleAddNewTask = (e) => {
    e.preventDefault();
    if (!newTaskText.trim()) return;
    if (!isFallback) {
      addTask(app.id, newTaskText.trim(), newTaskDueDate);
    } else {
      app.tasks = [...(app.tasks || []), {
        id: Date.now().toString(),
        text: newTaskText.trim(),
        completed: false,
        dueDate: newTaskDueDate || "2026-07-20"
      }];
      setNotesText(notesText + " ");
    }
    setNewTaskText("");
    setNewTaskDueDate("");
  };

  const handleToggleTask = (taskId) => {
    if (!isFallback) {
      toggleTask(app.id, taskId);
    } else {
      const task = (app.tasks || []).find(t => t.id === taskId);
      if (task) task.completed = !task.completed;
      setNotesText(notesText + " ");
    }
  };

  const handleDelete = () => {
    if (confirm("Are you sure you want to delete this job application?")) {
      if (!isFallback) {
        deleteApplication(app.id);
      }
      navigate("/applications");
    }
  };

  const toggleArchive = () => {
    const nextArchived = !app.archived;
    if (!isFallback) {
      updateApplication(app.id, { archived: nextArchived });
    } else {
      app.archived = nextArchived;
      setNotesText(notesText + " ");
    }
  };

  const toggleBookmark = () => {
    const nextBookmarked = !app.bookmarked;
    if (!isFallback) {
      updateApplication(app.id, { bookmarked: nextBookmarked });
    } else {
      app.bookmarked = nextBookmarked;
      setNotesText(notesText + " ");
    }
  };

  const handleStatusChange = (newStatus) => {
    if (!isFallback) {
      updateApplication(app.id, { status: newStatus });
    } else {
      app.status = newStatus;
      app.history = [...(app.history || []), {
        date: new Date().toISOString().split("T")[0],
        status: newStatus,
        notes: `Status changed manually to ${newStatus}`
      }];
      setNotesText(notesText + " ");
    }
  };

  // ── Guard: show loading / error / not-found before accessing app fields ──
  if (loading) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (error || !app) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 text-center">
        <AlertCircle className="w-10 h-10 text-rose-400" />
        <p className="text-sm font-semibold text-slate-600">{error || "Application not found."}</p>
        <button onClick={() => navigate("/applications")} className="px-4 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold">
          Back to Applications
        </button>
      </div>
    );
  }

  // Helper formatting styles
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

  // Pipeline conversion index
  const pipelineSteps = [
    { status: "wishlist", label: "Target" },
    { status: "applied", label: "Applied" },
    { status: "interview", label: "Interview" },
    { status: "offer", label: "Offer" }
  ];

  const currentStepIndex = pipelineSteps.findIndex(s => s.status === app.status);

  // Recruiter & Hiring team data
  const recruiterName = app.company === "Stripe" ? "Marcus A." : app.company === "Vercel" ? "Lee P." : "Talent Acquisition";
  const recruiterEmail = `${recruiterName.toLowerCase().replace(" ", "")}@${app.company.toLowerCase()}.com`;
  
  const hiringTeam = [
    { name: recruiterName, role: "Recruiter", avatar: "MA" },
    { name: app.company === "Stripe" ? "Karri K." : "Lee P.", role: "Hiring Manager", avatar: "HM" },
    { name: "Siddharth S.", role: "Engineering Lead", avatar: "SS" }
  ];

  // Similar jobs search
  const similarJobs = [
    { company: "Linear", role: "Product Engineer", location: "Remote", salary: "$130k - $160k", logoColor: "from-[#5E6AD2] to-[#7B88EB]" },
    { company: "Vercel", role: "Developer Advocate", location: "Remote", salary: "$125k - $155k", logoColor: "from-[#000000] to-[#2563EB]" }
  ].filter(job => job.company.toLowerCase() !== app.company.toLowerCase());

  return (
    <div className="space-y-6 relative pb-16 animate-fade-in">
      
      {/* Fallback Playground Warning Banner */}
      {isFallback && (
        <div className="bg-[#0c0a09] border border-amber-500/20 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-overlay">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-400/10 flex items-center justify-center text-amber-400 shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Viewing Application Details Playground</h4>
              <p className="text-[11px] text-brand-400 mt-0.5">Currently displaying a mock details profile for Stripe. Load actual hunt to test dynamic navigation.</p>
            </div>
          </div>
          <button 
            onClick={() => navigate("/applications")}
            className="w-full sm:w-auto px-4 py-1.5 bg-amber-400 hover:bg-amber-500 text-brand-950 text-[11px] font-bold rounded-lg transition"
          >
            Back to CRM Board
          </button>
        </div>
      )}

      {/* Sticky Action Panel */}
      <div className="sticky top-0 bg-white/80 backdrop-blur-md border border-brand-200/60 rounded-2xl p-5 shadow-overlay flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-30">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate("/applications")}
            className="p-2 hover:bg-brand-50 rounded-xl text-brand-500 hover:text-brand-850 transition"
            title="Back to Applications list"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getGradBackground(app.company)} text-white font-extrabold text-sm uppercase flex items-center justify-center shadow-3xs shrink-0`}>
            {app.company[0]}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base md:text-lg font-black text-brand-950 tracking-tight">{app.company}</h1>
              {app.bookmarked && (
                <Bookmark className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              )}
              {app.archived && (
                <span className="text-[9px] font-extrabold text-brand-400 bg-brand-100 px-1.5 py-0.5 rounded border">ARCHIVED</span>
              )}
            </div>
            <p className="text-xs font-semibold text-brand-500">{app.role}</p>
          </div>
        </div>

        {/* Action button controls */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          
          {/* Stage Dropdown */}
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-brand-400 font-bold uppercase">Stage:</span>
            <select
              value={app.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="border border-brand-200 rounded-xl px-2.5 py-1.5 text-xs font-bold text-brand-700 bg-white outline-none cursor-pointer focus:border-brand-500"
            >
              <option value="wishlist">Wishlist</option>
              <option value="applied">Applied</option>
              <option value="interview">Interviewing</option>
              <option value="offer">Offer Received</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <span className="w-px h-6 bg-brand-200 hidden sm:inline" />

          {/* Bookmark */}
          <button 
            onClick={toggleBookmark}
            className={`p-2 rounded-xl border transition ${
              app.bookmarked 
                ? "bg-amber-50 border-amber-200 text-amber-600" 
                : "bg-white border-brand-200 text-brand-400 hover:text-brand-700"
            }`}
            title={app.bookmarked ? "Unbookmark application" : "Bookmark application"}
          >
            <Bookmark className="w-4 h-4" />
          </button>

          {/* Archive toggle */}
          <button 
            onClick={toggleArchive}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-bold transition ${
              app.archived 
                ? "bg-purple-50 border-purple-200 text-purple-600" 
                : "bg-white border-brand-200 text-brand-600 hover:bg-brand-50"
            }`}
          >
            <Archive className="w-3.5 h-3.5" />
            <span>{app.archived ? "Archived" : "Archive"}</span>
          </button>

          {/* Edit */}
          <button 
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-brand-200 hover:bg-brand-50 rounded-xl text-xs font-bold text-brand-700 transition"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>Edit</span>
          </button>

          {/* Delete */}
          <button 
            onClick={handleDelete}
            className="flex items-center gap-1.5 px-3 py-2 bg-white border border-brand-200 hover:border-rose-100 text-brand-600 hover:text-rose-600 rounded-xl text-xs font-bold transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Delete</span>
          </button>

        </div>
      </div>

      {/* 3-Column Profile Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* Left Column: Metadata & Assets */}
        <div className="space-y-6">
          
          {/* Company Overview */}
          <div className="bg-white border border-brand-200/60 rounded-2xl p-5 shadow-premium">
            <h3 className="text-xs font-bold text-brand-850 uppercase tracking-wider mb-4">Company Overview</h3>
            <div className="space-y-3.5 text-xs text-brand-600">
              <div className="flex justify-between items-center py-1 border-b border-brand-50">
                <span className="font-bold text-brand-400">Headquarters</span>
                <span className="font-semibold text-brand-900">San Francisco, CA</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-brand-50">
                <span className="font-bold text-brand-400">Industry</span>
                <span className="font-semibold text-brand-900">Fintech / Payments</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-brand-50">
                <span className="font-bold text-brand-400">Company Size</span>
                <span className="font-semibold text-brand-900">8,500+ employees</span>
              </div>
              <div className="flex justify-between items-center py-1">
                <span className="font-bold text-brand-400">Website</span>
                <a 
                  href={`https://www.${app.company.toLowerCase()}.com`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="font-bold text-amber-600 hover:underline flex items-center gap-0.5"
                >
                  <span>{app.company.toLowerCase()}.com</span>
                  <LinkIcon className="w-3 h-3" />
                </a>
              </div>
            </div>
          </div>

          {/* Salary Information */}
          <div className="bg-white border border-brand-200/60 rounded-2xl p-5 shadow-premium">
            <h3 className="text-xs font-bold text-brand-850 uppercase tracking-wider mb-4">Salary & Compensation</h3>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-black text-brand-950 font-mono tracking-tight">
                {app.salary || "—"}
              </span>
            </div>
            <p className="text-[10px] text-brand-400 font-bold uppercase mt-1">ANNUAL BASE BRACKET</p>
            
            <div className="border-t border-brand-100 pt-3.5 mt-4 space-y-2 text-xs text-brand-500">
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Health, dental & vision coverage</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>401(k) matching up to 4%</span>
              </div>
            </div>
          </div>

          {/* Required Skills */}
          <div className="bg-white border border-brand-200/60 rounded-2xl p-5 shadow-premium">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs font-bold text-brand-850 uppercase tracking-wider">Required Skills</h3>
              <span className="text-[10px] font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-100">
                85% Match
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {app.tags && app.tags.map(tag => (
                <span 
                  key={tag} 
                  className="flex items-center gap-1 bg-brand-50/50 border border-brand-100 text-brand-650 px-2.5 py-1 rounded-lg text-xs font-bold"
                >
                  <Tag className="w-3 h-3 text-brand-400" />
                  <span>{tag}</span>
                </span>
              ))}
            </div>
          </div>

          {/* Documents */}
          <div className="bg-white border border-brand-200/60 rounded-2xl p-5 shadow-premium">
            <h3 className="text-xs font-bold text-brand-850 uppercase tracking-wider mb-4">Linked Documents</h3>
            <div className="space-y-3">
              {/* Resume */}
              <a 
                href="file:///C:/Users/Rishika/Desktop/resume.pdf"
                className="flex items-center justify-between p-3 bg-brand-50/50 hover:bg-brand-50 border border-brand-100 rounded-xl transition cursor-pointer group"
              >
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-brand-400 group-hover:text-amber-500 transition-colors" />
                  <span className="text-xs font-bold text-brand-900">Resume_Rishika.pdf</span>
                </div>
                <FileDown className="w-3.5 h-3.5 text-brand-400" />
              </a>

              {/* Cover Letter */}
              <div className="flex items-center justify-between p-3 bg-brand-50/50 hover:bg-brand-50 border border-brand-100 rounded-xl transition cursor-pointer group">
                <div className="flex items-center gap-2.5">
                  <FileText className="w-4 h-4 text-brand-400 group-hover:text-amber-500 transition-colors" />
                  <span className="text-xs font-bold text-brand-900">CoverLetter_{app.company}.pdf</span>
                </div>
                <FileDown className="w-3.5 h-3.5 text-brand-400" />
              </div>
            </div>
          </div>

        </div>

        {/* Middle Column: Progress, Timeline, JD, Calendar */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Application Progress Funnel */}
          <div className="bg-white border border-brand-200/60 rounded-2xl p-6 shadow-premium">
            <h3 className="text-xs font-bold text-brand-850 uppercase tracking-wider mb-5">Pipeline Progress</h3>
            
            {/* Visual Steps Tracker */}
            <div className="flex flex-col sm:flex-row justify-between items-center gap-4 relative">
              
              {/* Connecting line */}
              <div className="absolute top-3.5 left-6 right-6 h-0.5 bg-brand-100 hidden sm:block z-0" />
              <div 
                className="absolute top-3.5 left-6 h-0.5 bg-amber-400 hidden sm:block z-0 transition-all duration-500" 
                style={{ width: `${currentStepIndex >= 0 ? (currentStepIndex / (pipelineSteps.length - 1)) * 90 : 0}%` }}
              />

              {pipelineSteps.map((step, idx) => {
                const isPassed = idx < currentStepIndex;
                const isActive = idx === currentStepIndex;
                
                return (
                  <div 
                    key={step.status}
                    onClick={() => handleStatusChange(step.status)}
                    className="flex flex-row sm:flex-col items-center gap-3 sm:gap-2 z-10 cursor-pointer group"
                  >
                    <div className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-300 ${
                      isPassed ? "bg-amber-400 border-amber-400 text-brand-950" :
                      isActive ? "bg-brand-950 border-brand-950 text-white shadow-3xs scale-110" :
                      "bg-white border-brand-200 text-brand-400 group-hover:border-brand-400"
                    }`}>
                      {isPassed ? (
                        <Check className="w-4 h-4" strokeWidth={3} />
                      ) : (
                        <span className="text-xs font-extrabold">{idx + 1}</span>
                      )}
                    </div>
                    <span className={`text-xs font-bold ${
                      isActive ? "text-brand-950" : "text-brand-400 group-hover:text-brand-700"
                    }`}>
                      {step.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Job Description */}
          <div className="bg-white border border-brand-200/60 rounded-2xl p-6 shadow-premium">
            <h3 className="text-xs font-bold text-brand-850 uppercase tracking-wider mb-3">Job Description</h3>
            <div className="text-xs md:text-sm text-brand-650 leading-relaxed font-sans whitespace-pre-line bg-brand-50/20 border border-brand-100 rounded-xl p-4 max-h-56 overflow-y-auto">
              {app.jobDescription}
            </div>
          </div>

          {/* Interview Schedule */}
          <div className="bg-white border border-brand-200/60 rounded-2xl p-6 shadow-premium">
            <h3 className="text-xs font-bold text-brand-850 uppercase tracking-wider mb-4">Interview Schedule</h3>
            {app.status === "interview" ? (
              <div className="space-y-4">
                <div className="p-4 bg-brand-50/50 border border-brand-100 rounded-xl space-y-3.5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-brand-100/50 pb-3">
                    <div>
                      <span className="text-[10px] font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-100 uppercase">
                        Technical Panel Loop
                      </span>
                      <h4 className="text-sm font-bold text-brand-900 mt-1">Stripe Frontend Interview Screen</h4>
                    </div>
                    <span className="text-xs font-extrabold text-brand-500 font-mono">
                      Jul 17, 2026 — 2:00 PM PST
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-3 text-xs">
                    <span className="flex items-center gap-1.5 text-brand-600">
                      <Video className="w-4 h-4 text-brand-400" />
                      <a href="https://teams.microsoft.com/stripe-loop-xxx" target="_blank" rel="noreferrer" className="underline text-amber-600 font-bold hover:text-amber-800">
                        Join MS Teams Meeting
                      </a>
                    </span>
                    <span className="text-[10px] font-extrabold text-brand-400 bg-brand-105 border border-brand-200 px-2 py-0.5 rounded">
                      INTERVIEWER: MARCUS A.
                    </span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-brand-400 text-center py-6">
                No active interviews currently scheduled for this pipeline stage.
              </p>
            )}
          </div>

          {/* Split 2-Column: Application Timeline History & Tasks */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Application Timeline Roadmap */}
            <div className="bg-white border border-brand-200/60 rounded-2xl p-5 shadow-premium">
              <h3 className="text-xs font-bold text-brand-850 uppercase tracking-wider mb-4">Roadmap Logs</h3>
              <div className="space-y-4 pl-3.5 border-l border-brand-200">
                {app.history && app.history.map((hist, idx) => (
                  <div key={idx} className="relative">
                    <span className="absolute -left-[18px] top-1 w-2 h-2 bg-white border border-amber-400 rounded-full" />
                    <div className="text-xs">
                      <div className="flex items-center gap-1.5">
                        <span className="font-extrabold text-brand-850 capitalize">{hist.status}</span>
                        <span className="text-[9px] text-brand-400 font-bold font-mono">{hist.date}</span>
                      </div>
                      {hist.notes && (
                        <p className="text-brand-500 mt-1 leading-relaxed">
                          {hist.notes}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Preparation Checklists Tasks */}
            <div className="bg-white border border-brand-200/60 rounded-2xl p-5 shadow-premium">
              <h3 className="text-xs font-bold text-brand-850 uppercase tracking-wider mb-1">Checklist Tasks</h3>
              <p className="text-[10px] text-brand-400 mb-4">Preparation milestones for this candidacy</p>
              
              <form onSubmit={handleAddNewTask} className="flex gap-2 mb-4">
                <input
                  type="text"
                  required
                  placeholder="Review specs..."
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  className="flex-1 border border-brand-200 rounded-xl px-3 py-1.5 text-xs text-brand-800 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-3 bg-brand-950 hover:bg-brand-900 text-white rounded-xl text-xs font-bold"
                >
                  Add
                </button>
              </form>

              <div className="space-y-2.5 max-h-[160px] overflow-y-auto pr-0.5">
                {app.tasks && app.tasks.map(task => (
                  <div 
                    key={task.id} 
                    className="flex items-start gap-2.5 p-2 bg-brand-50/20 border border-brand-50 rounded-xl hover:border-brand-200 transition"
                  >
                    <div 
                      onClick={() => handleToggleTask(task.id)}
                      className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer mt-0.5 transition ${
                        task.completed ? "bg-brand-950 border-brand-950 text-white" : "border-brand-300"
                      }`}
                    >
                      {task.completed && <Check className="w-3 h-3 stroke-[3px]" />}
                    </div>
                    <span className={`text-xs font-bold leading-normal ${task.completed ? "line-through text-brand-400 font-normal" : "text-brand-700"}`}>
                      {task.text}
                    </span>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

        {/* Right Column: Recruiter, Hiring Team, Emails, Notepad, Similar Jobs */}
        <div className="space-y-6">
          
          {/* Recruiter Information */}
          <div className="bg-white border border-brand-200/60 rounded-2xl p-5 shadow-premium">
            <h3 className="text-xs font-bold text-brand-850 uppercase tracking-wider mb-4">Recruiter Profile</h3>
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-full bg-brand-950 text-amber-400 border border-brand-800 flex items-center justify-center font-extrabold text-sm uppercase shadow-3xs">
                {recruiterName[0]}
              </div>
              <div>
                <h4 className="text-xs md:text-sm font-bold text-brand-900">{recruiterName}</h4>
                <p className="text-xs text-brand-400">Senior Technical Recruiter</p>
                <p className="text-[10px] text-brand-500 mt-0.5 font-mono">{recruiterEmail}</p>
              </div>
            </div>
            
            <div className="border-t border-brand-100 pt-3.5 mt-4">
              <a 
                href={`mailto:${recruiterEmail}`}
                className="w-full py-2 bg-brand-50 hover:bg-brand-100 border border-brand-200 rounded-xl text-xs font-bold text-brand-700 transition flex items-center justify-center gap-1.5"
              >
                <Mail className="w-3.5 h-3.5 text-brand-400" />
                <span>Contact Recruiter</span>
              </a>
            </div>
          </div>

          {/* Hiring Team */}
          <div className="bg-white border border-brand-200/60 rounded-2xl p-5 shadow-premium">
            <h3 className="text-xs font-bold text-brand-850 uppercase tracking-wider mb-4">Hiring Team Directory</h3>
            <div className="space-y-3">
              {hiringTeam.map((team, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 hover:bg-brand-50/50 rounded-xl border border-transparent hover:border-brand-100 transition">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full bg-brand-100 flex items-center justify-center text-[10px] font-extrabold text-brand-700">
                      {team.avatar}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-brand-900">{team.name}</h4>
                      <p className="text-[10px] text-brand-450">{team.role}</p>
                    </div>
                  </div>
                  <span className="text-[9px] font-extrabold text-brand-400 bg-brand-100 px-1.5 py-0.5 rounded uppercase">ACTIVE</span>
                </div>
              ))}
            </div>
          </div>

          {/* Synced Email Timeline Accordions */}
          <div className="bg-white border border-brand-200/60 rounded-2xl p-5 shadow-premium">
            <h3 className="text-xs font-bold text-brand-850 uppercase tracking-wider mb-4"> synced email threads</h3>
            
            <div className="space-y-3.5">
              {app.emails && app.emails.map(email => {
                const isExpanded = expandedEmailId === email.id;
                return (
                  <div key={email.id} className="border border-brand-100 rounded-xl overflow-hidden bg-white shadow-2xs">
                    <div 
                      onClick={() => setExpandedEmailId(isExpanded ? null : email.id)}
                      className="p-3.5 bg-brand-50/20 hover:bg-brand-50/50 cursor-pointer flex justify-between items-start select-none transition"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between text-[10px] pr-2">
                          <span className="font-extrabold text-brand-700 truncate">{email.from}</span>
                          <span className="font-mono text-brand-400 shrink-0">{email.date}</span>
                        </div>
                        <h4 className="text-xs font-bold text-brand-900 mt-1 truncate">{email.subject}</h4>
                      </div>
                      <span className="text-brand-400 ml-1 mt-0.5">
                        {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                      </span>
                    </div>

                    <AnimatePresence>
                      {isExpanded && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: "auto" }}
                          exit={{ height: 0 }}
                          className="overflow-hidden bg-white border-t border-brand-50"
                        >
                          <div className="p-3.5 text-xs text-brand-655 font-sans whitespace-pre-wrap leading-relaxed">
                            {email.body}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Notes pad */}
          <div className="bg-white border border-brand-200/60 rounded-2xl p-5 shadow-premium">
            <h3 className="text-xs font-bold text-brand-850 uppercase tracking-wider mb-1">Candidacy Notepad</h3>
            <p className="text-[10px] text-brand-400 mb-3">Autosaves modifications locally</p>
            <textarea
              rows={6}
              value={notesText}
              onChange={handleNotesChange}
              placeholder="Draft interview notes, follow-up strategies..."
              className="w-full border border-brand-200 rounded-xl p-3.5 text-xs text-brand-700 placeholder-brand-400 focus:outline-none focus:border-brand-500 font-sans resize-none leading-relaxed"
            />
          </div>

          {/* Similar Jobs */}
          <div className="bg-white border border-brand-200/60 rounded-2xl p-5 shadow-premium">
            <h3 className="text-xs font-bold text-brand-850 uppercase tracking-wider mb-4">Similar Openings</h3>
            <div className="space-y-3">
              {similarJobs.map((job, idx) => (
                <div key={idx} className="flex items-center justify-between p-2 rounded-xl border border-brand-50">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${job.logoColor} text-white font-extrabold text-xs uppercase flex items-center justify-center shadow-3xs shrink-0`}>
                      {job.company[0]}
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-brand-900">{job.company}</h4>
                      <p className="text-[10px] text-brand-500">{job.role}</p>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <span className="inline-block text-[9px] font-extrabold text-brand-600 bg-brand-100 px-1.5 py-0.5 rounded">
                      {job.salary}
                    </span>
                    <p className="text-[8px] text-brand-400 mt-1 font-semibold">{job.location}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Edit Modal Wrapper */}
      <ApplicationModal 
        isOpen={isEditModalOpen} 
        onClose={() => setIsEditModalOpen(false)} 
        appToEdit={!isFallback ? app : null}
      />
      
    </div>
  );
}
