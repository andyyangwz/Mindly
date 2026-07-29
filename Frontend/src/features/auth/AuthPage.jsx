import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Sun, Moon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../theme/ThemeProvider";
import AtmospherePanel from "./AtmospherePanel";
import AuthPanel from "./AuthPanel";
import "../../styles/auth/index.css";

export default function AuthPage() {
  const { t, i18n } = useTranslation();
  const [mode, setMode] = useState("login");
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { login, signup, googleLogin, user } = useAuth();
  const { resolvedTheme, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const isLight = resolvedTheme === "light";

  useEffect(() => {
    if (user) {
      navigate("/app/dashboard", { replace: true });
    }
  }, [user, navigate]);

  const handleModeChange = useCallback((newMode) => {
    if (newMode === mode) return;
    setErrors({});
    setServerError("");
    setFormData({ firstName: "", lastName: "", email: "", password: "", confirmPassword: "" });
    setMode(newMode);
  }, [mode]);

  function validate() {
    const errs = {};
    if (mode === "signup") {
      if (!formData.firstName || formData.firstName.length < 2)
        errs.firstName = t("auth.page.firstNameError");
      if (!formData.lastName || formData.lastName.length < 2)
        errs.lastName = t("auth.page.lastNameError");
      if (!formData.email || !formData.email.includes("@"))
        errs.email = t("auth.page.emailError");
      if (!formData.password || formData.password.length < 6)
        errs.password = t("auth.page.passwordError");
      if (formData.password !== formData.confirmPassword)
        errs.confirmPassword = t("auth.page.confirmError");
    } else {
      if (!formData.email) errs.email = t("auth.page.emailRequired");
      if (!formData.password) errs.password = t("auth.page.passwordRequired");
    }
    return errs;
  }

  async function handleSubmit(currentMode) {
    setServerError("");

    const validationErrors = validate();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    try {
      if (currentMode === "login") {
        await login(formData.email, formData.password);
      } else {
        await signup(formData.firstName, formData.lastName, formData.email, formData.email, formData.password);
      }
      navigate("/app/dashboard", { replace: true });
    } catch (err) {
      const msg =
        err.response?.error ||
        err.response?.message ||
        err.message ||
        t("auth.page.serverError");
      setServerError(msg);
    } finally {
      setSubmitting(false);
    }
  }

  async function handleGoogleAuth(credential) {
    setServerError("");
    setSubmitting(true);
    try {
      await googleLogin(credential);
    } catch (err) {
      const msg =
        err.response?.error ||
        err.message ||
        t("auth.page.googleError");
      setServerError(msg);
      setSubmitting(false);
    }
  }

  const handleChange = useCallback((field) => {
    return (value) => {
      setFormData((prev) => ({ ...prev, [field]: value }));
    };
  }, []);

  return (
    <>
      <button
        onClick={() => {
          const next = i18n.language?.startsWith("id") ? "en" : "id"
          i18n.changeLanguage(next)
        }}
        aria-label={i18n.language?.startsWith("id") ? "Switch to English" : "Beralih ke Bahasa Indonesia"}
        className="fixed-btn-base"
        style={{ right: 76, fontFamily: "'Poppins', system-ui, sans-serif" }}
      >
        {i18n.language?.startsWith("id") ? "ID" : "EN"}
      </button>
      <button
        onClick={toggleTheme}
        aria-label={isLight ? t("landing.themeToggle.darkMode") : t("landing.themeToggle.lightMode")}
        className="fixed-btn-base"
        style={{ right: 24 }}
      >
        {isLight ? <Moon size={16} /> : <Sun size={16} />}
      </button>
    <div
      className="auth-page-root"
      style={{ background: isLight ? "#F4F1F8" : "#0A0A1A" }}
    >
      <AtmospherePanel isLight={isLight} />
      <AuthPanel
        isLight={isLight}
        mode={mode}
        onModeChange={handleModeChange}
        formData={formData}
        errors={errors}
        serverError={serverError}
        submitting={submitting}
        onSubmit={handleSubmit}
        handleChange={handleChange}
        onGoogleAuth={handleGoogleAuth}
      />
    </div>
    </>
  );
}
