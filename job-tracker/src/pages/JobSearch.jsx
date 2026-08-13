import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useJobTracker } from "../context/JobTrackerContext";
import { jobsApi } from "../services/jobsApi";
import SearchBar from "../components/job-search/SearchBar";
import SearchHistory from "../components/job-search/SearchHistory";
import FilterSidebar from "../components/job-search/FilterSidebar";
import JobList from "../components/job-search/JobList";
import JobDetailsModal from "../components/job-search/JobDetailsModal";
import LoadingSkeleton from "../components/job-search/LoadingSkeleton";
import { Sparkles, CheckCircle2, X, ExternalLink, Bookmark, RefreshCw, AlertCircle } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function JobSearch() {
  const { addApplication } = useJobTracker();

  // Search parameters
  const [searchQuery, setSearchQuery] = useState("Full Stack Developer");
  const [locationQuery, setLocationQuery] = useState("Remote");
  const [experienceLevel, setExperienceLevel] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [salaryRange, setSalaryRange] = useState("");

  // Filters
  const [workModeFilter, setWorkModeFilter] = useState("all");
  const [employmentTypeFilter, setEmploymentTypeFilter] = useState("all");
  const [companyFilter, setCompanyFilter] = useState("");
  const [datePostedFilter, setDatePostedFilter] = useState("all");

  // State
  const [jobs, setJobs] = useState([]);
  const [savedJobIds, setSavedJobIds] = useState(new Set());
  const [recentSearches, setRecentSearches] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);

  // Modals
  const [selectedJobModal, setSelectedJobModal] = useState(null);
  const [applyConfirmationJob, setApplyConfirmationJob] = useState(null);
  const [autoAppAddedSuccess, setAutoAppAddedSuccess] = useState(null);

  // Load saved jobs and recent search queries on mount
  useEffect(() => {
    async function initData() {
      try {
        const [savedData, recentData] = await Promise.all([
          jobsApi.getSavedJobs().catch(() => []),
          jobsApi.getRecentSearches().catch(() => []),
        ]);
        if (Array.isArray(savedData)) {
          setSavedJobIds(new Set(savedData.map((j) => j.id)));
        }
        if (Array.isArray(recentData)) {
          setRecentSearches(recentData);
        }
      } catch {
        /* Ignore offline/auth errors */
      }
    }
    initData();
  }, []);

  // Execute job search query
  const handleSearch = useCallback(async (customQuery = null, customLoc = null) => {
    const q = customQuery !== null ? customQuery : searchQuery;
    const loc = customLoc !== null ? customLoc : locationQuery;

    setIsSearching(true);
    setError(null);
    try {
      const results = await jobsApi.searchJobs({
        query: q || "Developer",
        location: loc || "",
        experience: experienceLevel,
        employment_type: employmentType,
        salary: salaryRange,
        page: 1,
      });

      setJobs(results);
      setCurrentPage(1);

      // Refresh recent searches log
      const updatedSearches = await jobsApi.getRecentSearches().catch(() => []);
      if (Array.isArray(updatedSearches) && updatedSearches.length > 0) {
        setRecentSearches(updatedSearches);
      }
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to fetch jobs. Please try again.");
    } finally {
      setIsSearching(false);
    }
  }, [searchQuery, locationQuery, experienceLevel, employmentType, salaryRange]);

  useEffect(() => {
    handleSearch();
  }, []);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const loc = (job.location || "").toLowerCase();
      const empType = (job.employment_type || "").toLowerCase();
      const comp = (job.company || "").toLowerCase();
      const posted = (job.posted_at || "").toLowerCase();

      // Work mode filter
      if (workModeFilter === "remote" && !loc.includes("remote")) return false;
      if (workModeFilter === "hybrid" && !loc.includes("hybrid")) return false;
      if (workModeFilter === "onsite" && (loc.includes("remote") || loc.includes("hybrid"))) return false;

      // Employment type filter
      if (employmentTypeFilter !== "all" && !empType.includes(employmentTypeFilter.toLowerCase())) return false;

      // Company filter
      if (companyFilter.trim() && !comp.includes(companyFilter.toLowerCase().trim())) return false;

      // Date posted filter
      if (datePostedFilter === "today" && !posted.includes("today")) return false;

      return true;
    });
  }, [jobs, workModeFilter, employmentTypeFilter, companyFilter, datePostedFilter]);

  // Save / Unsave toggle handler
  const handleSaveToggle = async (job) => {
    const isCurrentlySaved = savedJobIds.has(job.id);
    try {
      if (isCurrentlySaved) {
        await jobsApi.unsaveJob(job.id);
        setSavedJobIds((prev) => {
          const next = new Set(prev);
          next.delete(job.id);
          return next;
        });
      } else {
        await jobsApi.saveJob(job);
        setSavedJobIds((prev) => new Set(prev).add(job.id));
      }
    } catch {
      // Fallback toggle for offline/demo mode
      setSavedJobIds((prev) => {
        const next = new Set(prev);
        if (isCurrentlySaved) next.delete(job.id);
        else next.add(job.id);
        return next;
      });
    }
  };

  // Apply Handler: Opens URL and shows Confirmation Dialog
  const handleApplyClick = (job) => {
    if (job.apply_url) {
      window.open(job.apply_url, "_blank", "noopener,noreferrer");
    }
    setApplyConfirmationJob(job);
  };

  // Confirm Auto-Create Application in Applications module
  const handleConfirmApplication = async (didApply) => {
    const targetJob = applyConfirmationJob;
    setApplyConfirmationJob(null);

    if (didApply && targetJob) {
      try {
        await addApplication({
          company: targetJob.company,
          role: targetJob.title,
          status: "applied",
          location: targetJob.location,
          salary: targetJob.salary,
          source: "AI Job Search",
          jobDescription: targetJob.description,
          notes: targetJob.apply_url,
        });

        setAutoAppAddedSuccess(targetJob.company);
        setTimeout(() => setAutoAppAddedSuccess(null), 4000);
      } catch {
        // Handled cleanly
      }
    }
  };

  // Reset Filters
  const handleResetFilters = () => {
    setWorkModeFilter("all");
    setEmploymentTypeFilter("all");
    setCompanyFilter("");
    setDatePostedFilter("all");
  };

  return (
    <div className="space-y-6 pb-16 animate-fade-in select-none">
      
      {/* Page Title Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white border border-brand-200/80 rounded-2xl p-6 shadow-premium">
        <div>
          <h1 className="text-xl md:text-2xl font-black text-brand-950 tracking-tight flex items-center gap-2.5">
            <span>AI Job Search</span>
            <span className="text-xs font-extrabold text-amber-800 bg-amber-100/80 border border-amber-300/60 px-2.5 py-0.5 rounded-full font-mono">
              Live Feed
            </span>
          </h1>
          <p className="text-xs text-brand-500 mt-1 max-w-2xl">
            Search verified opportunity listings across major platforms from one unified interface.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => handleSearch()}
            disabled={isSearching}
            className="flex items-center gap-1.5 px-4 py-2 border border-brand-200 hover:border-brand-300 rounded-xl text-xs font-bold text-brand-700 bg-white hover:bg-brand-50 transition cursor-pointer disabled:opacity-50"
          >
            <RefreshCw size={13} className={isSearching ? "animate-spin" : ""} />
            <span>{isSearching ? "Updating..." : "Refresh Listings"}</span>
          </button>
        </div>
      </div>

      {/* Auto-Add Success Toast */}
      {autoAppAddedSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="bg-emerald-950 text-white border border-emerald-700 rounded-2xl p-4 flex items-center justify-between shadow-overlay"
        >
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-500 text-brand-950 font-extrabold flex items-center justify-center shrink-0">
              <CheckCircle2 size={18} />
            </div>
            <div>
              <h4 className="text-xs font-bold text-emerald-200">Application Tracked Automatically!</h4>
              <p className="text-[11px] text-emerald-300/90 mt-0.5">
                Saved <strong>{autoAppAddedSuccess}</strong> application into your Applications board under "APPLIED" status.
              </p>
            </div>
          </div>
          <button onClick={() => setAutoAppAddedSuccess(null)} className="text-emerald-400 hover:text-white">
            <X size={16} />
          </button>
        </motion.div>
      )}

      {/* Search Input Section */}
      <div className="space-y-3">
        <SearchBar
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          locationQuery={locationQuery}
          setLocationQuery={setLocationQuery}
          experienceLevel={experienceLevel}
          setExperienceLevel={setExperienceLevel}
          employmentType={employmentType}
          setEmploymentType={setEmploymentType}
          salaryRange={salaryRange}
          setSalaryRange={setSalaryRange}
          onSearch={handleSearch}
          isSearching={isSearching}
        />

        {/* Recent Search History Chips */}
        <SearchHistory
          recentSearches={recentSearches}
          onSelectSearch={(q, loc) => {
            setSearchQuery(q);
            setLocationQuery(loc || "");
            handleSearch(q, loc || "");
          }}
        />
      </div>

      {/* Error Alert */}
      {error && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5 text-xs font-semibold">
            <AlertCircle size={16} className="text-rose-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => handleSearch()}
            className="px-3 py-1.5 bg-rose-600 text-white rounded-xl text-xs font-bold hover:bg-rose-700 transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Main Grid: Left Filter Sidebar (3 cols), Right Job List (9 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Left Filter Sidebar */}
        <div className="lg:col-span-3">
          <FilterSidebar
            workModeFilter={workModeFilter}
            setWorkModeFilter={setWorkModeFilter}
            employmentTypeFilter={employmentTypeFilter}
            setEmploymentTypeFilter={setEmploymentTypeFilter}
            companyFilter={companyFilter}
            setCompanyFilter={setCompanyFilter}
            datePostedFilter={datePostedFilter}
            setDatePostedFilter={setDatePostedFilter}
            onResetFilters={handleResetFilters}
          />
        </div>

        {/* Right Job Results Panel */}
        <div className="lg:col-span-9">
          {isSearching ? (
            <LoadingSkeleton />
          ) : (
            <JobList
              jobs={filteredJobs}
              savedJobIds={savedJobIds}
              onSaveToggle={handleSaveToggle}
              onViewDetails={(job) => setSelectedJobModal(job)}
              onApply={handleApplyClick}
              currentPage={currentPage}
              setCurrentPage={setCurrentPage}
              onResetSearch={() => {
                setSearchQuery("");
                setLocationQuery("");
                handleResetFilters();
                handleSearch("", "");
              }}
            />
          )}
        </div>
      </div>

      {/* Job Details Modal Popup */}
      <JobDetailsModal
        job={selectedJobModal}
        isOpen={!!selectedJobModal}
        onClose={() => setSelectedJobModal(null)}
        isSaved={selectedJobModal ? savedJobIds.has(selectedJobModal.id) : false}
        onSaveToggle={handleSaveToggle}
        onApply={handleApplyClick}
      />

      {/* Did You Apply? Confirmation Modal Dialog */}
      {applyConfirmationJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-950/70 backdrop-blur-sm select-none">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white border border-brand-200 rounded-3xl p-6 max-w-md w-full shadow-overlay space-y-5 text-center"
          >
            <div className="w-14 h-14 bg-amber-50 border border-amber-200 text-amber-500 rounded-2xl flex items-center justify-center mx-auto shadow-3xs">
              <ExternalLink size={24} />
            </div>

            <div>
              <h3 className="text-base font-black text-brand-950">Did you apply to this position?</h3>
              <p className="text-xs text-brand-500 mt-1.5 leading-relaxed font-medium">
                Application URL was opened in your browser for <strong>{applyConfirmationJob.title}</strong> at <strong>{applyConfirmationJob.company}</strong>.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => handleConfirmApplication(false)}
                className="py-2.5 border border-brand-200 hover:border-brand-300 bg-white text-brand-700 text-xs font-bold rounded-xl transition cursor-pointer"
              >
                No, just browsing
              </button>

              <button
                onClick={() => handleConfirmApplication(true)}
                className="py-2.5 bg-brand-950 hover:bg-brand-900 text-white text-xs font-bold rounded-xl transition shadow-sm cursor-pointer hover-lift flex items-center justify-center gap-1.5"
              >
                <CheckCircle2 size={15} className="text-amber-400" />
                <span>Yes, Add Application</span>
              </button>
            </div>
          </motion.div>
        </div>
      )}

    </div>
  );
}
