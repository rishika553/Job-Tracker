import { Routes, Route } from "react-router-dom";

import Dashboard from "../pages/Dashboard";
import Application from "../pages/Application";
import ApplicationDetails from "../pages/ApplicationDetails";
import Pipeline from "../pages/Pipeline";
import Analytics from "../pages/Analytics";
import Calendar from "../pages/Calendar";
import Companies from "../pages/Companies";
import Resume from "../pages/Resume";
import Notifications from "../pages/Notifications";
import AIInsights from "../pages/AIInsights";
import Setting from "../pages/Setting";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Dashboard />} />
      <Route path="/applications" element={<Application />} />
      <Route path="/applications/:id" element={<ApplicationDetails />} />
      <Route path="/pipeline" element={<Pipeline />} />
      <Route path="/analytics" element={<Analytics />} />
      <Route path="/calendar" element={<Calendar />} />
      <Route path="/companies" element={<Companies />} />
      <Route path="/resume" element={<Resume />} />
      <Route path="/notifications" element={<Notifications />} />
      <Route path="/ai" element={<AIInsights />} />
      <Route path="/settings" element={<Setting />} />
    </Routes>
  );
}
// Trigger route rebuild for Notifications Center