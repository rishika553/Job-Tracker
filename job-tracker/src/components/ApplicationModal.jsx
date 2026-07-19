import React, { useState, useEffect } from "react";
import { useJobTracker } from "../context/JobTrackerContext";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ApplicationModal({ isOpen, onClose, appToEdit = null }) {
  const { addApplication, updateApplication } = useJobTracker();
  
  const [formData, setFormData] = useState({
    company: "",
    role: "",
    status: "applied",
    source: "LinkedIn",
    appliedDate: new Date().toISOString().split("T")[0],
    salary: "",
    location: "",
    tagsString: "",
    jobDescription: "",
    notes: ""
  });

  useEffect(() => {
    if (appToEdit) {
      setFormData({
        company: appToEdit.company || "",
        role: appToEdit.role || "",
        status: appToEdit.status || "applied",
        source: appToEdit.source || "LinkedIn",
        appliedDate: appToEdit.appliedDate === "-" ? "" : (appToEdit.appliedDate || ""),
        salary: appToEdit.salary || "",
        location: appToEdit.location || "",
        tagsString: appToEdit.tags ? appToEdit.tags.join(", ") : "",
        jobDescription: appToEdit.jobDescription || "",
        notes: appToEdit.notes || ""
      });
    } else {
      setFormData({
        company: "",
        role: "",
        status: "applied",
        source: "LinkedIn",
        appliedDate: new Date().toISOString().split("T")[0],
        salary: "",
        location: "",
        tagsString: "",
        jobDescription: "",
        notes: ""
      });
    }
  }, [appToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.company.trim() || !formData.role.trim()) return;

    // Convert comma-separated string to tag array
    const tags = formData.tagsString
      ? formData.tagsString.split(",").map(t => t.trim()).filter(Boolean)
      : [];

    const formattedApp = {
      company: formData.company.trim(),
      role: formData.role.trim(),
      status: formData.status,
      source: formData.source,
      appliedDate: formData.status === "wishlist" ? "-" : (formData.appliedDate || new Date().toISOString().split("T")[0]),
      salary: formData.salary.trim(),
      location: formData.location.trim(),
      tags,
      jobDescription: formData.jobDescription.trim(),
      notes: formData.notes.trim()
    };

    if (appToEdit) {
      updateApplication(appToEdit.id, formattedApp);
    } else {
      // Create random logo gradient for variety
      const gradients = [
        "from-[#635BFF] to-[#8079FF]",
        "from-[#5E6AD2] to-[#7B88EB]",
        "from-[#FF9900] to-[#146B93]",
        "from-[#0A0A0A] to-[#1C1C1C]",
        "from-[#10B981] to-[#34D399]",
        "from-[#EF4444] to-[#F87171]",
        "from-[#3B82F6] to-[#60A5FA]"
      ];
      const randomGradient = gradients[Math.floor(Math.random() * gradients.length)];
      addApplication({
        ...formattedApp,
        logoColor: randomGradient
      });
    }

    onClose();
  };

  const sources = [
    "LinkedIn", "Indeed", "Wellfound", "Naukri", "Glassdoor", 
    "Greenhouse", "Lever", "Workday", "Referral", "Career Portal", "Gmail Sync"
  ];

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-[2px]"
        />

        {/* Modal dialog */}
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
            <button 
              onClick={onClose}
              className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-400 hover:text-slate-600 transition"
            >
              <X size={18} />
            </button>
          </div>

          {/* Form Content */}
          <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
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
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                />
              </div>

              {/* Role */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Role / Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Frontend Engineer"
                  value={formData.role}
                  onChange={(e) => setFormData(p => ({ ...p, role: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
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
                  className="w-full border border-slate-200 bg-white rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
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
                  className="w-full border border-slate-200 bg-white rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
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
                  value={formData.appliedDate}
                  onChange={(e) => setFormData(p => ({ ...p, appliedDate: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 disabled:bg-slate-50 disabled:text-slate-400"
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
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                />
              </div>

              {/* Salary */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Salary Range
                </label>
                <input
                  type="text"
                  placeholder="e.g. $120,000 - $140,000"
                  value={formData.salary}
                  onChange={(e) => setFormData(p => ({ ...p, salary: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
                />
              </div>

              {/* Skills/Tags */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                  Skills / Tags (comma separated)
                </label>
                <input
                  type="text"
                  placeholder="e.g. React, TypeScript, Figma"
                  value={formData.tagsString}
                  onChange={(e) => setFormData(p => ({ ...p, tagsString: e.target.value }))}
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500"
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
                placeholder="Paste key responsibilities, requirements, or links..."
                value={formData.jobDescription}
                onChange={(e) => setFormData(p => ({ ...p, jobDescription: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 font-sans resize-none"
              />
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1.5">
                Internal Notes
              </label>
              <textarea
                rows={3}
                placeholder="Interview logs, referral contacts, or reminders..."
                value={formData.notes}
                onChange={(e) => setFormData(p => ({ ...p, notes: e.target.value }))}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm text-slate-800 placeholder-slate-400 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 font-sans resize-none"
              />
            </div>
          </form>

          {/* Footer Actions */}
          <div className="flex justify-end gap-3 px-6 py-4 bg-slate-50 border-t border-slate-100 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-slate-200 bg-white rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-slate-800 transition"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!formData.company.trim() || !formData.role.trim()}
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-500/50 text-white rounded-lg text-sm font-medium transition cursor-pointer disabled:cursor-not-allowed"
            >
              {appToEdit ? "Save Changes" : "Track Application"}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
