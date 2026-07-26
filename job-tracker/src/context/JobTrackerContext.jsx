import React, { createContext, useContext, useState, useEffect } from "react";
import { gmailApi } from "../services/gmailApi";
import { applicationsApi } from "../services/applicationsApi";

const JobTrackerContext = createContext();

export function JobTrackerProvider({ children }) {
  const [applications, setApplications] = useState([]);
  const [activities, setActivities] = useState([]);
  const [syncedEmails, setSyncedEmails] = useState([]);
  
  // Gmail sync status initialized clean and disconnected
  const [gmailStatus, setGmailStatus] = useState({
    connected: false,
    account: "",
    accountId: null,
    isScanning: false,
    emailsScanned: 0,
    jobsFound: 0,
    lastSync: "Never",
    logs: []
  });

  // Selected application ID for detail view
  const [selectedAppId, setSelectedAppId] = useState(null);

  // Command palette visibility
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);

  // Load applications from backend DB
  const fetchApplications = async () => {
    try {
      const data = await applicationsApi.listApplications();
      if (Array.isArray(data)) {
        setApplications(data);
      }
    } catch (err) {
      // If user unauthenticated or offline, preserve local state
    }
  };

  // Check backend for active connected Gmail accounts & applications on mount
  useEffect(() => {
    async function initData() {
      await fetchApplications();
      try {
        const accounts = await gmailApi.listAccounts();
        if (accounts && accounts.length > 0) {
          const activeAcc = accounts[0];
          setGmailStatus({
            connected: true,
            account: activeAcc.email,
            accountId: activeAcc.id,
            isScanning: false,
            emailsScanned: 0,
            jobsFound: 0,
            lastSync: "Just now",
            logs: [`Connected to active Gmail account (${activeAcc.email})`]
          });
        }
      } catch (err) {
        // User unauthenticated or backend unavailable
      }
    }
    initData();
  }, []);

  // Initiate real Google OAuth connection flow
  const connectGmail = async () => {
    try {
      setGmailStatus(prev => ({
        ...prev,
        isScanning: true,
        logs: ["Initiating Google OAuth connection..."]
      }));
      const authUrl = await gmailApi.getConnectUrl();
      if (authUrl) {
        window.location.href = authUrl;
      }
    } catch (err) {
      setGmailStatus(prev => ({
        ...prev,
        isScanning: false,
        logs: [`Connection error: ${err.response?.data?.detail || err.message}`]
      }));
    }
  };

  // Helper to extract job details from email content
  const extractJobFromEmail = (email) => {
    if (!email) return null;
    const subject = email.subject || "";
    const body = email.body || email.snippet || "";
    const sender = email.sender || email.from || "";
    const text = `${subject} ${body} ${sender}`.toLowerCase();

    // Check if job application confirmation or update email
    const isJobEmail = text.includes("applied") || text.includes("application") || text.includes("thank you for applying") || text.includes("interview") || text.includes("offer") || text.includes("greenhouse") || text.includes("lever") || text.includes("workday");
    if (!isJobEmail) return null;

    // Extract Company Name
    let company = "";
    const companyMatch = subject.match(/(?:at|to|with|for)\s+([A-Z][A-Za-z0-9\s&.-]+?)(?:\s+for|\s+-\s+|\s+\(|\s*$)/i) ||
                         sender.match(/([A-Z][A-Za-z0-9\s&.-]+?)(?:\s*<|\s*recruiting|\s*careers|\s*hiring)/i);
    if (companyMatch && companyMatch[1] && companyMatch[1].trim().length > 1) {
      company = companyMatch[1].trim();
    }
    if (!company) {
      const domainMatch = sender.match(/@([\w-]+)\./);
      if (domainMatch && !["gmail", "yahoo", "hotmail", "outlook"].includes(domainMatch[1])) {
        company = domainMatch[1].charAt(0).toUpperCase() + domainMatch[1].slice(1);
      } else {
        company = sender.split("<")[0].replace(/[^a-zA-Z0-9\s]/g, "").trim() || "Target Company";
      }
    }

    // Extract Role Title
    let role = "Software Engineer";
    const roleMatch = subject.match(/(?:for|as)\s+([A-Za-z0-9\s/.-]+?)(?:\s+at|\s+-\s+|\s+\(|$)/i) ||
                      body.match(/(?:position|role|job|title):\s*([A-Za-z0-9\s/.-]+)/i);
    if (roleMatch && roleMatch[1] && roleMatch[1].trim().length > 2) {
      role = roleMatch[1].trim();
    }

    // Extract Application Status
    let status = "applied";
    if (text.includes("interview") || text.includes("schedule")) status = "interview";
    else if (text.includes("offer")) status = "offer";
    else if (text.includes("reject") || text.includes("regret to inform")) status = "rejected";

    return {
      company: company.slice(0, 35),
      role: role.slice(0, 45),
      status: status,
      appliedDate: email.date || "Recent",
      source: "Email Auto-Sync",
      location: "Remote / On-site",
      jobDescription: body.slice(0, 500)
    };
  };

  // Sync emails from real Gmail API endpoint and parse into DB
  const syncGmail = async () => {
    if (!gmailStatus.connected || !gmailStatus.accountId) {
      await connectGmail();
      return;
    }

    setGmailStatus(prev => ({
      ...prev,
      isScanning: true,
      logs: ["Connecting to Gmail API endpoint...", "Scanning inbox messages for job emails..."]
    }));

    try {
      const data = await gmailApi.fetchEmails(gmailStatus.accountId);
      const fetchedEmails = data?.emails || [];
      setSyncedEmails(fetchedEmails);

      // Auto-extract and create applications for any new job emails
      let autoCreatedCount = 0;
      for (const email of fetchedEmails) {
        const parsedJob = extractJobFromEmail(email);
        if (parsedJob) {
          const exists = applications.some(a => 
            (a.company && a.company.toLowerCase() === parsedJob.company.toLowerCase()) ||
            (a.role && a.role.toLowerCase() === parsedJob.role.toLowerCase())
          );
          if (!exists) {
            await addApplication(parsedJob);
            autoCreatedCount++;
          }
        }
      }

      // Refresh applications list to display all newly parsed applications
      await fetchApplications();

      if (fetchedEmails.length > 0) {
        const newActivities = fetchedEmails.map((e, idx) => ({
          id: `email_${e.id || idx}_${Date.now()}`,
          type: "sync",
          sender: e.sender || e.from || "Gmail",
          subject: e.subject || "(No subject)",
          text: e.subject || "(No subject)",
          time: e.date || "Just now"
        }));
        setActivities(newActivities);
      }

      const emailLogs = fetchedEmails.slice(0, 5).map(
        e => `[${e.date || "Recent"}] From: ${e.sender || e.from || "Unknown"} | Subject: ${e.subject || "(No subject)"}`
      );

      setGmailStatus(prev => ({
        ...prev,
        isScanning: false,
        emailsScanned: fetchedEmails.length,
        jobsFound: autoCreatedCount || fetchedEmails.length,
        lastSync: "Just now",
        logs: [
          `Successfully connected to Gmail API for ${gmailStatus.account}.`,
          `Fetched ${fetchedEmails.length} messages and auto-extracted ${autoCreatedCount} new job applications.`,
          ...emailLogs
        ]
      }));
    } catch (err) {
      setGmailStatus(prev => ({
        ...prev,
        isScanning: false,
        logs: [`Sync failed: ${err.response?.data?.detail || err.message}`]
      }));
    }
  };

  const loadDemoData = () => {
    setApplications([]);
    setActivities([]);
  };

  const clearHunt = () => {
    setApplications([]);
    setActivities([]);
    setSyncedEmails([]);
    setGmailStatus({
      connected: false,
      account: "",
      accountId: null,
      isScanning: false,
      emailsScanned: 0,
      jobsFound: 0,
      lastSync: "Never",
      logs: []
    });
    setSelectedAppId(null);
  };

  const addApplication = async (app) => {
    try {
      const created = await applicationsApi.createApplication({
        company: app.company,
        title: app.role || app.title || "Developer",
        status: app.status || "applied",
        location: app.location || "",
        salary_range: app.salary || app.salary_range || "",
        source: app.source || "manual",
        notes: app.notes || "",
        job_description: app.jobDescription || ""
      });
      setApplications(prev => [created, ...prev]);
    } catch (err) {
      const fallbackApp = {
        ...app,
        id: app.id || Date.now().toString(),
        logoColor: app.logoColor || "from-[#6B7280] to-[#374151]",
        tasks: app.tasks || [],
        emails: app.emails || [],
        history: app.history || [
          { date: new Date().toISOString().split("T")[0], status: app.status, notes: "Application added manually" }
        ]
      };
      setApplications((prev) => [fallbackApp, ...prev]);
    }
  };

  const updateApplication = async (id, updatedFields) => {
    try {
      const updated = await applicationsApi.updateApplication(id, updatedFields);
      setApplications((prev) => prev.map((app) => (app.id === id ? updated : app)));
    } catch (err) {
      setApplications((prev) =>
        prev.map((app) => (app.id === id ? { ...app, ...updatedFields } : app))
      );
    }
  };

  const deleteApplication = async (id) => {
    try {
      await applicationsApi.deleteApplication(id);
    } catch (err) {
      // ignore
    }
    setApplications((prev) => prev.filter((app) => app.id !== id));
  };

  const addTask = (appId, taskText, dueDate = "") => {
    setApplications((prev) =>
      prev.map((app) => {
        if (app.id === appId) {
          return {
            ...app,
            tasks: [
              ...(app.tasks || []),
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
            tasks: (app.tasks || []).map((task) =>
              task.id === taskId ? { ...task, completed: !task.completed } : task
            )
          };
        }
        return app;
      })
    );
  };

  const toggleGmailConnection = () => {
    if (!gmailStatus.connected) {
      connectGmail();
    } else {
      setGmailStatus(prev => ({
        ...prev,
        connected: false,
        account: "",
        accountId: null,
        logs: []
      }));
    }
  };

  return (
    <JobTrackerContext.Provider
      value={{
        applications,
        syncedEmails,
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
        connectGmail,
        syncGmail,
        toggleGmailConnection,
        setGmailStatus,
        fetchApplications
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
