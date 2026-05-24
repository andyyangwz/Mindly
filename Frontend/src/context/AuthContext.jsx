import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authService } from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem("mindly-token");
    if (token) {
      authService
        .getMe()
        .then((data) => setUser(data.user))
        .catch(() => {
          localStorage.removeItem("mindly-token");
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (loginId, password) => {
    const data = await authService.login(loginId, password);
    localStorage.setItem("mindly-token", data.token);
    setUser(data.user);
  }, []);

  const signup = useCallback(async (firstName, lastName, username, email, password) => {
    const data = await authService.signup(firstName, lastName, username, email, password);
    localStorage.setItem("mindly-token", data.token);
    setUser(data.user);
  }, []);

  const googleLogin = useCallback(async (credential) => {
    const data = await authService.googleLogin(credential);
    localStorage.setItem("mindly-token", data.token);
    setUser(data.user);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("mindly-token");
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, googleLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
