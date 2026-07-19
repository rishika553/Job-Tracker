import React, { useState } from "react";
import { useJobTracker } from "../context/JobTrackerContext";
import { 
  User, 
  Link2, 
  Eye, 
  Bell, 
  Shield, 
  Lock, 
  CreditCard, 
  Workflow, 
  Check, 
  AlertCircle,
  Download,
  ToggleLeft,
  ToggleRight,
  Globe
} from "lucide-react";

export default function Setting() {
  const { clearHunt } = useJobTracker();
  const [activeTab, setActiveTab] = useState("profile");
  const [saveSuccess, setSaveSuccess] = useState(false);

  // 1. Profile State
  const [profile, setProfile] = useState({
    name: "Rishika",
    email: "rishika@example.com",
    title: "Frontend Engineer / UI Developer"
  });

  // 2. Connected Accounts State
  const [connectedAccounts, setConnectedAccounts] = useState({
    google: true,
    gmail: true,
    linkedin: false,
    indeed: false,
    wellfound: false,
    naukri: false
  });

  // 3. Appearance State
  const [appearance, setAppearance] = useState({
    theme: "light",
    density: "default"
  });

  // 4. Notifications State
  const [notifications, setNotifications] = useState({
    interviews: true,
    digest: false,
    dueReminders: true
  });

  // 5. Security State
  const [security, setSecurity] = useState({
    currentPassword: "",
    newPassword: "",
    apiKey: "ct_key_77a94d88e0b12bc51f"
  });

  // 6. Privacy State
  const [privacy, setPrivacy] = useState({
    shareData: false,
    publicProfile: false
  });

  // 7. Billing State
  const [billing, setBilling] = useState({
    cardName: "",
    cardNumber: "",
    expiry: "",
    cvv: "",
    plan: "free"
  });

  // 8. Integrations State
  const [integrations, setIntegrations] = useState({
    slackWebhook: "",
    discordWebhook: ""
  });

  const handleProfileSave = (e) => {
    e.preventDefault();
    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  const toggleAccount = (key) => {
    setConnectedAccounts(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const handleExportData = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify({ profile, connectedAccounts, appearance, notifications }));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "careertrack_backup.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const handleSaveCard = (e) => {
    e.preventDefault();
    alert("Billing card verified and saved securely (simulation).");
    setBilling(prev => ({ ...prev, cardName: "", cardNumber: "", expiry: "", cvv: "" }));
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start animate-fade-in select-none">
      
      {/* Sidebar Navigation tabs */}
      <div className="w-full lg:w-64 bg-white border border-brand-200/60 rounded-2xl p-3.5 shadow-premium shrink-0 space-y-1">
        <h2 className="text-xs font-extrabold text-brand-400 uppercase tracking-widest px-3 mb-3">System Settings</h2>
        
        {[
          { id: "profile", label: "Profile Information", icon: <User size={15} /> },
          { id: "accounts", label: "Connected Accounts", icon: <Link2 size={15} /> },
          { id: "appearance", label: "System Appearance", icon: <Eye size={15} /> },
          { id: "notifications", label: "Alert Notifications", icon: <Bell size={15} /> },
          { id: "security", label: "Access & Security", icon: <Shield size={15} /> },
          { id: "privacy", label: "Privacy & Controls", icon: <Lock size={15} /> },
          { id: "billing", label: "Billing & Plans", icon: <CreditCard size={15} /> },
          { id: "integrations", label: "Webhooks & Sync", icon: <Workflow size={15} /> }
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold text-left transition cursor-pointer ${
              activeTab === tab.id 
                ? "bg-amber-50 text-amber-700 font-bold border-l-2 border-amber-500 shadow-3xs" 
                : "text-brand-500 hover:text-brand-900 hover:bg-brand-50/50"
            }`}
          >
            {tab.icon}
            <span>{tab.label}</span>
          </button>
        ))}
      </div>

      {/* Main Settings Form panel */}
      <div className="flex-1 w-full space-y-6 bg-white border border-brand-200/60 rounded-2xl p-6 shadow-premium min-h-[460px]">
        
        {/* Tab: Profile */}
        {activeTab === "profile" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-brand-900">Profile Information</h3>
              <p className="text-[11px] text-brand-450 mt-0.5">Customize your personal details and target developer titles.</p>
            </div>

            <form onSubmit={handleProfileSave} className="space-y-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-slate-900 border border-brand-200 flex items-center justify-center text-lg font-black text-amber-500 shadow-3xs">
                  {profile.name[0]}
                </div>
                <div>
                  <h4 className="text-xs font-bold text-brand-850">Avatar Initials</h4>
                  <p className="text-[10px] text-brand-400 mt-0.5">Auto-generated from your full name profile.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-brand-450 uppercase tracking-wider mb-1.5">Full Name</label>
                  <input
                    type="text"
                    required
                    value={profile.name}
                    onChange={(e) => setProfile(p => ({ ...p, name: e.target.value }))}
                    className="w-full border border-brand-200 rounded-xl px-3 py-2 text-xs text-brand-800 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-brand-450 uppercase tracking-wider mb-1.5">Contact Email</label>
                  <input
                    type="email"
                    required
                    value={profile.email}
                    onChange={(e) => setProfile(p => ({ ...p, email: e.target.value }))}
                    className="w-full border border-brand-200 rounded-xl px-3 py-2 text-xs text-brand-800 focus:outline-none"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="block text-[10px] font-bold text-brand-450 uppercase tracking-wider mb-1.5">Target Job Title</label>
                  <input
                    type="text"
                    required
                    value={profile.title}
                    onChange={(e) => setProfile(p => ({ ...p, title: e.target.value }))}
                    className="w-full border border-brand-200 rounded-xl px-3 py-2 text-xs text-brand-800 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 pt-3 border-t border-brand-50">
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-950 hover:bg-brand-900 text-white rounded-xl text-xs font-bold shadow-sm transition cursor-pointer"
                >
                  Save Profile Changes
                </button>
                {saveSuccess && (
                  <span className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 bg-emerald-50 border border-emerald-100 px-2.5 py-1 rounded-lg">
                    <Check size={12} />
                    Changes saved!
                  </span>
                )}
              </div>
            </form>
          </div>
        )}

        {/* Tab: Connected Accounts */}
        {activeTab === "accounts" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-brand-900">Connected Accounts</h3>
              <p className="text-[11px] text-brand-450 mt-0.5">Manage single sign-on authorizations and email synchronization ports.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { key: "google", name: "Google", desc: "Authentications, backups, Google Drive exports.", color: "bg-red-50 border-red-100 text-red-650" },
                { key: "gmail", name: "Gmail API", desc: "Scan folders for confirmation letters and timelines.", color: "bg-orange-50 border-orange-100 text-orange-650" },
                { key: "linkedin", name: "LinkedIn", desc: "Sync direct applications and recruiter profiles.", color: "bg-blue-50 border-blue-100 text-blue-650" },
                { key: "indeed", name: "Indeed Connect", desc: "Track application updates and platform stages.", color: "bg-sky-50 border-sky-100 text-sky-650" },
                { key: "wellfound", name: "Wellfound (AngelList)", desc: "Track startup applications and team contacts.", color: "bg-stone-50 border-stone-100 text-brand-950" },
                { key: "naukri", name: "Naukri", desc: "Scan job alerts and recruiter notification panels.", color: "bg-indigo-50 border-indigo-100 text-indigo-650" }
              ].map(acc => (
                <div key={acc.key} className="flex items-start justify-between border border-brand-150 rounded-xl p-4 bg-brand-50/10">
                  <div className="flex gap-3 items-start min-w-0">
                    <div className={`w-8 h-8 rounded-lg ${acc.color} flex items-center justify-center font-black text-xs uppercase shrink-0`}>
                      {acc.name[0]}
                    </div>
                    <div className="min-w-0">
                      <h4 className="text-xs font-bold text-brand-950">{acc.name}</h4>
                      <p className="text-[10px] text-brand-450 leading-normal mt-0.5 truncate">{acc.desc}</p>
                    </div>
                  </div>
                  <button onClick={() => toggleAccount(acc.key)} className="cursor-pointer text-brand-400 hover:text-brand-600 transition ml-2 shrink-0">
                    {connectedAccounts[acc.key] ? (
                      <ToggleRight size={26} className="text-emerald-500" />
                    ) : (
                      <ToggleLeft size={26} />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab: Appearance */}
        {activeTab === "appearance" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-brand-900">System Appearance</h3>
              <p className="text-[11px] text-brand-450 mt-0.5">Customize theme options and layout densities for CareerTrack Pro.</p>
            </div>

            <div className="space-y-5">
              {/* Spacing density */}
              <div>
                <label className="block text-[10px] font-bold text-brand-450 uppercase tracking-wider mb-2">Interface Density</label>
                <div className="flex gap-2">
                  {["default", "compact"].map(den => (
                    <button
                      key={den}
                      onClick={() => setAppearance(prev => ({ ...prev, density: den }))}
                      className={`px-4 py-2 border rounded-xl text-xs font-bold capitalize transition cursor-pointer ${
                        appearance.density === den 
                          ? "border-amber-400 bg-amber-50/10 text-amber-700 font-extrabold shadow-3xs" 
                          : "border-brand-200 text-brand-500 hover:border-brand-350"
                      }`}
                    >
                      {den}
                    </button>
                  ))}
                </div>
              </div>

              {/* Theme selectors */}
              <div>
                <label className="block text-[10px] font-bold text-brand-450 uppercase tracking-wider mb-2">Color Theme</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: "light", name: "Light Mode", desc: "Clean grey grids and white canvases." },
                    { id: "dark", name: "Dark Mode (Mock)", desc: "Sleek charcoal backdrops and glowing accents." },
                    { id: "auto", name: "System Sync", desc: "Adapts to local OS preference scheduler." }
                  ].map(thm => (
                    <div
                      key={thm.id}
                      onClick={() => setAppearance(prev => ({ ...prev, theme: thm.id }))}
                      className={`p-3.5 border rounded-xl transition cursor-pointer text-left ${
                        appearance.theme === thm.id 
                          ? "border-amber-400 bg-amber-50/10 ring-1 ring-amber-400/10 shadow-3xs" 
                          : "border-brand-150 hover:border-brand-200"
                      }`}
                    >
                      <h4 className="text-xs font-bold text-brand-900">{thm.name}</h4>
                      <p className="text-[10px] text-brand-450 mt-1 leading-normal">{thm.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Notifications */}
        {activeTab === "notifications" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-brand-900">Alert Notifications</h3>
              <p className="text-[11px] text-brand-450 mt-0.5">Toggle notification channels for upcoming assessment deadlines and sync events.</p>
            </div>

            <div className="space-y-3">
              {[
                { key: "interviews", title: "Interview Reminders", desc: "Notify via dashboard alerts 24 hours prior to technical and panel rounds." },
                { key: "digest", title: "Daily Sync Digest", desc: "Receive summary reports outlining recently auto-tracked timeline applications." },
                { key: "dueReminders", title: "Assessment Deadlines", desc: "Flag due dates and follow-ups on the dashboard widget header." }
              ].map(notif => (
                <div
                  key={notif.key}
                  onClick={() => setNotifications(prev => ({ ...prev, [notif.key]: !prev[notif.key] }))}
                  className="flex items-start gap-3.5 p-3.5 bg-brand-50/10 hover:bg-brand-50/20 border border-brand-150 rounded-xl transition cursor-pointer select-none"
                >
                  <input
                    type="checkbox"
                    checked={notifications[notif.key]}
                    onChange={() => {}} // handled by parent click trigger
                    className="w-4 h-4 rounded text-amber-500 border-brand-300 mt-0.5 accent-amber-500 pointer-events-none"
                  />
                  <div>
                    <h4 className="text-xs font-bold text-brand-850">{notif.title}</h4>
                    <p className="text-[10px] text-brand-450 mt-0.5 leading-relaxed">{notif.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab: Security */}
        {activeTab === "security" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-brand-900">Access & Security</h3>
              <p className="text-[11px] text-brand-450 mt-0.5">Configure access passwords and generate system developer API keys.</p>
            </div>

            <div className="space-y-5">
              {/* Change Password form */}
              <div className="space-y-3 max-w-sm">
                <h4 className="text-[10px] font-bold text-brand-450 uppercase tracking-wider">Change Password</h4>
                
                <div>
                  <input
                    type="password"
                    placeholder="Current Password"
                    value={security.currentPassword}
                    onChange={(e) => setSecurity(prev => ({ ...prev, currentPassword: e.target.value }))}
                    className="w-full border border-brand-200 rounded-xl px-3 py-1.5 text-xs text-brand-800 focus:outline-none"
                  />
                </div>

                <div>
                  <input
                    type="password"
                    placeholder="New Password"
                    value={security.newPassword}
                    onChange={(e) => setSecurity(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full border border-brand-200 rounded-xl px-3 py-1.5 text-xs text-brand-800 focus:outline-none"
                  />
                </div>

                <button 
                  onClick={() => {
                    if (security.currentPassword && security.newPassword) {
                      alert("Password updated successfully.");
                      setSecurity(prev => ({ ...prev, currentPassword: "", newPassword: "" }));
                    } else {
                      alert("Please fill current and new password values.");
                    }
                  }}
                  className="px-3.5 py-1.5 bg-brand-950 hover:bg-brand-900 text-white rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  Change Password
                </button>
              </div>

              {/* Developer API key */}
              <div className="pt-5 border-t border-brand-100 space-y-3">
                <h4 className="text-[10px] font-bold text-brand-450 uppercase tracking-wider">Developer API Key</h4>
                <p className="text-[10px] text-brand-450 leading-relaxed">Use this token to query your applications programmatically from custom automation daemons.</p>
                
                <div className="flex items-center gap-2 max-w-md bg-brand-50/50 border border-brand-200 px-3 py-2 rounded-xl">
                  <span className="font-mono text-xs text-brand-700 truncate">{security.apiKey}</span>
                  <button 
                    onClick={() => {
                      navigator.clipboard.writeText(security.apiKey);
                      alert("Copied API key to clipboard!");
                    }}
                    className="ml-auto text-[10px] font-bold text-amber-600 hover:text-amber-700 transition cursor-pointer shrink-0"
                  >
                    Copy Token
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Privacy */}
        {activeTab === "privacy" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-brand-900">Privacy & Controls</h3>
              <p className="text-[11px] text-brand-450 mt-0.5">Toggle visibility parameters and export your entire applications database.</p>
            </div>

            <div className="space-y-5">
              {/* Privacy toggles */}
              <div className="space-y-3">
                {[
                  { key: "shareData", title: "Anonymized Analytics Sharing", desc: "Allow CareerTrack to aggregate salary bands anonymously to build platform analytics reports." },
                  { key: "publicProfile", title: "Public Directory Listing", desc: "Publish target roles to index recruiters search feeds." }
                ].map(priv => (
                  <div
                    key={priv.key}
                    onClick={() => setPrivacy(prev => ({ ...prev, [priv.key]: !prev[priv.key] }))}
                    className="flex items-start gap-3.5 p-3.5 bg-brand-50/10 hover:bg-brand-50/20 border border-brand-150 rounded-xl transition cursor-pointer select-none"
                  >
                    <input
                      type="checkbox"
                      checked={privacy[priv.key]}
                      onChange={() => {}}
                      className="w-4 h-4 rounded text-amber-500 border-brand-300 mt-0.5 accent-amber-500 pointer-events-none"
                    />
                    <div>
                      <h4 className="text-xs font-bold text-brand-850">{priv.title}</h4>
                      <p className="text-[10px] text-brand-450 mt-0.5 leading-relaxed">{priv.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Exports / Reset zone */}
              <div className="pt-5 border-t border-brand-100 space-y-4">
                <h4 className="text-[10px] font-bold text-brand-450 uppercase tracking-wider">Document Backups</h4>
                
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={handleExportData}
                    className="flex items-center gap-1.5 px-4 py-2 border border-brand-200 hover:bg-brand-50 text-brand-700 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    <Download size={13} />
                    <span>Export Hunt Database (JSON)</span>
                  </button>

                  <button
                    onClick={() => {
                      if (confirm("Are you sure you want to delete all job tracking data? This cannot be undone.")) {
                        clearHunt();
                        alert("Board database cleared.");
                        window.location.href = "/";
                      }
                    }}
                    className="px-4 py-2 border border-rose-200 hover:bg-rose-50 text-rose-650 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    Clear Database
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Tab: Billing */}
        {activeTab === "billing" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-brand-900">Billing & Plans</h3>
              <p className="text-[11px] text-brand-450 mt-0.5">Review subscription plans, update cards, and access transaction statements.</p>
            </div>

            <div className="space-y-6">
              
              {/* Plan select block */}
              <div>
                <label className="block text-[10px] font-bold text-brand-450 uppercase tracking-wider mb-2">Subscription Tier</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { id: "free", name: "Free Tier", desc: "Up to 50 active applications tracked dynamically." },
                    { id: "pro", name: "CareerTrack Pro ($12/mo)", desc: "Unlimited tracks, Gmail sync, PDF scanner tools." }
                  ].map(pl => (
                    <div
                      key={pl.id}
                      onClick={() => setBilling(prev => ({ ...prev, plan: pl.id }))}
                      className={`p-3.5 border rounded-xl transition cursor-pointer text-left ${
                        billing.plan === pl.id 
                          ? "border-amber-400 bg-amber-50/10 ring-1 ring-amber-400/10 shadow-3xs" 
                          : "border-brand-150 hover:border-brand-200"
                      }`}
                    >
                      <h4 className="text-xs font-bold text-brand-900">{pl.name}</h4>
                      <p className="text-[10px] text-brand-450 mt-1 leading-normal">{pl.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Add payment card mock form */}
              <div className="pt-5 border-t border-brand-100 space-y-3.5">
                <h4 className="text-[10px] font-bold text-brand-450 uppercase tracking-wider">Save Card Credentials</h4>
                
                <form onSubmit={handleSaveCard} className="space-y-3.5 max-w-sm">
                  <div className="flex items-center bg-brand-50/50 border border-brand-200 rounded-xl px-3 py-1.5 shadow-2xs">
                    <CreditCard size={14} className="text-brand-400 mr-2 shrink-0" />
                    <input
                      type="text"
                      required
                      placeholder="Cardholder Name"
                      value={billing.cardName}
                      onChange={(e) => setBilling(prev => ({ ...prev, cardName: e.target.value }))}
                      className="w-full text-xs text-brand-800 outline-none bg-transparent placeholder-brand-400"
                    />
                  </div>

                  <div className="flex items-center bg-brand-50/50 border border-brand-200 rounded-xl px-3 py-1.5 shadow-2xs">
                    <input
                      type="text"
                      required
                      placeholder="Card Number (e.g. 4111 2222 3333 4444)"
                      value={billing.cardNumber}
                      onChange={(e) => setBilling(prev => ({ ...prev, cardNumber: e.target.value }))}
                      className="w-full text-xs text-brand-800 outline-none bg-transparent placeholder-brand-400"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center bg-brand-50/50 border border-brand-200 rounded-xl px-3 py-1.5 shadow-2xs">
                      <input
                        type="text"
                        required
                        placeholder="MM/YY"
                        value={billing.expiry}
                        onChange={(e) => setBilling(prev => ({ ...prev, expiry: e.target.value }))}
                        className="w-full text-xs text-brand-800 outline-none bg-transparent placeholder-brand-400"
                      />
                    </div>
                    <div className="flex items-center bg-brand-50/50 border border-brand-200 rounded-xl px-3 py-1.5 shadow-2xs">
                      <input
                        type="text"
                        required
                        placeholder="CVV"
                        value={billing.cvv}
                        onChange={(e) => setBilling(prev => ({ ...prev, cvv: e.target.value }))}
                        className="w-full text-xs text-brand-800 outline-none bg-transparent placeholder-brand-400"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="px-4 py-2 bg-brand-950 hover:bg-brand-900 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                  >
                    Save Card details
                  </button>
                </form>
              </div>

              {/* Invoices table list */}
              <div className="pt-5 border-t border-brand-100 space-y-2">
                <h4 className="text-[10px] font-bold text-brand-450 uppercase tracking-wider">Statement Invoices</h4>
                <div className="text-xs text-brand-450 py-3 bg-brand-50/10 border border-dashed border-brand-150 rounded-xl text-center">
                  No statement logs found. You are currently on the Free Tier plan.
                </div>
              </div>

            </div>
          </div>
        )}

        {/* Tab: Integrations */}
        {activeTab === "integrations" && (
          <div className="space-y-6">
            <div>
              <h3 className="text-sm font-bold text-brand-900">Webhooks & Sync</h3>
              <p className="text-[11px] text-brand-450 mt-0.5">Integrate third-party message notification boards or synchronize data extension hooks.</p>
            </div>

            <div className="space-y-5">
              
              {/* Webhooks config */}
              <div className="space-y-3.5 max-w-md">
                <h4 className="text-[10px] font-bold text-brand-450 uppercase tracking-wider">Slack webhook notifications</h4>
                <div className="flex items-center bg-brand-50/50 border border-brand-200 rounded-xl px-3 py-1.5 shadow-2xs">
                  <Globe size={13} className="text-brand-400 mr-2 shrink-0" />
                  <input
                    type="url"
                    placeholder="https://hooks.slack.com/services/..."
                    value={integrations.slackWebhook}
                    onChange={(e) => setIntegrations(prev => ({ ...prev, slackWebhook: e.target.value }))}
                    className="w-full text-xs text-brand-800 outline-none bg-transparent placeholder-brand-400"
                  />
                </div>

                <h4 className="text-[10px] font-bold text-brand-450 uppercase tracking-wider pt-2">Discord webhook channel</h4>
                <div className="flex items-center bg-brand-50/50 border border-brand-200 rounded-xl px-3 py-1.5 shadow-2xs">
                  <Globe size={13} className="text-brand-400 mr-2 shrink-0" />
                  <input
                    type="url"
                    placeholder="https://discord.com/api/webhooks/..."
                    value={integrations.discordWebhook}
                    onChange={(e) => setIntegrations(prev => ({ ...prev, discordWebhook: e.target.value }))}
                    className="w-full text-xs text-brand-800 outline-none bg-transparent placeholder-brand-400"
                  />
                </div>

                <button
                  onClick={() => {
                    alert("Webhook parameters saved successfully.");
                  }}
                  className="px-4 py-2 bg-brand-950 hover:bg-brand-900 text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                >
                  Save Integration webhooks
                </button>
              </div>

              {/* Sync status browser extension */}
              <div className="pt-5 border-t border-brand-100 space-y-3">
                <h4 className="text-[10px] font-bold text-brand-450 uppercase tracking-wider">Chrome Extension Sync</h4>
                <div className="flex items-center gap-3 p-4 border border-brand-150 rounded-xl bg-brand-50/10 max-w-md">
                  <div className="w-8 h-8 rounded-lg bg-brand-100 flex items-center justify-center text-brand-655 font-bold text-xs uppercase shrink-0">
                    Ext
                  </div>
                  <div>
                    <h5 className="text-xs font-bold text-brand-900">CareerTrack Sync Helper</h5>
                    <p className="text-[10px] text-brand-450 mt-0.5 leading-normal">Allows importing job detail cards directly when browsing LinkedIn or Indeed boards.</p>
                  </div>
                  <span className="ml-auto text-[9px] font-extrabold text-brand-500 bg-brand-100 px-2 py-0.5 rounded-full shrink-0 uppercase tracking-wide">
                    Inactive
                  </span>
                </div>
              </div>

            </div>
          </div>
        )}

      </div>

    </div>
  );
}