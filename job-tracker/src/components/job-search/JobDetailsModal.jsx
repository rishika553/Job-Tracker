import React from "react";
import { 
  X, 
  Building2, 
  MapPin, 
  DollarSign, 
  Calendar, 
  Briefcase, 
  ExternalLink, 
  CheckCircle2, 
  Sparkles, 
  Bookmark, 
  BookmarkCheck,
  Award
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function JobDetailsModal({
  job,
  isOpen,
  onClose,
  isSaved,
  onSaveToggle,
  onApply,
}) {
  if (!isOpen || !job) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-950/60 backdrop-blur-sm">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 10 }}
          transition={{ duration: 0.2 }}
          className="bg-white border border-brand-200 rounded-3xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-overlay overflow-hidden text-left"
        >
          {/* Header Bar */}
          <div className="p-6 border-b border-brand-100 flex items-start justify-between gap-4 bg-brand-50/30">
            <div className="flex items-center gap-4">
              {job.company_logo ? (
                <img
                  src={job.company_logo}
                  alt={job.company}
                  className="w-14 h-14 rounded-2xl object-contain bg-white border border-brand-200 p-1.5 shrink-0 shadow-3xs"
                  onError={(e) => { e.target.style.display = 'none'; }}
                />
              ) : (
                <div className="w-14 h-14 rounded-2xl bg-brand-950 text-amber-400 font-black text-xl flex items-center justify-center uppercase shrink-0 shadow-3xs">
                  {(job.company || "C")[0]}
                </div>
              )}

              <div>
                <span className="text-[9px] font-extrabold uppercase tracking-widest text-amber-700 bg-amber-50 border border-amber-200/60 px-2 py-0.5 rounded-full font-mono">
                  {job.source || "JSearch Verified"}
                </span>
                <h2 className="text-lg md:text-xl font-black text-brand-950 mt-1 leading-snug">
                  {job.title}
                </h2>
                <p className="text-xs font-bold text-brand-700 mt-0.5 flex items-center gap-2">
                  <span>{job.company}</span>
                  <span>•</span>
                  <span className="flex items-center gap-1 font-normal text-brand-500">
                    <MapPin size={12} />
                    {job.location}
                  </span>
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-brand-400 hover:text-brand-950 hover:bg-brand-100 transition cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>

          {/* Scrollable Content Body */}
          <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs text-brand-800 leading-relaxed">
            
            {/* Quick Metadata Bar */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-brand-50/50 border border-brand-100 rounded-2xl p-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-400 font-mono block">Employment Type</span>
                <span className="text-xs font-extrabold text-brand-900 mt-0.5 block">{job.employment_type}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-400 font-mono block">Salary Range</span>
                <span className="text-xs font-extrabold text-emerald-700 mt-0.5 block">{job.salary}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-400 font-mono block">Date Posted</span>
                <span className="text-xs font-bold text-brand-800 mt-0.5 block">{job.posted_at}</span>
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-brand-400 font-mono block">Match Score</span>
                <span className="text-xs font-extrabold text-purple-700 mt-0.5 block flex items-center gap-1">
                  <Sparkles size={11} />
                  {Math.round((job.ai_match_score || 0.92) * 100)}% Match
                </span>
              </div>
            </div>

            {/* Job Description */}
            <div className="space-y-2">
              <h3 className="text-xs font-extrabold text-brand-950 uppercase tracking-wider font-mono">Job Description</h3>
              <div className="bg-brand-50/20 border border-brand-100/80 rounded-2xl p-4.5 text-brand-800 font-sans whitespace-pre-wrap leading-relaxed">
                {job.description}
              </div>
            </div>

            {/* Required Skills */}
            {job.skills && job.skills.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-extrabold text-brand-950 uppercase tracking-wider font-mono">Key Skills & Qualifications</h3>
                <div className="flex flex-wrap gap-2">
                  {job.skills.map((skill, i) => (
                    <span key={i} className="px-3 py-1 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs font-bold shadow-3xs">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Responsibilities */}
            {job.responsibilities && job.responsibilities.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-extrabold text-brand-950 uppercase tracking-wider font-mono">Responsibilities</h3>
                <ul className="space-y-2">
                  {job.responsibilities.map((resp, i) => (
                    <li key={i} className="flex items-start gap-2 text-brand-700">
                      <CheckCircle2 size={14} className="text-amber-500 shrink-0 mt-0.5" />
                      <span>{resp}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Benefits */}
            {job.benefits && job.benefits.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-xs font-extrabold text-brand-950 uppercase tracking-wider font-mono">Perks & Benefits</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {job.benefits.map((ben, i) => (
                    <div key={i} className="p-3 bg-brand-50/40 border border-brand-100 rounded-xl flex items-center gap-2 text-brand-800 font-medium">
                      <Award size={14} className="text-indigo-600 shrink-0" />
                      <span>{ben}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Company Info Footer */}
            <div className="p-4 bg-brand-950 text-white rounded-2xl flex items-center justify-between gap-4">
              <div>
                <h4 className="text-xs font-extrabold text-white">About {job.company}</h4>
                <p className="text-[11px] text-brand-400 mt-0.5">Learn more on the company career portal.</p>
              </div>
              <a
                href={`https://www.google.com/search?q=${job.company}+careers`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-1.5 bg-brand-850 hover:bg-brand-800 border border-brand-750 text-amber-400 rounded-xl text-xs font-bold transition flex items-center gap-1 shrink-0"
              >
                <span>Company Profile</span>
                <ExternalLink size={12} />
              </a>
            </div>
          </div>

          {/* Sticky Modal Footer Actions */}
          <div className="p-5 border-t border-brand-100 flex items-center justify-between gap-3 bg-white">
            <button
              onClick={() => onSaveToggle(job)}
              className={`flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                isSaved
                  ? "bg-amber-500 text-brand-950 border-amber-500 shadow-3xs"
                  : "bg-white hover:bg-brand-50 text-brand-700 border-brand-200"
              }`}
            >
              {isSaved ? <BookmarkCheck size={15} /> : <Bookmark size={15} />}
              <span>{isSaved ? "Saved in Supabase" : "Save Job"}</span>
            </button>

            <button
              onClick={() => {
                onClose();
                onApply(job);
              }}
              className="flex items-center gap-2 px-6 py-2.5 bg-brand-950 hover:bg-brand-900 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer hover-lift"
            >
              <span>Apply Now</span>
              <ExternalLink size={14} />
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
