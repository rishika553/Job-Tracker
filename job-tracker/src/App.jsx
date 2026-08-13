import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import DashboardLayout from "./layouts/DashboardLayout";
import { JobTrackerProvider } from "./context/JobTrackerContext";
import { AuthProvider } from "./context/AuthContext";
import ErrorBoundary from "./components/ErrorBoundary";

function App() {
  return (
    <ErrorBoundary>
      <AuthProvider>
        <JobTrackerProvider>
          <BrowserRouter>
            <DashboardLayout>
              <AppRoutes />
            </DashboardLayout>
          </BrowserRouter>
        </JobTrackerProvider>
      </AuthProvider>
    </ErrorBoundary>
  );
}

export default App;