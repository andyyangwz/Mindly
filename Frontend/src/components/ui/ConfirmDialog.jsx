import { useEffect, useRef } from "react"
import { AlertTriangle, X } from "lucide-react"
import { Portal } from "../../utils/portal"
import "../../styles/shared/index.css"

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

  return (
    <Portal>
      <div role="presentation" onClick={onCancel} className="cd-overlay">
        <div
          role="alertdialog"
          aria-modal="true"
          aria-label={title}
          onClick={(e) => e.stopPropagation()}
          className="cd-dialog"
        >
          <div className="cd-header">
            <div className={`cd-icon-box cd-icon-box--${variant}`}>
              <AlertTriangle size={20} />
            </div>
            <div className="cd-body">
              <h2 className="cd-title">{title}</h2>
              {message && <p className="cd-message">{message}</p>}
            </div>
            <button type="button" onClick={onCancel} aria-label="Close" className="cd-close-btn">
              <X size={16} />
            </button>
          </div>

          <div className="cd-actions">
            <button type="button" onClick={onCancel} disabled={loading} className="cd-cancel-btn">
              {cancelLabel}
            </button>
            <button
              ref={confirmRef}
              type="button"
              onClick={onConfirm}
              disabled={loading}
              className="cd-confirm-btn"
              data-variant={variant}
            >
              {loading ? `${confirmLabel}...` : confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </Portal>
  )
}
