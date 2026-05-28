import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { theme } from "../../../theme";
import IconPicker from "./IconPicker";

const OVERLAY_STYLES = {
  position: "fixed",
  inset: 0,
  background: "rgba(0,0,0,0.4)",
  backdropFilter: "blur(4px)",
  zIndex: theme.z.modalOverlay,
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  animation: "fadeIn 0.2s ease",
};

const MODAL_STYLES = {
  background: "var(--color-card)",
  borderRadius: 18,
  padding: "24px",
  width: 440,
  maxWidth: "90vw",
  maxHeight: "85vh",
  overflow: "hidden",
  display: "flex",
  flexDirection: "column",
  boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
  zIndex: theme.z.modal,
  animation: "slideUp 0.25s ease",
};

export default function EditHabitRelicModal({ relic, onClose, onUpdated, onDeleted }) {
  const { t } = useTranslation();
  const [icon, setIcon] = useState(relic?.icon || "FaStar");
  const [title, setTitle] = useState(relic?.title || "");
  const [currentProgress, setCurrentProgress] = useState(relic?.current_progress ?? 0);
  const [target, setTarget] = useState(String(relic?.target ?? ""));
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const titleRef = useRef(null);

  useEffect(() => {
    if (relic) {
      setIcon(relic.icon || "FaStar");
      setTitle(relic.title || "");
      setCurrentProgress(relic.current_progress ?? 0);
      setTarget(String(relic.target ?? ""));
      setErrors({});
      setTimeout(() => titleRef.current?.focus(), 100);
    }
  }, [relic]);

  const handleSubmit = useCallback(async () => {
    const errs = {};
    if (!title.trim()) errs.title = t("home.createGoal.validation.nameRequired");
    const tgt = parseInt(target, 10);
    if (!target || isNaN(tgt) || tgt <= 0) errs.target = t("home.createGoal.validation.targetRequired");
    if (currentProgress < 0) errs.currentProgress = t("home.editGoal.validation.cannotBeNegative");

    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }

    setSubmitting(true);
    try {
      await onUpdated(relic.id, {
        icon,
        title: title.trim(),
        current_progress: currentProgress,
        target: tgt,
      });
      onClose();
    } catch (e) {
      setErrors({ submit: e.message || t("home.editGoal.validation.updateFailed") });
    } finally {
      setSubmitting(false);
    }
  }, [icon, title, currentProgress, target, relic, onUpdated, onClose, t]);

  const handleDelete = useCallback(async () => {
    setDeleting(true);
    try {
      await onDeleted(relic.id);
      onClose();
    } catch (e) {
      setErrors({ submit: e.message || t("home.editGoal.validation.deleteFailed") });
    } finally {
      setDeleting(false);
    }
  }, [relic, onDeleted, onClose, t]);

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Enter" && !submitting && !deleting) {
        handleSubmit();
      }
      if (e.key === "Escape") {
        onClose();
      }
    },
    [handleSubmit, submitting, deleting, onClose]
  );

  if (!relic) return null;

  const fieldStyle = {
    width: "100%",
    boxSizing: "border-box",
    padding: "10px 14px",
    borderRadius: 10,
    border: "1px solid var(--color-border, #E5E7EB)",
    background: "var(--color-input)",
    color: "var(--color-dark, #1F2937)",
    fontSize: 14,
    outline: "none",
    transition: "border-color 0.15s",
  };

  const labelStyle = {
    fontSize: 12,
    fontWeight: 600,
    color: "var(--color-dark, #374151)",
    marginBottom: 4,
    display: "block",
  };

  return (
    <div style={OVERLAY_STYLES} onClick={onClose} onKeyDown={handleKeyDown}>
      <div
        style={MODAL_STYLES}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <style>{`
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
        `}</style>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: "var(--color-dark, #1E1B4B)", margin: 0 }}>
            {t("home.editGoal.title")}
          </h2>
          <button
            onClick={onClose}
            disabled={submitting || deleting}
            style={{
              background: "var(--color-bg, #F3F4F6)",
              border: "none",
              borderRadius: 8,
              width: 32,
              height: 32,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontSize: 16,
              color: "var(--color-dark, #6B7280)",
            }}
          >
            ✕
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16, overflow: "auto", flex: 1 }}>
          <div>
            <label style={labelStyle}>{t("home.editGoal.iconLabel")}</label>
            <IconPicker value={icon} onChange={setIcon} />
          </div>

          <div>
            <label style={labelStyle}>{t("home.editGoal.titleLabel")}</label>
            <input
              ref={titleRef}
              type="text"
              placeholder={t("home.editGoal.titlePlaceholder")}
              value={title}
              onChange={(e) => { setTitle(e.target.value); setErrors((p) => ({ ...p, title: null })); }}
              style={{
                ...fieldStyle,
                borderColor: errors.title ? "#EF4444" : "var(--color-border, #E5E7EB)",
              }}
            />
            {errors.title && <span style={{ fontSize: 11, color: "#EF4444", marginTop: 2 }}>{errors.title}</span>}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
            <div>
              <label style={labelStyle}>{t("home.editGoal.currentProgressLabel")}</label>
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
              />
            </div>
            <div>
              <label style={labelStyle}>{t("home.editGoal.targetLabel")}</label>
              <input
                type="number"
                min="1"
                placeholder={t("home.editGoal.targetPlaceholder")}
                value={target}
                onChange={(e) => { setTarget(e.target.value); setErrors((p) => ({ ...p, target: null })); }}
                style={{
                  ...fieldStyle,
                  borderColor: errors.target ? "#EF4444" : "var(--color-border, #E5E7EB)",
                }}
              />
              {errors.target && <span style={{ fontSize: 11, color: "#EF4444", marginTop: 2 }}>{errors.target}</span>}
            </div>
          </div>
        </div>

        {errors.submit && (
          <p style={{ fontSize: 12, color: "#EF4444", margin: "8px 0 0", textAlign: "center" }}>
            {errors.submit}
          </p>
        )}

        <div style={{ display: "flex", gap: 10, marginTop: 20, justifyContent: "space-between" }}>
          <button
            onClick={handleDelete}
            disabled={submitting || deleting}
            style={{
              padding: "10px 20px",
              borderRadius: 10,
              border: "none",
              background: deleting ? "#FCA5A5" : "#FEE2E2",
              color: "#DC2626",
              fontSize: 13,
              fontWeight: 600,
              cursor: deleting ? "not-allowed" : "pointer",
              opacity: deleting ? 0.6 : 1,
            }}
          >
            {deleting ? t("home.editGoal.deleting") : t("home.editGoal.delete")}
          </button>

          <div style={{ display: "flex", gap: 10 }}>
            <button
              onClick={onClose}
              disabled={submitting || deleting}
              style={{
                padding: "10px 20px",
                borderRadius: 10,
                border: "1px solid var(--color-border, #E5E7EB)",
                background: "transparent",
                color: "var(--color-dark, #6B7280)",
                fontSize: 13,
                fontWeight: 600,
                cursor: "pointer",
              }}
            >
              {t("common.cancel")}
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || deleting}
              style={{
                padding: "10px 24px",
                borderRadius: 10,
                border: "none",
                background: `linear-gradient(135deg, ${theme.primary}, ${theme.primary}dd)`,
                color: "#fff",
                fontSize: 13,
                fontWeight: 600,
                cursor: submitting ? "not-allowed" : "pointer",
                opacity: submitting ? 0.6 : 1,
              }}
            >
              {submitting ? t("home.editGoal.saving") : t("home.editGoal.save")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
