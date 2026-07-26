import React from "react";
import { 
  Building2, 
  MapPin, 
  DollarSign, 
  Calendar, 
  Bookmark, 
  BookmarkCheck, 
  ExternalLink, 
  Eye, 
  Sparkles,
  Briefcase
} from "lucide-react";
import { motion } from "framer-motion";

export default function JobCard({
  job,
  isSaved,
  onSaveToggle,
  onViewDetails,
  onApply,
}) {
  const logoUrl = job.company_logo;

  return (
    <motion.div
      whileHover={{ y: -3, transition: { duration: 0.15 } }}
      className="bg-white/80 backdrop-blur-md border border-brand-200/80 hover:border-amber-400/60 rounded-2xl p-5 shadow-premium hover:shadow-overlay transition-all duration-200 flex flex-col justify-between relative group"
    >
      <div>
        {/* Top Header: Logo, Company & Source Badge */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            {logoUrl ? (
              <img
                src={logoUrl}
                alt={job.company}
                className="w-10 h-10 rounded-xl object-contain bg-white border border-brand-100 p-1 shrink-0 shadow-3xs"
                onError={(e) => {
                  e.target.style.display = 'none';
                }}
              />
            ) : (
              <div className="w-10 h-10 rounded-xl bg-brand-950 text-amber-400 font-black text-sm flex items-center justify-center uppercase shrink-0 shadow-3xs">
                {(job.company || "C")[0]}
              </div>
            )}

            <div className="min-w-0">
              <h4 className="text-xs font-bold text-brand-900 truncate flex items-center gap-1.5">
                <span>{job.company}</span>
              </h4>
              <p className="text-[10px] text-brand-400 font-mono flex items-center gap-1 mt-0.5">
                <MapPin size={11} className="shrink-0" />
                <span className="truncate">{job.location}</span>
              </p>
            </div>
          </div>

          <span className="text-[9px] font-extrabold uppercase tracking-wider text-brand-500 bg-brand-50 border border-brand-150 px-2 py-0.5 rounded-full shrink-0 font-sans">
            {job.source || "JSearch"}
          </span>
        </div>

        {/* Job Title */}
        <h3 className="text-sm font-black text-brand-950 group-hover:text-amber-700 transition-colors leading-snug line-clamp-2 my-2">
          {job.title}
        </h3>

        {/* Job Tags (Type & Salary) */}
        <div className="flex flex-wrap items-center gap-2 my-3">
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-md">
            <Briefcase size={10} />
            {job.employment_type || "Full Time"}
          </span>

          <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-md">
            <DollarSign size={10} />
            {job.salary || "Competitive"}
          </span>
        </div>

        {/* Short Description Snippet */}
        <p className="text-xs text-brand-500 line-clamp-2 leading-relaxed mb-4 font-medium">
          {job.description}
        </p>
      </div>

      {/* Footer Info & Actions */}
      <div className="border-t border-brand-100/80 pt-3.5 mt-2 space-y-3">
        <div className="flex items-center justify-between text-[10px] text-brand-400 font-mono">
          <span className="flex items-center gap-1">
            <Calendar size={11} />
            {job.posted_at}
          </span>

          {job.ai_match_score && (
            <span className="text-purple-600 font-extrabold flex items-center gap-1 font-sans">
              <Sparkles size={11} />
              {Math.round(job.ai_match_score * 100)}% Match
            </span>
          )}
        </div>

        {/* Card Action Buttons */}
        <div className="grid grid-cols-12 gap-2">
          {/* Save / Saved Toggle Button */}
          <button
            onClick={() => onSaveToggle(job)}
            className={`col-span-3 flex items-center justify-center gap-1 py-2 rounded-xl text-xs font-bold transition cursor-pointer border ${
              isSaved
                ? "bg-amber-500 text-brand-950 border-amber-500 shadow-3xs"
                : "bg-white hover:bg-brand-50 text-brand-700 border-brand-200"
            }`}
          >
            {isSaved ? <BookmarkCheck size={14} /> : <Bookmark size={14} />}
            <span className="hidden sm:inline">{isSaved ? "Saved" : "Save"}</span>
          </button>

          {/* View Details Modal Button */}
          <button
            onClick={() => onViewDetails(job)}
            className="col-span-4 flex items-center justify-center gap-1 py-2 bg-brand-50 hover:bg-brand-100 text-brand-900 border border-brand-200/80 rounded-xl text-xs font-bold transition cursor-pointer"
          >
            <Eye size={13} />
            <span>Details</span>
          </button>

          {/* Apply Button */}
          <button
            onClick={() => onApply(job)}
            className="col-span-5 flex items-center justify-center gap-1.5 py-2 bg-brand-950 hover:bg-brand-900 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer hover-lift"
          >
            <span>Apply</span>
            <ExternalLink size={12} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}
