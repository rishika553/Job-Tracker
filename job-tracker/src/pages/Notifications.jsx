import React, { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { notificationsApi } from "../services/notificationsApi";
import { useJobTracker } from "../context/JobTrackerContext";
import { 
  Inbox, 
  Check, 
  Search, 
  Calendar, 
  RefreshCw, 
  Mail, 
  Clock, 
  Award, 
  Archive, 
  Sparkles, 
  Layers, 
  ChevronRight, 
  AlertCircle,
  ToggleLeft,
  Trash2,
  Loader2
} from "lucide-react";

export default function Notifications() {
  const { applications, syncedEmails, activities, gmailStatus, loadDemoData } = useJobTracker();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [selectedNotifId, setSelectedNotifId] = useState(null);
  const [readStateOverrides, setReadStateOverrides] = useState({});
  const [viewMode, setViewMode] = useState("feed");
  const navigate = useNavigate();

  const renderTextWithLinks = (text) => {
    if (!text) return null;

    let clean = text;
    if (typeof clean === "string" && clean.includes("<") && clean.includes(">")) {
      clean = clean
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
        .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, "")
        .replace(/<a\s+[^>]*href=["']([^"']+)["'][^>]*>(.*?)<\/a>/gi, "$2 ($1)")
        .replace(/<\/?(p|div|tr|h1|h2|h3|h4|h5|h6|li|blockquote)[^>]*>/gi, "\n")
        .replace(/<br\s*\/?>/gi, "\n")
        .replace(/<[^>]+>/g, " ");
    }

    const urlRegex = /(https?:\/\/[^\s<]+|www\.[^\s<]+)/g;
    const parts = clean.split(urlRegex);

    return parts.map((part, idx) => {
      if (part.match(urlRegex)) {
        const href = part.startsWith("www.") ? `https://${part}` : part;
        return (
          <a
            key={idx}
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="text-amber-600 hover:text-amber-700 font-semibold underline underline-offset-2 break-all transition cursor-pointer"
          >
            {part}
          </a>
        );
      }
      return part;
    });
  };

  const fetchNotifications = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await notificationsApi.listNotifications();
      setNotifications(data);
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to load notifications.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  // Dynamic notifications generation from context applications & synced emails
  const notificationsList = useMemo(() => {
    const list = [];
    
    // 1. Synced Gmail Inbox Messages
    (syncedEmails || []).forEach((email, idx) => {
      const sender = email.sender || email.from || "Gmail";
      const subject = email.subject || "(No subject)";
      const body = email.body || email.snippet || subject;
      list.push({
        id: `email-${email.id || idx}`,
        category: "message",
        title: sender,
        details: subject,
        body: body,
        timestamp: email.date || "Recent",
        read: false,
        actionLabel: "Read Message",
        link: null
      });
    });

    // 2. Synced Activities Feed
    (activities || []).forEach((act) => {
      if (!list.some(item => item.id === `act-${act.id}`)) {
        list.push({
          id: `act-${act.id}`,
          category: act.type === "sync" ? "message" : "update",
          title: act.sender || act.text || "System Log",
          details: act.subject || act.text || "Activity tracked",
          body: act.text || act.subject || "Synced log message.",
          timestamp: act.time || "Recent",
          read: true,
          actionLabel: "View Activity",
          link: null
        });
      }
    });

    applications.forEach(app => {
      // Interview Reminders
      if (app.status === "interview") {
        list.push({
          id: `int-${app.id}`,
          category: "interview",
          title: `Technical Round: ${app.company}`,
          details: `Panel interview scheduled for ${app.role} role. Video meeting details are updated.`,
          timestamp: "Today, 2:00 PM",
          read: false,
          actionLabel: "Open Teams Link",
          link: "/calendar"
        });
      }
      
      // Application Updates
      list.push({
        id: `up-${app.id}`,
        category: "update",
        title: `${app.company} Application Update`,
        details: `Candidacy status moved to ${app.status.toUpperCase()} for ${app.role}.`,
        timestamp: "Yesterday",
        read: false,
        actionLabel: "Inspect Details",
        link: `/applications/${app.id}`
      });

      // Offers
      if (app.status === "offer") {
        list.push({
          id: `off-${app.id}`,
          category: "offer",
          title: `Offer Extended by ${app.company}!`,
          details: `Congratulations! Compensation packages for ${app.role} have been drafted. Review details below.`,
          timestamp: "July 12",
          read: true,
          actionLabel: "View Offer Details",
          link: `/applications/${app.id}`
        });
      }
    });

    // Apply read overrides from state
    return list.map(item => {
      const isOverridden = readStateOverrides[item.id] !== undefined;
      return {
        ...item,
        read: isOverridden ? readStateOverrides[item.id] : item.read
      };
    });
  }, [applications, syncedEmails, activities, gmailStatus, readStateOverrides]);

  // Categories list metadata
  const categories = [
    { id: "all", label: "All Inbox", icon: <Inbox size={14} /> },
    { id: "interview", label: "Interviews", icon: <Calendar size={14} /> },
    { id: "update", label: "Updates", icon: <Layers size={14} /> },
    { id: "message", label: "Recruiter Messages", icon: <Mail size={14} /> },
    { id: "deadline", label: "Deadlines", icon: <Clock size={14} /> },
    { id: "offer", label: "Offers", icon: <Award size={14} /> },
    { id: "rejection", label: "Rejections", icon: <Archive size={14} /> },
    { id: "ai", label: "AI Tips", icon: <Sparkles size={14} /> },
    { id: "system", label: "System Sync", icon: <RefreshCw size={14} /> }
  ];

  // Filters logic
  const filteredNotifs = useMemo(() => {
    return notificationsList.filter(n => {
      const matchesCategory = activeCategory === "all" || n.category === activeCategory;
      const matchesSearch = n.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            n.details.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [notificationsList, activeCategory, searchTerm]);

  // Count unread items
  const unreadCount = useMemo(() => {
    return notificationsList.filter(n => !n.read).length;
  }, [notificationsList]);

  // Actions
  const handleMarkAsRead = (id) => {
    setReadStateOverrides(prev => ({
      ...prev,
      [id]: true
    }));
  };

  const handleMarkAllRead = () => {
    const overrides = {};
    notificationsList.forEach(n => {
      overrides[n.id] = true;
    });
    setReadStateOverrides(overrides);
  };

  const activeNotif = notificationsList.find(n => n.id === selectedNotifId) || filteredNotifs[0];

  const getCategoryColor = (cat) => {
    const colors = {
      interview: "bg-emerald-50 text-emerald-600 border-emerald-100",
      update: "bg-indigo-50 text-indigo-600 border-indigo-100",
      message: "bg-orange-50 text-orange-600 border-orange-100",
      deadline: "bg-amber-50 text-amber-600 border-amber-100",
      offer: "bg-pink-50 text-pink-600 border-pink-100",
      rejection: "bg-rose-50 text-rose-600 border-rose-100",
      ai: "bg-purple-50 text-purple-600 border-purple-100",
      system: "bg-stone-150 text-brand-700 border-brand-200"
    };
    return colors[cat] || "bg-brand-50 text-brand-600 border-brand-100";
  };

  return (
    <div className="space-y-6 pb-12 animate-fade-in select-none">
      


      {/* Heading Block */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-brand-200/60 rounded-2xl p-5 shadow-premium">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-brand-950 tracking-tight flex items-center gap-2">
            <span>Notification Center</span>
            <span className="text-xs font-extrabold text-brand-500 bg-brand-100 px-2 py-0.5 rounded-full font-mono">
              {unreadCount} unread
            </span>
          </h1>
          <p className="text-xs text-brand-500 mt-1 max-w-2xl">
            Linear-style notification inbox mapping active interview cycles, updates, messages, and reminders.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Timeline vs Card View Switcher */}
          <div className="flex bg-brand-50 border border-brand-200 rounded-xl p-1 shrink-0">
            <button
              onClick={() => setViewMode("feed")}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                viewMode === "feed" ? "bg-white text-brand-950 shadow-3xs" : "text-brand-500 hover:text-brand-800"
              }`}
            >
              Feed Split
            </button>
            <button
              onClick={() => setViewMode("timeline")}
              className={`px-3 py-1.5 rounded-lg text-[10px] font-bold transition cursor-pointer ${
                viewMode === "timeline" ? "bg-white text-brand-950 shadow-3xs" : "text-brand-500 hover:text-brand-800"
              }`}
            >
              Timeline view
            </button>
          </div>

          <button
            onClick={handleMarkAllRead}
            disabled={unreadCount === 0}
            className="flex items-center gap-1.5 px-3 py-2 bg-brand-950 hover:bg-brand-900 disabled:bg-brand-100 disabled:text-brand-350 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
          >
            <Check size={13} />
            <span>Mark all read</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Categories on Left, Feed/Timeline on Right */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
        
        {/* Category Tab Selector Filters */}
        <div className="bg-white border border-brand-200/60 rounded-2xl p-4 shadow-premium space-y-1">
          <h3 className="text-[10px] font-bold text-brand-400 uppercase tracking-widest px-3 mb-2">Category Filters</h3>
          
          {categories.map(cat => {
            const count = cat.id === "all" 
              ? notificationsList.length 
              : notificationsList.filter(n => n.category === cat.id).length;

            const uCount = cat.id === "all"
              ? notificationsList.filter(n => !n.read).length
              : notificationsList.filter(n => n.category === cat.id && !n.read).length;

            return (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  setSelectedNotifId(null);
                }}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  activeCategory === cat.id 
                    ? "bg-amber-50 text-amber-700 font-bold shadow-3xs" 
                    : "text-brand-500 hover:text-brand-900 hover:bg-brand-50/50"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {cat.icon}
                  <span className="truncate">{cat.label}</span>
                </div>
                
                <div className="flex items-center gap-1.5 shrink-0">
                  {uCount > 0 && (
                    <span className="w-1.5 h-1.5 bg-amber-500 rounded-full shrink-0" />
                  )}
                  <span className="text-[10px] font-mono text-brand-400 font-bold bg-brand-50 border border-brand-100 px-1.5 py-0.2 rounded">
                    {count}
                  </span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Dynamic Panel Feed */}
        <div className="lg:col-span-3 space-y-4">
          
          {/* Inline Search Bar */}
          <div className="flex items-center bg-white border border-brand-200 rounded-2xl px-4 py-3 shadow-premium">
            <Search size={15} className="text-brand-400 mr-2 shrink-0" />
            <input
              type="text"
              placeholder="Filter notifications by keyword..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs text-brand-800 outline-none bg-transparent placeholder-brand-400"
            />
          </div>

          {filteredNotifs.length > 0 ? (
            viewMode === "feed" ? (
              
              /* Linear-style Feed Split screen */
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-start">
                
                {/* Scrollable list */}
                <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {filteredNotifs.map((notif) => {
                    const isActive = notif.id === activeNotif?.id;
                    return (
                      <div
                        key={notif.id}
                        onClick={() => setSelectedNotifId(notif.id)}
                        className={`p-4 border rounded-2xl transition cursor-pointer relative flex justify-between items-start ${
                          isActive 
                            ? "border-amber-400 bg-amber-50/5 ring-1 ring-amber-400/10 shadow-3xs" 
                            : "border-brand-200/80 hover:border-brand-300 bg-white"
                        }`}
                      >
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`inline-block border px-1.5 py-0.2 rounded text-[8px] font-bold uppercase tracking-wider font-sans ${getCategoryColor(notif.category)}`}>
                              {notif.category}
                            </span>
                            <span className="text-[9px] text-brand-400 font-bold font-mono">{notif.timestamp}</span>
                          </div>

                          <h4 className={`text-xs font-bold text-brand-900 mt-2 truncate ${!notif.read ? "font-black" : "font-semibold"}`}>
                            {notif.title}
                          </h4>
                          <p className="text-[10px] text-brand-450 mt-1 truncate">{notif.details}</p>
                        </div>

                        {/* Unread circle badge */}
                        {!notif.read && (
                          <span className="w-2.5 h-2.5 bg-amber-500 rounded-full shrink-0 shadow-3xs mt-1" />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Details view panel (Slack/Linear right drawer layout) */}
                <div className="bg-white border border-brand-200/60 rounded-2xl p-5 shadow-premium space-y-4">
                  {activeNotif ? (
                    <>
                      <div className="flex justify-between items-start gap-4 flex-wrap border-b border-brand-100/50 pb-3.5">
                        <div>
                          <span className={`inline-block border px-2 py-0.5 rounded text-[9px] font-bold uppercase tracking-wider ${getCategoryColor(activeNotif.category)}`}>
                            {activeNotif.category}
                          </span>
                          <span className="text-[10px] text-brand-400 font-bold font-mono block mt-2">{activeNotif.timestamp}</span>
                        </div>

                        {!activeNotif.read && (
                          <button
                            onClick={() => handleMarkAsRead(activeNotif.id)}
                            className="flex items-center gap-1.5 px-3 py-1 bg-brand-50 hover:bg-brand-100 text-brand-700 rounded-xl text-[10px] font-bold transition cursor-pointer"
                          >
                            <Check size={11} />
                            <span>Mark read</span>
                          </button>
                        )}
                      </div>

                      <div className="space-y-3.5">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-brand-950 text-amber-400 font-extrabold text-xs flex items-center justify-center uppercase shrink-0">
                            {activeNotif.title[0] || 'M'}
                          </div>
                          <div>
                            <h3 className="text-xs font-bold text-brand-900 leading-tight">{activeNotif.title}</h3>
                            <span className="text-[10px] text-brand-400 font-mono">{activeNotif.timestamp}</span>
                          </div>
                        </div>

                        <div className="bg-brand-50/40 border border-brand-100 rounded-xl p-4 space-y-2 text-left">
                          <h4 className="text-xs font-extrabold text-brand-950 leading-snug">{activeNotif.details}</h4>
                          <div className="text-xs text-brand-700 leading-relaxed font-sans whitespace-pre-wrap pt-2.5 border-t border-brand-150/60 max-h-[420px] overflow-y-auto font-normal">
                            {renderTextWithLinks(activeNotif.body || activeNotif.details)}
                          </div>
                        </div>
                      </div>

                      {activeNotif.link && (
                        <div className="pt-3 border-t border-brand-100/50 flex justify-end">
                          <button
                            onClick={() => navigate(activeNotif.link)}
                            className="flex items-center gap-1 px-4 py-2 bg-brand-950 hover:bg-brand-900 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                          >
                            <span>{activeNotif.actionLabel}</span>
                            <ChevronRight size={13} />
                          </button>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center text-xs text-brand-450 py-12">
                      Select a notification to view actions
                    </div>
                  )}
                </div>

              </div>

            ) : (

              /* Chronological Timeline view layout */
              <div className="bg-white border border-brand-200/60 rounded-2xl p-6 shadow-premium relative">
                
                {/* Timeline connector vertical line */}
                <div className="absolute left-8 top-12 bottom-12 w-0.5 bg-brand-150" />

                <div className="space-y-6">
                  {filteredNotifs.map((notif) => (
                    <div key={notif.id} className="relative pl-12 group flex items-start justify-between gap-4">
                      
                      {/* Timeline Node dot */}
                      <div className={`absolute left-6 w-4.5 h-4.5 rounded-full border-2 border-white flex items-center justify-center -translate-x-1/2 z-10 transition ${
                        !notif.read ? "bg-amber-400 shadow-3xs" : "bg-brand-200"
                      }`} />

                      <div className="flex-1 bg-brand-50/5 hover:bg-brand-50/10 border border-brand-150 rounded-2xl p-4 transition text-left flex justify-between items-start flex-wrap gap-4">
                        <div className="min-w-0 pr-2">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className={`inline-block border px-1.5 py-0.2 rounded text-[8px] font-bold uppercase tracking-wider ${getCategoryColor(notif.category)}`}>
                              {notif.category}
                            </span>
                            <span className="text-[9px] text-brand-400 font-bold font-mono">{notif.timestamp}</span>
                          </div>

                          <h4 className="text-xs font-bold text-brand-900 mt-2">{notif.title}</h4>
                          <p className="text-[10px] text-brand-450 mt-1">{notif.details}</p>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          {!notif.read && (
                            <button
                              onClick={() => handleMarkAsRead(notif.id)}
                              className="p-1 hover:bg-brand-50 rounded text-brand-400 hover:text-brand-700 transition"
                              title="Mark read"
                            >
                              <Check size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => navigate(notif.link)}
                            className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-950 hover:bg-brand-900 text-white rounded-xl text-[10px] font-bold transition shadow-sm cursor-pointer"
                          >
                            <span>{notif.actionLabel}</span>
                            <ChevronRight size={11} />
                          </button>
                        </div>
                      </div>

                    </div>
                  ))}
                </div>

              </div>

            )
          ) : (
            <div className="bg-white border border-brand-200/60 rounded-2xl p-8 text-center max-w-xl mx-auto shadow-premium space-y-4 py-12">
              <div className="w-12 h-12 bg-amber-50 rounded-full border border-amber-200 flex items-center justify-center text-amber-500 mx-auto">
                <Inbox size={20} />
              </div>
              <div>
                <h3 className="text-sm font-bold text-brand-850">All caught up!</h3>
                <p className="text-xs text-brand-500 mt-2 max-w-sm mx-auto leading-relaxed">
                  No notifications matching "{searchTerm || activeCategory}" found. Go explore candidate tracking.
                </p>
              </div>
            </div>
          )}

        </div>

      </div>

    </div>
  );
}
