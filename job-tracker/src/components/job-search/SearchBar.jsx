import React from "react";
import { Search, MapPin, Briefcase, DollarSign, Sparkles } from "lucide-react";

export default function SearchBar({
  searchQuery,
  setSearchQuery,
  locationQuery,
  setLocationQuery,
  experienceLevel,
  setExperienceLevel,
  employmentType,
  setEmploymentType,
  salaryRange,
  setSalaryRange,
  onSearch,
  isSearching,
}) {
  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch();
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white border border-brand-200/80 rounded-2xl p-4 md:p-5 shadow-premium space-y-4"
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-12 gap-3 items-center">
        
        {/* Job Title / Keywords */}
        <div className="lg:col-span-4 relative flex items-center bg-brand-50/50 border border-brand-200 rounded-xl px-3.5 py-2.5 transition focus-within:border-amber-400 focus-within:ring-1 focus-within:ring-amber-400/20">
          <Search size={16} className="text-brand-400 mr-2.5 shrink-0" />
          <input
            type="text"
            placeholder="Job title, skills, or company..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full text-xs font-semibold text-brand-900 bg-transparent outline-none placeholder-brand-400"
          />
        </div>

        {/* Location */}
        <div className="lg:col-span-3 relative flex items-center bg-brand-50/50 border border-brand-200 rounded-xl px-3.5 py-2.5 transition focus-within:border-amber-400 focus-within:ring-1 focus-within:ring-amber-400/20">
          <MapPin size={16} className="text-brand-400 mr-2.5 shrink-0" />
          <input
            type="text"
            placeholder="City, State, or Remote..."
            value={locationQuery}
            onChange={(e) => setLocationQuery(e.target.value)}
            className="w-full text-xs font-semibold text-brand-900 bg-transparent outline-none placeholder-brand-400"
          />
        </div>

        {/* Experience Level */}
        <div className="lg:col-span-2 relative flex items-center bg-brand-50/50 border border-brand-200 rounded-xl px-3 py-2.5">
          <Briefcase size={15} className="text-brand-400 mr-2 shrink-0" />
          <select
            value={experienceLevel}
            onChange={(e) => setExperienceLevel(e.target.value)}
            className="w-full text-xs font-bold text-brand-800 bg-transparent outline-none cursor-pointer"
          >
            <option value="">Any Experience</option>
            <option value="entry">Entry Level</option>
            <option value="mid">Mid Level</option>
            <option value="senior">Senior Level</option>
            <option value="lead">Lead / Staff</option>
          </select>
        </div>

        {/* Search Button */}
        <div className="lg:col-span-3 flex items-center gap-2">
          <button
            type="submit"
            disabled={isSearching}
            className="w-full flex items-center justify-center gap-2 px-5 py-2.5 bg-brand-950 hover:bg-brand-900 text-amber-400 font-bold text-xs rounded-xl shadow-sm transition cursor-pointer disabled:opacity-50 hover-lift"
          >
            <Sparkles size={14} className={isSearching ? "animate-spin" : ""} />
            <span>{isSearching ? "Searching..." : "Find Jobs"}</span>
          </button>
        </div>
      </div>
    </form>
  );
}
