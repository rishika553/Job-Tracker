import React, { useState } from "react";
import { 
  UploadCloud, 
  Download, 
  Sparkles, 
  Trash2, 
  CheckCircle2, 
  FileText, 
  History, 
  Layout, 
  Eye, 
  AlertCircle,
  ChevronRight
} from "lucide-react";

// Mock templates available for download
const RESUME_TEMPLATES = [
  { id: "t1", name: "Modern Tech Lead", layout: "Single-column minimalist layout tailored for engineers.", color: "border-amber-400 bg-amber-50/20" },
  { id: "t2", name: "Executive Suite", layout: "Two-column design focusing on leadership metrics and OKRs.", color: "border-brand-200 hover:border-brand-300" },
  { id: "t3", name: "Creative Minimal", layout: "Sleek serif-based typography with left-border dividers.", color: "border-brand-200 hover:border-brand-300" }
];

export default function Resume() {
  // Start with empty resume arrays to remove pre-seeded dummy data
  const [resumes, setResumes] = useState([]);
  const [activeResumeId, setActiveResumeId] = useState(null);
  const [historyLogs, setHistoryLogs] = useState([]);

  // Upload simulation state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState("");

  const activeResume = resumes.find(r => r.id === activeResumeId);

  // Dynamic Suggestion generation dependent on selected version's score
  const getAISuggestions = (score) => {
    if (!score) return [];
    if (score >= 90) {
      return [
        { title: "Formatting Clean", desc: "No WAI-ARIA conflicts found. Perfect baseline grids.", resolved: true },
        { title: "High Impact Verbs", desc: "Using descriptive words like 'boosted', 'led', and 'refactored'.", resolved: true },
        { title: "Keywords Match", desc: "ATS parsed code frameworks, lazy-loads, and developer terms correctly.", resolved: true }
      ];
    }
    if (score >= 70 && score < 90) {
      return [
        { title: "Keyword Density", desc: "Incorporate more developer terms (e.g. REST APIs, TypeScript, Webpack) to improve match rates.", resolved: false },
        { title: "Quantify Accomplishments", desc: "Include specific numbers (e.g. +24% performance boost) instead of qualitative terms.", resolved: false },
        { title: "Clean Layout", desc: "No formatting bugs found. Font sizing hierarchy is correct.", resolved: true }
      ];
    }
    return [
      { title: "Missing Metrics", desc: "Zero quantitative metrics found. Add numbers demonstrating actual business impact.", resolved: false },
      { title: "Structure Overhaul", desc: "Slight column overlap detected. Rework spacing templates to avoid parser collisions.", resolved: false },
      { title: "Action Verbs Required", desc: "Replace generic verbs like 'helped', 'assisted' with strong terms like 'engineered', 'spearheaded'.", resolved: false }
    ];
  };

  const suggestions = activeResume ? getAISuggestions(activeResume.score) : [];

  // Simulated File Upload handler
  const handleUploadSimulation = (e) => {
    e.preventDefault();
    if (!uploadedFileName.trim()) return;

    setIsUploading(true);
    setTimeout(() => {
      const generatedScore = Math.floor(Math.random() * (98 - 65 + 1)) + 65; // Generate 65 - 98
      const newVerNum = resumes.length + 1;
      const fileId = `v${newVerNum}`;

      const newFile = {
        id: fileId,
        name: uploadedFileName.endsWith(".pdf") ? uploadedFileName.trim() : `${uploadedFileName.trim()}.pdf`,
        version: `V${newVerNum} Custom`,
        score: generatedScore,
        date: new Date().toISOString().split("T")[0],
        size: "128 KB",
        tagline: "Custom Tailored Upload",
        summary: "Ambitious Frontend Developer with expertise in scalable client components, user experiences, and automated test libraries.",
        experience: [
          { role: "Developer", company: "Sandbox Lab", period: "2026", points: ["Successfully uploaded document, checking system parameters.", "Implemented local state components with automated re-renders."] }
        ]
      };

      setResumes([newFile, ...resumes]);
      setActiveResumeId(fileId);

      // Add to logs
      setHistoryLogs([
        { 
          id: `h${Date.now()}`, 
          date: newFile.date, 
          action: `${newFile.name} uploaded manually`, 
          size: newFile.size, 
          score: newFile.score 
        },
        ...historyLogs
      ]);

      setIsUploading(false);
      setUploadedFileName("");
    }, 800);
  };

  const handleDelete = (id, e) => {
    e.stopPropagation();
    const remaining = resumes.filter(r => r.id !== id);
    setResumes(remaining);
    if (activeResumeId === id) {
      setActiveResumeId(remaining.length > 0 ? remaining[0].id : null);
    }
  };

  // Get color for ATS radial circle dials
  const getScoreColor = (score) => {
    if (!score) return "text-stone-300 stroke-stone-300";
    if (score >= 90) return "text-emerald-500 stroke-emerald-500";
    if (score >= 70) return "text-amber-500 stroke-amber-500";
    return "text-rose-500 stroke-rose-500";
  };

  return (
    <div className="space-y-6 pb-16 animate-fade-in select-none">
      
      {/* CRM Heading Block */}
      <div className="bg-white border border-brand-200/60 rounded-2xl p-6 shadow-premium">
        <h1 className="text-xl md:text-2xl font-black text-brand-950 tracking-tight flex items-center gap-2">
          <span>Resume Management</span>
          <span className="text-xs font-extrabold text-brand-500 bg-brand-100 px-2 py-0.5 rounded-full">
            {resumes.length} versions
          </span>
        </h1>
        <p className="text-xs text-brand-500 mt-1 max-w-2xl">
          Upload tailored PDF files, inspect ATS parsing scores, review feedback suggestions, and manage document versions.
        </p>
      </div>

      {/* Grid Workspace Layout */}
      <div className="grid grid-cols-1 xl:grid-cols-4 gap-6 items-start">
        
        {/* Left Column: Versions list & ATS dials */}
        <div className="space-y-6 xl:col-span-1">
          
          {/* ATS Dial Scorecard */}
          <div className="bg-white border border-brand-200/60 rounded-2xl p-5 shadow-premium text-center space-y-4">
            <h3 className="text-xs font-bold text-brand-850 uppercase tracking-wider pl-1">ATS Scanner Score</h3>
            
            {/* Radial dial block */}
            <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
              <svg className="w-full h-full transform -rotate-90">
                <circle
                  cx="64"
                  cy="64"
                  r="52"
                  className="stroke-stone-100 fill-none"
                  strokeWidth="8"
                />
                <circle
                  cx="64"
                  cy="64"
                  r="52"
                  className={`fill-none transition-all duration-500 ${getScoreColor(activeResume?.score)}`}
                  strokeWidth="8"
                  strokeDasharray="326.7"
                  strokeDashoffset={activeResume ? 326.7 - (326.7 * activeResume.score) / 100 : 326.7}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute flex flex-col items-center">
                <span className="text-3xl font-black text-brand-950 font-mono tracking-tight">
                  {activeResume ? activeResume.score : "—"}
                </span>
                <span className="text-[9px] font-extrabold text-brand-400 uppercase tracking-widest mt-0.5">Match %</span>
              </div>
            </div>

            <div className="text-xs text-brand-655 leading-normal">
              {activeResume ? (
                <>
                  Rating: <span className="font-bold text-brand-950">{activeResume.score >= 90 ? "Excellent Match" : activeResume.score >= 70 ? "Good Match" : "Weak Match"}</span>
                  <p className="text-[10px] text-brand-400 mt-1">Stripe ATS Parser (v1.2) matches</p>
                </>
              ) : (
                <span className="text-brand-450">No document selected. Upload a file below to run scan.</span>
              )}
            </div>
          </div>

          {/* Uploaded Resumes Versions */}
          <div className="bg-white border border-brand-200/60 rounded-2xl p-5 shadow-premium">
            <h3 className="text-xs font-bold text-brand-850 uppercase tracking-wider mb-4">Resume Versions</h3>
            
            {resumes.length > 0 ? (
              <div className="space-y-3">
                {resumes.map((res) => {
                  const isActive = res.id === activeResumeId;
                  return (
                    <div
                      key={res.id}
                      onClick={() => setActiveResumeId(res.id)}
                      className={`p-3 border rounded-xl transition cursor-pointer relative group flex justify-between items-start ${
                        isActive 
                          ? "border-amber-400 bg-amber-50/5 ring-1 ring-amber-400/10 shadow-3xs" 
                          : "border-brand-100 hover:border-brand-200 bg-white"
                      }`}
                    >
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[10px] font-extrabold text-brand-500 uppercase">{res.version}</span>
                          {res.score >= 90 && (
                            <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                          )}
                        </div>
                        <h4 className="text-xs font-bold text-brand-900 truncate mt-1">{res.name}</h4>
                        <p className="text-[9px] text-brand-400 font-bold font-mono mt-0.5">{res.date} • {res.size}</p>
                      </div>

                      <button
                        onClick={(e) => handleDelete(res.id, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-brand-50 rounded text-brand-400 hover:text-rose-600 transition"
                        title="Delete version"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="text-center py-6 text-xs text-brand-450 border border-dashed border-brand-150 rounded-xl bg-brand-50/10">
                No versions uploaded
              </div>
            )}
          </div>

          {/* Upload Resumes Simulation form */}
          <div className="bg-white border border-brand-200/60 rounded-2xl p-5 shadow-premium">
            <h3 className="text-xs font-bold text-brand-850 uppercase tracking-wider mb-3">Upload Resume</h3>
            
            <form onSubmit={handleUploadSimulation} className="space-y-3 text-xs">
              <div className="border border-dashed border-brand-200 rounded-xl p-4 text-center bg-brand-50/10 hover:bg-brand-50/20 transition cursor-pointer relative">
                <UploadCloud className="w-6 h-6 text-brand-400 mx-auto mb-2" />
                <span className="font-bold text-brand-700 block">Drag & drop PDF files</span>
                <span className="text-[10px] text-brand-400">or click to browse local files</span>
              </div>

              <div className="flex flex-col gap-1">
                <input
                  type="text"
                  required
                  placeholder="Rename file (e.g. Resume_Stripe)"
                  value={uploadedFileName}
                  onChange={(e) => setUploadedFileName(e.target.value)}
                  className="border border-brand-200 rounded-xl px-3 py-1.5 text-xs text-brand-800 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={isUploading}
                className="w-full py-2 bg-brand-950 hover:bg-brand-900 disabled:bg-brand-800 text-white rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center gap-1.5"
              >
                <span>{isUploading ? "Uploading file..." : "Simulate PDF Upload"}</span>
              </button>
            </form>
          </div>

        </div>

        {/* Middle Column: Document Letterhead PDF Mock Preview */}
        <div className="xl:col-span-2 space-y-4">
          
          {/* Preview controls */}
          <div className="flex items-center justify-between bg-white border border-brand-200/60 rounded-2xl p-4 shadow-premium">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-brand-50 border border-brand-200/50 flex items-center justify-center text-brand-850">
                <Eye size={16} />
              </div>
              <h2 className="text-sm font-black text-brand-950 tracking-tight uppercase">Document Preview</h2>
            </div>

            <div className="flex items-center gap-2">
              <a 
                href="file:///C:/Users/Rishika/Desktop/resume.pdf"
                className="flex items-center gap-1 px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-750 rounded-xl text-xs font-bold transition cursor-pointer"
              >
                <Download size={12} />
                <span>Download PDF</span>
              </a>
            </div>
          </div>

          {/* Letterhead Mock Frame Canvas */}
          <div className="bg-brand-105 border border-brand-250 rounded-2xl p-8 flex items-center justify-center min-h-[520px] shadow-premium">
            
            {activeResume ? (
              /* Elegant resume paper mockup */
              <div className="bg-white border border-brand-200/65 shadow-overlay p-8 max-w-md w-full min-h-[480px] text-[9px] font-serif leading-relaxed text-brand-950 space-y-4">
                
                {/* Header Letterhead */}
                <div className="text-center space-y-1 pb-3 border-b border-brand-200">
                  <h2 className="text-base font-extrabold tracking-wide uppercase">Rishika S.</h2>
                  <p className="text-[9px] italic font-sans text-brand-500 font-semibold">{activeResume.tagline}</p>
                  <div className="text-[8px] font-sans text-brand-400 font-bold flex justify-center gap-3">
                    <span>San Francisco, CA</span>
                    <span>•</span>
                    <span>rishika@example.com</span>
                    <span>•</span>
                    <span>github.com/rishika553</span>
                  </div>
                </div>

                {/* Summary */}
                <div className="space-y-1">
                  <h4 className="text-[10px] font-bold tracking-wider uppercase font-sans text-brand-800">Professional Summary</h4>
                  <p className="italic text-brand-655 font-semibold text-justify">
                    {activeResume.summary}
                  </p>
                </div>

                {/* Experience */}
                <div className="space-y-2">
                  <h4 className="text-[10px] font-bold tracking-wider uppercase font-sans text-brand-800">Professional Experience</h4>
                  {activeResume.experience.map((exp, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between font-sans text-[8.5px] font-bold text-brand-900">
                        <span>{exp.role} — {exp.company}</span>
                        <span className="font-mono text-[8px] font-normal text-brand-500">{exp.period}</span>
                      </div>
                      <ul className="list-disc pl-3.5 space-y-0.5 text-brand-600">
                        {exp.points.map((pt, pIdx) => (
                          <li key={pIdx} className="text-justify">{pt}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>

                {/* Skills */}
                <div className="space-y-1">
                  <h4 className="text-[10px] font-bold tracking-wider uppercase font-sans text-brand-800">Technical Skills</h4>
                  <p className="font-sans text-[8px] text-brand-600 font-semibold">
                    <span className="font-bold text-brand-800">Developer Ecosystem:</span> React.js, TypeScript, Tailwind CSS, lazy-loads, accessibility compliance, RESTful Web APIs, Web Performance audits, and unit testing scripts.
                  </p>
                </div>

              </div>
            ) : (
              <div className="text-center text-xs text-brand-450 max-w-xs space-y-2">
                <FileText className="w-8 h-8 text-brand-350 mx-auto" />
                <h4 className="font-bold">No Resume Selected</h4>
                <p className="leading-relaxed">Please upload or select an active document version on the sidebar to preview the letterhead grids.</p>
              </div>
            )}

          </div>

        </div>

        {/* Right Column: AI tips, upload changelogs, templates */}
        <div className="space-y-6 xl:col-span-1">
          
          {/* AI Suggestions Panel */}
          <div className="bg-white border border-brand-200/60 rounded-2xl p-5 shadow-premium space-y-4">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-500" />
              <h3 className="text-xs font-bold text-brand-850 uppercase tracking-wider">AI suggestions</h3>
            </div>
            
            {activeResume ? (
              <div className="space-y-3.5">
                {suggestions.map((sug, idx) => (
                  <div key={idx} className="flex gap-2.5 items-start p-1">
                    <div className="mt-0.5 shrink-0">
                      {sug.resolved ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <AlertCircle className="w-4 h-4 text-amber-500" />
                      )}
                    </div>
                    <div>
                      <h4 className={`text-xs font-bold leading-normal ${sug.resolved ? "text-brand-850" : "text-brand-900"}`}>{sug.title}</h4>
                      <p className="text-[10px] text-brand-450 leading-relaxed mt-0.5">{sug.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-brand-450 leading-relaxed py-2">Select a version to analyze keywords.</p>
            )}
          </div>

          {/* Resume templates */}
          <div className="bg-white border border-brand-200/60 rounded-2xl p-5 shadow-premium space-y-4">
            <div className="flex items-center gap-1.5">
              <Layout className="w-4 h-4 text-brand-400" />
              <h3 className="text-xs font-bold text-brand-850 uppercase tracking-wider">Templates library</h3>
            </div>

            <div className="space-y-3 text-xs">
              {RESUME_TEMPLATES.map(temp => (
                <div key={temp.id} className={`p-3 border rounded-xl transition cursor-pointer border-brand-100 hover:border-brand-200 bg-white`}>
                  <h4 className="font-bold text-brand-900">{temp.name}</h4>
                  <p className="text-[10px] text-brand-450 mt-1 leading-normal">{temp.layout}</p>
                  <div className="flex justify-end mt-2 pt-2 border-t border-brand-50">
                    <button className="flex items-center gap-1 text-[10px] font-bold text-amber-600 hover:text-amber-700 transition">
                      <Download size={10} />
                      <span>Download docx</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Resume upload logs history */}
          <div className="bg-white border border-brand-200/60 rounded-2xl p-5 shadow-premium space-y-4">
            <div className="flex items-center gap-1.5">
              <History className="w-4 h-4 text-brand-400" />
              <h3 className="text-xs font-bold text-brand-850 uppercase tracking-wider">Version History</h3>
            </div>

            {historyLogs.length > 0 ? (
              <div className="space-y-3.5 text-xs max-h-[160px] overflow-y-auto pr-0.5">
                {historyLogs.map(log => (
                  <div key={log.id} className="flex gap-2.5 items-start">
                    <ChevronRight size={12} className="text-brand-350 mt-0.5 shrink-0" />
                    <div>
                      <h4 className="font-bold text-brand-900 leading-snug">{log.action}</h4>
                      <div className="flex items-center gap-2 mt-1 text-[9px] text-brand-400 font-bold font-mono">
                        <span>{log.date}</span>
                        <span>•</span>
                        <span>{log.size}</span>
                        <span>•</span>
                        <span className="text-amber-600">Match {log.score}%</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-brand-450 leading-relaxed py-2">No history logged yet.</p>
            )}
          </div>

        </div>

      </div>

    </div>
  );
}
