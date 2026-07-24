import { useState, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { Edit3, Trash2, Clock, Flag, Play, X } from "lucide-react"
import { theme } from "../../../theme"
import { Portal } from "../../../utils/portal"
import { formatTime, STATUS_META } from "../utils/calendarConstants"
import InteractiveProgressBar from "../components/InteractiveProgressBar"

function formatDateTime(datetimeStr, timeStr) {
  if (!datetimeStr) return ""
  const datePart = datetimeStr.length >= 10
    ? new Date(datetimeStr.slice(0, 10) + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
    : datetimeStr
  const timePart = timeStr ? formatTime(timeStr) : (datetimeStr ? formatTime(datetimeStr.slice(11, 16)) : "")
  return timePart ? `${datePart} ${timePart}` : datePart
}

const STATUS_OPTIONS = ["To Do", "In Progress", "Done"]

export default function ActivityDetailModal({ activity, open, onClose, onStatusChange, onProgressChange, onEdit, onDelete }) {
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
    return t(`productivity.status.${k[s]}`)
  }, [t])

  if (!open || !activity) return null

  return (
    <Portal>
      <div
        onClick={handleClose}
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
                background: `${viewingActivity.color}20`,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                {viewingActivity.hasDeadline ? (
                  <Play size={22} color={taskColor} />
                ) : (
                  <Clock size={22} color={viewingActivity.color} />
                )}
              </div>
              <div>
                <h2 style={{ fontSize: 18, fontWeight: 600, color: theme.dark, margin: 0, marginBottom: 6 }}>
                  {viewingActivity.title}
                </h2>
                <span style={{ fontSize: 11, color: viewingActivity.color, fontWeight: 500 }}>
                  {viewingActivity.hasDeadline ? (
                    <>{t("productivity.event.task")}</>
                  ) : viewingActivity.startDatetime ? (
                    <>{formatDateTime(viewingActivity.startDatetime, viewingActivity.startTime)} &ndash; {viewingActivity.startDatetime && viewingActivity.endDatetime && viewingActivity.startDatetime.slice(0, 10) !== viewingActivity.endDatetime.slice(0, 10) ? formatDateTime(viewingActivity.endDatetime, viewingActivity.endTime) : formatTime(viewingActivity.endTime)}</>
                  ) : null}
                </span>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
              {onEdit && (
                <button
                  type="button"
                  onClick={() => { onEdit(viewingActivity); handleClose() }}
                  style={{ background: theme.bg, border: "none", borderRadius: 10, width: 36, height: 36, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: theme.primaryText, transition: "all 0.15s" }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = `color-mix(in srgb, ${theme.primary} 18%, transparent)` }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = theme.bg }}
                  aria-label={t("productivity.event.edit")}
                >
                  <Edit3 size={16} />
                </button>
              )}
              <button
                type="button"
                onClick={() => { setConfirmDelete(true); setShowStatusOptions(false) }}
                style={{ background: "rgba(239,68,68,0.08)", border: "none", borderRadius: 10, width: 36, height: 36, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", color: "#EF4444", transition: "all 0.15s" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.2)" }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.08)" }}
                aria-label={t("productivity.event.delete")}
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

          {/* Badges row */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 24 }}>
            <span style={{ fontSize: 11, background: `${viewingActivity.color}18`, color: viewingActivity.color, borderRadius: 20, padding: "5px 14px", fontWeight: 500 }}>
              {t("productivity.event.priorityLabel", { priority: t(`productivity.eventForm.priority_${viewingActivity.priority}`) })}
            </span>

            {viewingActivity.hasDeadline && (
              <span style={{ fontSize: 11, background: `${taskColor}14`, color: taskColor, borderRadius: 20, padding: "5px 14px", fontWeight: 600, display: "flex", alignItems: "center", gap: 5 }}>
                <Play size={11} fill={taskColor} /> {t("productivity.event.taskStart")}
              </span>
            )}
          </div>

          {/* Description */}
          {viewingActivity.description && (
            <div style={{ background: theme.bg, borderRadius: 12, padding: "18px 22px", marginBottom: 28, fontSize: 14, color: theme.dark, lineHeight: 1.8, whiteSpace: "pre-wrap" }}>
              {viewingActivity.description}
            </div>
          )}

          {/* Progress (tasks only) — full width, between description and dates */}
          {viewingActivity.hasDeadline && (
            <div style={{ marginBottom: 28, width: "100%" }}>
              <InteractiveProgressBar
                value={hasUnsavedProgress ? localProgress : savedProgress}
                baselineValue={savedProgress}
                color={taskColor}
                onChange={onProgressChange ? (v) => setLocalProgress(v) : undefined}
                headerSuffix={hasUnsavedProgress ? (
                  <div style={{ display: "flex", alignItems: "center", gap: 4, marginLeft: 6 }}>
                    <button
                      type="button"
                      onClick={() => { onProgressChange(viewingActivity, localProgress); setLocalProgress(null) }}
                      style={{
                        padding: "3px 10px", borderRadius: 6,
                        border: "none", background: taskColor, color: "white",
                        fontSize: 11, fontWeight: 600, cursor: "pointer",
                        transition: "opacity 0.15s",
                      }}
                      onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.85" }}
                      onMouseLeave={(e) => { e.currentTarget.style.opacity = "1" }}
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => setLocalProgress(null)}
                      style={{
                        padding: "3px 10px", borderRadius: 6,
                        border: `1px solid ${taskColor}30`, background: "transparent",
                        color: taskColor, fontSize: 11, fontWeight: 600, cursor: "pointer",
                        transition: "all 0.15s",
                      }}
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
            <div style={{ display: "flex", flexDirection: "column", gap: 12, marginBottom: 28 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: `${taskColor}08`, borderRadius: 10, border: `1px solid ${taskColor}20` }}>
                <Play size={14} color={taskColor} />
                <div>
                  <span style={{ fontSize: 10, fontWeight: 600, color: taskColor, textTransform: "uppercase", letterSpacing: "0.04em" }}>{t("productivity.event.start")}</span>
                  <p style={{ fontSize: 13, color: theme.dark, fontWeight: 500, margin: 0 }}>{formatDateTime(viewingActivity.startDatetime, viewingActivity.startTime)}</p>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", background: "#DC262608", borderRadius: 10, border: "1px solid #DC262620" }}>
                <Flag size={14} color="#DC2626" />
                <div>
                  <span style={{ fontSize: 10, fontWeight: 600, color: "#DC2626", textTransform: "uppercase", letterSpacing: "0.04em" }}>{t("productivity.event.endDeadline")}</span>
                  <p style={{ fontSize: 13, color: theme.dark, fontWeight: 500, margin: 0 }}>{formatDateTime(viewingActivity.endDatetime, viewingActivity.endTime)}</p>
                </div>
              </div>
            </div>
          )}

          {/* Status badge */}
          {viewingActivity.status && (
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 28 }}>
              <div style={{
                display: "inline-flex", alignItems: "center", gap: 0,
                borderRadius: 20,
                background: STATUS_META[viewingActivity.status]?.bg || theme.bg,
                border: `1px solid ${STATUS_META[viewingActivity.status]?.border || "transparent"}`,
                overflow: "hidden",
              }}>
                <span style={{
                  fontSize: 12, fontWeight: 600,
                  color: STATUS_META[viewingActivity.status]?.color || theme.muted,
                  padding: "5px 8px 5px 14px",
                  userSelect: "none",
                }}>
                  {tStatus(viewingActivity.status)}
                </span>
                <div style={{
                  width: 1, height: 14,
                  background: STATUS_META[viewingActivity.status]?.border || theme.border,
                  flexShrink: 0,
                }} />
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setShowStatusOptions(v => !v) }}
                  style={{
                    background: "none", border: "none", cursor: "pointer",
                    padding: "5px 10px", display: "flex", alignItems: "center",
                    color: theme.muted, transition: "color 0.15s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.color = theme.dark }}
                  onMouseLeave={(e) => { e.currentTarget.style.color = theme.muted }}
                  aria-label={t("productivity.event.changeStatus")}
                >
                  <Edit3 size={12} strokeWidth={2} />
                </button>
              </div>
            </div>
          )}

          {/* Change Status options */}
          {showStatusOptions && (
            <div style={{ display: "flex", gap: 4, marginBottom: 28 }}>
              {STATUS_OPTIONS.map(s => {
                const meta = STATUS_META[s]
                const active = viewingActivity.status === s
                return (
                  <button
                    key={s}
                    onClick={() => { onStatusChange(viewingActivity, s); setShowStatusOptions(false) }}
                    style={{
                      flex: 1, padding: "7px 8px", borderRadius: 8,
                      border: active ? `1.5px solid ${meta.color}` : `1px solid ${theme.border}`,
                      background: active ? meta.bg : "transparent",
                      color: active ? meta.color : theme.muted,
                      fontSize: 11, fontWeight: active ? 600 : 500,
                      cursor: "pointer", transition: "all 0.12s", whiteSpace: "nowrap",
                    }}
                    onMouseEnter={(e) => {
                      if (!active) { e.currentTarget.style.background = theme.bg; e.currentTarget.style.borderColor = meta.color }
                    }}
                    onMouseLeave={(e) => {
                      if (!active) { e.currentTarget.style.background = "transparent"; e.currentTarget.style.borderColor = theme.border }
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
            <div style={{ background: "rgba(220,38,38,0.08)", borderRadius: 12, padding: "14px 16px", display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap" }}>
              <span style={{ fontSize: 13, color: "#EF4444", flex: 1 }}>{t("productivity.event.deleteConfirm")}</span>
              <button type="button" onClick={() => onDelete(viewingActivity.id)}
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
