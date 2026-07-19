import React, { useState } from "react";
import { useJobTracker } from "../context/JobTrackerContext";
import { 
  Plus, 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Clock, 
  User, 
  Video, 
  AlertCircle,
  Check,
  CheckSquare,
  MapPin,
  Bookmark,
  PhoneCall,
  FileText
} from "lucide-react";

export default function Calendar() {
  const { applications, loadDemoData } = useJobTracker();

  // Local state for scheduler
  const [currentDate, setCurrentDate] = useState(new Date(2026, 6, 15)); // Focus on July 2026
  const [selectedDateStr, setSelectedDateStr] = useState("2026-07-15");
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  const [customEvents, setCustomEvents] = useState([]);

  // Form states for the professional scheduling interface
  const [formCompany, setFormCompany] = useState("");
  const [formRole, setFormRole] = useState("");
  const [formType, setFormType] = useState("interview"); // "interview", "assessment", "followup", "meeting"
  const [formDate, setFormDate] = useState("2026-07-15");
  const [formTime, setFormTime] = useState("14:00");
  const [formInterviewer, setFormInterviewer] = useState("");
  const [formNotes, setFormNotes] = useState("");

  const totalApps = applications.length;

  // 1. Dynamic Events Parser: Extract events from context applications & tasks
  const getParsedEvents = () => {
    const list = [];

    // Add custom simulated events scheduled by the user
    customEvents.forEach(evt => {
      list.push({
        ...evt,
        isCustom: true
      });
    });

    applications.forEach(app => {
      // Submission Deadline / Applied Date
      if (app.appliedDate && app.appliedDate !== "-") {
        list.push({
          id: `applied-${app.id}`,
          title: `Applied to ${app.company}`,
          date: app.appliedDate,
          type: "applied",
          company: app.company,
          role: app.role,
          color: "bg-slate-100/80 text-slate-800 border-slate-200"
        });
      }

      // Preparation checklists/tasks
      if (app.tasks) {
        app.tasks.forEach(task => {
          if (task.dueDate) {
            const isAssessment = task.text.toLowerCase().includes("assess") || 
                                 task.text.toLowerCase().includes("code") || 
                                 task.text.toLowerCase().includes("test");
            
            list.push({
              id: `task-${task.id}`,
              title: isAssessment ? `Coding Assessment: ${app.company}` : `Follow-up: ${task.text}`,
              date: task.dueDate,
              type: isAssessment ? "assessment" : "followup",
              company: app.company,
              role: app.role,
              completed: task.completed,
              color: isAssessment 
                ? "bg-purple-50 text-purple-700 border-purple-200/50" 
                : "bg-blue-50 text-blue-700 border-blue-200/50"
            });
          }
        });
      }

      // Interview schedules
      if (app.status === "interview") {
        // Stripe interview on Jul 17, Vercel/Linear simulated on Jul 20
        const date = app.company === "Stripe" ? "2026-07-17" : "2026-07-20";
        list.push({
          id: `interview-${app.id}`,
          title: `${app.company} Technical Panel`,
          date,
          type: "interview",
          company: app.company,
          role: app.role,
          time: "2:00 PM PST",
          interviewer: app.company === "Stripe" ? "Marcus A." : "Lee P.",
          color: "bg-amber-50 text-amber-700 border-amber-200"
        });
      }
    });

    return list;
  };

  const allEvents = getParsedEvents();

  // 2. Large Calendar Month Calculations (July 2026 Grid)
  // July 2026 starts on a Wednesday (index 3 if Sunday=0) and has 31 days.
  const daysInJuly = 31;
  const startDayOffset = 3; // Wednesday offset

  // Build grid blocks
  const calendarCells = [];
  for (let i = 0; i < startDayOffset; i++) {
    calendarCells.push({ day: null, dateStr: null });
  }
  for (let d = 1; d <= daysInJuly; d++) {
    const dayStr = d < 10 ? `0${d}` : `${d}`;
    calendarCells.push({
      day: d,
      dateStr: `2026-07-${dayStr}`
    });
  }
  // Pad grid to 42 cells (6 full rows)
  while (calendarCells.length < 42) {
    calendarCells.push({ day: null, dateStr: null });
  }

  // 3. Today's Events (July 15, 2026)
  const todayEvents = allEvents.filter(e => e.date === "2026-07-15");

  // 4. Upcoming schedule (Any event on or after July 15, sorted chronologically)
  const upcomingEvents = allEvents
    .filter(e => e.date && e.date >= "2026-07-15")
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 5);

  // 5. Reminder sidebar: uncompleted tasks / follow-ups
  const reminderTasks = allEvents.filter(e => e.type === "followup" && !e.completed);

  // Handle scheduling submission
  const handleScheduleSubmit = (e) => {
    e.preventDefault();
    if (!formCompany) return;

    const newEvt = {
      id: `custom-${Date.now()}`,
      title: formType === "interview" ? `${formCompany} Interview Stage` : 
             formType === "assessment" ? `Coding Test: ${formCompany}` :
             formType === "meeting" ? `Call with ${formInterviewer || "Recruiter"}` : 
             `Follow-up: ${formNotes || "Application review"}`,
      date: formDate,
      time: formTime,
      type: formType,
      company: formCompany,
      role: formRole || "Software Candidate",
      interviewer: formInterviewer,
      notes: formNotes,
      color: formType === "interview" ? "bg-amber-50 text-amber-700 border-amber-200" :
             formType === "assessment" ? "bg-purple-50 text-purple-700 border-purple-200/50" :
             formType === "meeting" ? "bg-emerald-50 text-emerald-700 border-emerald-200/50" :
             "bg-blue-50 text-blue-700 border-blue-200/50"
    };

    setCustomEvents([...customEvents, newEvt]);
    setIsScheduleModalOpen(false);

    // Reset inputs
    setFormCompany("");
    setFormRole("");
    setFormInterviewer("");
    setFormNotes("");
  };

  const handleCellClick = (dateStr) => {
    if (!dateStr) return;
    setSelectedDateStr(dateStr);
    setFormDate(dateStr);
    setIsScheduleModalOpen(true);
  };

  // Helper formatting for labels
  const getEventIcon = (type) => {
    switch (type) {
      case "interview": return <Video className="w-3.5 h-3.5" />;
      case "assessment": return <FileText className="w-3.5 h-3.5" />;
      case "meeting": return <PhoneCall className="w-3.5 h-3.5" />;
      case "followup": return <CheckSquare className="w-3.5 h-3.5" />;
      default: return <CalendarIcon className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="space-y-6 pb-16 animate-fade-in select-none">
      
      {/* Playground Warning banner if context is empty */}
      {totalApps === 0 && (
        <div className="bg-[#0c0a09] border border-amber-500/20 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-overlay">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-amber-400/10 flex items-center justify-center text-amber-400 shrink-0">
              <AlertCircle className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-xs font-bold text-white">Viewing Calendar Playground</h4>
              <p className="text-[11px] text-brand-400 mt-0.5 font-sans">No applications tracked. Click below to load demo data and view calendar events.</p>
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

      {/* Title Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-brand-200/60 rounded-2xl p-6 shadow-premium">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-brand-950 tracking-tight flex items-center gap-2">
            <span>Interview Scheduler</span>
            <span className="text-xs font-extrabold text-brand-500 bg-brand-100 px-2 py-0.5 rounded-full">
              {allEvents.length} events
            </span>
          </h1>
          <p className="text-xs text-brand-500 mt-1 max-w-2xl">
            Track coding assessments, technical interview loops, and recruiter follow-up deadlines.
          </p>
        </div>

        <button
          onClick={() => {
            setFormDate("2026-07-15");
            setIsScheduleModalOpen(true);
          }}
          className="flex items-center gap-1.5 px-4 py-2.5 bg-brand-950 hover:bg-brand-900 border border-brand-900 text-white rounded-xl text-xs font-bold shadow-sm transition hover-lift cursor-pointer"
        >
          <Plus size={14} />
          <span>Schedule Event</span>
        </button>
      </div>

      {/* Main 3-Column Calendar Workspace Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
        
        {/* Left Column: Mini calendar & Today's Events spotlight */}
        <div className="space-y-6 xl:col-span-1">
          
          {/* Mini Monthly Overview */}
          <div className="bg-white border border-brand-200/60 rounded-2xl p-5 shadow-premium">
            <div className="flex items-center justify-between mb-4">
              <span className="text-xs font-extrabold text-brand-850 uppercase tracking-widest pl-1">July 2026</span>
              <div className="flex gap-1">
                <button className="p-1 hover:bg-brand-50 rounded text-brand-400"><ChevronLeft size={14} /></button>
                <button className="p-1 hover:bg-brand-50 rounded text-brand-400"><ChevronRight size={14} /></button>
              </div>
            </div>

            {/* Mini Grid */}
            <div className="grid grid-cols-7 gap-y-2 text-center text-[10px]">
              {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
                <span key={i} className="font-extrabold text-brand-400 uppercase">{d}</span>
              ))}
              {calendarCells.slice(0, 35).map((cell, idx) => {
                const isSelected = cell.dateStr === selectedDateStr;
                const hasEvents = cell.dateStr && allEvents.some(e => e.date === cell.dateStr);

                return (
                  <button 
                    key={idx}
                    disabled={!cell.day}
                    onClick={() => cell.dateStr && setSelectedDateStr(cell.dateStr)}
                    className={`h-6 w-6 mx-auto rounded-lg flex items-center justify-center font-semibold transition relative ${
                      !cell.day ? "opacity-0" :
                      isSelected ? "bg-brand-950 text-white font-bold" :
                      "text-brand-700 hover:bg-brand-50"
                    }`}
                  >
                    <span>{cell.day}</span>
                    {hasEvents && !isSelected && (
                      <span className="absolute bottom-0.5 w-1 h-1 bg-amber-500 rounded-full" />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Today's Events Spotlight */}
          <div className="bg-white border border-brand-200/60 rounded-2xl p-5 shadow-premium">
            <h3 className="text-xs font-bold text-brand-850 uppercase tracking-wider mb-4">Today's Schedule</h3>
            <div className="space-y-3.5">
              {todayEvents.length > 0 ? (
                todayEvents.map(evt => (
                  <div 
                    key={evt.id} 
                    className="p-3 bg-brand-50/30 border border-brand-100 rounded-xl space-y-1.5"
                  >
                    <div className="flex justify-between items-start">
                      <span className="text-[9px] font-extrabold text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded uppercase">
                        {evt.type}
                      </span>
                      <span className="text-[10px] text-brand-400 font-bold font-mono">{evt.time || "All day"}</span>
                    </div>
                    <h4 className="text-xs font-bold text-brand-900">{evt.title}</h4>
                    <p className="text-[10px] text-brand-500">{evt.role}</p>
                  </div>
                ))
              ) : (
                <div className="text-center text-xs text-brand-400 py-6">
                  No events scheduled for today (July 15).
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Middle Column: Large Calendar Month Grid */}
        <div className="xl:col-span-2 space-y-4">
          
          {/* Calendar Month Selector Header */}
          <div className="flex items-center justify-between bg-white border border-brand-200/60 rounded-2xl p-4 shadow-premium">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand-50 border border-brand-200/50 flex items-center justify-center text-brand-850">
                <CalendarIcon size={16} />
              </div>
              <h2 className="text-sm font-black text-brand-950 tracking-tight uppercase">July 2026</h2>
            </div>
            
            <div className="flex border border-brand-200 bg-white rounded-xl p-0.5 shadow-2xs text-[11px] font-bold text-brand-600">
              <span className="px-3 py-1 bg-brand-950 text-white rounded-lg">Month</span>
              <span className="px-3 py-1 hover:text-brand-950 cursor-pointer">Week</span>
              <span className="px-3 py-1 hover:text-brand-950 cursor-pointer">Day</span>
            </div>
          </div>

          {/* Large Monthly Grid */}
          <div className="bg-white border border-brand-200/60 rounded-2xl overflow-hidden shadow-premium">
            
            {/* Weekdays Labels Header */}
            <div className="grid grid-cols-7 text-center border-b border-brand-100 bg-brand-50/10 py-2.5 text-[10px] font-extrabold text-brand-450 uppercase tracking-widest">
              <span>Sun</span>
              <span>Mon</span>
              <span>Tue</span>
              <span>Wed</span>
              <span>Thu</span>
              <span>Fri</span>
              <span>Sat</span>
            </div>

            {/* Calendar Cells Grid (42 blocks) */}
            <div className="grid grid-cols-7 gap-px bg-brand-100/50 text-xs">
              {calendarCells.map((cell, idx) => {
                const cellEvents = allEvents.filter(e => e.date === cell.dateStr);
                const isSelected = cell.dateStr === selectedDateStr;

                return (
                  <div
                    key={idx}
                    onClick={() => cell.dateStr && handleCellClick(cell.dateStr)}
                    className={`min-h-[90px] bg-white p-2 hover:bg-brand-50/30 transition duration-150 cursor-pointer relative ${
                      !cell.day ? "bg-brand-50/10 pointer-events-none" : ""
                    } ${isSelected ? "ring-2 ring-inset ring-amber-400 bg-amber-50/5" : ""}`}
                  >
                    {/* Day number */}
                    {cell.day && (
                      <span className={`inline-block w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] ${
                        cell.day === 15 ? "bg-brand-950 text-white shadow-3xs" : "text-brand-700"
                      }`}>
                        {cell.day}
                      </span>
                    )}

                    {/* Events List inside Cell */}
                    <div className="mt-1.5 space-y-1 overflow-hidden">
                      {cellEvents.slice(0, 2).map((evt) => (
                        <div
                          key={evt.id}
                          className={`px-1.5 py-0.5 rounded text-[8px] font-bold border truncate ${evt.color}`}
                          title={`${evt.title} (${evt.role})`}
                        >
                          {evt.company ? `${evt.company}: ` : ""}{evt.title.split(":")[0]}
                        </div>
                      ))}
                      {cellEvents.length > 2 && (
                        <div className="text-[7px] font-bold text-brand-400 pl-1 uppercase">
                          + {cellEvents.length - 2} more
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

          </div>

        </div>

        {/* Right Column: Reminders & Upcoming schedule feed */}
        <div className="space-y-6 xl:col-span-1">
          
          {/* Reminder Sidebar */}
          <div className="bg-white border border-brand-200/60 rounded-2xl p-5 shadow-premium">
            <h3 className="text-xs font-bold text-brand-850 uppercase tracking-wider mb-1">Alert Reminders</h3>
            <p className="text-[10px] text-brand-400 mb-4">Uncompleted follow-up milestones</p>
            
            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-0.5">
              {reminderTasks.length > 0 ? (
                reminderTasks.map(tsk => (
                  <div key={tsk.id} className="flex gap-2.5 items-start p-2 hover:bg-brand-50/50 rounded-xl border border-transparent hover:border-brand-100 transition">
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-xs font-bold text-brand-900 leading-normal">{tsk.title}</h4>
                      <p className="text-[9px] text-brand-400 font-bold font-mono mt-0.5">DUE: {tsk.date}</p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-xs text-brand-400 py-6">
                  No active reminders or past-due tasks.
                </div>
              )}
            </div>
          </div>

          {/* Upcoming Schedule */}
          <div className="bg-white border border-brand-200/60 rounded-2xl p-5 shadow-premium">
            <h3 className="text-xs font-bold text-brand-850 uppercase tracking-wider mb-4">Upcoming Schedule</h3>
            
            <div className="space-y-4">
              {upcomingEvents.length > 0 ? (
                upcomingEvents.map(evt => (
                  <div key={evt.id} className="flex gap-3 items-start border-b border-brand-50 last:border-0 pb-3 last:pb-0">
                    <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center shrink-0 text-brand-600 mt-0.5">
                      {getEventIcon(evt.type)}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-brand-900 truncate leading-snug">{evt.title}</h4>
                      <p className="text-[10px] text-brand-450 truncate">{evt.role}</p>
                      
                      <div className="flex items-center gap-3 mt-1.5 text-[9px] text-brand-400 font-bold font-mono">
                        <span className="flex items-center gap-0.5">
                          <CalendarIcon size={10} />
                          <span>{evt.date}</span>
                        </span>
                        {evt.time && (
                          <span className="flex items-center gap-0.5">
                            <Clock size={10} />
                            <span>{evt.time}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center text-xs text-brand-400 py-6">
                  No upcoming meetings scheduled.
                </div>
              )}
            </div>
          </div>

        </div>

      </div>

      {/* Professional Scheduling Interface Modal */}
      {isScheduleModalOpen && (
        <div className="fixed inset-0 bg-brand-950/40 backdrop-blur-xs flex items-center justify-center z-50 p-4">
          <div className="bg-white border border-brand-200 rounded-2xl p-6 shadow-overlay max-w-md w-full space-y-4">
            
            <div className="flex items-center justify-between border-b border-brand-100 pb-3">
              <h3 className="text-sm font-bold text-brand-950 flex items-center gap-2">
                <CalendarIcon size={16} className="text-amber-500" />
                <span>Schedule job Hunt Event</span>
              </h3>
              <button 
                onClick={() => setIsScheduleModalOpen(false)}
                className="text-xs font-bold text-brand-400 hover:text-brand-700"
              >
                Close
              </button>
            </div>

            <form onSubmit={handleScheduleSubmit} className="space-y-4 text-xs">
              
              {/* Event Type */}
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-brand-700">Event Type</label>
                <select
                  value={formType}
                  onChange={(e) => setFormType(e.target.value)}
                  className="border border-brand-200 rounded-xl px-3 py-2 outline-none font-bold text-brand-700"
                >
                  <option value="interview">Technical Interview</option>
                  <option value="assessment">Coding Assessment</option>
                  <option value="meeting">Recruiter Meeting</option>
                  <option value="followup">Follow-up Reminder</option>
                </select>
              </div>

              {/* Company & Role */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-brand-700">Company Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Stripe"
                    value={formCompany}
                    onChange={(e) => setFormCompany(e.target.value)}
                    className="border border-brand-200 rounded-xl px-3 py-2 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-brand-700">Role Title</label>
                  <input
                    type="text"
                    placeholder="e.g. Frontend Engineer"
                    value={formRole}
                    onChange={(e) => setFormRole(e.target.value)}
                    className="border border-brand-200 rounded-xl px-3 py-2 focus:outline-none"
                  />
                </div>
              </div>

              {/* Date & Time */}
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-brand-700">Event Date</label>
                  <input
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="border border-brand-200 rounded-xl px-3 py-2 focus:outline-none font-mono font-bold"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-brand-700">Event Time</label>
                  <input
                    type="time"
                    required
                    value={formTime}
                    onChange={(e) => setFormTime(e.target.value)}
                    className="border border-brand-200 rounded-xl px-3 py-2 focus:outline-none font-mono font-bold"
                  />
                </div>
              </div>

              {/* Interviewer */}
              {(formType === "interview" || formType === "meeting") && (
                <div className="flex flex-col gap-1.5">
                  <label className="font-bold text-brand-700">Interviewer/Contact Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Marcus A."
                    value={formInterviewer}
                    onChange={(e) => setFormInterviewer(e.target.value)}
                    className="border border-brand-200 rounded-xl px-3 py-2 focus:outline-none"
                  />
                </div>
              )}

              {/* Notes */}
              <div className="flex flex-col gap-1.5">
                <label className="font-bold text-brand-700">Meeting Notes / Agenda</label>
                <textarea
                  rows={3}
                  placeholder="Notes, link to video call, preparation details..."
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="border border-brand-200 rounded-xl px-3 py-2 focus:outline-none resize-none font-sans leading-relaxed"
                />
              </div>

              <div className="pt-2 border-t border-brand-100 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsScheduleModalOpen(false)}
                  className="px-4 py-2 border border-brand-200 hover:bg-brand-50 rounded-xl text-xs font-bold text-brand-655"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-950 hover:bg-brand-900 text-white rounded-xl text-xs font-bold shadow-sm"
                >
                  Schedule Event
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
}
