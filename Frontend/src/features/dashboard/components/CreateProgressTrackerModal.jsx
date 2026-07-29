import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import IconPicker, { resolveIcon } from "./IconPicker";
import "../../../styles/dashboard/index.css"

function RarityLabel(title, current, target) {
  const len = (title || "").length;
  const hasTarget = target > 0;
  if (!title) return { label: "Unnamed Relic", color: "var(--color-muted)" };
  if (len > 20 && hasTarget) return { label: "Legendary Relic", color: "#F59E0B" };
  if (len > 12 || target > 50) return { label: "Rare Relic", color: "#8B5CF6" };
  if (target > 10) return { label: "Uncommon Relic", color: "#3B82F6" };
  return { label: "Common Relic", color: "var(--color-muted)" };
}

export default function CreateProgressTrackerModal({ open, onClose, onCreated }) {
  const { t } = useTranslation();
  const [icon, setIcon] = useState("FaStar");
  const [title, setTitle] = useState("");
  const [currentProgress, setCurrentProgress] = useState(0);
  const [target, setTarget] = useState("");
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [forgeAnim, setForgeAnim] = useState(false);
  const titleRef = useRef(null);
  const [particles] = useState(() => Array.from({ length: 6 }, (_, i) => {
    const w = 4 + Math.random() * 6;
    const h = 4 + Math.random() * 6;
    const bg = `rgba(139,92,246,${0.1 + Math.random() * 0.2})`;
    const l = `${10 + Math.random() * 80}%`;
    const t = `${20 + Math.random() * 60}%`;
    const anim = `relicParticleFloat ${3 + Math.random() * 4}s ease-in-out ${Math.random() * 3}s infinite`;
    return { key: i, w, h, bg, l, t, anim };
  }));

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
    if (!title.trim()) errs.title = t("dashboard.createGoal.validation.nameRequired");
    const tgt = parseInt(target, 10);
    if (!target || isNaN(tgt) || tgt <= 0) errs.target = t("dashboard.createGoal.validation.targetRequired");
    if (currentProgress < 0) errs.currentProgress = t("dashboard.createGoal.validation.cannotBeNegative");

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
        setErrors({ submit: e.message || t("dashboard.createGoal.validation.createFailed") });
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
  const circ = 2 * Math.PI * 62;
  const offset = circ * (1 - pct / 100);
  const IconCmp = resolveIcon(icon);

  return (
    <div className="modal-relic-overlay" onClick={onClose} onKeyDown={handleKeyDown} tabIndex={-1}>
      <div onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" className="modal-relic-card">
        <div className="modal-relic-ambient" />

        {/* ===== LEFT — Relic Preview ===== */}
        <div className="modal-relic-preview">
          {particles.map(p => (
            <div key={p.key} style={{
              position: "absolute",
              width: p.w,
              height: p.h,
              borderRadius: "50%",
              background: p.bg,
              left: p.l,
              top: p.t,
              animation: p.anim,
              pointerEvents: "none",
            }} />
          ))}

          <div className="modal-relic-orb-container" style={{ transform: forgeAnim ? "scale(0.8)" : undefined }}>
            <div className="modal-relic-orb-glow" />
            <svg width={160} height={160} className={forgeAnim ? "modal-relic-orb-energy-forge" : "modal-relic-orb-energy"}>
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
            <svg width={160} height={160} className="modal-relic-progress-ring">
              <defs>
                <linearGradient id="progressGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.8" />
                  <stop offset="50%" stopColor="#A78BFA" stopOpacity="0.5" />
                  <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.8" />
                </linearGradient>
              </defs>
              <circle cx={80} cy={80} r={62} fill="none" stroke="var(--color-border)" strokeWidth="3" />
              <circle cx={80} cy={80} r={62} fill="none" stroke="url(#progressGrad)" strokeWidth="3"
                strokeLinecap="round" strokeDasharray={`${circ}`} strokeDashoffset={offset}
                style={{ transition: "stroke-dashoffset 0.6s ease" }} />
            </svg>
            <div className="modal-relic-icon-core">
              {IconCmp ? (
                <div style={{
                  color: "var(--color-primary)",
                  animation: forgeAnim ? "none" : "relicPulse 3s ease-in-out infinite",
                  display: "flex",
                }}>
                  {/* eslint-disable-next-line react-hooks/static-components */}
                  <IconCmp size={32} />
                </div>
              ) : (
                <span style={{ fontSize: 28, color: "var(--color-primary)" }}>✦</span>
              )}
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: 20 }}>
            <h3 className="modal-relic-preview-title">{title || "New Relic"}</h3>
            <span className="modal-relic-preview-rarity" style={{ color: rarity.color }}>{rarity.label}</span>
            <p className="modal-relic-preview-desc">
              {targetNum > 0
                ? `${currentProgress} / ${targetNum} — ${pct}% attuned`
                : "Set a target to attune"}
            </p>
          </div>
        </div>

        {/* ===== RIGHT — Form Controls ===== */}
        <div className="modal-relic-form">
          <div className="modal-relic-form-header">
            <h2 className="modal-relic-form-title">Forge New Relic</h2>
            <button onClick={onClose} className="modal-relic-close-btn">✕</button>
          </div>

          <div className="modal-relic-form-body">
            <div>
              <label className="modal-relic-label">Relic Icon</label>
              <IconPicker value={icon} onChange={setIcon} />
            </div>

            <div>
              <label className="modal-relic-label">Relic Name</label>
              <input
                ref={titleRef}
                type="text"
                placeholder="e.g. Mindfire Routine"
                value={title}
                onChange={(e) => { setTitle(e.target.value); setErrors((p) => ({ ...p, title: null })); }}
                className="modal-relic-field"
                style={errors.title ? { borderColor: "#EF4444", boxShadow: "0 0 0 2px rgba(239,68,68,0.15)" } : undefined}
              />
              {errors.title && <span className="modal-relic-error-text">{errors.title}</span>}
            </div>

            <div className="modal-relic-preview-grid">
              <div>
                <label className="modal-relic-label">Current</label>
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
                  className="modal-relic-field"
                />
              </div>
              <div>
                <label className="modal-relic-label">Target</label>
                <input
                  type="number"
                  min="1"
                  placeholder="e.g. 30"
                  value={target}
                  onChange={(e) => { setTarget(e.target.value); setErrors((p) => ({ ...p, target: null })); }}
                  className="modal-relic-field"
                  style={errors.target ? { borderColor: "#EF4444", boxShadow: "0 0 0 2px rgba(239,68,68,0.15)" } : undefined}
                />
                {errors.target && <span className="modal-relic-error-text">{errors.target}</span>}
              </div>
            </div>
          </div>

          {errors.submit && <p className="modal-relic-submit-error">{errors.submit}</p>}

          <div className="modal-relic-footer">
            <button onClick={onClose} disabled={submitting} className="modal-relic-cancel-btn">Cancel</button>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="modal-relic-forge-btn"
              style={submitting ? undefined : {
                background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))",
                boxShadow: "0 4px 16px rgba(139,92,246,0.25)",
              }}
            >
              {submitting ? "Forging..." : "Forge Relic"}
              {submitting && <span className="modal-relic-forge-shimmer" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
