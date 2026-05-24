import { useEffect, useRef } from "react"
import { AlertTriangle, X } from "lucide-react"
import { theme } from "../../theme"
import { Portal } from "../../utils/portal"

export default function ConfirmDialog({
  open,
  title = "Are you sure?",
  message = "",
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  loading = false,
  variant = "danger",
}) {
  const confirmRef = useRef(null)

  useEffect(() => {
    if (open && confirmRef.current) {
      confirmRef.current.focus()
    }
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (e.key === "Escape") onCancel()
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [open, onCancel])

  if (!open) return null

  const confirmColors = {
    danger: { bg: "#EF4444", hover: "#DC2626" },
    primary: { bg: theme.primary, hover: "#6D28D9" },
  }
  const colors = confirmColors[variant] || confirmColors.danger

  return (
    <Portal>
      <div
        role="presentation"
        onClick={onCancel}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: theme.z.modalOverlay,
          background: "rgba(0,0,0,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
        }}
      >
        <div
          role="alertdialog"
          aria-modal="true"
          aria-label={title}
          onClick={(e) => e.stopPropagation()}
          style={{
            background: "var(--color-card, white)",
            borderRadius: 20,
            padding: "28px 32px",
            maxWidth: 400,
            width: "100%",
            boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
            zIndex: theme.z.modal,
          }}
        >
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 16 }}>
            <div
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                background: variant === "danger" ? "rgba(239,68,68,0.1)" : theme.bg,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <AlertTriangle size={20} color={variant === "danger" ? "#EF4444" : theme.primaryText} />
            </div>
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: 16, fontWeight: 600, color: theme.dark, margin: 0, marginBottom: 4 }}>
                {title}
              </h2>
              {message && (
                <p style={{ fontSize: 13, color: theme.muted, margin: 0, lineHeight: 1.5 }}>{message}</p>
              )}
            </div>
            <button
              type="button"
              onClick={onCancel}
              aria-label="Close"
              style={{ background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex" }}
            >
              <X size={16} color={theme.muted} />
            </button>
          </div>

          <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              style={{
                padding: "9px 20px",
                borderRadius: 10,
                border: `1px solid ${theme.border}`,
                background: "var(--color-card, white)",
                color: theme.dark,
                fontSize: 13,
                fontWeight: 500,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.5 : 1,
              }}
            >
              {cancelLabel}
            </button>
            <button
              ref={confirmRef}
              type="button"
              onClick={onConfirm}
              disabled={loading}
              style={{
                padding: "9px 20px",
                borderRadius: 10,
                border: "none",
                background: colors.bg,
                color: "white",
                fontSize: 13,
                fontWeight: 500,
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.7 : 1,
                transition: "background 0.15s",
              }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = colors.hover }}
              onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = colors.bg }}
            >
              {loading ? `${confirmLabel}...` : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  )
}
