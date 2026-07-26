import React, { useState, useMemo } from "react";
import JobCard from "./JobCard";
import EmptyState from "./EmptyState";
import { ArrowUpDown, ChevronLeft, ChevronRight, Layers } from "lucide-react";

export default function JobList({
  jobs,
  savedJobIds,
  onSaveToggle,
  onViewDetails,
  onApply,
  currentPage,
  setCurrentPage,
  onResetSearch,
}) {
  const [sortBy, setSortBy] = useState("newest");
  const itemsPerPage = 6;

  // Sorting logic
  const sortedJobs = useMemo(() => {
    const list = [...jobs];
    if (sortBy === "newest") {
      return list; // Preserved original API / search order
    }
    if (sortBy === "oldest") {
      return list.reverse();
    }
    if (sortBy === "company") {
      return list.sort((a, b) => a.company.localeCompare(b.company));
    }
    if (sortBy === "title") {
      return list.sort((a, b) => a.title.localeCompare(b.title));
    }
    return list;
  }, [jobs, sortBy]);

  // Client pagination
  const totalPages = Math.ceil(sortedJobs.length / itemsPerPage) || 1;
  const paginatedJobs = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedJobs.slice(start, start + itemsPerPage);
  }, [sortedJobs, currentPage]);

  if (jobs.length === 0) {
    return <EmptyState onReset={onResetSearch} />;
  }

  return (
    <div className="space-y-4">
      {/* Header bar with Count and Sorting */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white/60 backdrop-blur-md border border-brand-200/60 rounded-xl px-4 py-2.5 shadow-3xs">
        <div className="flex items-center gap-2 text-xs font-bold text-brand-800">
          <Layers size={14} className="text-amber-500" />
          <span>
            Showing <strong className="text-brand-950 font-extrabold">{sortedJobs.length}</strong> matching opportunities
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-brand-400 font-mono flex items-center gap-1">
            <ArrowUpDown size={12} />
            Sort:
          </span>
          <select
            value={sortBy}
            onChange={(e) => {
              setSortBy(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-white border border-brand-200 rounded-lg px-2.5 py-1 text-xs font-bold text-brand-850 outline-none cursor-pointer"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="company">Company Name</option>
            <option value="title">Job Title</option>
          </select>
        </div>
      </div>

      {/* Grid of Job Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {paginatedJobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            isSaved={savedJobIds.has(job.id)}
            onSaveToggle={onSaveToggle}
            onViewDetails={onViewDetails}
            onApply={onApply}
          />
        ))}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-brand-100/80 pt-4">
          <span className="text-xs font-mono text-brand-400">
            Page {currentPage} of {totalPages}
          </span>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="p-2 border border-brand-200 rounded-xl bg-white hover:bg-brand-50 text-brand-700 disabled:opacity-40 transition cursor-pointer"
            >
              <ChevronLeft size={16} />
            </button>

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="p-2 border border-brand-200 rounded-xl bg-white hover:bg-brand-50 text-brand-700 disabled:opacity-40 transition cursor-pointer"
            >
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
