import { useState, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { Edit3, Trash2, Bell, Clock, X } from "lucide-react"
import { theme } from "../../../theme"
import { Portal } from "../../../utils/portal"
import { formatTime } from "../utils/calendarConstants"

function formatDateTime(datetimeStr, timeStr) {
  if (!datetimeStr) return ""
  const datePart = datetimeStr.length >= 10
    ? new Date(datetimeStr.slice(0, 10) + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : datetimeStr
  const timePart = timeStr || (datetimeStr.length >= 16 ? formatTime(datetimeStr.slice(11, 16)) : "")
  return timePart ? `${datePart} ${timePart}` : datePart
}

export default function ReminderDetailModal({ reminder, open, onClose, onEdit, onDelete, elevated }) {
  const { t } = useTranslation()
  const [confirmDelete, setConfirmDelete] = useState(false)

  const handleClose = useCallback(() => {
    setConfirmDelete(false)
    onClose()
  }, [onClose])

  if (!open || !reminder) return null

  return (
    <Portal>
      <div
        onClick={handleClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: elevated ? 903 : theme.z.modalOverlay,
          background: "rgba(0,0,0,0.4)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
        }}
      >
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.stopPropagation()}
          style={{
            background: "var(--color-card, white)",
            borderRadius: 20,
            padding: "40px 44px",
            maxWidth: 520,
            width: "100%",
            boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
            zIndex: theme.z.modal,
          }}
        >
          {/* Header row */}
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 28 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12,
                background: `${reminder.color}20`,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <Bell size={22} color={reminder.color} />
              </div>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 600, color: theme.dark, margin: 0, marginBottom: 6 }}>
                  {reminder.title}
                </h2>
                <span style={{ fontSize: 11, color: reminder.color, fontWeight: 500 }}>
                  {reminder.datetime ? formatDateTime(reminder.datetime, reminder.time) : ""}
                </span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              {onEdit && (
                <button
                  type="button"
                  onClick={() => { onEdit(reminder); handleClose() }}
                  style={{ background: theme.bg, border: "none", borderRadius: 10, width: 36, height: 36, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: theme.primaryText, transition: "all 0.15s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = `color-mix(in srgb, ${theme.primary} 18%, transparent)` }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = theme.bg }}
                  aria-label="Edit"
                >
                  <Edit3 size={16} />
                </button>
              )}
              <button
                type="button"
                onClick={() => { setConfirmDelete(true) }}
                style={{ background: "rgba(239,68,68,0.08)", border: "none", borderRadius: 10, width: 36, height: 36, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#EF4444", transition: "all 0.15s" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.2)" }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.08)" }}
                aria-label="Delete"
              >
                <Trash2 size={16} />
              </button>
              <button
                type="button"
                onClick={handleClose}
                style={{ background: "none", border: "none", cursor: "pointer", padding: 6, display: "flex", color: theme.muted }}
                aria-label={t("common.close")}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Priority badge */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 24 }}>
            <span style={{ fontSize: 11, background: `${reminder.color}18`, color: reminder.color, borderRadius: 20, padding: "5px 14px", fontWeight: 500 }}>
              {t("productivity.event.priorityLabel", { priority: t(`productivity.eventForm.priority_${reminder.priority}`) })}
            </span>
            <span style={{ fontSize: 11, background: `${reminder.color}14`, color: reminder.color, borderRadius: 20, padding: "5px 14px", fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
              <Bell size={11} fill={reminder.color} /> Reminder
            </span>
          </div>

          {/* Description */}
          {reminder.description && (
            <div style={{ background: theme.bg, borderRadius: 12, padding: "18px 22px", marginBottom: 28, fontSize: 14, color: theme.dark, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
              {reminder.description}
            </div>
          )}

          {/* Datetime */}
          {reminder.datetime && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: `${reminder.color}08`, borderRadius: 10, border: `1px solid ${reminder.color}20` }}>
                <Clock size={14} color={reminder.color} />
                <div>
                  <span style={{ fontSize: 10, fontWeight: 600, color: reminder.color, textTransform: "uppercase", letterSpacing: "0.04em" }}>Remind At</span>
                  <p style={{ fontSize: 13, color: theme.dark, fontWeight: 500, margin: 0 }}>{formatDateTime(reminder.datetime, reminder.time)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Delete confirmation */}
          {confirmDelete && (
            <div style={{ background: "rgba(220,38,38,0.08)", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontSize: 13, color: "#EF4444", flex: 1 }}>{t("productivity.event.deleteConfirm")}</span>
              <button type="button" onClick={() => onDelete(reminder.id)}
                style={{ padding: "6px 16px", borderRadius: 8, border: "none", background: "#EF4444", color: "white", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
                {t("common.delete")}
              </button>
              <button type="button" onClick={() => setConfirmDelete(false)}
                style={{ padding: "6px 12px", borderRadius: 8, border: "1px solid rgba(220,38,38,0.3)", background: "var(--color-card, white)", color: "#EF4444", fontSize: 12, fontWeight: 500, cursor: "pointer" }}>
                {t("common.cancel")}
              </button>
            </div>
          )}
        </div>
      </div>
    </Portal>
  )
}
