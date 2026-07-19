import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import DashboardLayout from "./layouts/DashboardLayout";
import { JobTrackerProvider } from "./context/JobTrackerContext";

function App() {
  return (
    <JobTrackerProvider>
      <BrowserRouter>
        <DashboardLayout>
          <AppRoutes />
        </DashboardLayout>
      </BrowserRouter>
    </JobTrackerProvider>
  );
}

export default App;