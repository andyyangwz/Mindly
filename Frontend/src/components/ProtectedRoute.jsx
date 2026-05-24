import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { theme } from "../theme";
import { Loader2 } from "lucide-react";

export default function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          height: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: theme.bg,
        }}
      >
        <Loader2
          size={28}
          style={{
            color: theme.primary,
            animation: "spin 0.8s linear infinite",
          }}
        />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return children;
}
