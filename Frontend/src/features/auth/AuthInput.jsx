import { useState } from "react";
import { motion } from "framer-motion";
import "../../styles/auth/index.css";

export default function AuthInput({
  label,
  type = "text",
  value,
  onChange,
  error,
  placeholder,
  suffix,
}) {
  const [focused, setFocused] = useState(false);
  const hasError = !!error;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <label
        className={`auth-input-label${focused ? " focused" : ""}${hasError ? " error" : ""}`}
      >
        {label}
      </label>
      <div className="auth-input-wrap">
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
          className={`auth-input-field${hasError ? " error" : ""}`}
          style={{ paddingRight: suffix ? 44 : 16 }}
        />
        {suffix && (
          <div className="auth-input-suffix">
            {suffix}
          </div>
        )}
      </div>
      {hasError && (
        <motion.p
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="auth-input-error"
        >
          {error}
        </motion.p>
      )}
    </motion.div>
  );
}
