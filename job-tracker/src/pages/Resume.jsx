import React, { useState, useRef } from "react";
import { motion } from "framer-motion";
import { 
  UploadCloud, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  Download, 
  Layers, 
  Zap, 
  ShieldCheck, 
  TrendingUp, 
  Check, 
  X, 
  ChevronRight, 
  Code2, 
  Loader2,
  FileCode,
  Briefcase,
  Target
} from "lucide-react";
import { resumeApi } from "../services/resumeApi";

// Pre-defined Target Role Options
const TARGET_ROLES = [
  "Full Stack Developer",
  "Software Engineer",
  "Frontend Developer",
  "Backend Developer",
  "AI Engineer",
  "Machine Learning Engineer",
  "Data Analyst",
  "Cloud Engineer",
  "DevOps Engineer"
];

// Pre-defined Loading Stages
const LOADING_STAGES = [
  "Uploading Resume...",
  "Extracting Text via PyMuPDF / python-docx...",
  "Normalizing Resume Content...",
  "Invoking AI ATS Analysis...",
  "Evaluating Target Role Keywords...",
  "Generating Section Suggestions...",
  "Finalizing Dynamic ATS Score..."
];

export default function Resume() {
  // File & Upload state
  const [selectedFile, setSelectedFile] = useState(null);
  const [targetRole, setTargetRole] = useState("Full Stack Developer");
  const [isDragOver, setIsDragOver] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [loadingStageIdx, setLoadingStageIdx] = useState(0);
  const [errorMsg, setErrorMsg] = useState(null);

  // Analysis result state
  const [analysisResult, setAnalysisResult] = useState(null);

  const fileInputRef = useRef(null);

  // Handle Drag & Drop
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      validateAndSetFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files[0]) {
      validateAndSetFile(e.target.files[0]);
    }
  };

  const validateAndSetFile = (file) => {
    setErrorMsg(null);
    const validTypes = [
      "application/pdf", 
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain"
    ];
    const extension = file.name.split(".").pop().toLowerCase();
    
    if (validTypes.includes(file.type) || ["pdf", "docx", "txt"].includes(extension)) {
      setSelectedFile(file);
    } else {
      setErrorMsg("Please upload a valid PDF, DOCX, or TXT document.");
    }
  };

  // Submit Analysis
  const handleAnalyzeResume = async () => {
    if (!selectedFile) {
      setErrorMsg("Please select or drop a resume file first.");
      return;
    }

    setIsAnalyzing(true);
    setErrorMsg(null);
    setLoadingStageIdx(0);

    const stageInterval = setInterval(() => {
      setLoadingStageIdx((prev) => {
        if (prev < LOADING_STAGES.length - 1) return prev + 1;
        return prev;
      });
    }, 600);

    try {
      const res = await resumeApi.analyzeAts(selectedFile, targetRole);
      clearInterval(stageInterval);

      if (res && res.success && res.analysis) {
        setAnalysisResult(res.analysis);
      } else {
        throw new Error("Failed to receive structured analysis from backend.");
      }
    } catch (err) {
      clearInterval(stageInterval);
      console.error("ATS Analysis Error:", err);
      setErrorMsg("Failed to analyze resume. Please ensure the backend server is running.");
      setAnalysisResult(null);
    } finally {
      setIsAnalyzing(false);
    }
  };

  // PDF Report Print
  const handleDownloadReport = () => {
    window.print();
  };

  // Score color helper
  const getScoreColor = (score) => {
    if (score >= 80) return { text: "text-emerald-600", bg: "bg-emerald-500", ring: "stroke-emerald-500", border: "border-emerald-200 bg-emerald-50/30" };
    if (score >= 60) return { text: "text-amber-500", bg: "bg-amber-400", ring: "stroke-amber-400", border: "border-amber-200 bg-amber-50/30" };
    return { text: "text-rose-600", bg: "bg-rose-500", ring: "stroke-rose-500", border: "border-rose-200 bg-rose-50/30" };
  };

  return (
    <div className="min-h-screen bg-slate-50/50 pb-24 text-slate-900 font-sans print:bg-white print:p-0">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-8 space-y-8">

        {/* 1. Hero Section */}
        <div className="text-center space-y-3 print:hidden">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-brand-950 text-amber-400 text-xs font-black tracking-wider uppercase shadow-xs">
            <Sparkles size={13} className="text-amber-400 animate-pulse" />
            <span>AI RESUME ATS ANALYZER</span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-black tracking-tight text-brand-950">
            AI Resume ATS Analyzer
          </h1>
          
          <p className="text-sm md:text-base text-brand-500 max-w-2xl mx-auto leading-relaxed font-medium">
            Upload your resume to extract text dynamically and calculate your individual ATS score, keyword relevance, and section recommendations.
          </p>
        </div>

        {/* 2. Resume Upload Section */}
        <div className="bg-white border border-brand-200/70 rounded-3xl p-6 sm:p-8 shadow-premium space-y-6 print:hidden">
          
          {/* Target Role Selector */}
          <div className="space-y-2">
            <label className="text-xs font-extrabold text-brand-800 uppercase tracking-wider flex items-center gap-2">
              <Target size={14} className="text-amber-500" />
              <span>Target Role for ATS Optimization</span>
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {TARGET_ROLES.map((role) => (
                <button
                  key={role}
                  type="button"
                  onClick={() => setTargetRole(role)}
                  className={`px-3 py-2 rounded-xl text-xs font-bold transition border text-center truncate ${
                    targetRole === role 
                      ? "bg-brand-950 text-amber-400 border-brand-950 shadow-xs" 
                      : "bg-brand-50/50 text-brand-700 border-brand-200 hover:border-brand-350"
                  }`}
                >
                  {role}
                </button>
              ))}
            </div>
          </div>

          {/* Drag & Drop Upload Zone */}
          <div 
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center transition-all cursor-pointer flex flex-col items-center justify-center space-y-4 ${
              isDragOver 
                ? "border-amber-400 bg-amber-50/30 scale-[1.01]" 
                : selectedFile 
                ? "border-emerald-300 bg-emerald-50/10" 
                : "border-brand-200 hover:border-brand-400 hover:bg-brand-50/30"
            }`}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileSelect} 
              accept=".pdf,.docx,.txt" 
              className="hidden" 
            />

            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition ${
              selectedFile ? "bg-emerald-100 text-emerald-600" : "bg-amber-50 text-amber-500 border border-amber-200/80"
            }`}>
              {selectedFile ? <FileText size={28} /> : <UploadCloud size={28} />}
            </div>

            {selectedFile ? (
              <div className="space-y-1">
                <p className="text-sm font-black text-brand-950 flex items-center gap-2 justify-center">
                  <span>{selectedFile.name}</span>
                  <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded bg-brand-100 text-brand-700">
                    {(selectedFile.size / 1024).toFixed(1)} KB
                  </span>
                </p>
                <p className="text-xs text-emerald-600 font-bold flex items-center justify-center gap-1">
                  <CheckCircle2 size={13} />
                  <span>Ready to analyze text against target role: {targetRole}</span>
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                <p className="text-sm font-bold text-brand-900">
                  <span className="text-amber-600 underline underline-offset-2">Click to upload</span> or drag and drop your resume
                </p>
                <p className="text-xs text-brand-400 font-medium">
                  Supports PDF (PyMuPDF / pdfplumber), DOCX (python-docx), or TXT formats
                </p>
              </div>
            )}
          </div>

          {/* Error Banner */}
          {errorMsg && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-bold flex items-center gap-2">
              <AlertTriangle size={15} className="shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Analyze Button */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2 border-t border-brand-100">
            {selectedFile && (
              <button
                type="button"
                onClick={() => { setSelectedFile(null); setAnalysisResult(null); }}
                className="text-xs text-brand-450 hover:text-rose-600 font-bold transition flex items-center gap-1 cursor-pointer"
              >
                <X size={14} />
                <span>Remove file</span>
              </button>
            )}

            <button
              type="button"
              disabled={!selectedFile || isAnalyzing}
              onClick={handleAnalyzeResume}
              className={`w-full sm:w-auto ml-auto px-8 py-3.5 rounded-xl font-black text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition shadow-md ${
                !selectedFile || isAnalyzing
                  ? "bg-brand-200 text-brand-400 cursor-not-allowed"
                  : "bg-brand-950 hover:bg-brand-900 text-amber-400 cursor-pointer hover:shadow-lg"
              }`}
            >
              {isAnalyzing ? (
                <>
                  <Loader2 size={16} className="animate-spin text-amber-400" />
                  <span>Analyzing Resume Text...</span>
                </>
              ) : (
                <>
                  <Sparkles size={16} className="text-amber-400" />
                  <span>Analyze Resume</span>
                </>
              )}
            </button>
          </div>

          {/* Loading Experience Overlay */}
          {isAnalyzing && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-6 bg-brand-950 text-white rounded-2xl space-y-4 shadow-xl"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-amber-400/20 text-amber-400 flex items-center justify-center font-bold text-xs">
                    <Loader2 size={16} className="animate-spin" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black text-amber-400 uppercase tracking-wider">
                      {LOADING_STAGES[loadingStageIdx]}
                    </h4>
                    <p className="text-[10px] text-brand-300 font-mono">Evaluating {selectedFile?.name} against {targetRole}</p>
                  </div>
                </div>
                <span className="text-xs font-mono font-bold text-brand-300">
                  {Math.round(((loadingStageIdx + 1) / LOADING_STAGES.length) * 100)}%
                </span>
              </div>

              <div className="w-full h-2 bg-brand-850 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: `${((loadingStageIdx + 1) / LOADING_STAGES.length) * 100}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            </motion.div>
          )}
        </div>

        {/* Results Render Area */}
        {analysisResult && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8 print:space-y-6"
          >
            {/* Top Bar for Report Download */}
            <div className="flex justify-between items-center bg-white border border-brand-200/70 rounded-2xl p-4 shadow-sm print:hidden">
              <div className="flex items-center gap-2">
                <ShieldCheck className="text-emerald-500" size={18} />
                <span className="text-xs font-black text-brand-950 uppercase tracking-wider">
                  Analysis Complete: {selectedFile?.name || "Resume"} ({analysisResult.role_match || targetRole})
                </span>
              </div>

              <button
                onClick={handleDownloadReport}
                className="flex items-center gap-1.5 px-4 py-2 bg-brand-950 hover:bg-brand-900 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
              >
                <Download size={14} className="text-amber-400" />
                <span>Download Analysis Report</span>
              </button>
            </div>

            {/* Overall Summary Banner */}
            {analysisResult.overall_summary && (
              <div className="bg-amber-50/50 border border-amber-200/80 rounded-2xl p-4 text-xs text-amber-900 font-semibold leading-relaxed">
                <span className="font-black text-amber-950 block mb-1 uppercase tracking-wider">Analysis Summary</span>
                {analysisResult.overall_summary}
              </div>
            )}

            {/* ATS Score Card & Improvement Potential */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* Animated ATS Score Card */}
              <div className="md:col-span-2 bg-white border border-brand-200/70 rounded-3xl p-6 sm:p-8 shadow-premium flex flex-col sm:flex-row items-center gap-6 sm:gap-8 relative overflow-hidden">
                <div className="relative w-40 h-40 shrink-0 flex items-center justify-center">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle 
                      cx="50" cy="50" r="42" 
                      stroke="#f1f5f9" strokeWidth="8" fill="transparent" 
                    />
                    <motion.circle 
                      cx="50" cy="50" r="42" 
                      strokeWidth="8" 
                      strokeDasharray="264"
                      initial={{ strokeDashoffset: 264 }}
                      animate={{ strokeDashoffset: 264 - (264 * (analysisResult.ats_score || analysisResult.current_score || 0)) / 100 }}
                      transition={{ duration: 1.2, ease: "easeOut" }}
                      strokeLinecap="round"
                      fill="transparent" 
                      className={getScoreColor(analysisResult.ats_score || analysisResult.current_score || 0).ring}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className={`text-4xl font-black font-mono tracking-tight ${getScoreColor(analysisResult.ats_score || analysisResult.current_score || 0).text}`}>
                      {analysisResult.ats_score || analysisResult.current_score || 0}
                    </span>
                    <span className="text-[10px] font-extrabold text-brand-400 uppercase tracking-widest">OUT OF 100</span>
                  </div>
                </div>

                <div className="space-y-3 text-center sm:text-left flex-1">
                  <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black uppercase tracking-wider border border-brand-200/80 bg-brand-50 text-brand-800">
                    <Briefcase size={13} className="text-amber-500" />
                    <span>Role Match: {analysisResult.role_match || targetRole}</span>
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black text-brand-950">
                    ATS Compatibility Score
                  </h2>
                  <p className="text-xs text-brand-500 leading-relaxed font-medium">
                    Evaluated from extracted document text against target requirements, keyword density, section quality, and formatting rules.
                  </p>
                </div>
              </div>

              {/* Improvement Potential Card */}
              <div className="bg-brand-950 text-white rounded-3xl p-6 sm:p-8 shadow-premium flex flex-col justify-between space-y-4">
                <div>
                  <span className="text-[10px] font-extrabold text-amber-400 uppercase tracking-widest block">
                    IMPROVEMENT POTENTIAL
                  </span>
                  <h3 className="text-lg font-black text-white mt-1">Score Optimization</h3>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between items-center border-b border-brand-800 pb-2">
                    <span className="text-xs text-brand-300 font-bold">Current ATS Score</span>
                    <span className="text-sm font-black font-mono text-white">
                      {analysisResult.current_score || analysisResult.ats_score || 0}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center border-b border-brand-800 pb-2">
                    <span className="text-xs text-brand-300 font-bold">Potential ATS Score</span>
                    <span className="text-sm font-black font-mono text-emerald-400">
                      {analysisResult.potential_score || 94}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                    <span className="text-xs text-amber-400 font-black">Estimated Boost</span>
                    <span className="text-base font-black font-mono text-amber-400 flex items-center gap-0.5">
                      <TrendingUp size={16} />
                      +{analysisResult.estimated_improvement || 12}%
                    </span>
                  </div>
                </div>
              </div>

            </div>

            {/* ATS Breakdown Cards Grid */}
            {analysisResult.ats_breakdown && (
              <div className="bg-white border border-brand-200/70 rounded-3xl p-6 sm:p-8 shadow-premium space-y-6">
                <div>
                  <h3 className="text-base font-black text-brand-950 uppercase tracking-wider flex items-center gap-2">
                    <Layers size={18} className="text-amber-500" />
                    <span>ATS Breakdown</span>
                  </h3>
                  <p className="text-xs text-brand-500 font-medium mt-1">
                    Sub-scores calculated directly from your extracted resume text.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {Object.entries(analysisResult.ats_breakdown).map(([key, val]) => (
                    <div key={key} className="p-4 bg-brand-50/30 border border-brand-150 rounded-2xl space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-brand-800 uppercase tracking-wider capitalize">
                          {key.replace("_", " ")}
                        </span>
                        <span className={`text-xs font-black font-mono ${getScoreColor(val).text}`}>
                          {val}%
                        </span>
                      </div>
                      <div className="w-full h-2 bg-brand-150 rounded-full overflow-hidden">
                        <motion.div 
                          className={`h-full rounded-full ${getScoreColor(val).bg}`}
                          initial={{ width: "0%" }}
                          animate={{ width: `${val}%` }}
                          transition={{ duration: 0.8 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Missing & Recommended Keywords */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Missing ATS Keywords */}
              <div className="bg-white border border-brand-200/70 rounded-3xl p-6 sm:p-8 shadow-premium space-y-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="text-rose-500" size={18} />
                  <h3 className="text-base font-black text-brand-950 uppercase tracking-wider">
                    Missing Keywords
                  </h3>
                </div>
                <p className="text-xs text-brand-500 font-medium">
                  Keywords absent in your uploaded resume for the <strong>{targetRole}</strong> role profile.
                </p>

                <div className="flex flex-wrap gap-2 pt-2">
                  {(analysisResult.missing_keywords || []).length > 0 ? (
                    analysisResult.missing_keywords.map((kw, idx) => (
                      <span 
                        key={idx}
                        className="px-3 py-1.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-bold flex items-center gap-1.5"
                      >
                        <X size={12} className="text-rose-500" />
                        <span>{kw}</span>
                      </span>
                    ))
                  ) : (
                    <span className="text-xs text-emerald-600 font-bold">No major role keywords missing!</span>
                  )}
                </div>
              </div>

              {/* Recommended Keywords */}
              <div className="bg-white border border-brand-200/70 rounded-3xl p-6 sm:p-8 shadow-premium space-y-4">
                <div className="flex items-center gap-2">
                  <Code2 className="text-amber-500" size={18} />
                  <h3 className="text-base font-black text-brand-950 uppercase tracking-wider">
                    Recommended Keywords
                  </h3>
                </div>

                <p className="text-xs text-brand-500 font-medium">
                  Keywords found or suggested grouped by technical domain:
                </p>

                <div className="space-y-3 pt-1">
                  {Object.entries(analysisResult.recommended_keywords || {}).map(([cat, items]) => (
                    <div key={cat} className="space-y-1.5">
                      <span className="text-[10px] font-black text-brand-450 uppercase tracking-wider font-mono">
                        {cat.replace("_", " ")}
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {Array.isArray(items) && items.length > 0 ? (
                          items.map((item, i) => (
                            <span 
                              key={i} 
                              className="px-2.5 py-1 bg-amber-50 border border-amber-200/80 text-amber-900 text-[11px] font-bold rounded-lg"
                            >
                              + {item}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-brand-400 font-mono">—</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Strengths & Weaknesses */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

              {/* Strengths */}
              <div className="bg-white border border-brand-200/70 rounded-3xl p-6 sm:p-8 shadow-premium space-y-4">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="text-emerald-500" size={18} />
                  <h3 className="text-base font-black text-brand-950 uppercase tracking-wider">
                    Strengths Detected
                  </h3>
                </div>

                <div className="space-y-3">
                  {(analysisResult.strengths || []).map((str, idx) => (
                    <div key={idx} className="p-3.5 bg-emerald-50/40 border border-emerald-200/70 rounded-2xl flex items-start gap-3 text-xs text-brand-850 font-semibold">
                      <div className="p-1 bg-emerald-500 text-white rounded-lg shrink-0 mt-0.5">
                        <Check size={11} />
                      </div>
                      <span>{str}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Weaknesses */}
              <div className="bg-white border border-brand-200/70 rounded-3xl p-6 sm:p-8 shadow-premium space-y-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="text-amber-500" size={18} />
                  <h3 className="text-base font-black text-brand-950 uppercase tracking-wider">
                    Areas for Improvement
                  </h3>
                </div>

                <div className="space-y-3">
                  {(analysisResult.weaknesses || []).map((wk, idx) => (
                    <div key={idx} className="p-3.5 bg-amber-50/40 border border-amber-200/70 rounded-2xl flex items-start gap-3 text-xs text-brand-850 font-semibold">
                      <span className="w-5 h-5 rounded-full bg-amber-500 text-white font-mono font-black text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                        !
                      </span>
                      <span>{wk}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Section Analysis */}
            {analysisResult.sections && (
              <div className="bg-white border border-brand-200/70 rounded-3xl p-6 sm:p-8 shadow-premium space-y-6">
                <div>
                  <h3 className="text-base font-black text-brand-950 uppercase tracking-wider flex items-center gap-2">
                    <FileCode size={18} className="text-amber-500" />
                    <span>Section Evaluations</span>
                  </h3>
                  <p className="text-xs text-brand-500 font-medium mt-1">
                    Quality scores and personalized recommendations per document section.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {Object.entries(analysisResult.sections).map(([secKey, secVal]) => (
                    <div key={secKey} className="p-5 border border-brand-200/80 rounded-2xl bg-white space-y-3 shadow-2xs">
                      <div className="flex justify-between items-center border-b border-brand-100 pb-2">
                        <h4 className="text-xs font-black text-brand-950 uppercase tracking-wider capitalize">{secKey}</h4>
                        <span className={`text-xs font-black font-mono px-2 py-0.5 rounded border ${getScoreColor(secVal.score || 0).border} ${getScoreColor(secVal.score || 0).text}`}>
                          {secVal.score || 0}%
                        </span>
                      </div>

                      <p className="text-xs text-brand-600 font-medium leading-relaxed">
                        {secVal.suggestion || "Section structured properly."}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ATS Compatibility Checklist */}
            {analysisResult.ats_compatibility && (
              <div className="bg-white border border-brand-200/70 rounded-3xl p-6 sm:p-8 shadow-premium space-y-6">
                <div>
                  <h3 className="text-base font-black text-brand-950 uppercase tracking-wider flex items-center gap-2">
                    <ShieldCheck size={18} className="text-emerald-500" />
                    <span>ATS Compatibility Checklist</span>
                  </h3>
                  <p className="text-xs text-brand-500 font-medium mt-1">
                    Parsing compatibility verification results.
                  </p>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {Object.entries(analysisResult.ats_compatibility).map(([itemKey, passed]) => (
                    <div key={itemKey} className="p-4 bg-brand-50/20 border border-brand-150 rounded-2xl flex items-center gap-3">
                      {passed ? (
                        <CheckCircle2 size={18} className="text-emerald-500 shrink-0" />
                      ) : (
                        <X size={18} className="text-rose-500 shrink-0" />
                      )}
                      <div>
                        <h4 className="text-xs font-black text-brand-900 capitalize">{itemKey.replace("_", " ")}</h4>
                        <p className="text-[10px] text-brand-500 font-mono font-bold">
                          {passed ? "Passed Check" : "Needs Attention"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </motion.div>
        )}

      </div>
    </div>
  );
}
