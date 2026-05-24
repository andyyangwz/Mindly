import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { theme } from "../../../theme";
import IconPicker, { resolveIcon } from "./IconPicker";

function RarityLabel(title, current, target) {
  const len = (title || "").length;
  const hasTarget = target > 0;
  if (!title) return { label: "Unnamed Relic", color: "var(--color-muted)" };
  if (len > 20 && hasTarget) return { label: "Legendary Relic", color: "#F59E0B" };
  if (len > 12 || target > 50) return { label: "Rare Relic", color: "#8B5CF6" };
  if (target > 10) return { label: "Uncommon Relic", color: "#3B82F6" };
  return { label: "Common Relic", color: "var(--color-muted)" };
}

export default function CreateHabitRelicModal({ open, onClose, onCreated }) {
  const { t } = useTranslation();
  const [icon, setIcon] = useState("FaStar");
  const [title, setTitle] = useState("");
  const [currentProgress, setCurrentProgress] = useState(0);
  const [target, setTarget] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [forgeAnim, setForgeAnim] = useState(false);
  const titleRef = useRef(null);

  useEffect(() => {
    if (open) {
      setIcon("FaStar");
      setTitle("");
      setCurrentProgress(0);
      setTarget("");
      setErrors({});
      setForgeAnim(false);
      setTimeout(() => titleRef.current?.focus(), 300);
    }
  }, [open]);

  const handleSubmit = useCallback(async () => {
    const errs = {};
    if (!title.trim()) errs.title = t("home.createGoal.validation.nameRequired");
    const tgt = parseInt(target, 10);
    if (!target || isNaN(tgt) || tgt <= 0) errs.target = t("home.createGoal.validation.targetRequired");
    if (currentProgress < 0) errs.currentProgress = t("home.createGoal.validation.cannotBeNegative");

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    setForgeAnim(true);
    setTimeout(async () => {
      try {
        await onCreated({
          icon,
          title: title.trim(),
          current_progress: currentProgress,
          target: tgt,
        });
        onClose();
      } catch (e) {
        setErrors({ submit: e.message || t("home.createGoal.validation.createFailed") });
        setForgeAnim(false);
      } finally {
        setSubmitting(false);
      }
    }, 800);
  }, [icon, title, currentProgress, target, onCreated, onClose, t]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" && !submitting) {
        handleSubmit();
      }
      if (e.key === "Escape") {
        onClose();
      }
    },
    [handleSubmit, submitting, onClose]
  );

  if (!open) return null;

  const targetNum = parseInt(target, 10) || 0;
  const pct = targetNum > 0 ? Math.min(Math.round((currentProgress / targetNum) * 100), 100) : 0;
  const rarity = RarityLabel(title, currentProgress, targetNum);
  const circ = 2 * Math.PI * 42;
  const offset = circ * (1 - pct / 100);

  const fieldStyle = {
    width: "100%",
    boxSizing: "border-box",
    padding: "12px 16px",
    borderRadius: 12,
    border: "1px solid var(--color-border, #E5E7EB)",
    background: "var(--color-input)",
    color: "var(--color-dark, #1F2937)",
    fontSize: 13,
    outline: "none",
    transition: "border-color 0.2s, box-shadow 0.2s",
    fontFamily: "inherit",
  };

  const labelStyle = {
    fontSize: 11,
    fontWeight: 600,
    color: "var(--color-muted, #6B7280)",
    marginBottom: 6,
    display: "block",
    letterSpacing: "0.04em",
    textTransform: "uppercase",
  };

  return (
    <div
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(8px)",
        zIndex: theme.z.modalOverlay,
        display: "flex", alignItems: "center", justifyContent: "center",
        animation: "relicFadeIn 0.3s ease",
      }}
      onClick={onClose}
      onKeyDown={handleKeyDown}
    >
      <style>{`
        @keyframes relicFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes relicSlideUp { from { opacity: 0; transform: translateY(30px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes relicPulse { 0%, 100% { transform: scale(1); opacity: 0.6; } 50% { transform: scale(1.05); opacity: 0.9; } }
        @keyframes relicOrbFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-6px); } }
        @keyframes relicEnergy { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
        @keyframes relicGlow { 0%, 100% { box-shadow: 0 0 20px rgba(139,92,246,0.15); } 50% { box-shadow: 0 0 40px rgba(139,92,246,0.3); } }
        @keyframes relicForge { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.1); opacity: 0.8; box-shadow: 0 0 80px rgba(139,92,246,0.6); } 100% { transform: scale(0.95); opacity: 0; } }
        @keyframes shimmer { 0% { background-position: -200% 0; } 100% { background-position: 200% 0; } }
        @keyframes particleFloat { 0%, 100% { transform: translateY(0) scale(1); opacity: 0; } 20% { opacity: 1; } 80% { opacity: 0.5; } 100% { transform: translateY(-60px) scale(0); opacity: 0; } }
      `}</style>

      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{
          background: "var(--color-card)",
          borderRadius: 20,
          width: 720,
          maxWidth: "92vw",
          maxHeight: "88vh",
          display: "flex",
          overflow: "hidden",
          boxShadow: "0 24px 80px rgba(0,0,0,0.2), 0 0 0 1px rgba(139,92,246,0.06)",
          animation: "relicSlideUp 0.35s ease",
          position: "relative",
        }}
      >
        {/* Ambient gradient overlay */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(135deg, rgba(139,92,246,0.03), transparent 50%, rgba(59,130,246,0.02))",
          pointerEvents: "none",
          borderRadius: 20,
          zIndex: 0,
        }} />

        {/* ===== LEFT — Relic Preview ===== */}
        <div style={{
          width: 300,
          minWidth: 300,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "32px 24px",
          position: "relative",
          zIndex: 1,
          borderRight: "1px solid var(--color-border, rgba(0,0,0,0.06))",
          background: "linear-gradient(180deg, rgba(139,92,246,0.04) 0%, transparent 60%)",
          overflow: "hidden",
        }}>
          {/* Ambient particles */}
          {[...Array(6)].map((_, i) => (
            <div key={i} style={{
              position: "absolute",
              width: 4 + Math.random() * 6,
              height: 4 + Math.random() * 6,
              borderRadius: "50%",
              background: `rgba(139,92,246,${0.1 + Math.random() * 0.2})`,
              left: `${10 + Math.random() * 80}%`,
              top: `${20 + Math.random() * 60}%`,
              animation: `particleFloat ${3 + Math.random() * 4}s ease-in-out ${Math.random() * 3}s infinite`,
              pointerEvents: "none",
            }} />
          ))}

          {/* Floating relic orb */}
          <div style={{
            position: "relative",
            width: 160, height: 160,
            animation: "relicOrbFloat 4s ease-in-out infinite",
            transform: forgeAnim ? "scale(0.8)" : undefined,
            transition: "transform 0.3s",
          }}>
            {/* Outer glow ring */}
            <div style={{
              position: "absolute",
              top: -16, left: -16, width: 192, height: 192,
              borderRadius: "50%",
              background: "linear-gradient(135deg, rgba(139,92,246,0.08), rgba(59,130,246,0.04))",
              animation: "relicGlow 3s ease-in-out infinite",
              pointerEvents: "none",
            }} />

            {/* Energy ring */}
            <svg width={160} height={160} style={{
              position: "absolute",
              animation: forgeAnim ? "relicForge 0.8s ease forwards" : "relicEnergy 8s linear infinite",
            }}>
              <defs>
                <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.4" />
                  <stop offset="50%" stopColor="#A78BFA" stopOpacity="0.15" />
                  <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.4" />
                </linearGradient>
              </defs>
              <circle cx={80} cy={80} r={74} fill="none" stroke="url(#ringGrad)" strokeWidth="1.5"
                strokeDasharray="8 6" />
            </svg>

            {/* Progress ring */}
            <svg width={160} height={160} style={{ position: "absolute", transform: "rotate(-90deg)" }}>
              <circle cx={80} cy={80} r={62} fill="none" stroke="var(--color-border, #E5E7EB)" strokeWidth="3" />
              <circle cx={80} cy={80} r={62} fill="none" stroke="url(#ringGrad)" strokeWidth="3"
                strokeLinecap="round" strokeDasharray={`${circ}`} strokeDashoffset={offset}
                style={{ transition: "stroke-dashoffset 0.6s ease" }} />
            </svg>

            {/* Icon core */}
            <div style={{
              position: "absolute",
              top: 40, left: 40, width: 80, height: 80,
              borderRadius: "50%",
              background: "var(--color-card)",
              boxShadow: "0 0 30px rgba(139,92,246,0.1), inset 0 0 20px rgba(139,92,246,0.04)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {(() => {
                const Icon = resolveIcon(icon);
                return Icon ? (
                  <div style={{
                    color: theme.primary,
                    animation: forgeAnim ? "none" : "relicPulse 3s ease-in-out infinite",
                    display: "flex",
                  }}>
                    <Icon size={32} />
                  </div>
                ) : (
                  <span style={{ fontSize: 28, color: theme.primary }}>✦</span>
                );
              })()}
            </div>
          </div>

          {/* Relic title preview */}
          <div style={{ textAlign: "center", marginTop: 20 }}>
            <h3 style={{
              fontSize: 18, fontWeight: 700, color: "var(--color-dark)",
              margin: 0, lineHeight: 1.3,
            }}>
              {title || "New Relic"}
            </h3>
            <span style={{
              fontSize: 11, fontWeight: 600, color: rarity.color,
              letterSpacing: "0.08em", textTransform: "uppercase",
              marginTop: 4, display: "inline-block",
            }}>
              {rarity.label}
            </span>
            <p style={{
              fontSize: 12, color: "var(--color-muted)", margin: "8px 0 0",
              fontStyle: "italic", fontWeight: 400,
            }}>
              {targetNum > 0
                ? `${currentProgress} / ${targetNum} — ${pct}% attuned`
                : "Set a target to attune"}
            </p>
          </div>
        </div>

        {/* ===== RIGHT — Form Controls ===== */}
        <div style={{
          flex: 1,
          padding: "28px 28px 24px",
          display: "flex", flexDirection: "column",
          position: "relative", zIndex: 1,
          overflow: "auto",
        }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 22 }}>
            <h2 style={{ fontSize: 15, fontWeight: 700, color: "var(--color-dark)", margin: 0, letterSpacing: "-0.01em" }}>
              Forge New Relic
            </h2>
            <button onClick={onClose} style={{
              width: 30, height: 30, borderRadius: 8,
              border: "none", cursor: "pointer",
              background: "var(--color-input)",
              color: "var(--color-muted)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: 14, transition: "all 0.15s",
            }}>
              ✕
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 16, flex: 1 }}>
            {/* Icon */}
            <div>
              <label style={labelStyle}>Relic Icon</label>
              <IconPicker value={icon} onChange={setIcon} />
            </div>

            {/* Title */}
            <div>
              <label style={labelStyle}>Relic Name</label>
              <input
                ref={titleRef}
                type="text"
                placeholder="e.g. Mindfire Routine"
                value={title}
                onChange={(e) => { setTitle(e.target.value); setErrors((p) => ({ ...p, title: null })); }}
                style={{
                  ...fieldStyle,
                  borderColor: errors.title ? "#EF4444" : "var(--color-border, #E5E7EB)",
                  boxShadow: errors.title ? "0 0 0 2px rgba(239,68,68,0.15)" : "none",
                }}
                onFocus={(e) => {
                  if (!errors.title) e.currentTarget.style.borderColor = theme.primary;
                  e.currentTarget.style.boxShadow = `0 0 0 2px rgba(139,92,246,0.1)`;
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = errors.title ? "#EF4444" : "var(--color-border, #E5E7EB)";
                  e.currentTarget.style.boxShadow = errors.title ? "0 0 0 2px rgba(239,68,68,0.15)" : "none";
                }}
              />
              {errors.title && <span style={{ fontSize: 11, color: "#EF4444", marginTop: 4, display: "block" }}>{errors.title}</span>}
            </div>

            {/* Progress + Target */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={labelStyle}>Current</label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={String(currentProgress)}
                  onChange={(e) => {
                    const raw = e.target.value;
                    if (raw === "") { setCurrentProgress(0); return; }
                    if (!/^\d+$/.test(raw)) return;
                    const cleaned = raw.replace(/^0+/, "");
                    setCurrentProgress(cleaned === "" ? 0 : parseInt(cleaned, 10));
                  }}
                  style={fieldStyle}
                  onFocus={(e) => {
                    e.currentTarget.style.borderColor = theme.primary;
                    e.currentTarget.style.boxShadow = `0 0 0 2px rgba(139,92,246,0.1)`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = "var(--color-border, #E5E7EB)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                />
              </div>
              <div>
                <label style={labelStyle}>Target</label>
                <input
                  type="number"
                  min="1"
                  placeholder="e.g. 30"
                  value={target}
                  onChange={(e) => { setTarget(e.target.value); setErrors((p) => ({ ...p, target: null })); }}
                  style={{
                    ...fieldStyle,
                    borderColor: errors.target ? "#EF4444" : "var(--color-border, #E5E7EB)",
                    boxShadow: errors.target ? "0 0 0 2px rgba(239,68,68,0.15)" : "none",
                  }}
                  onFocus={(e) => {
                    if (!errors.target) e.currentTarget.style.borderColor = theme.primary;
                    e.currentTarget.style.boxShadow = errors.target ? "0 0 0 2px rgba(239,68,68,0.15)" : `0 0 0 2px rgba(139,92,246,0.1)`;
                  }}
                  onBlur={(e) => {
                    e.currentTarget.style.borderColor = errors.target ? "#EF4444" : "var(--color-border, #E5E7EB)";
                    e.currentTarget.style.boxShadow = errors.target ? "0 0 0 2px rgba(239,68,68,0.15)" : "none";
                  }}
                />
                {errors.target && <span style={{ fontSize: 11, color: "#EF4444", marginTop: 4, display: "block" }}>{errors.target}</span>}
              </div>
            </div>
          </div>

          {errors.submit && (
            <p style={{ fontSize: 12, color: "#EF4444", margin: "12px 0 0", textAlign: "center" }}>
              {errors.submit}
            </p>
          )}

          <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "flex-end", alignItems: "center" }}>
            <button onClick={onClose} disabled={submitting} style={{
              padding: "10px 20px", borderRadius: 10,
              border: "1px solid var(--color-border, #E5E7EB)",
              background: "transparent",
              color: "var(--color-muted)",
              fontSize: 12, fontWeight: 600, cursor: "pointer",
              transition: "all 0.15s",
              fontFamily: "inherit",
            }}>
              Cancel
            </button>
            <button onClick={handleSubmit} disabled={submitting} style={{
              padding: "10px 28px", borderRadius: 10, border: "none",
              background: submitting ? "var(--color-muted)" : `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
              color: "#fff", fontSize: 12, fontWeight: 600,
              cursor: submitting ? "not-allowed" : "pointer",
              opacity: submitting ? 0.6 : 1,
              transition: "all 0.3s",
              boxShadow: submitting ? "none" : `0 4px 16px rgba(139,92,246,0.25)`,
              fontFamily: "inherit",
              letterSpacing: "0.02em",
              position: "relative", overflow: "hidden",
            }}>
              {submitting ? "Forging..." : "Forge Relic"}
              {submitting && (
                <span style={{
                  position: "absolute", inset: 0,
                  background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
                  backgroundSize: "200% 100%",
                  animation: "shimmer 1s ease-in-out infinite",
                }} />
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
