import React, { createContext, useContext, useState, useEffect } from "react";

const JobTrackerContext = createContext();

// Move demo applications data outside provider
const MOCK_APPLICATIONS = [
  {
    id: "1",
    company: "Stripe",
    logoColor: "from-[#635BFF] to-[#8079FF]",
    role: "Frontend Engineer",
    status: "interview",
    source: "Gmail Sync",
    appliedDate: "2026-07-08",
    salary: "$145,000 - $175,000",
    location: "San Francisco, CA (Hybrid)",
    tags: ["React", "TypeScript", "Tailwind"],
    jobDescription: "Stripe is looking for a Frontend Engineer to build the next generation of online payment interfaces. You will work on developer dashboards, user onboarding flows, and high-performance payment widgets. Requirements: React, TypeScript, Tailwind CSS, and 2+ years of experience.",
    notes: "The recruiter (Marcus) reached out via email. The technical interview is scheduled for next Tuesday at 2 PM PST. Focus area: Web Performance and Component Design.",
    tasks: [
      { id: "t1_1", text: "Review Stripe API documentation & UI components", completed: true, dueDate: "2026-07-10" },
      { id: "t1_2", text: "Practice React component performance optimizations", completed: false, dueDate: "2026-07-14" },
      { id: "t1_3", text: "Prepare frontend system design answers", completed: false, dueDate: "2026-07-15" }
    ],
    emails: [
      {
        id: "e1_1",
        from: "Stripe Careers <recruiting@stripe.com>",
        subject: "Thank you for applying to Stripe!",
        date: "July 8, 2026",
        body: "Hello Rishika,\n\nWe received your application for the Frontend Engineer position. Our recruiting team is reviewing your profile and will get back to you shortly.\n\nBest regards,\nStripe Recruiting Team"
      },
      {
        id: "e1_2",
        from: "Marcus at Stripe <marcus.a@stripe.com>",
        subject: "Interview invitation: Stripe Frontend Engineer",
        date: "July 12, 2026",
        body: "Hi Rishika,\n\nI hope you are doing well. We were impressed by your resume and would like to schedule a 45-minute technical interview to talk about your React and frontend experience. Please use the link below to select a convenient time.\n\nBest,\nMarcus"
      }
    ],
    history: [
      { date: "2026-07-08", status: "applied", notes: "Gmail Auto-detect: Found Greenhouse confirmation" },
      { date: "2026-07-12", status: "interview", notes: "Gmail Auto-detect: Found Stripe Interview scheduler email" }
    ]
  },
  {
    id: "2",
    company: "Linear",
    logoColor: "from-[#5E6AD2] to-[#7B88EB]",
    role: "Product Designer",
    status: "applied",
    source: "Referral",
    appliedDate: "2026-07-11",
    salary: "$130,000 - $160,000",
    location: "Remote",
    tags: ["Figma", "Design Systems", "UI/UX"],
    jobDescription: "Linear is building tools for the next generation of software teams. We are seeking a Product Designer who can sweat the details and design interfaces that are fast, keyboard-driven, and visually striking. Experienced in layout, typography, and motion design.",
    notes: "Referred by Karri (Senior Engineer at Linear). Sent portfolio links. He said they care heavily about custom details and custom components.",
    tasks: [
      { id: "t2_1", text: "Prepare portfolio presentation deck", completed: false, dueDate: "2026-07-16" },
      { id: "t2_2", text: "Research Linear design patterns and keyboard shortcuts", completed: false, dueDate: "2026-07-18" }
    ],
    emails: [
      {
        id: "e2_1",
        from: "Karri <karri@linear.app>",
        subject: "Referral submitted: Rishika (Product Designer)",
        date: "July 11, 2026",
        body: "Hey Rishika,\n\nI've submitted your referral to our hiring team. They generally review applications pretty quickly. Make sure your portfolio is fully updated! Let's stay in touch.\n\nBest,\nKarri"
      }
    ],
    history: [
      { date: "2026-07-11", status: "applied", notes: "Referral submitted by Karri" }
    ]
  },
  {
    id: "3",
    company: "OpenAI",
    logoColor: "from-[#000000] to-[#404040]",
    role: "Frontend Engineer",
    status: "wishlist",
    source: "Career Portal",
    appliedDate: "-",
    salary: "$200,000 - $280,000",
    location: "San Francisco, CA",
    tags: ["React", "WebGL", "NextJS"],
    jobDescription: "Build responsive, high-performance interfaces for AI tools, API platforms, and ChatGPT features. Work closely with AI researchers to visualize model inputs and outputs.",
    notes: "Need to clean up web dev projects and highlight any LLM/AI integrations. Thinking of applying before the weekend.",
    tasks: [
      { id: "t3_1", text: "Build a demo React app featuring Gemini API integrations", completed: false, dueDate: "2026-07-15" }
    ],
    emails: [],
    history: [
      { date: "2026-07-13", status: "wishlist", notes: "Added OpenAI to wishlist board" }
    ]
  },
  {
    id: "4",
    company: "Microsoft",
    logoColor: "from-[#00A4EF] to-[#7FBA00]",
    role: "Software Engineer Intern",
    status: "offer",
    source: "Indeed",
    appliedDate: "2026-06-15",
    salary: "$45 - $60 / hour",
    location: "Redmond, WA (Hybrid)",
    tags: ["C#", "React", "Azure"],
    jobDescription: "Join the Developer Division at Microsoft. Contribute to dev tools, VS Code integrations, or Azure service dashboards. Solid programming foundations in C#, JS, TS, Python, or Java.",
    notes: "Offer letter received on July 10th. Compensation package: $54/hour plus relocation package. Deadline to accept is July 24th.",
    tasks: [
      { id: "t4_1", text: "Review offer letter terms", completed: true, dueDate: "2026-07-12" },
      { id: "t4_2", text: "Sign and return the acceptance document", completed: false, dueDate: "2026-07-22" },
      { id: "t4_3", text: "Submit background check questionnaire", completed: false, dueDate: "2026-07-25" }
    ],
    emails: [
      {
        id: "e4_1",
        from: "Microsoft Recruiting <noreply@greenhouse.io>",
        subject: "Microsoft Final Round Schedule",
        date: "June 25, 2026",
        body: "Dear Rishika,\n\nWe are pleased to invite you to our final round interviews. They will consist of three 45-minute technical evaluations conducted on Microsoft Teams..."
      },
      {
        id: "e4_2",
        from: "Microsoft Recruiting <noreply@greenhouse.io>",
        subject: "Offer from Microsoft: Software Engineer Intern",
        date: "July 10, 2026",
        body: "Hi Rishika,\n\nCongratulations! We are thrilled to offer you the position of Software Engineer Intern for Fall 2026. The full offer packet is enclosed in this email. We look forward to welcoming you to Redmond!\n\nWarm regards,\nMicrosoft University Recruiting"
      }
    ],
    history: [
      { date: "2026-06-15", status: "applied", notes: "Applied via Indeed portal" },
      { date: "2026-06-25", status: "interview", notes: "Invited to final rounds" },
      { date: "2026-07-10", status: "offer", notes: "Offer letter received!" }
    ]
  },
  {
    id: "5",
    company: "Amazon",
    logoColor: "from-[#FF9900] to-[#146B93]",
    role: "SDE Intern",
    status: "rejected",
    source: "Naukri",
    appliedDate: "2026-06-20",
    salary: "$55 / hour",
    location: "Seattle, WA",
    tags: ["Java", "AWS", "Databases"],
    jobDescription: "Help build large-scale cloud services. Write robust code in Java, C++, or Python. Work on storage, compute, or delivery services.",
    notes: "Completed Online Assessment (OA) on June 28. Received rejection email on July 5.",
    tasks: [
      { id: "t5_1", text: "Review Amazon OA results and debug failure cases", completed: true, dueDate: "2026-07-06" }
    ],
    emails: [
      {
        id: "e5_1",
        from: "Amazon Jobs <no-reply@workday.com>",
        subject: "Amazon Online Assessment Invitation",
        date: "June 21, 2026",
        body: "Dear Candidate,\n\nYou are invited to complete the Amazon Online Assessment. You will have 120 minutes to solve coding questions and an engineering simulation..."
      },
      {
        id: "e5_2",
        from: "Amazon Jobs <no-reply@workday.com>",
        subject: "Update on your Amazon Application",
        date: "July 5, 2026",
        body: "Hello,\n\nThank you for taking the time to apply and participate in our evaluations. At this time, we will not be moving forward with your application. We wish you success in your search.\n\nBest,\nAmazon Recruiting"
      }
    ],
    history: [
      { date: "2026-06-20", status: "applied", notes: "Applied via Naukri" },
      { date: "2026-06-21", status: "interview", notes: "Received OA invitation" },
      { date: "2026-07-05", status: "rejected", notes: "Rejected after assessment" }
    ]
  },
  {
    id: "6",
    company: "Wellfound Jobs",
    logoColor: "from-[#0A0A0A] to-[#1C1C1C]",
    role: "React Specialist",
    status: "wishlist",
    source: "Wellfound",
    appliedDate: "-",
    salary: "$120,000 - $145,000 + 1% Equity",
    location: "Remote (US)",
    tags: ["React", "Framer Motion", "Tailwind"],
    jobDescription: "A seed-stage Web3 startup is looking for a senior frontend developer who can build fluid, highly animated dashboards using Framer Motion. Looking for self-starters.",
    notes: "Need to highlight Framer Motion work. High salary + high equity is attractive.",
    tasks: [],
    emails: [],
    history: [
      { date: "2026-07-12", status: "wishlist", notes: "Saved from Wellfound board" }
    ]
  },
  {
    id: "7",
    company: "Vercel",
    logoColor: "from-[#000000] to-[#2563EB]",
    role: "Developer Advocate",
    status: "interview",
    source: "Lever",
    appliedDate: "2026-07-05",
    salary: "$125,000 - $155,000",
    location: "Remote",
    tags: ["NextJS", "DevRel", "Tailwind"],
    jobDescription: "Work on making the web faster and more developer-friendly. Create tutorials, engage with framework communities, write blogs, and improve Next.js documentation.",
    notes: "First conversation with DevRel manager went great. Preparing a demo project using Next.js 15 for the second technical review.",
    tasks: [
      { id: "t7_1", text: "Build a demo app showcasing Next.js Server Actions", completed: true, dueDate: "2026-07-10" },
      { id: "t7_2", text: "Prepare slides summarizing feedback on Next.js docs", completed: false, dueDate: "2026-07-15" }
    ],
    emails: [
      {
        id: "e7_1",
        from: "Vercel Careers <jobs@lever.co>",
        subject: "Application Received: Developer Advocate at Vercel",
        date: "July 5, 2026",
        body: "Hi Rishika,\n\nThanks for applying to Vercel. We have received your application and will review it. Keep coding!\n\nBest,\nVercel Talent Team"
      },
      {
        id: "e7_2",
        from: "Lee at Vercel <lee@vercel.com>",
        subject: "Next steps at Vercel",
        date: "July 11, 2026",
        body: "Hi Rishika,\n\nLoved your blog post on React Server Components. Let's schedule a call this week to talk about how you'd fit in the DevRel group. Here is my calendar link.\n\nCheers,\nLee"
      }
    ],
    history: [
      { date: "2026-07-05", status: "applied", notes: "Applied via Lever portal" },
      { date: "2026-07-11", status: "interview", notes: "Invited to schedule a call with DevRel director" }
    ]
  }
];

const MOCK_ACTIVITIES = [
  { id: "a1", type: "sync", text: "Gmail scan auto-tracked Microsoft final rounds invite", time: "1 hour ago" },
  { id: "a2", type: "sync", text: "Gmail scan detected Stripe Interview scheduler email", time: "Yesterday" },
  { id: "a3", type: "manual", text: "You created OpenAI application in Wishlist", time: "2 days ago" },
  { id: "a4", type: "manual", text: "Vercel application status updated to Interview", time: "2 days ago" }
];

export function JobTrackerProvider({ children }) {
  // Empty states by default (remove pre-filled dummy data)
  const [applications, setApplications] = useState([]);
  const [activities, setActivities] = useState([]);
  
  // Gmail sync status
  const [gmailStatus, setGmailStatus] = useState({
    connected: true,
    account: "rishika@example.com",
    isScanning: false,
    emailsScanned: 2450,
    jobsFound: 0,
    lastSync: "Never",
    logs: []
  });

  // Selected application ID for the global slide-over detail view
  const [selectedAppId, setSelectedAppId] = useState(null);

  // Command palette visibility
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Load demo hunt data
  const loadDemoData = () => {
    setApplications(MOCK_APPLICATIONS);
    setActivities(MOCK_ACTIVITIES);
    setGmailStatus(prev => ({
      ...prev,
      jobsFound: 14,
      lastSync: "2 minutes ago",
      logs: ["Loaded 14 tracked job applications from scanned history."]
    }));
  };

  // Clear data to start fresh
  const clearHunt = () => {
    setApplications([]);
    setActivities([]);
    setGmailStatus(prev => ({
      ...prev,
      jobsFound: 0,
      lastSync: "Never",
      logs: []
    }));
    setSelectedAppId(null);
  };

  // Add an application
  const addApplication = (app) => {
    const newApp = {
      ...app,
      id: app.id || Date.now().toString(),
      logoColor: app.logoColor || "from-[#6B7280] to-[#374151]",
      tasks: app.tasks || [],
      emails: app.emails || [],
      history: app.history || [
        { date: new Date().toISOString().split("T")[0], status: app.status, notes: "Application added manually" }
      ]
    };
    setApplications((prev) => [newApp, ...prev]);
    
    // Add to activity feed
    setActivities((prev) => [
      {
        id: Date.now().toString(),
        type: "manual",
        text: `You added ${newApp.company} (${newApp.role}) to ${newApp.status}`,
        time: "Just now"
      },
      ...prev
    ]);
  };

  // Update an application
  const updateApplication = (id, updatedFields) => {
    setApplications((prev) =>
      prev.map((app) => {
        if (app.id === id) {
          const history = [...(app.history || [])];
          // Record status transition
          if (updatedFields.status && updatedFields.status !== app.status) {
            history.push({
              date: new Date().toISOString().split("T")[0],
              status: updatedFields.status,
              notes: `Status changed from ${app.status} to ${updatedFields.status}`
            });
            // Log as activity
            setActivities((prevAct) => [
              {
                id: Date.now().toString(),
                type: "manual",
                text: `${app.company} status updated to ${updatedFields.status}`,
                time: "Just now"
              },
              ...prevAct
            ]);
          }
          return { ...app, ...updatedFields, history };
        }
        return app;
      })
    );
  };

  // Delete an application
  const deleteApplication = (id) => {
    const target = applications.find((a) => a.id === id);
    if (target) {
      setActivities((prev) => [
        {
          id: Date.now().toString(),
          type: "manual",
          text: `You deleted ${target.company} application`,
          time: "Just now"
        },
        ...prev
      ]);
    }
    setApplications((prev) => prev.filter((app) => app.id !== id));
  };

  // Tasks Management
  const addTask = (appId, taskText, dueDate = "") => {
    setApplications((prev) =>
      prev.map((app) => {
        if (app.id === appId) {
          return {
            ...app,
            tasks: [
              ...app.tasks,
              { id: Date.now().toString(), text: taskText, completed: false, dueDate }
            ]
          };
        }
        return app;
      })
    );
  };

  const toggleTask = (appId, taskId) => {
    setApplications((prev) =>
      prev.map((app) => {
        if (app.id === appId) {
          return {
            ...app,
            tasks: app.tasks.map((task) =>
              task.id === taskId ? { ...task, completed: !task.completed } : task
            )
          };
        }
        return app;
      })
    );
  };

  // Gmail sync emulator
  const syncGmail = () => {
    if (!gmailStatus.connected) return;

    setGmailStatus((prev) => ({
      ...prev,
      isScanning: true,
      logs: ["Establishing secure connection to Gmail API..."]
    }));

    const stages = [
      { delay: 1000, log: "Authorizing with rishika@example.com..." },
      { delay: 2000, log: "Crawling inbox since last sync... (scanning 142 new emails)" },
      { delay: 3000, log: "Parsing email templates for ATS markers (Greenhouse, Lever, Workday)..." },
      { delay: 4000, log: "Found 1 new job tracking update from Greenhouse." },
      { delay: 5000, log: "Sync complete! Vercel application details updated." }
    ];

    stages.forEach((stage) => {
      setTimeout(() => {
        setGmailStatus((prev) => ({
          ...prev,
          logs: [...prev.logs, stage.log]
        }));
      }, stage.delay);
    });

    setTimeout(() => {
      setGmailStatus((prev) => ({
        ...prev,
        isScanning: false,
        emailsScanned: prev.emailsScanned + 142,
        jobsFound: prev.jobsFound > 0 ? prev.jobsFound + 1 : 1,
        lastSync: "Just now"
      }));

      // Trigger automatic update for Vercel in the list
      setApplications((prevApps) => {
        const hasVercel = prevApps.some(app => app.company === "Vercel");
        if (hasVercel) {
          return prevApps.map((app) => {
            if (app.company === "Vercel") {
              const hasOfferEmail = app.emails.some((e) => e.subject.includes("Offer"));
              if (!hasOfferEmail) {
                const updatedEmails = [
                  ...app.emails,
                  {
                    id: "e7_3",
                    from: "Vercel Talent Acquisition <recruiting@vercel.com>",
                    subject: "Offer from Vercel: Developer Advocate",
                    date: "July 13, 2026",
                    body: "Hi Rishika,\n\nWe were absolutely thrilled with your presentation! The team is excited to offer you the position of Developer Advocate at Vercel. Find attached the offer details.\n\nWarmly,\nLee & Vercel HR"
                  }
                ];
                const updatedHistory = [
                  ...app.history,
                  { date: "2026-07-13", status: "offer", notes: "Gmail Auto-detect: Found Vercel Offer letter!" }
                ];
                // Add activity log
                setActivities((prevAct) => [
                  {
                    id: Date.now().toString(),
                    type: "sync",
                    text: "Gmail scan auto-tracked Vercel Developer Advocate Offer!",
                    time: "Just now"
                  },
                  ...prevAct
                ]);
                return {
                  ...app,
                  status: "offer",
                  emails: updatedEmails,
                  history: updatedHistory
                };
              }
            }
            return app;
          });
        } else {
          // If board is empty and they sync, add Vercel as a demo sync item
          const demoVercel = {
            id: "7",
            company: "Vercel",
            logoColor: "from-[#000000] to-[#2563EB]",
            role: "Developer Advocate",
            status: "offer",
            source: "Gmail Sync",
            appliedDate: "2026-07-05",
            salary: "$125,000 - $155,000",
            location: "Remote",
            tags: ["NextJS", "DevRel", "Tailwind"],
            jobDescription: "Work on making the web faster and more developer-friendly. Create tutorials, engage with framework communities, write blogs, and improve Next.js documentation.",
            notes: "First conversation with DevRel manager went great. Preparing a demo project using Next.js 15 for the second technical review.",
            tasks: [
              { id: "t7_1", text: "Build a demo app showcasing Next.js Server Actions", completed: true, dueDate: "2026-07-10" },
              { id: "t7_2", text: "Prepare slides summarizing feedback on Next.js docs", completed: false, dueDate: "2026-07-15" }
            ],
            emails: [
              {
                id: "e7_1",
                from: "Vercel Careers <jobs@lever.co>",
                subject: "Application Received: Developer Advocate at Vercel",
                date: "July 5, 2026",
                body: "Hi Rishika,\n\nThanks for applying to Vercel. We have received your application and will review it. Keep coding!\n\nBest,\nVercel Talent Team"
              },
              {
                id: "e7_2",
                from: "Lee at Vercel <lee@vercel.com>",
                subject: "Next steps at Vercel",
                date: "July 11, 2026",
                body: "Hi Rishika,\n\nLoved your blog post on React Server Components. Let's schedule a call this week to talk about how you'd fit in the DevRel group. Here is my calendar link.\n\nCheers,\nLee"
              },
              {
                id: "e7_3",
                from: "Vercel Talent Acquisition <recruiting@vercel.com>",
                subject: "Offer from Vercel: Developer Advocate",
                date: "July 13, 2026",
                body: "Hi Rishika,\n\nWe were absolutely thrilled with your presentation! The team is excited to offer you the position of Developer Advocate at Vercel. Find attached the offer details.\n\nWarmly,\nLee & Vercel HR"
              }
            ],
            history: [
              { date: "2026-07-05", status: "applied", notes: "Applied via Lever portal" },
              { date: "2026-07-11", status: "interview", notes: "Invited to schedule a call with DevRel director" },
              { date: "2026-07-13", status: "offer", notes: "Gmail Auto-detect: Found Vercel Offer letter!" }
            ]
          };
          setActivities((prevAct) => [
            {
              id: Date.now().toString(),
              type: "sync",
              text: "Gmail scan auto-tracked Vercel Developer Advocate Offer!",
              time: "Just now"
            },
            ...prevAct
          ]);
          return [demoVercel];
        }
      });
    }, 5500);
  };

  const toggleGmailConnection = () => {
    setGmailStatus((prev) => ({
      ...prev,
      connected: !prev.connected,
      logs: []
    }));
  };

  return (
    <JobTrackerContext.Provider
      value={{
        applications,
        gmailStatus,
        activities,
        selectedAppId,
        setSelectedAppId,
        commandPaletteOpen,
        setCommandPaletteOpen,
        loadDemoData,
        clearHunt,
        addApplication,
        updateApplication,
        deleteApplication,
        addTask,
        toggleTask,
        syncGmail,
        toggleGmailConnection,
        setGmailStatus
      }}
    >
      {children}
    </JobTrackerContext.Provider>
  );
}

export function useJobTracker() {
  const context = useContext(JobTrackerContext);
  if (!context) {
    throw new Error("useJobTracker must be used within a JobTrackerProvider");
  }
  return context;
}
