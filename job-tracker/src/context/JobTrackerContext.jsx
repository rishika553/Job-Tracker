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

  // Sync emails from real Gmail API endpoint and parse into DB
  const syncGmail = async () => {
    if (!gmailStatus.connected || !gmailStatus.accountId) {
      await connectGmail();
      return;
    }

    setGmailStatus(prev => ({
      ...prev,
      isScanning: true,
      logs: ["Connecting to Gmail API endpoint...", "Scanning inbox messages (newer_than:30d)..."]
    }));

    try {
      const data = await gmailApi.fetchEmails(gmailStatus.accountId);
      const fetchedEmails = data?.emails || [];
      setSyncedEmails(fetchedEmails);

      // Refresh applications list to catch any auto-detected applications
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
        jobsFound: fetchedEmails.length,
        lastSync: "Just now",
        logs: [
          `Successfully connected to Gmail API for ${gmailStatus.account}.`,
          `Fetched ${fetchedEmails.length} messages from inbox (newer_than:30d).`,
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
