import { useState, useCallback } from "react";
import { Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import AuthInput from "./AuthInput";
import GoogleButton from "./GoogleButton";
import "../../styles/auth/index.css";

const INPUTS = {
  login: ["email", "password"],
  signup: ["firstName", "lastName", "email", "password", "confirmPassword"],
};

const slideFade = {
  enter: { opacity: 0, y: 8 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

function ModeTab({ active, label, onClick }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      className={`mode-tab-btn${active ? " active" : ""}`}
    >
      {label}
      {active && (
        <motion.div
          layoutId="modeIndicator"
          className="mode-tab-indicator"
          style={{ background: "linear-gradient(90deg, var(--color-primary), color-mix(in srgb, var(--color-secondary) 60%, transparent))" }}
          transition={{ type: "spring", stiffness: 450, damping: 28 }}
        />
      )}
    </motion.button>
  );
}

function LoginForm({ formData, errors, showPassword, onTogglePassword, handleChange, t }) {
  return (
    <div className="auth-panel-form">
      <AuthInput
        label={t("auth.panel.labels.email")}
        type="email"
        value={formData.email || ""}
        onChange={handleChange("email")}
        error={errors.email}
        placeholder={t("auth.panel.placeholders.email")}
      />
      <div>
        <AuthInput
          label={t("auth.panel.labels.password")}
          type={showPassword ? "text" : "password"}
          value={formData.password || ""}
          onChange={handleChange("password")}
          error={errors.password}
          placeholder={t("auth.panel.placeholders.password")}
          suffix={
            <button
              type="button"
              onClick={onTogglePassword}
              className="eye-btn"
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />
        <p
          className="auth-panel-forgot"
          style={{ color: "var(--color-muted)" }}
        >
          {t("auth.panel.forgotPassword")}
        </p>
      </div>
    </div>
  );
}

function SignUpForm({ formData, errors, showPassword, showConfirm, onTogglePassword, onToggleConfirm, handleChange, t }) {
  return (
    <div className="auth-panel-form">
      <div className="auth-panel-name-row">
        <AuthInput
          label={t("auth.panel.labels.firstName")}
          value={formData.firstName || ""}
          onChange={handleChange("firstName")}
          error={errors.firstName}
          placeholder={t("auth.panel.placeholders.firstName")}
        />
        <AuthInput
          label={t("auth.panel.labels.lastName")}
          value={formData.lastName || ""}
          onChange={handleChange("lastName")}
          error={errors.lastName}
          placeholder={t("auth.panel.placeholders.lastName")}
        />
      </div>
      <AuthInput
        label={t("auth.panel.labels.email")}
        type="email"
        value={formData.email || ""}
        onChange={handleChange("email")}
        error={errors.email}
        placeholder={t("auth.panel.placeholders.email")}
      />
      <AuthInput
        label={t("auth.panel.labels.password")}
        type={showPassword ? "text" : "password"}
        value={formData.password || ""}
        onChange={handleChange("password")}
        error={errors.password}
        placeholder={t("auth.panel.placeholders.password")}
        suffix={
          <button
            type="button"
            onClick={onTogglePassword}
            className="eye-btn"
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        }
      />
      <AuthInput
        label={t("auth.panel.labels.confirmPassword")}
        type={showConfirm ? "text" : "password"}
        value={formData.confirmPassword || ""}
        onChange={handleChange("confirmPassword")}
        error={errors.confirmPassword}
        placeholder={t("auth.panel.placeholders.confirmPassword")}
        suffix={
          <button
            type="button"
            onClick={onToggleConfirm}
            className="eye-btn"
            tabIndex={-1}
          >
            {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        }
      />
    </div>
  );
}

export default function AuthPanel({
  isLight,
  mode,
  onModeChange,
  formData,
  errors,
  serverError,
  submitting,
  onSubmit,
  handleChange,
  onGoogleAuth,
}) {
  const { t } = useTranslation();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const handleModeClick = useCallback((key) => {
    onModeChange(key);
  }, [onModeChange]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
      className="auth-panel-root"
      style={{ background: isLight ? "rgba(244,241,248,0.6)" : "rgba(10,10,26,0.5)" }}
    >
      <div
        className="auth-panel-glow"
        style={{
          background: isLight
            ? "radial-gradient(circle, rgba(124,92,252,0.06) 0%, transparent 60%)"
            : "radial-gradient(circle, rgba(108,71,255,0.04) 0%, transparent 60%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.35, ease: "easeOut" }}
        className="auth-panel-card-wrap"
      >
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(mode); }}>
          <div
            className="auth-panel-card"
            style={{
              border: `1px solid ${isLight ? "rgba(45,43,61,0.06)" : "rgba(255,255,255,0.05)"}`,
              background: isLight ? "rgba(255,255,255,0.65)" : "rgba(22,17,46,0.6)",
              boxShadow: isLight
                ? "0 8px 32px rgba(45,43,61,0.06), 0 0 0 1px rgba(255,255,255,0.5) inset"
                : "0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.02) inset",
            }}
          >
            <div
              className="auth-panel-tabs"
              style={{
                borderBottom: `1px solid ${isLight ? "rgba(45,43,61,0.05)" : "rgba(255,255,255,0.04)"}`,
                color: isLight ? "rgba(45,43,61,0.85)" : "rgba(232,230,240,0.9)",
              }}
            >
              <ModeTab
                  key="login"
                  active={mode === "login"}
                  label={t("auth.panel.signIn")}
                  onClick={() => handleModeClick("login")}
                />
                <ModeTab
                  key="signup"
                  active={mode === "signup"}
                  label={t("auth.panel.createAccount")}
                  onClick={() => handleModeClick("signup")}
                />
            </div>

            <div className="auth-panel-body">
              <AnimatePresence mode="wait">
                {mode === "login" ? (
                  <motion.div
                    key="login"
                    variants={slideFade}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.2 }}
                  >
                    <LoginForm
                      formData={formData}
                      errors={errors}
                      showPassword={showPassword}
                      onTogglePassword={() => setShowPassword(v => !v)}
                      handleChange={handleChange}
                      t={t}
                    />
                  </motion.div>
                ) : (
                  <motion.div
                    key="signup"
                    variants={slideFade}
                    initial="enter"
                    animate="center"
                    exit="exit"
                    transition={{ duration: 0.2 }}
                  >
                    <SignUpForm
                      formData={formData}
                      errors={errors}
                      showPassword={showPassword}
                      showConfirm={showConfirm}
                      onTogglePassword={() => setShowPassword(v => !v)}
                      onToggleConfirm={() => setShowConfirm(v => !v)}
                      handleChange={handleChange}
                      t={t}
                    />
                  </motion.div>
                )}
              </AnimatePresence>

              {serverError && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 10,
                    marginTop: 14,
                    fontSize: 12,
                    fontWeight: 500,
                    lineHeight: 1.4,
                    background: isLight ? "rgba(220,38,38,0.08)" : "rgba(239,68,68,0.1)",
                    border: `1px solid ${isLight ? "rgba(220,38,38,0.15)" : "rgba(239,68,68,0.2)"}`,
                    color: isLight ? "#DC2626" : "#EF4444",
                  }}
                >
                  {serverError}
                </motion.div>
              )}

              <motion.div
                animate={{ marginTop: 20 }}
                transition={{ duration: 0.2 }}
              >
                <motion.button
                  type="submit"
                  disabled={submitting}
                  whileHover={submitting ? {} : { scale: 1.015, boxShadow: isLight ? "0 0 30px rgba(124,92,252,0.2)" : "0 0 30px rgba(108,71,255,0.15)" }}
                  whileTap={submitting ? {} : { scale: 0.985 }}
                  className="auth-panel-submit-btn"
                  style={{
                    background: isLight
                      ? "linear-gradient(135deg, rgba(124,92,252,0.85), rgba(167,139,250,0.55))"
                      : "linear-gradient(135deg, rgba(108,71,255,0.85), rgba(74,58,138,0.65))",
                    color: isLight ? "rgba(255,255,255,0.95)" : "rgba(232,230,240,0.95)",
                    boxShadow: isLight ? "0 0 20px rgba(124,92,252,0.12)" : "0 0 20px rgba(108,71,255,0.08)",
                    opacity: submitting ? 0.7 : 1,
                    cursor: submitting ? "not-allowed" : "pointer",
                  }}
                >
                  {submitting ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                      className="auth-panel-spinner"
                    >
                      <Loader2 size={18} />
                    </motion.div>
                  ) : (
                    <>
                      {mode === "login" ? t("auth.panel.signIn") : t("auth.panel.createAccount")}
                      <ArrowRight size={16} />
                    </>
                  )}
                </motion.button>
              </motion.div>

              <div className="auth-panel-divider">
                <div
                  className="auth-panel-divider-line"
                  style={{ background: isLight ? "rgba(45,43,61,0.06)" : "rgba(255,255,255,0.06)" }}
                />
                <span
                  className="auth-panel-divider-text"
                  style={{ color: isLight ? "rgba(45,43,61,0.25)" : "rgba(154,148,184,0.35)" }}
                >
                  {t("auth.panel.or")}
                </span>
                <div
                  className="auth-panel-divider-line"
                  style={{ background: isLight ? "rgba(45,43,61,0.06)" : "rgba(255,255,255,0.06)" }}
                />
              </div>

              <div className="auth-panel-google-wrap">
                <GoogleButton isLight={isLight} onSuccess={onGoogleAuth} onError={(e) => console.error(e)} />
              </div>
            </div>
          </div>
        </form>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="auth-panel-footer"
          style={{
            color: isLight ? "rgba(45,43,61,0.2)" : "rgba(154,148,184,0.3)",
          }}
        >
          {mode === "login"
            ? t("auth.panel.footerSignIn")
            : t("auth.panel.footerCreate")}
        </motion.p>
      </motion.div>
    </motion.div>
  );
}
