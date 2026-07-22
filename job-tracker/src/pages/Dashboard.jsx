import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useJobTracker } from "../context/JobTrackerContext";
import { useAuth } from "../context/AuthContext";
import { dashboardApi } from "../services/dashboardApi";
import ApplicationModal from "../components/ApplicationModal";
import { 
  Briefcase, 
  Sparkles, 
  Calendar, 
  CheckSquare, 
  TrendingUp, 
  Mail, 
  RefreshCw, 
  Plus,
  ArrowRight,
  Clock,
  Zap,
  Check,
  Flame,
  Target,
  ChevronRight,
  CalendarDays,
  Layers,
  MessageSquare,
  AlertCircle,
  Play,
  Loader2
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  ResponsiveContainer,
  Tooltip
} from "recharts";

export default function Dashboard() {
  const { user } = useAuth();
  const {
    applications: contextApplications,
    activities: contextActivities,
    gmailStatus,
    selectedAppId,
    setSelectedAppId,
    syncGmail,
    loadDemoData,
    clearHunt,
  } = useJobTracker();
  const [dashboardData, setDashboardData] = useState({
    total_applications: 0,
    applied_count: 0,
    interviewing_count: 0,
    offered_count: 0,
    rejected_count: 0,
    response_rate: 0,
    recent_applications: [],
    upcoming_events: [],
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeDateStr, setActiveDateStr] = useState(new Date().toISOString().split("T")[0]);
  const navigate = useNavigate();

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await dashboardApi.getSummary();
      setDashboardData(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load dashboard metrics.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const applications = dashboardData.recent_applications || [];
  const totalApps = dashboardData.total_applications;
  const appliedCount = dashboardData.applied_count;
  const interviewCount = dashboardData.interviewing_count;
  const offerCount = dashboardData.offered_count;
  const responseRate = Math.round(dashboardData.response_rate * 100);

  // Derived from context applications (local state, not backend)
  const wishlistCount = contextApplications.filter(a => a.status === "wishlist").length;
  const searchStreak = Math.max(1, contextApplications.length > 0 ? 7 : 0);

  // 15. Dynamic Weekly activity graph calculations
  const getWeeklyActivity = () => {
    const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
    const activityMap = {};
    
    // Initialize the last 7 days with count 0
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dayName = days[d.getDay()];
      const dateString = d.toISOString().split("T")[0];
      activityMap[dateString] = { day: dayName, count: 0 };
    }
    
    // Populate counts from applications applied dates
    applications.forEach(app => {
      if (app.appliedDate && activityMap[app.appliedDate]) {
        activityMap[app.appliedDate].count += 1;
      }
    });

    // Add activity scan touches
    contextActivities.forEach(() => {
      const keys = Object.keys(activityMap);
      if (keys.length > 0) {
        const randomKey = keys[Math.floor(Math.random() * keys.length)];
        activityMap[randomKey].count += 0.5;
      }
    });
    
    return Object.values(activityMap).map(item => ({
      ...item,
      count: Math.round(item.count)
    }));
  };

  const activityData = getWeeklyActivity();

  // 11. Calendar preview calculations
  const getDynamicCalendar = () => {
    const days = [];
    const today = new Date();
    
    // Get Mon-Sun of current week
    const currentDay = today.getDay();
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);
    
    for (let i = 0; i < 7; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      const dateStr = d.toISOString().split("T")[0];
      const isToday = d.toDateString() === today.toDateString();
      
      const hasEvent = applications.some(app => 
        app.appliedDate === dateStr || 
        app.tasks.some(t => t.dueDate === dateStr)
      );
      
      let type = isToday ? "today" : "";
      if (hasEvent) {
        const hasInterview = applications.some(app => 
          app.status === "interview" && app.appliedDate === dateStr
        );
        const hasOffer = applications.some(app => 
          app.status === "offer" && app.appliedDate === dateStr
        );
        type = hasOffer ? "offer" : hasInterview ? "interview" : "applied";
      }

      days.push({
        date: d.getDate(),
        dateStr: dateStr,
        hasEvent,
        type,
        dayName: d.toLocaleDateString("en-US", { weekday: "short" })[0]
      });
    }
    return days;
  };

  const calendarDays = getDynamicCalendar();
  const selectedDayInfo = calendarDays.find(d => d.dateStr === activeDateStr) || calendarDays[3];

  // 3. Today's focus card calculations
  const getFocusCard = () => {
    const interviewApp = applications.find(app => app.status === "interview");
    if (interviewApp) {
      const nextTask = interviewApp.tasks.find(t => !t.completed);
      return {
        title: `Technical Prep: ${interviewApp.company}`,
        subtitle: `Next round: ${interviewApp.role}. Focus on core technical competencies.`,
        taskText: nextTask ? nextTask.text : "Prepare project showcase & resume highlights.",
        company: interviewApp.company,
        time: "Scheduled",
        type: "interview"
      };
    }
    
    const pendingTaskApp = applications.find(app => app.tasks.some(t => !t.completed));
    if (pendingTaskApp) {
      const nextTask = pendingTaskApp.tasks.find(t => !t.completed);
      return {
        title: `Pending Task: ${pendingTaskApp.company}`,
        subtitle: `Complete open checklists to advance in the recruitment cycle.`,
        taskText: nextTask.text,
        company: pendingTaskApp.company,
        time: "Action Needed",
        type: "task"
      };
    }
    
    return {
      title: "Build Pipeline",
      subtitle: "Add target companies to your wishlist or connect your Gmail inbox.",
      taskText: "Track new job application to start generating checklist items.",
      company: "System",
      time: "Ready",
      type: "empty"
    };
  };

  const focusCard = getFocusCard();

  // 13. AI suggestions panel calculations
  const getAISuggestions = () => {
    const suggestions = [];
    
    if (applications.length === 0) {
      return [
        {
          id: "ai-empty-1",
          title: "Track First Application",
          text: "AI Pilot is ready. Add a target company or scan your inbox to receive ATS compatibility scores and follow-up guidance.",
          actionText: "Track Job"
        },
        {
          id: "ai-empty-2",
          title: "Sync Email Crawler",
          text: "Automate tracking. Connecting your inbox allows the crawler to index Greenhouse, Lever, and Workday confirmation receipts.",
          actionText: "Scan Inbox"
        }
      ];
    }

    const interviewApp = applications.find(app => app.status === "interview");
    if (interviewApp) {
      suggestions.push({
        id: "ai-sug-interview",
        title: "Interview Readiness",
        text: `Your ${interviewApp.company} interview is scheduled. We suggest reviewing React rendering rules and system architecture patterns.`,
        actionText: "Practice Coach"
      });
    }

    const wishlistApp = applications.find(app => app.status === "wishlist");
    if (wishlistApp) {
      suggestions.push({
        id: "ai-sug-wishlist",
        title: "Resume Compatibility",
        text: `Optimize resume for ${wishlistApp.company} (${wishlistApp.role}). Target keywords: 'TypeScript', 'Web performance'.`,
        actionText: "Scan Resume"
      });
    }

    const offerApp = applications.find(app => app.status === "offer");
    if (offerApp) {
      suggestions.push({
        id: "ai-sug-offer",
        title: "Offer Negotiation",
        text: `Received an offer from ${offerApp.company}! Send a thank-you note and check base salary medians in your location.`,
        actionText: "Draft Reply"
      });
    }

    if (suggestions.length < 2) {
      suggestions.push({
        id: "ai-sug-fallback",
        title: "Pipeline Velocity",
        text: "Keep momentum going. We recommend submitting 2 applications today to meet your weekly goal target.",
        actionText: "Find Jobs"
      });
    }

    return suggestions.slice(0, 2);
  };

  const aiSuggestions = getAISuggestions();

  // 9. Recent Recruiter Activity calculations
  const parseSender = (rawSender, rawText) => {
    const senderStr = rawSender || rawText || "";
    const cleanStr = senderStr.replace(/^"|"$/g, '').trim();
    
    const match = cleanStr.match(/^(.*?)(?:\s*<([^>]+)>)?$/);
    let name = "";
    let domain = "Inbox";

    if (match) {
      name = (match[1] || "").replace(/^"|"$/g, '').trim();
      const email = match[2] || "";
      if (email.includes("@")) {
        const domainParts = email.split("@")[1].split(".");
        let rawDomain = domainParts[0];
        if ((rawDomain.toLowerCase() === "mail" || rawDomain.toLowerCase() === "jobalert") && domainParts.length > 1) {
          rawDomain = domainParts[1];
        }
        domain = rawDomain.charAt(0).toUpperCase() + rawDomain.slice(1);
      }
    }

    if (!name && cleanStr) {
      name = cleanStr.split("<")[0].replace(/^"|"$/g, '').trim();
    }

    // Clean pipe titles if too long
    if (name.includes("|")) {
      name = name.split("|")[0].trim();
    }

    return {
      recruiter: name || "Talent Team",
      company: domain || "Gmail"
    };
  };

  const recruiterActivity = contextActivities.map(a => {
    const parsed = parseSender(a.sender, a.text);
    return {
      id: a.id,
      company: parsed.company,
      recruiter: parsed.recruiter,
      text: a.subject || a.text,
      time: a.time,
      type: a.type
    };
  });

  // 8. Follow-up reminders tasks
  const tasks = applications.flatMap(app => 
    app.tasks.map(t => ({
      id: t.id,
      text: t.text,
      completed: t.completed,
      company: app.company,
      dueDate: t.dueDate ? t.dueDate.split("-").slice(1).join("/") : "TBD"
    }))
  ).slice(0, 3);

  // Navigation handlers
  const handleAppClick = (companyName) => {
    const app = applications.find(a => a.company.toLowerCase() === companyName.toLowerCase());
    if (app) {
      setSelectedAppId(app.id);
      navigate("/applications");
    } else {
      navigate("/applications");
    }
  };

  return (
    <div className="space-y-8 pb-16 animate-fade-in">
      
      {/* Dynamic welcome header, Streak & Quick Actions */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-white border border-brand-200/60 rounded-2xl p-8 shadow-premium">
        <div>
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-2xl md:text-3xl font-black text-brand-950 tracking-tight">
              Good afternoon, Rishika
            </h1>
            
            {/* 16. Streak Tracker */}
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/20 text-amber-700 text-xs font-extrabold shadow-3xs hover-lift cursor-default">
              <Flame size={14} className="text-amber-500 fill-amber-500 animate-pulse" />
              <span>{searchStreak} DAY STREAK</span>
            </div>
          </div>
          
          <p className="text-sm md:text-base text-brand-500 mt-2 max-w-3xl leading-relaxed">
            Your Gmail integration is active. We are scanning confirmation receipts from Greenhouse, Lever, and Workday.
          </p>
        </div>

        {/* 14. Quick Actions */}
        <div className="flex flex-wrap items-center gap-3 shrink-0">
          {applications.length > 0 ? (
            <button 
              onClick={clearHunt}
              className="px-4 py-2.5 border border-brand-200 hover:border-brand-300 rounded-xl text-xs font-bold text-brand-600 bg-white hover:bg-brand-50 transition cursor-pointer"
            >
              Reset Hunt
            </button>
          ) : (
            <button 
              onClick={loadDemoData}
              className="px-4 py-2.5 border border-brand-200 hover:border-brand-300 rounded-xl text-xs font-bold text-brand-600 bg-white hover:bg-brand-50 transition cursor-pointer flex items-center gap-1.5 hover:text-brand-900"
            >
              <Zap size={14} />
              <span>Load Demo Hunt</span>
            </button>
          )}

          <button 
            onClick={syncGmail}
            disabled={gmailStatus.isScanning}
            className="flex items-center gap-2 px-4 py-2.5 border border-brand-200 hover:border-brand-300 rounded-xl text-xs font-bold text-brand-600 bg-white hover:bg-brand-50 transition cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <RefreshCw size={14} className={gmailStatus.isScanning ? "animate-spin" : ""} />
            <span>{gmailStatus.isScanning ? "Scanning Gmail..." : "Scan Inbox"}</span>
          </button>
          
          <button 
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-brand-950 hover:bg-brand-900 border border-brand-900 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer hover-lift"
          >
            <Plus size={14} />
            <span>New App</span>
          </button>
        </div>
      </div>

      {/* Spotlight Row (Focus, Goal, AI Suggestions) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* 3. Today's focus card */}
        <div className="bg-brand-950 text-white rounded-2xl p-6 border border-brand-800 shadow-overlay relative overflow-hidden flex flex-col justify-between group hover:border-brand-700 transition duration-300">
          <div className="absolute top-0 right-0 w-36 h-36 bg-amber-400/5 rounded-full filter blur-xl pointer-events-none" />
          
          <div>
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-extrabold uppercase bg-amber-400 text-brand-950 px-2.5 py-0.5 rounded tracking-widest">
                TODAY'S FOCUS
              </span>
              <span className="text-xs text-brand-405 font-semibold flex items-center gap-1.5">
                <Clock size={13} />
                {focusCard.time}
              </span>
            </div>

            <h3 className="text-lg md:text-xl font-bold text-white leading-tight mb-2 group-hover:text-amber-300 transition duration-150">
              {focusCard.title}
            </h3>
            <p className="text-xs md:text-sm text-brand-400 leading-normal mb-6">
              {focusCard.subtitle}
            </p>
          </div>

          <div className="space-y-3 border-t border-brand-800 pt-4">
            <div className="flex items-center gap-2.5 text-sm text-brand-300">
              <div className="w-4 h-4 rounded-full border border-amber-400/40 flex items-center justify-center shrink-0">
                <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              </div>
              <span className="truncate">{focusCard.taskText}</span>
            </div>
            
            <div className="flex items-center justify-between mt-4">
              {focusCard.type !== "empty" ? (
                <button 
                  onClick={() => handleAppClick(focusCard.company)}
                  className="w-full py-2 bg-brand-900 hover:bg-brand-850 border border-brand-800 rounded-lg text-xs font-bold text-brand-200 transition flex items-center justify-center gap-1.5 hover:text-white"
                >
                  <Play size={11} className="fill-brand-200" />
                  <span>Launch Prep Hub</span>
                </button>
              ) : (
                <button 
                  onClick={() => setIsModalOpen(true)}
                  className="w-full py-2 bg-brand-900 hover:bg-brand-850 border border-brand-800 rounded-lg text-xs font-bold text-brand-200 transition flex items-center justify-center gap-1.5 hover:text-white"
                >
                  <Plus size={11} />
                  <span>Track Application</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 2. Weekly job search goal */}
        <div className="bg-white border border-brand-200/60 rounded-2xl p-6 shadow-premium flex flex-col justify-between hover:border-brand-300 transition duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5">
              <Target size={16} className="text-amber-500" />
              <h3 className="text-xs md:text-sm font-bold text-brand-850 uppercase tracking-wider">Weekly Search Goal</h3>
            </div>
            <span className="text-xs font-bold text-brand-505 bg-brand-100 px-2.5 py-0.5 rounded-full">
              Goal: 10
            </span>
          </div>

          <div className="flex items-center gap-6 my-3">
            <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  stroke="#f5f5f4"
                  strokeWidth="8"
                  fill="transparent"
                />
                <circle
                  cx="40"
                  cy="40"
                  r="34"
                  stroke="#facc15"
                  strokeWidth="8"
                  fill="transparent"
                  strokeDasharray={2 * Math.PI * 34}
                  strokeDashoffset={2 * Math.PI * 34 * (1 - Math.min(totalApps / 10, 1))}
                  strokeLinecap="round"
                  className="transition-all duration-500 ease-out"
                />
              </svg>
              <span className="absolute text-sm font-extrabold text-brand-950">
                {Math.round(Math.min(totalApps / 10, 1) * 100)}%
              </span>
            </div>

            <div>
              <p className="text-base font-bold text-brand-855">{totalApps} of 10 applied</p>
              <p className="text-xs md:text-sm text-brand-500 mt-1 leading-relaxed font-medium">
                {totalApps >= 10 ? "You've crushed your weekly goal! Keep maintaining search momentum." : "Track more applications to fulfill your weekly search quota."}
              </p>
            </div>
          </div>

          <div className="border-t border-brand-100 pt-4 flex items-center justify-between text-xs text-brand-400 font-semibold">
            <span>Weekly Hunt Velocity</span>
            <span className={totalApps > 0 ? "text-emerald-600 font-bold" : "text-brand-400"}>
              {totalApps > 0 ? "+12% active" : "0% tracking"}
            </span>
          </div>
        </div>

        {/* 13. AI suggestions panel */}
        <div className="bg-gradient-to-br from-amber-500/5 via-purple-500/5 to-white border border-brand-200/60 rounded-2xl p-6 shadow-premium flex flex-col justify-between hover:border-brand-300 transition duration-300">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5">
              <Sparkles size={16} className="text-purple-500 animate-pulse" />
              <h3 className="text-xs md:text-sm font-bold text-purple-950 uppercase tracking-wider">AI Pilot Recommendations</h3>
            </div>
            <span className="text-xs font-extrabold text-purple-600 bg-purple-50 px-2.5 py-0.5 rounded-full border border-purple-100/50">
              {aiSuggestions.length} SUGGESTIONS
            </span>
          </div>

          <div className="space-y-4 my-2">
            {aiSuggestions.map((sug) => (
              <div key={sug.id} className="text-left">
                <h4 className="text-xs md:text-sm font-extrabold text-brand-900 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                  {sug.title}
                </h4>
                <p className="text-xs text-brand-500 leading-relaxed mt-1 font-medium">
                  {sug.text}
                </p>
              </div>
            ))}
          </div>

          <div className="border-t border-brand-100 pt-4">
            <button 
              onClick={() => navigate("/ai")}
              className="w-full flex items-center justify-between text-xs font-extrabold text-purple-600 hover:text-purple-800 transition"
            >
              <span>Explore AI Prep Hub</span>
              <ArrowRight size={13} />
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Split layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left Columns (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* 4. Application overview */}
          <div className="bg-white border border-brand-200/60 rounded-2xl p-6 shadow-premium">
            <h3 className="text-xs md:text-sm font-bold text-brand-850 uppercase tracking-wider mb-5">Application Overview</h3>
            
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-brand-50/50 rounded-xl border border-brand-200/30 flex flex-col justify-between hover-lift cursor-default">
                <span className="text-xs font-bold text-brand-500 uppercase tracking-wider">Wishlist</span>
                <div className="flex items-baseline justify-between mt-3">
                  <span className="text-2xl font-extrabold text-brand-900">{wishlistCount}</span>
                  <span className="text-xs text-brand-400 font-semibold">Active target</span>
                </div>
              </div>
              
              <div className="p-4 bg-amber-50/30 rounded-xl border border-amber-500/10 flex flex-col justify-between hover-lift cursor-default">
                <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">Applied</span>
                <div className="flex items-baseline justify-between mt-3">
                  <span className="text-2xl font-extrabold text-brand-900">{appliedCount}</span>
                  <span className="text-xs text-brand-400 font-semibold">In review</span>
                </div>
              </div>

              <div className="p-4 bg-blue-50/30 rounded-xl border border-blue-500/10 flex flex-col justify-between hover-lift cursor-default">
                <span className="text-xs font-bold text-blue-600 uppercase tracking-wider">Interviews</span>
                <div className="flex items-baseline justify-between mt-3">
                  <span className="text-2xl font-extrabold text-brand-900">{interviewCount}</span>
                  <span className="text-xs text-blue-600 font-bold">Upcoming</span>
                </div>
              </div>

              <div className="p-4 bg-emerald-50/30 rounded-xl border border-emerald-500/10 flex flex-col justify-between hover-lift cursor-default">
                <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">Offers</span>
                <div className="flex items-baseline justify-between mt-3">
                  <span className="text-2xl font-extrabold text-brand-900">{offerCount}</span>
                  <span className="text-xs text-emerald-600 font-bold bg-emerald-50 border border-emerald-100 px-1 rounded">Secured</span>
                </div>
              </div>
            </div>
          </div>

          {/* 15. Weekly activity graph */}
          <div className="bg-white border border-brand-200/60 rounded-2xl p-6 shadow-premium">
            <div className="flex items-center justify-between mb-5">
              <div>
                <h3 className="text-xs md:text-sm font-bold text-brand-850 uppercase tracking-wider">Search Velocity</h3>
                <p className="text-xs text-brand-400 mt-1">Frequency of email scans, applications, and updates this week</p>
              </div>
              <div className="flex items-center gap-3.5 text-xs font-bold text-brand-500">
                <span className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  Activity Count
                </span>
              </div>
            </div>

            <div className="h-48 w-full">
              {totalApps > 0 || contextActivities.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activityData} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorActivity" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#facc15" stopOpacity={0.2}/>
                        <stop offset="95%" stopColor="#facc15" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <Tooltip 
                      contentStyle={{ 
                        fontSize: '12px', 
                        borderRadius: '12px', 
                        backgroundColor: '#0c0a09',
                        color: '#ffffff',
                        border: 'none',
                        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.05)'
                      }} 
                      labelClassName="font-extrabold text-amber-400"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="count" 
                      stroke="#eab308" 
                      strokeWidth={2} 
                      fillOpacity={1} 
                      fill="url(#colorActivity)" 
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center flex-col text-center py-6 text-brand-400 text-xs md:text-sm">
                  <Briefcase size={24} className="text-brand-300 mb-2" />
                  <span>No data points recorded yet. Add items or scan email to visualize velocity.</span>
                </div>
              )}
            </div>
            
            <div className="flex justify-between items-center text-xs text-brand-400 font-semibold border-t border-brand-100 pt-4 mt-2">
              <span>Monday, Jul 12</span>
              <span>Today (Wednesday, Jul 15)</span>
              <span>Sunday, Jul 19</span>
            </div>
          </div>

          {/* 10. Application pipeline preview */}
          <div className="bg-white border border-brand-200/60 rounded-2xl p-6 shadow-premium">
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-1.5">
                <Layers size={15} className="text-brand-500" />
                <h3 className="text-xs md:text-sm font-bold text-brand-850 uppercase tracking-wider">Pipeline Volume</h3>
              </div>
              <span className="text-xs text-brand-400 font-semibold">Total: {totalApps} active tracks</span>
            </div>

            <div className="space-y-4">
              {/* Row 1: Wishlist */}
              <div>
                <div className="flex items-center justify-between text-xs md:text-sm font-semibold text-brand-700 mb-1.5">
                  <span>Wishlist</span>
                  <span className="font-extrabold">{wishlistCount} jobs</span>
                </div>
                <div className="w-full h-2 bg-brand-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-brand-400 rounded-full transition-all duration-500" 
                    style={{ width: `${totalApps > 0 ? (wishlistCount / totalApps) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Row 2: Applied */}
              <div>
                <div className="flex items-center justify-between text-xs md:text-sm font-semibold text-brand-700 mb-1.5">
                  <span>Applied</span>
                  <span className="font-extrabold text-amber-600">{appliedCount} jobs</span>
                </div>
                <div className="w-full h-2 bg-brand-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-amber-400 rounded-full transition-all duration-500" 
                    style={{ width: `${totalApps > 0 ? (appliedCount / totalApps) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Row 3: Interview */}
              <div>
                <div className="flex items-center justify-between text-xs md:text-sm font-semibold text-brand-700 mb-1.5">
                  <span>Interviewing</span>
                  <span className="font-extrabold text-blue-600">{interviewCount} processes</span>
                </div>
                <div className="w-full h-2 bg-brand-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500 rounded-full transition-all duration-500" 
                    style={{ width: `${totalApps > 0 ? (interviewCount / totalApps) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Row 4: Offer */}
              <div>
                <div className="flex items-center justify-between text-xs md:text-sm font-semibold text-brand-700 mb-1.5">
                  <span>Offers Secured</span>
                  <span className="font-extrabold text-emerald-600">{offerCount} signed/received</span>
                </div>
                <div className="w-full h-2 bg-brand-100 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-500" 
                    style={{ width: `${totalApps > 0 ? (offerCount / totalApps) * 100 : 0}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Double Column Grid: Recent Applications & Recent Recruiter Activity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* 12. Recent applications */}
            <div className="bg-white border border-brand-200/60 rounded-2xl p-6 shadow-premium flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <h3 className="text-xs md:text-sm font-bold text-brand-850 uppercase tracking-wider">Recent Applications</h3>
                  <button 
                    onClick={() => navigate("/applications")}
                    className="text-xs font-bold text-brand-500 hover:text-brand-700 transition flex items-center gap-0.5"
                  >
                    <span>View all</span>
                    <ChevronRight size={14} />
                  </button>
                </div>

                <div className="space-y-4">
                  {applications.length > 0 ? (
                    applications.slice(0, 3).map((app) => (
                      <div 
                        key={app.id}
                        onClick={() => handleAppClick(app.company)}
                        className="flex items-center justify-between p-3 rounded-xl border border-brand-50 hover:bg-brand-50/50 hover:border-brand-200/50 transition cursor-pointer group"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${app.logoColor || 'from-brand-600 to-brand-800'} flex items-center justify-center text-white font-extrabold text-sm uppercase shadow-3xs`}>
                            {app.company[0]}
                          </div>
                          <div>
                            <h4 className="text-xs md:text-sm font-bold text-brand-900 group-hover:text-amber-600 transition-colors">
                              {app.company}
                            </h4>
                            <p className="text-xs text-brand-500 mt-1">
                              {app.role}
                            </p>
                          </div>
                        </div>

                        <div className="text-right">
                          <span className={`inline-block text-[10px] font-extrabold uppercase px-2.5 py-0.5 rounded ${
                            app.status === 'offer' ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' :
                            app.status === 'interview' ? 'bg-blue-50 text-blue-700 border border-blue-100' :
                            app.status === 'applied' ? 'bg-amber-50 text-amber-700 border border-amber-100' :
                            'bg-brand-100 text-brand-600'
                          }`}>
                            {app.status}
                          </span>
                          <p className="text-xs text-brand-400 mt-1 font-semibold">{app.source}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-xs md:text-sm text-brand-400">
                      No recent applications. Load hunt data or track manually.
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-brand-100 pt-4 mt-5">
                <p className="text-xs text-brand-400 font-semibold flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                  {applications.length > 0 ? `Latest application: ${applications[0].company}` : "Awaiting workspace tracking sync."}
                </p>
              </div>
            </div>

            {/* 9. Recent recruiter activity */}
            <div className="bg-white border border-brand-200/60 rounded-2xl p-6 shadow-premium flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-1.5">
                    <MessageSquare size={15} className="text-brand-500" />
                    <h3 className="text-xs md:text-sm font-bold text-brand-850 uppercase tracking-wider">Recruiter Feed</h3>
                  </div>
                  <span className="text-[10px] font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-100 animate-pulse">
                    LIVE SYNC
                  </span>
                </div>

                <div className="space-y-4">
                  {recruiterActivity.length > 0 ? (
                    recruiterActivity.slice(0, 3).map((act) => (
                      <div 
                        key={act.id} 
                        className="flex gap-3 items-start p-3 rounded-xl bg-brand-50/20 border border-brand-50 hover:border-brand-200/40 transition"
                      >
                        <div className="w-8 h-8 rounded-full bg-brand-200 flex items-center justify-center font-extrabold text-xs text-brand-700 uppercase shrink-0 mt-0.5 border border-white shadow-3xs">
                          {act.recruiter[0] || 'R'}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between">
                            <span className="text-xs md:text-sm font-extrabold text-brand-900 font-sans truncate">
                              {act.company && act.company.toLowerCase() !== act.recruiter.toLowerCase()
                                ? `${act.recruiter} @ ${act.company}`
                                : act.recruiter}
                            </span>
                            <span className="text-xs text-brand-400 font-semibold">{act.time}</span>
                          </div>
                          <p className="text-xs text-brand-600 leading-relaxed mt-1 font-medium">
                            {act.text}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8 text-xs md:text-sm text-brand-400">
                      No sync logs captured yet. Click Scan Inbox to scan email logs.
                    </div>
                  )}
                </div>
              </div>

              <div className="border-t border-brand-100 pt-4 mt-5 flex items-center justify-between text-xs text-brand-400 font-semibold">
                <span>Total parsed emails: {gmailStatus.emailsScanned}</span>
                <span className="underline cursor-pointer hover:text-brand-600">Gmail Settings</span>
              </div>
            </div>

          </div>

        </div>

        {/* Right Sidebar Column */}
        <div className="space-y-6">
          
          {/* 6. Response rate */}
          <div className="bg-white border border-brand-200/60 rounded-2xl p-6 shadow-premium flex flex-col justify-between hover:border-brand-300 transition duration-300">
            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-xs md:text-sm font-bold text-brand-850 uppercase tracking-wider">Response Rate</h3>
                <span className="text-xs font-extrabold text-emerald-600 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-100/50">
                  ACTIVE RATIO
                </span>
              </div>

              <div className="flex items-baseline gap-2.5">
                <span className="text-4xl font-black text-brand-950 tracking-tight">{responseRate}%</span>
                <span className="text-xs md:text-sm text-brand-500 font-medium">Conversion success</span>
              </div>
            </div>

            {/* Custom inline sparkline wave graph */}
            <div className="h-12 w-full my-4 flex items-end">
              {totalApps > 0 ? (
                <svg className="w-full h-full overflow-visible" preserveAspectRatio="none" viewBox="0 0 100 20">
                  <path
                    d="M0 18 Q20 5, 40 12 T80 4 T100 8 L100 20 L0 20 Z"
                    fill="url(#sparklineGrad)"
                    stroke="none"
                  />
                  <path
                    d="M0 18 Q20 5, 40 12 T80 4 T100 8"
                    fill="none"
                    stroke="#facc15"
                    strokeWidth="2"
                  />
                  <defs>
                    <linearGradient id="sparklineGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#facc15" stopOpacity="0.15" />
                      <stop offset="100%" stopColor="#facc15" stopOpacity="0" />
                    </linearGradient>
                  </defs>
                </svg>
              ) : (
                <div className="w-full border-b border-dashed border-brand-200 pb-1 text-center text-xs text-brand-400">
                  Waiting for data points
                </div>
              )}
            </div>

            <div className="border-t border-brand-100 pt-4 text-xs text-brand-400 font-semibold leading-relaxed">
              Calculated from positive response conversions (Interviews & Offers secured).
            </div>
          </div>

          {/* 7. Upcoming interviews */}
          <div className="bg-white border border-brand-200/60 rounded-2xl p-6 shadow-premium">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-1.5">
                <CalendarDays size={15} className="text-amber-500" />
                <h3 className="text-xs md:text-sm font-bold text-brand-850 uppercase tracking-wider">Upcoming Interviews</h3>
              </div>
              <span className="text-xs font-extrabold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded border border-blue-100/50">
                {interviewCount} ACTIVE
              </span>
            </div>

            <div className="space-y-4">
              {interviewCount > 0 ? (
                applications.filter(app => app.status === "interview").slice(0, 2).map((app) => (
                  <div 
                    key={app.id}
                    onClick={() => handleAppClick(app.company)}
                    className="p-4 bg-brand-50/50 hover:bg-brand-50 border border-brand-100 hover:border-brand-200 rounded-xl transition cursor-pointer group"
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-extrabold text-blue-600 uppercase tracking-wider">TECHNICAL SCREEN</span>
                      <span className="text-xs text-brand-400 font-semibold">{app.appliedDate || "TBD"}</span>
                    </div>
                    
                    <h4 className="text-xs md:text-sm font-bold text-brand-900 mt-2 group-hover:text-amber-600 transition-colors">
                      {app.company} — {app.role}
                    </h4>
                    <p className="text-xs text-brand-500 mt-1 leading-relaxed">
                      Check your Gmail log details for scheduling links.
                    </p>

                    <div className="flex items-center gap-2 mt-4 pt-3 border-t border-brand-100/50 text-xs font-bold text-brand-600 group-hover:text-brand-900 transition">
                      <span>Prepare credentials & code portfolio</span>
                      <ArrowRight size={13} className="transform group-hover:translate-x-0.5 transition-transform" />
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs md:text-sm text-brand-400">
                  No upcoming interviews. Keep applying!
                </div>
              )}
            </div>
          </div>

          {/* 11. Calendar preview */}
          <div className="bg-white border border-brand-200/60 rounded-2xl p-6 shadow-premium">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xs md:text-sm font-bold text-brand-850 uppercase tracking-wider">Calendar</h3>
              <span className="text-xs font-extrabold text-brand-800">July 2026</span>
            </div>

            <div className="grid grid-cols-7 gap-1 text-center mb-4">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, idx) => (
                <span key={idx} className="text-xs font-bold text-brand-400 uppercase">{day}</span>
              ))}

              {calendarDays.map((d, index) => (
                <div 
                  key={index}
                  onClick={() => d.hasEvent && setActiveDateStr(d.dateStr)}
                  className={`p-2 rounded-lg text-xs md:text-sm font-extrabold flex flex-col items-center justify-between h-12 border transition cursor-pointer relative ${
                    d.dateStr === activeDateStr ? 'bg-brand-950 text-white border-brand-950 shadow-3xs' :
                    d.type === 'today' ? 'bg-brand-50 text-brand-950 border-brand-200' :
                    'bg-transparent text-brand-700 border-transparent hover:bg-brand-50/50'
                  }`}
                >
                  <span>{d.date}</span>
                  {d.hasEvent && (
                    <span className={`w-2 h-2 rounded-full ${
                      d.type === 'offer' ? 'bg-emerald-500' :
                      d.type === 'interview' ? 'bg-blue-500' :
                      'bg-amber-400'
                    }`} />
                  )}
                </div>
              ))}
            </div>

            <div className="p-3 rounded-xl bg-brand-50/50 border border-brand-100/50 text-xs leading-relaxed font-medium">
              {selectedDayInfo.hasEvent ? (
                <div>
                  <p className="font-extrabold text-brand-850 flex items-center gap-1.5 mb-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                    Activity Detected
                  </p>
                  {applications.filter(app => app.appliedDate === selectedDayInfo.dateStr).map((app, i) => (
                    <p key={i} className="text-brand-900 font-bold mt-1">
                      Applied to {app.company} ({app.role})
                    </p>
                  ))}
                  {applications.flatMap(app => app.tasks).filter(t => t.dueDate === selectedDayInfo.dateStr).map((task, i) => (
                    <p key={i} className="text-brand-600 font-semibold mt-1">
                      Task: {task.text}
                    </p>
                  ))}
                </div>
              ) : (
                <p className="text-brand-400 text-center py-1">No scheduled events for this date.</p>
              )}
            </div>
          </div>

          {/* 5. Interview progress */}
          <div className="bg-white border border-brand-200/60 rounded-2xl p-6 shadow-premium">
            <h3 className="text-xs md:text-sm font-bold text-brand-850 uppercase tracking-wider mb-4">Interview Success rate</h3>
            
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-xs font-bold text-brand-700 mb-1.5">
                  <span>Technical Code Assessment</span>
                  <span className="text-brand-900">{totalApps > 0 ? "80%" : "0%"} Pass</span>
                </div>
                <div className="w-full h-2 bg-brand-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full transition-all duration-300" style={{ width: totalApps > 0 ? '80%' : '0%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-brand-700 mb-1.5">
                  <span>System Design & Architecture</span>
                  <span className="text-brand-900">{totalApps > 0 ? "65%" : "0%"} Pass</span>
                </div>
                <div className="w-full h-2 bg-brand-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all duration-300" style={{ width: totalApps > 0 ? '65%' : '0%' }} />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-xs font-bold text-brand-700 mb-1.5">
                  <span>Behavioral / Culture Fit</span>
                  <span className="text-brand-900">{totalApps > 0 ? "90%" : "0%"} Pass</span>
                </div>
                <div className="w-full h-2 bg-brand-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full transition-all duration-300" style={{ width: totalApps > 0 ? '90%' : '0%' }} />
                </div>
              </div>
            </div>
          </div>

          {/* 8. Follow-up reminders */}
          <div className="bg-white border border-brand-200/60 rounded-2xl p-6 shadow-premium">
            <div className="flex items-center gap-1.5 mb-2">
              <CheckSquare size={15} className="text-brand-600" />
              <h3 className="text-xs md:text-sm font-bold text-brand-850 uppercase tracking-wider">Follow-Up Reminders</h3>
            </div>
            <p className="text-xs text-brand-400 mb-5">Urgent checklists derived from your email synchronization logs</p>

            <div className="space-y-3.5">
              {tasks.length > 0 ? (
                tasks.map((task) => (
                  <div 
                    key={task.id}
                    className="flex items-start gap-3 p-3 rounded-xl bg-brand-50/20 border border-brand-50 hover:border-brand-200/50 transition"
                  >
                    <div className="mt-0.5 shrink-0">
                      <div className={`w-4 h-4 rounded-md border flex items-center justify-center cursor-pointer transition ${
                        task.completed ? 'bg-brand-950 border-brand-950 text-white' : 'border-brand-350 hover:border-brand-500'
                      }`}>
                        {task.completed && <Check size={10} strokeWidth={3} />}
                      </div>
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <p className={`text-xs md:text-sm font-semibold leading-relaxed ${task.completed ? 'line-through text-brand-400' : 'text-brand-700'}`}>
                        {task.text}
                      </p>
                      <div className="flex items-center gap-2 mt-2 text-xs text-brand-400 font-semibold">
                        <span className="bg-brand-100 text-brand-700 px-2 py-0.5 rounded">
                          {task.company}
                        </span>
                        <span>• Due {task.dueDate}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-6 text-xs md:text-sm text-brand-400">
                  All caught up! No active tasks.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Track Manual App Modal */}
      <ApplicationModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
      />
    </div>
  );
}