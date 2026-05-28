import { useTranslation } from "react-i18next"
import { theme } from "../../../theme"

export function Field({ label, error, children }) {
  return (
    <div style={{ marginBottom: 20, width: "100%", boxSizing: "border-box" }}>
      {label && (
        <label
          style={{
            fontSize: 10,
            fontWeight: 600,
            color: error ? "#EF4444" : theme.muted,
            display: "block",
            marginBottom: 6,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
          }}
        >
          {label}
        </label>
      )}
      {children}
    </div>
  )
}

export function ErrMsg({ msg }) {
  return (
    <p style={{ fontSize: 10, color: "#EF4444", margin: "3px 0 0" }}>
      {msg}
    </p>
  )
}

export function Error({ msg }) {
  return (
    <div
      style={{
        marginBottom: 14,
        padding: "10px 14px",
        background: "#FEF2F2",
        border: "1px solid #FECACA",
        borderRadius: 8,
        color: "#DC2626",
        fontSize: 12,
      }}
    >
      {msg}
    </div>
  )
}

export function In({ error, style: overrideStyle, ...props }) {
  return (
    <input
      {...props}
      style={{
        width: "100%",
        padding: "10px 12px",
        border: `1px solid ${error ? "#EF4444" : theme.border}`,
        borderRadius: 8,
        fontSize: 13,
        color: theme.dark,
        background: "var(--color-input)",
        outline: "none",
        boxSizing: "border-box",
        fontFamily: "inherit",
        ...overrideStyle,
      }}
    />
  )
}

export function Pill({ active, accent, onClick, compact, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        padding: compact ? "6px 10px" : "7px 12px",
        borderRadius: 8,
        border: `1px solid ${active ? accent : theme.border}`,
        background: active ? `${accent}12` : "var(--color-card, white)",
        color: active ? accent : theme.muted,
        fontSize: 11,
        fontWeight: 500,
        cursor: "pointer",
        transition: "all 0.1s",
        whiteSpace: "nowrap",
      }}
    >
      {children}
    </button>
  )
}

export function Row({ gap, wrap, children }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: gap ?? 8,
        flexWrap: wrap ? "wrap" : "nowrap",
      }}
    >
      {children}
    </div>
  )
}

export function Grid({ cols, gap, children }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: cols,
        gap: gap ?? 8,
      }}
    >
      {children}
    </div>
  )
}

export function Actions({ saving, isEdit, onCancel, onSubmit, accent, submitLabel }) {
  const { t } = useTranslation()

  return (
    <div
      style={{
        display: "flex",
        gap: 8,
        justifyContent: "flex-end",
        marginTop: 20,
      }}
    >
      <button
        type="button"
        onClick={onCancel}
        disabled={saving}
        style={{
          padding: "8px 18px",
          borderRadius: 8,
          border: `1px solid ${theme.border}`,
          background: "var(--color-card, white)",
          color: theme.dark,
          fontSize: 13,
          fontWeight: 500,
          cursor: saving ? "not-allowed" : "pointer",
          opacity: saving ? 0.5 : 1,
        }}
      >
        {t("common.cancel")}
      </button>
      <button
        type="button"
        onClick={onSubmit}
        disabled={saving}
        style={{
          padding: "8px 18px",
          borderRadius: 8,
          border: "none",
          background: saving
            ? theme.muted
            : `linear-gradient(135deg, ${accent || theme.primary}, ${theme.secondary})`,
          color: "white",
          fontSize: 13,
          fontWeight: 500,
          cursor: saving ? "not-allowed" : "pointer",
          opacity: saving ? 0.7 : 1,
        }}
      >
        {saving ? t("common.saving") : submitLabel || (isEdit ? t("productivity.eventForm.updateButton") : t("productivity.eventForm.createActivityButton"))}
      </button>
    </div>
  )
}
