import { useState, useCallback } from "react";
import { Eye, EyeOff, ArrowRight, Loader2 } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { useTranslation } from "react-i18next";
import AuthInput from "./AuthInput";
import GoogleButton from "./GoogleButton";

const INPUTS = {
  login: ["email", "password"],
  signup: ["firstName", "lastName", "email", "password", "confirmPassword"],
};

const slideFade = {
  enter: { opacity: 0, y: 8 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

function ModeTab({ active, label, onClick, t, isLight }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.97 }}
      style={{
        flex: 1,
        padding: "14px 0",
        textAlign: "center",
        fontWeight: 600,
        fontSize: 13,
        letterSpacing: "0.03em",
        border: "none",
        cursor: "pointer",
        background: "transparent",
        color: active ? "inherit" : "inherit",
        opacity: active ? 1 : 0.4,
        position: "relative",
        transition: "opacity 0.3s",
      }}
    >
      {label}
      {active && (
        <motion.div
          layoutId="modeIndicator"
          style={{
            position: "absolute",
            bottom: 0,
            left: "20%",
            right: "20%",
            height: 2,
            borderRadius: 1,
          }}
          transition={{ type: "spring", stiffness: 450, damping: 28 }}
        />
      )}
    </motion.button>
  );
}

function LoginForm({ isLight, formData, errors, showPassword, onTogglePassword, handleChange, t }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <AuthInput
        isLight={isLight}
        label={t("auth.panel.labels.email")}
        type="email"
        value={formData.email || ""}
        onChange={handleChange("email")}
        error={errors.email}
        placeholder={t("auth.panel.placeholders.email")}
      />
      <div>
        <AuthInput
          isLight={isLight}
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
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                padding: 4,
                color: "inherit",
                display: "flex",
              }}
              tabIndex={-1}
            >
              {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          }
        />
        <p
          style={{
            textAlign: "right",
            fontSize: 12,
            color: isLight ? "rgba(45,43,61,0.3)" : "rgba(154,148,184,0.45)",
            margin: "10px 0 0",
            cursor: "default",
          }}
        >
          {t("auth.panel.forgotPassword")}
        </p>
      </div>
    </div>
  );
}

function SignUpForm({ isLight, formData, errors, showPassword, showConfirm, onTogglePassword, onToggleConfirm, handleChange, t }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
        <AuthInput
          isLight={isLight}
          label={t("auth.panel.labels.firstName")}
          value={formData.firstName || ""}
          onChange={handleChange("firstName")}
          error={errors.firstName}
          placeholder={t("auth.panel.placeholders.firstName")}
        />
        <AuthInput
          isLight={isLight}
          label={t("auth.panel.labels.lastName")}
          value={formData.lastName || ""}
          onChange={handleChange("lastName")}
          error={errors.lastName}
          placeholder={t("auth.panel.placeholders.lastName")}
        />
      </div>
      <AuthInput
        isLight={isLight}
        label={t("auth.panel.labels.email")}
        type="email"
        value={formData.email || ""}
        onChange={handleChange("email")}
        error={errors.email}
        placeholder={t("auth.panel.placeholders.email")}
      />
      <AuthInput
        isLight={isLight}
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
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 4,
              color: "inherit",
              display: "flex",
            }}
            tabIndex={-1}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        }
      />
      <AuthInput
        isLight={isLight}
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
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 4,
              color: "inherit",
              display: "flex",
            }}
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

  const c = isLight
    ? {
        panelBg: "rgba(255,255,255,0.65)",
        panelBorder: "rgba(45,43,61,0.06)",
        panelShadow: "0 8px 32px rgba(45,43,61,0.06), 0 0 0 1px rgba(255,255,255,0.5) inset",
        tabBorder: "rgba(45,43,61,0.05)",
        indicator: "linear-gradient(90deg, rgba(124,92,252,0.5), rgba(167,139,250,0.3))",
        glow: "radial-gradient(circle, rgba(124,92,252,0.06) 0%, transparent 60%)",
        btnBg: "linear-gradient(135deg, rgba(124,92,252,0.85), rgba(167,139,250,0.55))",
        btnText: "rgba(255,255,255,0.95)",
        btnShadow: "0 0 20px rgba(124,92,252,0.12)",
        btnHoverShadow: "0 0 30px rgba(124,92,252,0.2)",
        errorBg: "rgba(220,38,38,0.08)",
        errorBorder: "rgba(220,38,38,0.15)",
        errorText: "#DC2626",
        footerText: "rgba(45,43,61,0.2)",
        textColor: "rgba(45,43,61,0.85)",
        mutedColor: "rgba(45,43,61,0.4)",
      }
    : {
        panelBg: "rgba(22,17,46,0.6)",
        panelBorder: "rgba(255,255,255,0.05)",
        panelShadow: "0 8px 32px rgba(0,0,0,0.3), 0 0 0 1px rgba(255,255,255,0.02) inset",
        tabBorder: "rgba(255,255,255,0.04)",
        indicator: "linear-gradient(90deg, rgba(108,71,255,0.6), rgba(74,58,138,0.4))",
        glow: "radial-gradient(circle, rgba(108,71,255,0.04) 0%, transparent 60%)",
        btnBg: "linear-gradient(135deg, rgba(108,71,255,0.85), rgba(74,58,138,0.65))",
        btnText: "rgba(232,230,240,0.95)",
        btnShadow: "0 0 20px rgba(108,71,255,0.08)",
        btnHoverShadow: "0 0 30px rgba(108,71,255,0.15)",
        errorBg: "rgba(239,68,68,0.1)",
        errorBorder: "rgba(239,68,68,0.2)",
        errorText: "#EF4444",
        footerText: "rgba(154,148,184,0.3)",
        textColor: "rgba(232,230,240,0.9)",
        mutedColor: "rgba(154,148,184,0.45)",
      };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.6, delay: 0.2, ease: "easeOut" }}
      style={{
        flex: "1 1 45%",
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 40,
        position: "relative",
        background: isLight ? "rgba(244,241,248,0.6)" : "rgba(10,10,26,0.5)",
      }}
    >
      {/* Glow behind card */}
      <div
        style={{
          position: "absolute",
          width: 500,
          height: 500,
          left: "50%",
          top: "50%",
          transform: "translate(-50%, -50%)",
          background: c.glow,
          pointerEvents: "none",
        }}
      />

      {/* Glass card */}
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.35, ease: "easeOut" }}
        style={{
          width: "100%",
          maxWidth: 420,
          position: "relative",
          zIndex: 1,
        }}
      >
        <form onSubmit={(e) => { e.preventDefault(); onSubmit(mode); }}>
          <div
            style={{
              borderRadius: 16,
              border: `1px solid ${c.panelBorder}`,
              background: c.panelBg,
              backdropFilter: "blur(24px)",
              WebkitBackdropFilter: "blur(24px)",
              overflow: "hidden",
              boxShadow: c.panelShadow,
            }}
          >
            {/* Mode tabs */}
            <div
              style={{
                display: "flex",
                borderBottom: `1px solid ${c.tabBorder}`,
                color: c.textColor,
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

            {/* Form body */}
            <div style={{ padding: "28px 32px 32px" }}>
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
                      isLight={isLight}
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
                      isLight={isLight}
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

              {/* Server error */}
              {serverError && (
                <motion.div
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{
                    padding: "10px 14px",
                    borderRadius: 10,
                    marginTop: 14,
                    background: c.errorBg,
                    border: `1px solid ${c.errorBorder}`,
                    color: c.errorText,
                    fontSize: 12,
                    fontWeight: 500,
                    lineHeight: 1.4,
                  }}
                >
                  {serverError}
                </motion.div>
              )}

              {/* Submit button */}
              <motion.div
                animate={{ marginTop: mode === "signup" || serverError ? 20 : 20 }}
                transition={{ duration: 0.2 }}
              >
                <motion.button
                  type="submit"
                  disabled={submitting}
                  whileHover={submitting ? {} : { scale: 1.015, boxShadow: c.btnHoverShadow }}
                  whileTap={submitting ? {} : { scale: 0.985 }}
                  style={{
                    width: "100%",
                    padding: "14px 24px",
                    borderRadius: 10,
                    border: "none",
                    background: c.btnBg,
                    color: c.btnText,
                    fontSize: 14,
                    fontWeight: 600,
                    letterSpacing: "0.02em",
                    cursor: submitting ? "not-allowed" : "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 8,
                    boxShadow: c.btnShadow,
                    opacity: submitting ? 0.7 : 1,
                    outline: "none",
                  }}
                >
                  {submitting ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
                      style={{ display: "flex" }}
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

              {/* Divider */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 16,
                  marginTop: 20,
                }}
              >
                <div style={{ flex: 1, height: 1, background: isLight ? "rgba(45,43,61,0.06)" : "rgba(255,255,255,0.06)" }} />
                <span
                  style={{
                    fontSize: 11,
                    color: isLight ? "rgba(45,43,61,0.25)" : "rgba(154,148,184,0.35)",
                    fontWeight: 500,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                  }}
                >
                  {t("auth.panel.or")}
                </span>
                <div style={{ flex: 1, height: 1, background: isLight ? "rgba(45,43,61,0.06)" : "rgba(255,255,255,0.06)" }} />
              </div>

              {/* Google button */}
              <div style={{ marginTop: 16 }}>
                <GoogleButton isLight={isLight} onSuccess={onGoogleAuth} onError={(e) => console.error(e)} />
              </div>
            </div>
          </div>
        </form>

        {/* Footer text */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          style={{
            textAlign: "center",
            fontSize: 11,
            color: c.footerText,
            margin: "20px 0 0",
            fontWeight: 500,
            letterSpacing: "0.04em",
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
