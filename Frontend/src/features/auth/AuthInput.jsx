import { useState } from "react";
import { motion } from "framer-motion";

const LIGHT = {
  label: "rgba(45,43,61,0.5)",
  labelFocus: "rgba(124,92,252,0.7)",
  labelError: "#DC2626",
  border: "rgba(45,43,61,0.1)",
  borderFocus: "rgba(124,92,252,0.35)",
  borderError: "rgba(220,38,38,0.5)",
  bg: "rgba(255,255,255,0.55)",
  bgFocus: "rgba(255,255,255,0.75)",
  text: "rgba(45,43,61,0.85)",
  suffix: "rgba(45,43,61,0.25)",
  suffixFocus: "rgba(45,43,61,0.45)",
  shadow: "0 0 0 1px rgba(124,92,252,0.12), 0 0 20px rgba(124,92,252,0.06)",
};

const DARK = {
  label: "rgba(154,148,184,0.5)",
  labelFocus: "rgba(200,190,240,0.7)",
  labelError: "#EF4444",
  border: "rgba(255,255,255,0.06)",
  borderFocus: "rgba(108,71,255,0.4)",
  borderError: "rgba(239,68,68,0.5)",
  bg: "rgba(22,17,46,0.4)",
  bgFocus: "rgba(22,17,46,0.6)",
  text: "rgba(232,230,240,0.9)",
  suffix: "rgba(154,148,184,0.3)",
  suffixFocus: "rgba(200,190,240,0.5)",
  shadow: "0 0 0 1px rgba(108,71,255,0.15), 0 0 20px rgba(108,71,255,0.05)",
};

export default function AuthInput({
  isLight,
  label,
  type = "text",
  value,
  onChange,
  error,
  placeholder,
  suffix,
}) {
  const [focused, setFocused] = useState(false);
  const t = isLight ? LIGHT : DARK;
  const hasError = !!error;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <label
        style={{
          display: "block",
          fontSize: 11,
          fontWeight: 600,
          color: hasError ? t.labelError : focused ? t.labelFocus : t.label,
          marginBottom: 6,
          letterSpacing: "0.04em",
          textTransform: "uppercase",
          transition: "color 0.2s",
        }}
      >
        {label}
      </label>
      <div style={{ position: "relative" }}>
        <motion.input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          autoComplete="off"
          whileFocus={{ scale: 1.005 }}
          animate={
            hasError ? { x: [0, -4, 4, -2, 2, 0] } : { x: 0 }
          }
          transition={hasError ? { duration: 0.35 } : { duration: 0.2 }}
          style={{
            width: "100%",
            padding: "13px 16px",
            paddingRight: suffix ? 44 : 16,
            borderRadius: 10,
            border: "1px solid",
            borderColor: hasError
              ? t.borderError
              : focused
              ? t.borderFocus
              : t.border,
            background: focused ? t.bgFocus : t.bg,
            color: t.text,
            fontSize: 14,
            fontWeight: 450,
            transition: "border-color 0.25s, background 0.25s",
            boxSizing: "border-box",
            outline: "none",
            backdropFilter: "blur(8px)",
            WebkitBackdropFilter: "blur(8px)",
            boxShadow: focused && !hasError ? t.shadow : "none",
          }}
        />
        {suffix && (
          <div
            style={{
              position: "absolute",
              right: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: focused ? t.suffixFocus : t.suffix,
              display: "flex",
              transition: "color 0.2s",
            }}
          >
            {suffix}
          </div>
        )}
      </div>
      {hasError && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          style={{
            fontSize: 11,
            color: t.labelError,
            margin: "5px 0 0",
            fontWeight: 500,
            letterSpacing: "0.01em",
          }}
        >
          {error}
        </motion.p>
      )}
    </motion.div>
  );
}
