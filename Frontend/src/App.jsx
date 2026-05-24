import { Routes, Route, Navigate } from "react-router-dom";
import { ThemeProvider } from "./theme/ThemeProvider";
import AppLayout from "./components/AppLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import LandingPage from "./features/landing/LandingPage";
import AuthPage from "./features/auth/AuthPage";
import HomePage from "./features/home/HomePage";
import JournalsPage from "./features/journals/JournalsPage";
import ProductivityPage from "./features/productivity/ProductivityPage";
import InsightPage from "./features/insight/InsightPage";
import SpillAIPage from "./features/spill/SpillAIPage";

export default function MindlyApp() {
  return (
    <ThemeProvider>
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
          <Route index element={<Navigate to="/app/home" replace />} />
          <Route path="home" element={<HomePage />} />
          <Route path="journals/*" element={<JournalsPage />} />
          <Route path="productivity" element={<ProductivityPage />} />
          <Route path="insight" element={<InsightPage />} />
          <Route path="spill" element={<SpillAIPage />} />
          <Route path="spill/:chatId" element={<SpillAIPage />} />
        </Route>
      </Routes>
    </ThemeProvider>
  );
}
