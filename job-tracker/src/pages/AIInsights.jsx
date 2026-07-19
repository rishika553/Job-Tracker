import React, { useState } from "react";
import { useJobTracker } from "../context/JobTrackerContext";
import { 
  Sparkles, 
  Upload, 
  CheckCircle, 
  AlertCircle, 
  ArrowRight, 
  Compass, 
  Cpu, 
  MessageSquareCode, 
  FileText,
  FileCheck,
  Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function AIInsights() {
  const { applications } = useJobTracker();
  
  // Resume Matcher State
  const [resumeUploaded, setResumeUploaded] = useState(false);
  const [isParsingResume, setIsParsingResume] = useState(false);
  const [parseLogs, setParseLogs] = useState([]);
  
  // Interview Prep State
  const [selectedAppId, setSelectedAppId] = useState("");
  const [userAnswer, setUserAnswer] = useState("");
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationFeedback, setEvaluationFeedback] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);

  // Active application for prep dropdown
  const prepApps = applications.filter(app => app.status === "interview" || app.status === "applied");

  const foundSkills = ["React", "TypeScript", "Tailwind CSS", "JavaScript", "Figma", "UI/UX", "Vite", "Git"];
  
  // Dynamically extract missing skills from applications
  const allApplicationTags = [...new Set(applications.flatMap(app => app.tags || []))];
  const missingSkills = allApplicationTags.filter(tag => !foundSkills.includes(tag));
  if (missingSkills.length === 0) {
    missingSkills.push("Next.js", "System Design", "Docker", "Unit Testing");
  }

  // Dynamically generate suggestions based on active applications
  const suggestions = [];
  applications.slice(0, 3).forEach(app => {
    suggestions.push(
      `${app.company} values keywords like ${app.tags.slice(0, 2).join(" and ")}. Incorporate them in your details to align with the ${app.role} role.`
    );
  });
  if (suggestions.length === 0) {
    suggestions.push(
      "Track target applications to view custom ATS resume roadmaps.",
      "Add skills like System Design and Docker to broaden compatibility."
    );
  }

  const resumeDetails = {
    score: applications.length > 0 ? 82 : 0,
    foundSkills,
    missingSkills,
    suggestions
  };

  // Interview Questions mapping
  const mockQuestions = {
    Stripe: [
      "Stripe values high-performance UIs. How would you optimize a React-based checkout form to ensure instant interactions?",
      "Explain the design pattern you would use to build a reusable, accessible credit card input field.",
      "How do you handle error states and loading feedback gracefully during API failures in a transaction flow?"
    ],
    Vercel: [
      "What are the core benefits of React Server Components (RSC) compared to client components, and how do they impact performance?",
      "How would you explain the differences between Static Site Generation (SSG) and Server-Side Rendering (SSR) to a developer?",
      "Write-up / explain how you would design a Developer Advocacy tutorial explaining Next.js Route Handlers."
    ],
    Linear: [
      "Linear is known for keyboard-first interfaces. How would you implement hotkey listener hooks in React without causing memory leaks?",
      "How would you design a custom, smooth drag-and-drop workflow in React using Framer Motion?",
      "Describe a UI detail in a product you love and explain what makes it feel premium."
    ],
    Microsoft: [
      "Describe the differences between an interface and an abstract class in object-oriented programming.",
      "Explain how you would design a scalable notification service that handles millions of user events daily.",
      "How do you approach debugging a memory leak in a large-scale React application?"
    ]
  };

  const activeQuestions = selectedAppId 
    ? (mockQuestions[applications.find(a => a.id === selectedAppId)?.company] || [
        "What is your approach to structuring reusable components in a React application?",
        "Explain how you handle asynchronous state management in React without a backend.",
        "How do you collaborate with designers to maintain design system consistency?"
      ])
    : [];

  const handleResumeUpload = (e) => {
    e.preventDefault();
    setIsParsingResume(true);
    setParseLogs(["Opening resume file...", "Reading file structure..."]);

    const stages = [
      { delay: 800, log: "Parsing text and layout coordinates..." },
      { delay: 1600, log: "Extracting skills and experience sections..." },
      { delay: 2400, log: "Comparing resume keywords with active job roles..." },
      { delay: 3200, log: "Synthesized ATS match report." }
    ];

    stages.forEach((stage) => {
      setTimeout(() => {
        setParseLogs(prev => [...prev, stage.log]);
      }, stage.delay);
    });

    setTimeout(() => {
      setIsParsingResume(false);
      setResumeUploaded(true);
    }, 3800);
  };

  const handleEvaluateAnswer = (e) => {
    e.preventDefault();
    if (!userAnswer.trim()) return;

    setIsEvaluating(true);
    setEvaluationFeedback(null);

    setTimeout(() => {
      setIsEvaluating(false);
      setEvaluationFeedback({
        score: "8.5 / 10",
        strengths: "Excellent articulation of React hooks and clean cleanup code. Good mention of browser APIs.",
        improvement: "Could strengthen the answer by referencing real-world profiling tools (e.g. Chrome DevTools Performance tab) and code splitting.",
        verdict: "Strong answer. Fits the role requirements."
      });
    }, 2000);
  };

  const resetPrep = (appId) => {
    setSelectedAppId(appId);
    setCurrentQuestionIndex(0);
    setUserAnswer("");
    setEvaluationFeedback(null);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* Left 2 Columns: Resume Scanner & Suggestions */}
      <div className="lg:col-span-2 space-y-6">
        
        {/* Resume Optimizer Card */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-premium">
          <div className="flex items-center gap-2 mb-4">
            <Cpu className="text-primary-500" size={18} />
            <h3 className="text-sm font-bold text-slate-800">
              AI Resume Match Optimizer
            </h3>
          </div>

          {!resumeUploaded && !isParsingResume ? (
            <div 
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleResumeUpload}
              className="border-2 border-dashed border-slate-200 hover:border-primary-400 bg-slate-50/50 rounded-xl p-8 text-center transition cursor-pointer select-none"
            >
              <Upload size={32} className="text-slate-400 mx-auto mb-3" />
              <h4 className="text-xs font-bold text-slate-700">Drag & Drop Resume</h4>
              <p className="text-[10px] text-slate-400 mt-1 max-w-sm mx-auto leading-normal">
                Supported formats: PDF, DOCX (Max 5MB). We'll audit your keywords against the {applications.length} applications in your board.
              </p>
              <button 
                onClick={handleResumeUpload}
                className="mt-4 px-3 py-1.5 bg-white border border-slate-200 hover:border-slate-300 rounded-lg text-[11px] font-semibold text-slate-600 transition cursor-pointer shadow-3xs"
              >
                Choose File
              </button>
            </div>
          ) : isParsingResume ? (
            <div className="space-y-4 py-6 text-center">
              <RefreshCw className="animate-spin text-primary-500 mx-auto" size={24} />
              <div className="text-xs font-bold text-slate-600">Analyzing Resume ATS Metadata...</div>
              
              <div className="bg-slate-900 text-[#00FF66] font-mono text-[10px] p-3 rounded-lg max-w-md mx-auto space-y-1 text-left h-24 overflow-y-auto leading-normal">
                {parseLogs.map((log, idx) => (
                  <div key={idx}>⚡ {log}</div>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-5">
              {/* Top Row: Score & Badge */}
              <div className="flex items-center gap-4 bg-primary-50/50 border border-primary-100 rounded-xl p-4">
                <div className="w-14 h-14 rounded-full border-4 border-primary-500 flex items-center justify-center text-slate-800 font-extrabold text-base bg-white shadow-sm shrink-0">
                  {resumeDetails.score}%
                </div>
                
                <div>
                  <h4 className="text-xs font-bold text-slate-800">Job Hunt Match Score</h4>
                  <p className="text-[10px] text-slate-500 mt-0.5 leading-relaxed">
                    Based on your saved jobs, your resume exhibits high compatibility. Adding the missing skills below will unlock more interview invites.
                  </p>
                </div>

                <button 
                  onClick={() => setResumeUploaded(false)}
                  className="ml-auto text-[10px] font-semibold text-slate-400 hover:text-slate-600 transition underline"
                >
                  Re-upload
                </button>
              </div>

              {/* Skills breakdown */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Found skills */}
                <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/50">
                  <div className="flex items-center gap-1.5 mb-2.5 text-emerald-600">
                    <CheckCircle size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Identified Skills ({resumeDetails.foundSkills.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {resumeDetails.foundSkills.map(skill => (
                      <span key={skill} className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-100 px-2 py-0.5 rounded font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Missing skills */}
                <div className="border border-slate-100 rounded-xl p-3 bg-slate-50/50">
                  <div className="flex items-center gap-1.5 mb-2.5 text-amber-600">
                    <AlertCircle size={14} />
                    <span className="text-[10px] font-bold uppercase tracking-wider">Target Keywords ({resumeDetails.missingSkills.length})</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {resumeDetails.missingSkills.map(skill => (
                      <span key={skill} className="text-[10px] bg-amber-50/50 text-amber-700 border border-amber-100/50 px-2 py-0.5 rounded font-medium">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Suggestions */}
              <div className="space-y-2">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">ATS Optimization Roadmap</h4>
                <div className="space-y-2">
                  {resumeDetails.suggestions.map((sug, idx) => (
                    <div key={idx} className="flex gap-2.5 items-start text-xs text-slate-600 bg-white border border-slate-100 rounded-lg p-2.5 shadow-3xs leading-relaxed">
                      <Zap size={14} className="text-primary-500 shrink-0 mt-0.5" />
                      <span>{sug}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          )}
        </div>

        {/* AI Recommendations Hub */}
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-premium">
          <div className="flex items-center gap-2 mb-4">
            <Compass className="text-primary-500" size={18} />
            <h3 className="text-sm font-bold text-slate-800">
              AI Job Hunt Advice
            </h3>
          </div>

          <div className="space-y-3.5">
            <div className="flex gap-3 items-start border-b border-slate-50 pb-3">
              <span className="w-5 h-5 rounded-full bg-[#0c0a09] border border-slate-800 flex items-center justify-center text-[10px] text-amber-400 font-extrabold shrink-0 mt-0.5 shadow-3xs">1</span>
              <div>
                <h4 className="text-xs font-bold text-slate-800">Follow up on OpenAI</h4>
                <p className="text-[11px] text-slate-500 leading-normal mt-0.5">
                  You added OpenAI to your wishlist 2 days ago. Our data shows applying early increases response rates by 22%. Apply now via Greenhouse template.
                </p>
              </div>
            </div>

            <div className="flex gap-3 items-start border-b border-slate-50 pb-3">
              <span className="w-5 h-5 rounded-full bg-[#0c0a09] border border-slate-800 flex items-center justify-center text-[10px] text-amber-400 font-extrabold shrink-0 mt-0.5 shadow-3xs">2</span>
              <div>
                <h4 className="text-xs font-bold text-slate-800">Prepare for Stripe</h4>
                <p className="text-[11px] text-slate-500 leading-normal mt-0.5">
                  Your interview with Stripe is on Tuesday. Stripe's frontend engineers frequently write vanilla JavaScript component libraries in assessments. Practice API design below.
                </p>
              </div>
            </div>

            <div className="flex gap-3 items-start">
              <span className="w-5 h-5 rounded-full bg-[#0c0a09] border border-slate-800 flex items-center justify-center text-[10px] text-amber-400 font-extrabold shrink-0 mt-0.5 shadow-3xs">3</span>
              <div>
                <h4 className="text-xs font-bold text-slate-800">Optimize Vercel application</h4>
                <p className="text-[11px] text-slate-500 leading-normal mt-0.5">
                  Vercel advocates are expected to write blog entries. Ensure your GitHub projects are cleanly documented with detailed READMEs.
                </p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Right Column: Interactive Interview Prep Simulator */}
      <div className="space-y-6">
        
        <div className="bg-white border border-slate-100 rounded-xl p-5 shadow-premium">
          <div className="flex items-center gap-2 mb-2">
            <MessageSquareCode className="text-primary-500" size={18} />
            <h3 className="text-sm font-bold text-slate-800">
              Interactive Interview Simulator
            </h3>
          </div>
          <p className="text-[10px] text-slate-400 mb-4">
            Practice customized question prompts and get automated evaluations.
          </p>

          {/* Select Application dropdown */}
          <div className="space-y-3.5">
            <div>
              <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Target Application
              </label>
              <select
                value={selectedAppId}
                onChange={(e) => resetPrep(e.target.value)}
                className="w-full border border-slate-200 bg-white rounded-lg px-2.5 py-1.5 text-xs text-slate-700 outline-none cursor-pointer focus:border-primary-500"
              >
                <option value="">Select a job board track...</option>
                {prepApps.map(app => (
                  <option key={app.id} value={app.id}>{app.company} — {app.role}</option>
                ))}
              </select>
            </div>

            {selectedAppId ? (
              <div className="space-y-4 pt-2">
                {/* Question */}
                <div className="bg-slate-50 border border-slate-100 rounded-lg p-3">
                  <div className="flex items-center justify-between mb-1.5 text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                    <span>Question {currentQuestionIndex + 1} of {activeQuestions.length}</span>
                    <span className="text-primary-600 bg-primary-50 px-1 py-0.2 rounded">Customized</span>
                  </div>
                  <p className="text-xs font-bold text-slate-700 leading-relaxed">
                    {activeQuestions[currentQuestionIndex]}
                  </p>
                </div>

                {/* Answer form */}
                <form onSubmit={handleEvaluateAnswer} className="space-y-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
                      Your Response
                    </label>
                    <textarea
                      rows={6}
                      required
                      placeholder="Type your structured answer here (e.g. STAR method)..."
                      value={userAnswer}
                      onChange={(e) => setUserAnswer(e.target.value)}
                      className="w-full border border-slate-200 rounded-lg p-3 text-xs text-slate-700 placeholder-slate-400 focus:outline-none focus:border-primary-500 font-sans resize-none leading-relaxed"
                    />
                  </div>

                  <div className="flex justify-between items-center">
                    <button
                      type="button"
                      disabled={currentQuestionIndex === 0}
                      onClick={() => {
                        setCurrentQuestionIndex(p => p - 1);
                        setEvaluationFeedback(null);
                        setUserAnswer("");
                      }}
                      className="text-[11px] font-semibold text-slate-400 hover:text-slate-600 disabled:text-slate-200 transition cursor-pointer"
                    >
                      ← Back
                    </button>

                    <button
                      type="submit"
                      disabled={isEvaluating || !userAnswer.trim()}
                      className="px-4 py-2 bg-primary-500 hover:bg-primary-600 disabled:bg-primary-500/50 text-white rounded-lg text-xs font-semibold shadow-sm transition cursor-pointer"
                    >
                      {isEvaluating ? "Evaluating..." : "Check Answer"}
                    </button>
                  </div>
                </form>

                {/* Evaluation Feedback */}
                <AnimatePresence>
                  {evaluationFeedback && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-slate-50 border border-slate-200/50 rounded-xl p-3.5 space-y-2 mt-4"
                    >
                      <div className="flex items-center justify-between border-b border-slate-100 pb-1.5">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">AI Evaluation Report</span>
                        <span className="text-xs font-extrabold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full border">{evaluationFeedback.score}</span>
                      </div>

                      <div className="text-xs space-y-2 leading-relaxed">
                        <div>
                          <span className="font-bold text-slate-700">Strengths:</span>{" "}
                          <span className="text-slate-600">{evaluationFeedback.strengths}</span>
                        </div>
                        <div>
                          <span className="font-bold text-slate-700">Suggested additions:</span>{" "}
                          <span className="text-slate-600">{evaluationFeedback.improvement}</span>
                        </div>
                      </div>

                      {currentQuestionIndex < activeQuestions.length - 1 && (
                        <button
                          onClick={() => {
                            setCurrentQuestionIndex(p => p + 1);
                            setUserAnswer("");
                            setEvaluationFeedback(null);
                          }}
                          className="w-full flex items-center justify-center gap-1.5 mt-3 pt-2.5 border-t border-slate-200/60 text-xs font-bold text-primary-500 hover:text-primary-700 transition"
                        >
                          <span>Next Question</span>
                          <ArrowRight size={13} />
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ) : (
              <div className="text-center py-10 border border-dashed rounded-xl bg-slate-50/20 border-slate-200">
                <FileText size={24} className="text-slate-300 mx-auto mb-2" />
                <p className="text-xs text-slate-400 leading-normal px-6">
                  Select an active application from the dropdown to launch interview questions.
                </p>
              </div>
            )}
          </div>
        </div>

      </div>

    </div>
  );
}