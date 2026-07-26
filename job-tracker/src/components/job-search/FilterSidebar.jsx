import React from "react";
import { Filter, Globe, Clock, Building2, RotateCcw } from "lucide-react";

export default function FilterSidebar({
  workModeFilter,
  setWorkModeFilter,
  employmentTypeFilter,
  setEmploymentTypeFilter,
  companyFilter,
  setCompanyFilter,
  datePostedFilter,
  setDatePostedFilter,
  onResetFilters,
}) {
  const workModes = [
    { id: "all", label: "All Modes" },
    { id: "remote", label: "Remote" },
    { id: "hybrid", label: "Hybrid" },
    { id: "onsite", label: "Onsite" },
  ];

  const employmentTypes = [
    { id: "all", label: "All Types" },
    { id: "Full Time", label: "Full Time" },
    { id: "Part Time", label: "Part Time" },
    { id: "Internship", label: "Internship" },
    { id: "Contract", label: "Contract" },
  ];

  const dateOptions = [
    { id: "all", label: "Anytime" },
    { id: "today", label: "Posted Today" },
    { id: "week", label: "Posted This Week" },
  ];

  return (
    <div className="bg-white border border-brand-200/80 rounded-2xl p-5 shadow-premium space-y-6 select-none">
      <div className="flex items-center justify-between border-b border-brand-100 pb-3">
        <div className="flex items-center gap-2">
          <Filter size={15} className="text-amber-500" />
          <h3 className="text-xs font-bold text-brand-900 uppercase tracking-wider">Filters</h3>
        </div>
        <button
          onClick={onResetFilters}
          className="flex items-center gap-1 text-[10px] font-bold text-brand-450 hover:text-amber-600 transition cursor-pointer"
        >
          <RotateCcw size={11} />
          <span>Reset</span>
        </button>
      </div>

      {/* Work Mode */}
      <div className="space-y-2">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-brand-400 font-mono flex items-center gap-1.5">
          <Globe size={12} />
          Work Mode
        </label>
        <div className="space-y-1">
          {workModes.map((mode) => (
            <label
              key={mode.id}
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                workModeFilter === mode.id
                  ? "bg-amber-50 text-amber-800 font-bold shadow-3xs"
                  : "text-brand-600 hover:bg-brand-50/60"
              }`}
            >
              <span>{mode.label}</span>
              <input
                type="radio"
                name="workMode"
                checked={workModeFilter === mode.id}
                onChange={() => setWorkModeFilter(mode.id)}
                className="accent-amber-500 cursor-pointer"
              />
            </label>
          ))}
        </div>
      </div>

      {/* Employment Type */}
      <div className="space-y-2 border-t border-brand-100 pt-4">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-brand-400 font-mono flex items-center gap-1.5">
          <Clock size={12} />
          Employment Type
        </label>
        <div className="space-y-1">
          {employmentTypes.map((type) => (
            <label
              key={type.id}
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                employmentTypeFilter === type.id
                  ? "bg-amber-50 text-amber-800 font-bold shadow-3xs"
                  : "text-brand-600 hover:bg-brand-50/60"
              }`}
            >
              <span>{type.label}</span>
              <input
                type="radio"
                name="empType"
                checked={employmentTypeFilter === type.id}
                onChange={() => setEmploymentTypeFilter(type.id)}
                className="accent-amber-500 cursor-pointer"
              />
            </label>
          ))}
        </div>
      </div>

      {/* Company Name Filter */}
      <div className="space-y-2 border-t border-brand-100 pt-4">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-brand-400 font-mono flex items-center gap-1.5">
          <Building2 size={12} />
          Company Filter
        </label>
        <input
          type="text"
          placeholder="Filter by company name..."
          value={companyFilter}
          onChange={(e) => setCompanyFilter(e.target.value)}
          className="w-full bg-brand-50/50 border border-brand-200 rounded-xl px-3 py-2 text-xs font-semibold text-brand-900 outline-none placeholder-brand-400"
        />
      </div>

      {/* Date Posted */}
      <div className="space-y-2 border-t border-brand-100 pt-4">
        <label className="text-[10px] font-extrabold uppercase tracking-widest text-brand-400 font-mono flex items-center gap-1.5">
          <Clock size={12} />
          Date Posted
        </label>
        <div className="space-y-1">
          {dateOptions.map((opt) => (
            <label
              key={opt.id}
              className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                datePostedFilter === opt.id
                  ? "bg-amber-50 text-amber-800 font-bold shadow-3xs"
                  : "text-brand-600 hover:bg-brand-50/60"
              }`}
            >
              <span>{opt.label}</span>
              <input
                type="radio"
                name="datePosted"
                checked={datePostedFilter === opt.id}
                onChange={() => setDatePostedFilter(opt.id)}
                className="accent-amber-500 cursor-pointer"
              />
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}
