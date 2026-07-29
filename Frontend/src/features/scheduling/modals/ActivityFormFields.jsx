import { useTranslation } from "react-i18next"
import "../../../styles/scheduling/index.css"

export function Field({ label, error, children }) {
  return (
    <div className="aff-field">
      {label && (
        <label className={`aff-label ${error ? "aff-label-error" : "aff-label-default"}`}>
          {label}
        </label>
      )}
      {children}
    </div>
  )
}

export function ErrMsg({ msg }) {
  return (
    <p className="aff-errmsg">{msg}</p>
  )
}

export function Error({ msg }) {
  return (
    <div className="aff-error-box">{msg}</div>
  )
}

export function In({ error, style: overrideStyle, ...props }) {
  return (
    <input
      {...props}
      className={`aff-input ${error ? "aff-input-error" : "aff-input-normal"}`}
      style={overrideStyle}
    />
  )
}

export function Pill({ active, accent, onClick, compact, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`aff-pill ${compact ? "aff-pill-compact" : "aff-pill-normal"}`}
      style={{
        border: `1px solid ${active ? accent : "var(--color-border)"}`,
        background: active ? `${accent}12` : "var(--color-card, white)",
        color: active ? accent : "var(--color-muted)",
      }}
    >
      {children}
    </button>
  )
}

export function Row({ gap, wrap, children }) {
  return (
    <div
      className="aff-row"
      style={{ gap: gap ?? 8, flexWrap: wrap ? "wrap" : "nowrap" }}
    >
      {children}
    </div>
  )
}

export function Grid({ cols, gap, children }) {
  return (
    <div
      className="aff-grid"
      style={{ gridTemplateColumns: cols, gap: gap ?? 8 }}
    >
      {children}
    </div>
  )
}

export function Actions({ saving, isEdit, onCancel, onSubmit, accent, submitLabel }) {
  const { t } = useTranslation()

  return (
    <div className="aff-actions">
      <button
        type="button"
        onClick={onCancel}
        disabled={saving}
        className={`aff-actions-btn aff-actions-btn-cancel ${saving ? "aff-actions-btn-disabled" : ""}`}
      >
        {t("common.cancel")}
      </button>
      <button
        type="button"
        onClick={onSubmit}
        disabled={saving}
        className="aff-actions-btn aff-actions-btn-submit"
        style={{
          background: saving
            ? "var(--color-muted)"
            : `linear-gradient(135deg, ${accent || "var(--color-primary)"}, var(--color-secondary))`,
          opacity: saving ? 0.7 : 1,
          cursor: saving ? "not-allowed" : "pointer",
        }}
      >
        {saving ? t("common.saving") : submitLabel || (isEdit ? t("scheduling.eventForm.updateButton") : t("scheduling.eventForm.createActivityButton"))}
      </button>
    </div>
  )
}