import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import DashboardLayout from "./layouts/DashboardLayout";
import { JobTrackerProvider } from "./context/JobTrackerContext";
import { AuthProvider } from "./context/AuthContext";

function App() {
  return (
    <AuthProvider>
      <JobTrackerProvider>
        <BrowserRouter>
          <DashboardLayout>
            <AppRoutes />
          </DashboardLayout>
        </BrowserRouter>
      </JobTrackerProvider>
    </AuthProvider>
  );
}

export default App;