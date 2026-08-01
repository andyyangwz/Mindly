import { Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./theme/ThemeProvider";
import { TutorialProvider } from "./components/tutorial/TutorialContext";
import AppLayout from "./components/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import LandingPage from "./features/landing/LandingPage";
import AuthPage from "./features/auth/AuthPage";
import DashboardPage from "./features/dashboard/DashboardPage";
import JournalsPage from "./features/journals/JournalsPage";
import SchedulingPage from "./features/scheduling/SchedulingPage";
import AIPlanningPage from "./features/scheduling/AIPlanningPage";
import InsightPage from "./features/insight/InsightPage";
import SpillAIPage from "./features/spill/SpillAIPage";
import ProgressTrackerPage from "./features/progressTracker/ProgressTrackerPage";
import ToastContainer from "./components/ui/Toast";

export default function MindlyApp() {
  return (
    <TutorialProvider>
    <ThemeProvider>
      <ToastContainer />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<Navigate to="/app/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="journals/*" element={<JournalsPage />} />
          <Route path="scheduling" element={<SchedulingPage />} />
          <Route path="ai-planning" element={<AIPlanningPage />} />
          <Route path="insight" element={<InsightPage />} />
          <Route path="progress-tracker" element={<ProgressTrackerPage />} />
          <Route path="spill" element={<SpillAIPage />} />
          <Route path="spill/:chatId" element={<SpillAIPage />} />
        </Route>
      </Routes>
    </ThemeProvider>
    </TutorialProvider>
  );
}
