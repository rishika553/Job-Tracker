import React, { useState, useEffect } from "react";
import { applicationsApi } from "../services/applicationsApi";
import { X, Loader2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ApplicationModal({ isOpen, onClose, appToEdit = null, onSaved }) {
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    company: "",
    title: "",
    status: "applied",
    source: "LinkedIn",
    applied_at: new Date().toISOString().split("T")[0],
    salary_range: "",
    location: "",
    job_description: "",
  });

  useEffect(() => {
    if (!isOpen) return;
    if (appToEdit) {
      setFormData({
        company: appToEdit.company || "",
        title: appToEdit.title || appToEdit.role || "",
        status: appToEdit.status || "applied",
        source: appToEdit.source || "LinkedIn",
        applied_at: appToEdit.applied_at
          ? appToEdit.applied_at.split("T")[0]
          : (appToEdit.appliedDate && appToEdit.appliedDate !== "-" ? appToEdit.appliedDate : new Date().toISOString().split("T")[0]),
        salary_range: appToEdit.salary_range || appToEdit.salary || "",
        location: appToEdit.location || "",
        job_description: appToEdit.job_description || appToEdit.jobDescription || "",
      });
    } else {
      setFormData({
        company: "",
        title: "",
        status: "applied",
        source: "LinkedIn",
        applied_at: new Date().toISOString().split("T")[0],
        salary_range: "",
        location: "",
        job_description: "",
      });
    }
    setError("");
  }, [appToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.company.trim() || !formData.title.trim()) return;

    const payload = {
      company: formData.company.trim(),
      title: formData.title.trim(),
      status: formData.status,
      source: formData.source,
      applied_at: formData.status === "wishlist" ? null : formData.applied_at || new Date().toISOString(),
      salary_range: formData.salary_range.trim() || null,
      location: formData.location.trim() || null,
      job_description: formData.job_description.trim() || null,
    };

    setSubmitting(true);
    setError("");
    try {
      if (appToEdit) {
        await applicationsApi.updateApplication(appToEdit.id, payload);
      } else {
        await applicationsApi.createApplication(payload);
      }
      onSaved?.();
      onClose();
    } catch (err) {
      setError(err.response?.data?.detail || "Failed to save application. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const sources = [
    "LinkedIn", "Indeed", "Wellfound", "Naukri", "Glassdoor",
    "Greenhouse", "Lever", "Workday", "Referral", "Career Portal", "Gmail Sync", "Manual",
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px]"
        />

        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ type: "spring", duration: 0.3 }}
          className="w-full max-w-2xl bg-white rounded-xl shadow-overlay border border-slate-100 overflow-hidden flex flex-col relative z-10 max-h-[90vh]"
        >
          {/* Header */}
          <div className="flex justify-between items-center px-6 py-4 border-b border-slate-100">
            <h2 className="text-lg font-semibold text-slate-900">
              {appToEdit ? "Edit Application" : "Track New Application"}
            </h2>
            <button onClick={onClose} className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition">
              <X size={18} />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-rose-50 border border-rose-200 text-rose-600 text-xs font-medium">
                {error}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Company */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Company Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Stripe"
                  value={formData.company}
                  onChange={(e) => setFormData(p => ({ ...p, company: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Title */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Role / Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Frontend Engineer"
                  value={formData.title}
                  onChange={(e) => setFormData(p => ({ ...p, title: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Application Stage
                </label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData(p => ({ ...p, status: e.target.value }))}
                  className="w-full border border-slate-200 bg-white rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                >
                  <option value="wishlist">Wishlist</option>
                  <option value="applied">Applied</option>
                  <option value="interview">Interviewing</option>
                  <option value="offer">Offer Received</option>
                  <option value="rejected">Rejected</option>
                </select>
              </div>

              {/* Source */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Application Source
                </label>
                <select
                  value={formData.source}
                  onChange={(e) => setFormData(p => ({ ...p, source: e.target.value }))}
                  className="w-full border border-slate-200 bg-white rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500"
                >
                  {sources.map(src => (
                    <option key={src} value={src}>{src}</option>
                  ))}
                </select>
              </div>

              {/* Applied Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Date Applied {formData.status === "wishlist" && "(Optional)"}
                </label>
                <input
                  type="date"
                  disabled={formData.status === "wishlist"}
                  value={formData.applied_at}
                  onChange={(e) => setFormData(p => ({ ...p, applied_at: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-indigo-500 disabled:bg-slate-50 disabled:text-slate-400"
                />
              </div>

              {/* Location */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Location
                </label>
                <input
                  type="text"
                  placeholder="e.g. San Francisco, CA or Remote"
                  value={formData.location}
                  onChange={(e) => setFormData(p => ({ ...p, location: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>

              {/* Salary */}
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Salary Range
                </label>
                <input
                  type="text"
                  placeholder="e.g. $120,000 - $140,000"
                  value={formData.salary_range}
                  onChange={(e) => setFormData(p => ({ ...p, salary_range: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Job Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Job Description
              </label>
              <textarea
                rows={3}
                placeholder="Paste key responsibilities or requirements..."
                value={formData.job_description}
                onChange={(e) => setFormData(p => ({ ...p, job_description: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 font-sans resize-none"
              />
            </div>
          </form>

          {/* Footer */}
          <div className="flex justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 bg-white rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting || !formData.company.trim() || !formData.title.trim()}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition flex items-center gap-2"
            >
              {submitting && <Loader2 size={14} className="animate-spin" />}
              {appToEdit ? "Save Changes" : "Track Application"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
