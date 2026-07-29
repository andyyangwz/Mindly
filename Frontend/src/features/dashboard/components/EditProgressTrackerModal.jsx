import { useState, useRef, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next";
import IconPicker from "./IconPicker";
import "../../../styles/dashboard/index.css"

export default function EditProgressTrackerModal({ relic, onClose, onUpdated, onDeleted }) {
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
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
    if (!title.trim()) errs.title = t("dashboard.createGoal.validation.nameRequired");
    const tgt = parseInt(target, 10);
    if (!target || isNaN(tgt) || tgt <= 0) errs.target = t("dashboard.createGoal.validation.targetRequired");
    if (currentProgress < 0) errs.currentProgress = t("dashboard.editGoal.validation.cannotBeNegative");

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
      setErrors({ submit: e.message || t("dashboard.editGoal.validation.updateFailed") });
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
      setErrors({ submit: e.message || t("dashboard.editGoal.validation.deleteFailed") });
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

  return (
    <div className="ehrm-overlay" style={{ zIndex: 900 }} onClick={onClose} onKeyDown={handleKeyDown}>
      <div className="ehrm-modal" style={{ zIndex: 1000 }} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="ehrm-header">
          <h2 className="ehrm-title">{t("dashboard.editGoal.title")}</h2>
          <button onClick={onClose} disabled={submitting || deleting} className="ehrm-close-btn">✕</button>
        </div>

        <div className="ehrm-body">
          <div>
            <label className="ehrm-label">{t("dashboard.editGoal.iconLabel")}</label>
            <IconPicker value={icon} onChange={setIcon} />
          </div>

          <div>
            <label className="ehrm-label">{t("dashboard.editGoal.titleLabel")}</label>
            <input
              ref={titleRef}
              type="text"
              placeholder={t("dashboard.editGoal.titlePlaceholder")}
              value={title}
              onChange={(e) => { setTitle(e.target.value); setErrors((p) => ({ ...p, title: null })); }}
              className={`ehrm-field ${errors.title ? "ehrm-field-error" : ""}`}
            />
            {errors.title && <span className="ehrm-error-text">{errors.title}</span>}
          </div>

          <div className="ehrm-grid">
            <div>
              <label className="ehrm-label">{t("dashboard.editGoal.currentProgressLabel")}</label>
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
                className="ehrm-field"
              />
            </div>
            <div>
              <label className="ehrm-label">{t("dashboard.editGoal.targetLabel")}</label>
              <input
                type="number"
                min="1"
                placeholder={t("dashboard.editGoal.targetPlaceholder")}
                value={target}
                onChange={(e) => { setTarget(e.target.value); setErrors((p) => ({ ...p, target: null })); }}
                className={`ehrm-field ${errors.target ? "ehrm-field-error" : ""}`}
              />
              {errors.target && <span className="ehrm-error-text">{errors.target}</span>}
            </div>
          </div>
        </div>

        {errors.submit && <p className="ehrm-submit-error">{errors.submit}</p>}

        <div className="ehrm-footer">
          <button
            onClick={handleDelete}
            disabled={submitting || deleting}
            className="ehrm-delete-btn"
          >
            {deleting ? t("dashboard.editGoal.deleting") : t("dashboard.editGoal.delete")}
          </button>

          <div className="ehrm-right-group">
            <button onClick={onClose} disabled={submitting || deleting} className="ehrm-cancel-btn">
              {t("common.cancel")}
            </button>
            <button
              onClick={handleSubmit}
              disabled={submitting || deleting}
              className="ehrm-save-btn"
              style={{
                background: `linear-gradient(135deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 87%, transparent))`,
              }}
            >
              {submitting ? t("dashboard.editGoal.saving") : t("dashboard.editGoal.save")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
