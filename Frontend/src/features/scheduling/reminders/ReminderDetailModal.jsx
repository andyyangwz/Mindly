import { useState, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { Edit3, Trash2, Bell, Clock, X } from "lucide-react"
import { Portal } from "../../../utils/portal"
import { formatTime } from "../utils/calendarConstants"
import "../../../styles/scheduling/index.css"

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
        className="rdm-overlay"
        style={{ zIndex: elevated ? 903 : 900 }}
      >
        <div
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.stopPropagation()}
          className="rdm-dialog"
        >
          <div className="rdm-header">
            <div className="rdm-header-left">
              <div className="rdm-header-icon-box" style={{ background: `${reminder.color}20` }}>
                <Bell size={22} color={reminder.color} />
              </div>
              <div className="rdm-header-info">
                <h2>{reminder.title}</h2>
                <span className="rdm-header-datetime" style={{ color: reminder.color }}>
                  {reminder.datetime ? formatDateTime(reminder.datetime, reminder.time) : ""}
                </span>
              </div>
            </div>
            <div className="rdm-header-actions">
              {onEdit && (
                <button
                  type="button"
                  onClick={() => { onEdit(reminder); handleClose() }}
                  className="rdm-icon-btn rdm-icon-btn-edit"
                  aria-label="Edit"
                >
                  <Edit3 size={16} />
                </button>
              )}
              <button
                type="button"
                onClick={() => { setConfirmDelete(true) }}
                className="rdm-icon-btn rdm-icon-btn-delete"
                aria-label="Delete"
              >
                <Trash2 size={16} />
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="rdm-icon-btn-close"
                aria-label={t("common.close")}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          <div className="rdm-badge-row">
            <span className="rdm-badge" style={{ background: `${reminder.color}18`, color: reminder.color }}>
              {t("scheduling.event.priorityLabel", { priority: t(`scheduling.eventForm.priority_${reminder.priority}`) })}
            </span>
            <span className="rdm-badge-icon" style={{ background: `${reminder.color}14`, color: reminder.color }}>
              <Bell size={11} fill={reminder.color} /> Reminder
            </span>
          </div>

          {reminder.description && (
            <div className="rdm-description-box">{reminder.description}</div>
          )}

          {reminder.datetime && (
            <div className="rdm-datetime-section">
              <div className="rdm-datetime-row" style={{ background: `${reminder.color}08`, border: `1px solid ${reminder.color}20` }}>
                <Clock size={14} color={reminder.color} />
                <div>
                  <span className="rdm-datetime-label" style={{ color: reminder.color }}>Remind At</span>
                  <p className="rdm-datetime-value">{formatDateTime(reminder.datetime, reminder.time)}</p>
                </div>
              </div>
            </div>
          )}

          {confirmDelete && (
            <div className="rdm-delete-confirm">
              <span className="rdm-delete-msg">{t("scheduling.event.deleteConfirm")}</span>
              <button type="button" onClick={() => onDelete(reminder.id)} className="rdm-btn-delete">
                {t("common.delete")}
              </button>
              <button type="button" onClick={() => setConfirmDelete(false)} className="rdm-btn-cancel-delete">
                {t("common.cancel")}
              </button>
            </div>
          )}
        </div>
      </div>
    </Portal>
  )
}