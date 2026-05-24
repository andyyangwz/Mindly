import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Wand2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import IconPicker, { resolveIcon } from "./IconPicker";

export default function CreateRelicModal({ open, onClose, onCreated }) {
  const { t } = useTranslation();
  const [icon, setIcon] = useState("FaStar");
  const [title, setTitle] = useState("");
  const [currentProgress, setCurrentProgress] = useState(0);
  const [target, setTarget] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const titleRef = useRef(null);

  useEffect(() => {
    if (open) {
      setIcon("FaStar");
      setTitle("");
      setCurrentProgress(0);
      setTarget("");
      setErrors({});
      setTimeout(() => titleRef.current?.focus(), 150);
    }
  }, [open]);

  const handleSubmit = useCallback(async () => {
    const errs = {};
    if (!title.trim()) errs.title = "Name is required";
    const tgt = parseInt(target, 10);
    if (!target || isNaN(tgt) || tgt <= 0) errs.target = "Target required";
    if (currentProgress < 0) errs.current = "Cannot be negative";

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    try {
      await onCreated({
        icon,
        title: title.trim(),
        current_progress: currentProgress,
        target: tgt,
      });
      onClose();
    } catch (e) {
      setErrors({ submit: e.message || "Failed to create" });
    } finally {
      setSubmitting(false);
    }
  }, [icon, title, currentProgress, target, onCreated, onClose]);

  const PreviewIcon = resolveIcon(icon);
  const pctPreview = target && parseInt(target, 10) > 0
    ? Math.min(Math.round((currentProgress / parseInt(target, 10)) * 100), 100)
    : 0;

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(8px)",
        zIndex: 900,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{
          background: "rgba(18,14,30,0.95)",
          borderRadius: 18,
          border: "1px solid rgba(255,255,255,0.04)",
          padding: "24px",
          width: 480,
          maxWidth: "90vw",
          maxHeight: "85vh",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.02) inset",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: "linear-gradient(135deg, rgba(108,71,255,0.25), rgba(108,71,255,0.05))",
              border: "1px solid rgba(108,71,255,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Wand2 size={14} color="rgba(200,190,240,0.7)" />
            </div>
            <div>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: "rgba(232,230,240,0.9)", margin: 0 }}>
                Forge New Relic
              </h2>
              <p style={{ fontSize: 11, color: "rgba(154,148,184,0.5)", margin: "1px 0 0" }}>
                Craft a personal growth ability
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{
              width: 28, height: 28, borderRadius: 8,
              border: "none", cursor: "pointer",
              background: "rgba(255,255,255,0.03)",
              color: "rgba(154,148,184,0.5)",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <X size={14} />
          </button>
        </div>

        <div style={{ display: "flex", gap: 16, overflow: "auto", flex: 1 }}>
          {/* Left: form */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 14 }}>
            {/* Icon picker */}
            <div>
              <label style={{ fontSize: 10, fontWeight: 600, color: "rgba(154,148,184,0.5)", marginBottom: 6, display: "block", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                Icon
              </label>
              <IconPicker value={icon} onChange={setIcon} />
            </div>

            {/* Title */}
            <div>
              <label style={{ fontSize: 10, fontWeight: 600, color: "rgba(154,148,184,0.5)", marginBottom: 6, display: "block", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                Name
              </label>
              <input
                ref={titleRef}
                type="text"
                placeholder="e.g. Morning Reading"
                value={title}
                onChange={(e) => { setTitle(e.target.value); setErrors((p) => ({ ...p, title: null })); }}
                style={{
                  width: "100%", boxSizing: "border-box",
                  padding: "10px 14px", borderRadius: 10,
                  border: errors.title ? "1px solid rgba(239,68,68,0.4)" : "1px solid rgba(255,255,255,0.06)",
                  background: "rgba(255,255,255,0.03)",
                  color: "rgba(232,230,240,0.85)",
                  fontSize: 13, outline: "none",
                }}
              />
              {errors.title && <span style={{ fontSize: 10, color: "#EF4444", marginTop: 2 }}>{errors.title}</span>}
            </div>

            {/* Progress + Target */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
              <div>
                <label style={{ fontSize: 10, fontWeight: 600, color: "rgba(154,148,184,0.5)", marginBottom: 6, display: "block", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                  Current
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={String(currentProgress)}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === "") { setCurrentProgress(0); return; }
                    if (!/^\d+$/.test(raw)) return;
                    setCurrentProgress(parseInt(raw.replace(/^0+/, ""), 10) || 0);
                  }}
                  style={{
                    width: "100%", boxSizing: "border-box",
                    padding: "10px 14px", borderRadius: 10,
                    border: "1px solid rgba(255,255,255,0.06)",
                    background: "rgba(255,255,255,0.03)",
                    color: "rgba(232,230,240,0.85)",
                    fontSize: 13, outline: "none",
                  }}
                />
              </div>
              <div>
                <label style={{ fontSize: 10, fontWeight: 600, color: "rgba(154,148,184,0.5)", marginBottom: 6, display: "block", letterSpacing: "0.04em", textTransform: "uppercase" }}>
                  Target
                </label>
                <input
                  type="number"
                  min="1"
                  placeholder="e.g. 30"
                  value={target}
                  onChange={(e) => { setTarget(e.target.value); setErrors((p) => ({ ...p, target: null })); }}
                  style={{
                    width: "100%", boxSizing: "border-box",
                    padding: "10px 14px", borderRadius: 10,
                    border: errors.target ? "1px solid rgba(239,68,68,0.4)" : "1px solid rgba(255,255,255,0.06)",
                    background: "rgba(255,255,255,0.03)",
                    color: "rgba(232,230,240,0.85)",
                    fontSize: 13, outline: "none",
                  }}
                />
                {errors.target && <span style={{ fontSize: 10, color: "#EF4444", marginTop: 2 }}>{errors.target}</span>}
              </div>
            </div>
          </div>

          {/* Right: live preview */}
          <div style={{ width: 140, flexShrink: 0 }}>
            <label style={{ fontSize: 10, fontWeight: 600, color: "rgba(154,148,184,0.5)", marginBottom: 8, display: "block", letterSpacing: "0.04em", textTransform: "uppercase" }}>
              Preview
            </label>
            <div style={{
              borderRadius: 14,
              border: "1px solid rgba(255,255,255,0.05)",
              background: "rgba(255,255,255,0.02)",
              padding: "16px",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
              textAlign: "center",
            }}>
              <div style={{ position: "relative", width: 48, height: 48 }}>
                <svg width={48} height={48} style={{ transform: "rotate(-90deg)", position: "absolute" }}>
                  <circle cx={24} cy={24} r={18} stroke="rgba(255,255,255,0.04)" strokeWidth="3" fill="none" />
                  <circle cx={24} cy={24} r={18} stroke="#6C47FF" strokeWidth="3" fill="none" strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 18}`} strokeDashoffset={2 * Math.PI * 18 * (1 - pctPreview / 100)}
                    style={{ transition: "stroke-dashoffset 0.4s" }} />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <PreviewIcon size={16} color="#6C47FF" />
                </div>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(232,230,240,0.7)", lineHeight: 1.2 }}>
                {title || "Untitled"}
              </span>
              <span style={{ fontSize: 10, color: "rgba(154,148,184,0.4)" }}>
                {currentProgress}/{target || "?"}
              </span>
            </div>
          </div>
        </div>

        {/* Error */}
        {errors.submit && (
          <p style={{ fontSize: 11, color: "#EF4444", margin: "8px 0 0", textAlign: "center", flexShrink: 0 }}>
            {errors.submit}
          </p>
        )}

        {/* Footer */}
        <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end", flexShrink: 0 }}>
          <button
            onClick={onClose}
            disabled={submitting}
            style={{
              padding: "10px 20px", borderRadius: 10,
              border: "1px solid rgba(255,255,255,0.06)",
              background: "transparent",
              color: "rgba(154,148,184,0.6)", fontSize: 12, fontWeight: 600,
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            style={{
              padding: "10px 24px", borderRadius: 10, border: "none",
              background: "linear-gradient(135deg, rgba(108,71,255,0.85), rgba(74,58,138,0.65))",
              color: "rgba(232,230,240,0.95)", fontSize: 12, fontWeight: 600,
              cursor: submitting ? "not-allowed" : "pointer",
              opacity: submitting ? 0.6 : 1,
            }}
          >
            {submitting ? "Forging..." : "Forge Relic"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
