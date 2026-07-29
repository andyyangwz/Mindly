import { useState, useCallback } from "react"
import { motion } from "framer-motion"
import { useTranslation } from "react-i18next"
import { Edit3, Trash2, Clock, Flag, Play, X } from "lucide-react"
import { Portal } from "../../../utils/portal"
import { formatTime, STATUS_META } from "../utils/calendarConstants"
import InteractiveProgressBar from "../components/InteractiveProgressBar"
import "../../../styles/scheduling/index.css"

function formatDateTime(datetimeStr, timeStr) {
  if (!datetimeStr) return ""
  const datePart = datetimeStr.length >= 10
    ? new Date(datetimeStr.slice(0, 10) + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : datetimeStr
  const timePart = timeStr ? formatTime(timeStr) : (datetimeStr ? formatTime(datetimeStr.slice(11, 16)) : "")
  return timePart ? `${datePart} ${timePart}` : datePart
}

const STATUS_OPTIONS = ["To Do", "In Progress", "Done"]

export default function ActivityDetailModal({ activity, open, onClose, onStatusChange, onProgressChange, onEdit, onDelete, elevated }) {
  const { t } = useTranslation()
  const [showStatusOptions, setShowStatusOptions] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [localProgress, setLocalProgress] = useState(null)

  const viewingActivity = activity
  const taskColor = viewingActivity?.color || "#6366F1"
  const savedProgress = viewingActivity?.progress ?? 0
  const hasUnsavedProgress = localProgress !== null && localProgress !== savedProgress

  const handleClose = useCallback(() => {
    setLocalProgress(null)
    setConfirmDelete(false)
    setShowStatusOptions(false)
    onClose()
  }, [onClose])

  const tStatus = useCallback((s) => {
    const k = { "To Do": "todo", "In Progress": "inProgress", "Done": "done" }
    return t(`scheduling.status.${k[s]}`)
  }, [t])

  if (!open || !activity) return null

  return (
    <Portal>
      <motion.div
        onClick={handleClose}
        className={`adm-overlay${elevated ? " adm-overlay--elevated" : ""}`}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
      >
        <motion.div
          role="dialog"
          aria-modal="true"
          onClick={(e) => e.stopPropagation()}
          className="adm-card"
          initial={{ opacity: 0, scale: 0.97, y: 4 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.97, y: 4 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
        >
          {/* Header row */}
          <div className="adm-header">
            <div className="adm-header-left">
              <div className="adm-icon-box" style={{ background: `${viewingActivity.color}20` }}>
                {viewingActivity.hasDeadline ? (
                  <Play size={22} color={taskColor} />
                ) : (
                  <Clock size={22} color={viewingActivity.color} />
                )}
              </div>
              <div>
                <h2 className="adm-title">
                  {viewingActivity.title}
                </h2>
                <span className="adm-subtitle" style={{ color: viewingActivity.color }}>
                  {viewingActivity.hasDeadline ? (
                    <>{t("scheduling.event.task")}</>
                  ) : viewingActivity.startDatetime ? (
                    <>{formatDateTime(viewingActivity.startDatetime, viewingActivity.startTime)} &ndash; {viewingActivity.startDatetime && viewingActivity.endDatetime && viewingActivity.startDatetime.slice(0, 10) !== viewingActivity.endDatetime.slice(0, 10) ? formatDateTime(viewingActivity.endDatetime, viewingActivity.endTime) : formatTime(viewingActivity.endTime)}</>
                  ) : null}
                </span>
              </div>
            </div>
            <div className="adm-header-actions">
              {onEdit && (
                <button
                  type="button"
                  onClick={() => { onEdit(viewingActivity); handleClose() }}
                  className="adm-icon-btn adm-icon-btn--edit"
                  aria-label={t("scheduling.event.edit")}
                >
                  <Edit3 size={16} />
                </button>
              )}
              <button
                type="button"
                onClick={() => { setConfirmDelete(true); setShowStatusOptions(false) }}
                className="adm-icon-btn adm-icon-btn--delete"
                aria-label={t("scheduling.event.delete")}
              >
                <Trash2 size={16} />
              </button>
              <button
                type="button"
                onClick={handleClose}
                className="adm-close-btn"
                aria-label={t("common.close")}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Badges row */}
          <div className="adm-badges">
            <span className="adm-badge" style={{ background: `${viewingActivity.color}18`, color: viewingActivity.color }}>
              {t("scheduling.event.priorityLabel", { priority: t(`scheduling.eventForm.priority_${viewingActivity.priority}`) })}
            </span>

            {viewingActivity.hasDeadline && (
              <span className="adm-badge adm-badge--task" style={{ background: `${taskColor}14`, color: taskColor }}>
                <Play size={11} fill={taskColor} /> {t("scheduling.event.taskStart")}
              </span>
            )}
          </div>

          {/* Description */}
          {viewingActivity.description && (
            <div className="adm-description">
              {viewingActivity.description}
            </div>
          )}

          {/* Progress (tasks only) — full width, between description and dates */}
          {viewingActivity.hasDeadline && (
            <div className="adm-progress-section">
              <InteractiveProgressBar
                value={hasUnsavedProgress ? localProgress : savedProgress}
                baselineValue={savedProgress}
                color={taskColor}
                onChange={onProgressChange ? (v) => setLocalProgress(v) : undefined}
                headerSuffix={hasUnsavedProgress ? (
                  <div className="adm-progress-actions">
                    <button
                      type="button"
                      onClick={() => { onProgressChange(viewingActivity, localProgress); setLocalProgress(null) }}
                      className="adm-save-btn"
                      style={{ background: taskColor }}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setLocalProgress(null)}
                      className="adm-cancel-btn"
                      style={{ border: `1px solid ${taskColor}30`, color: taskColor }}
                      onMouseEnter={(e) => { e.currentTarget.style.background = `${taskColor}10` }}
                      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
                    >
                      Cancel
                    </button>
                  </div>
                ) : null}
              />
            </div>
          )}

          {/* Task time range */}
          {viewingActivity.hasDeadline && (
            <div className="adm-time-section">
              <div className="adm-time-row" style={{ background: `${taskColor}08`, border: `1px solid ${taskColor}20` }}>
                <Play size={14} color={taskColor} />
                <div>
                  <span className="adm-time-label" style={{ color: taskColor }}>{t("scheduling.event.start")}</span>
                  <p className="adm-time-value">{formatDateTime(viewingActivity.startDatetime, viewingActivity.startTime)}</p>
                </div>
              </div>
              <div className="adm-time-row adm-time-row--end">
                <Flag size={14} color="#DC2626" />
                <div>
                  <span className="adm-time-label adm-time-label--end">{t("scheduling.event.endDeadline")}</span>
                  <p className="adm-time-value">{formatDateTime(viewingActivity.endDatetime, viewingActivity.endTime)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Status badge */}
          {viewingActivity.status && (
            <div className="adm-status-section">
              <div className="adm-status-inner" style={{
                background: STATUS_META[viewingActivity.status]?.bg || "var(--color-bg)",
                border: `1px solid ${STATUS_META[viewingActivity.status]?.border || "transparent"}`,
              }}>
                <span className="adm-status-text" style={{
                  color: STATUS_META[viewingActivity.status]?.color || "var(--color-muted)",
                }}>
                  {tStatus(viewingActivity.status)}
                </span>
                <div className="adm-status-divider" style={{
                  background: STATUS_META[viewingActivity.status]?.border || "var(--color-border)",
                }} />
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setShowStatusOptions(v => !v) }}
                  className="adm-status-change-btn"
                  aria-label={t("scheduling.event.changeStatus")}
                >
                  <Edit3 size={12} strokeWidth={2} />
                </button>
              </div>
            </div>
          )}

          {/* Change Status options */}
          {showStatusOptions && (
            <div className="adm-status-options">
              {STATUS_OPTIONS.map(s => {
                const meta = STATUS_META[s]
                const active = viewingActivity.status === s
                return (
                  <button
                    key={s}
                    onClick={() => { onStatusChange(viewingActivity, s); setShowStatusOptions(false) }}
                    className="adm-status-option"
                    style={{
                      border: active ? `1.5px solid ${meta.color}` : "1px solid var(--color-border)",
                      background: active ? meta.bg : "transparent",
                      color: active ? meta.color : "var(--color-muted)",
                      fontWeight: active ? 600 : 500,
                    }}
                    onMouseEnter={(e) => {
                      if (!active) { e.currentTarget.style.background = "var(--color-bg)"; e.currentTarget.style.borderColor = meta.color }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = "var(--color-border)" }
                    }}
                  >
                    {tStatus(s)}
                  </button>
                )
              })}
            </div>
          )}

          {/* Delete confirmation */}
          {confirmDelete && (
            <div className="adm-delete-confirm">
              <span className="adm-delete-confirm-text">{t("scheduling.event.deleteConfirm")}</span>
              <button type="button" onClick={() => onDelete(viewingActivity.id)} className="adm-delete-confirm-btn">
                {t("common.delete")}
              </button>
              <button type="button" onClick={() => setConfirmDelete(false)} className="adm-cancel-confirm-btn">
                {t("common.cancel")}
              </button>
            </div>
          )}
        </motion.div>
      </motion.div>
    </Portal>
  )
}
