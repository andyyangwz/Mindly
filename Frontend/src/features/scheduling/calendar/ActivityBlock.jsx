import { memo, useCallback, useRef, useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import i18n from "../../../i18n"
import { getActivityStyles } from "../utils/activityStyles"
import { STATUS_META } from "../utils/calendarConstants"
import { Portal } from "../../../utils/portal"
import "../../../styles/scheduling/index.css"

const TYPE_META = {
  normal: null,
  deadlineTask: { icon: "\u25B6", color: "#6366F1" },
}

const LEVEL_META = {
  productive: { color: "#10B981", bg: "#10B98114", border: "#10B98130" },
  neutral: { color: "#6B7280", bg: "#6B728010", border: "#6B728020" },
  unproductive: { color: "#EF4444", bg: "#EF444414", border: "#EF444430" },
}

function displayTitle(activity) {
  return activity.title
}

function formatDisplayTime(timeStr) {
  if (!timeStr) return ""
  const [h, m] = timeStr.split(":").map(Number)
  const hn = h === 24 ? 0 : h
  const ampm = hn >= 12 ? "PM" : "AM"
  const hour = hn % 12 || 12
  return `${hour}:${String(m).padStart(2, "0")} ${ampm}`
}

function formatDeadlineDate(dateStr) {
  if (!dateStr) return ""
  const d = new Date(dateStr + "T00:00:00")
  const locale = i18n.language?.startsWith("id") ? "id-ID" : "en-US"
  return d.toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })
}

function formatCompletionTime(dateStr) {
  if (!dateStr) return ""
  const d = new Date(dateStr)
  const locale = i18n.language?.startsWith("id") ? "id-ID" : "en-US"
  return d.toLocaleDateString(locale, { day: "numeric", month: "short", year: "numeric" })
}

const RESIZE_ZONE_HEIGHT = 8

const ActivityBlock = memo(function ActivityBlock({ activity, style, onContextMenu, onViewDetails, isInlineEditing, onInlineSave, onInlineCancel, onStatusChange, interactionMode, isSyncing, tutorialTarget, isDragging, isResizing }) {
  const [statusUpdated, setStatusUpdated] = useState(false)
  const { t } = useTranslation()
  const { startTime, endTime, segmentStart, segmentEnd, status, hasDeadline } = activity
  const displayStart = startTime || (segmentStart && segmentStart.length > 5 ? segmentStart.split("T")[1] : segmentStart)
  const displayEnd = endTime || (segmentEnd && segmentEnd.length > 5 ? segmentEnd.split("T")[1] : segmentEnd)
  const isDone = status === "Done"
  const es = getActivityStyles(activity)
  const typeInfo = TYPE_META[es.variantKey] || null
  const statusMeta = STATUS_META[status] || null
  const baseHeight = style?.height || 60
  const top = style?.top || 0
  const height = hasDeadline ? baseHeight + 6 : baseHeight
  const isCompact = height < 32
  const isMini = height < 24
  const showFinishedAt = isDone && !isMini && hasDeadline && activity.statusChangeAt
  const displayHeight = showFinishedAt ? height + 6 : height
  const isCrossDaySeg = activity.isSegmented
  const continuesPrev = !isCrossDaySeg ? false : activity.continuesPrev
  const continuesNext = !isCrossDaySeg ? false : activity.continuesNext
  const isTaskMarker = activity._isTaskMarker

  const [statusMenu, setStatusMenu] = useState(null)
  const [menuPos, setMenuPos] = useState({ right: 0, top: 0 })
  const statusMenuRef = useRef(null)
  const [inlineTitle, setInlineTitle] = useState("")
  const inlineInputRef = useRef(null)
  const prevStatusRef = useRef(activity.status)
  const statusTimerRef = useRef(null)

  useEffect(() => {
    if (prevStatusRef.current !== activity.status) {
      prevStatusRef.current = activity.status
      setStatusUpdated(true)
      if (statusTimerRef.current) clearTimeout(statusTimerRef.current)
      statusTimerRef.current = setTimeout(() => setStatusUpdated(false), 600)
    }
  }, [activity.status])

  useEffect(() => {
    return () => {
      if (statusTimerRef.current) clearTimeout(statusTimerRef.current)
    }
  }, [])

  const handleDetailClick = useCallback((e) => {
    if (interactionMode !== "fixed" || isInlineEditing) return
    e.stopPropagation()
    onViewDetails?.(activity)
  }, [activity, onViewDetails, isInlineEditing, interactionMode])

  const handleStatusBadgeClick = useCallback((e) => {
    if (interactionMode !== "fixed") return
    e.stopPropagation()
    const rect = e.currentTarget.getBoundingClientRect()
    setStatusMenu({ activity, badgeRect: rect, pos: { right: window.innerWidth - rect.right - 1, top: rect.bottom + 4 } })
  }, [activity, interactionMode])

  useEffect(() => {
    if (!statusMenu) return
    setMenuPos(statusMenu.pos)

    requestAnimationFrame(() => {
      const el = statusMenuRef.current
      if (!el) return
      const mr = el.getBoundingClientRect()
      const vw = window.innerWidth
      const vh = window.innerHeight
      const gap = 4
      let { right, top } = statusMenu.pos

      if (right + mr.width > vw - gap) right = vw - mr.width - gap
      if (right < gap) right = gap
      if (top + mr.height > vh - gap) top = vh - mr.height - gap
      if (top < gap) top = gap

      setMenuPos({ right, top })
    })
  }, [statusMenu])

  useEffect(() => {
    if (!statusMenu) return
    const handler = (e) => {
      if (!e.target.closest("[data-status-menu]")) {
        setStatusMenu(null)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [statusMenu])

  useEffect(() => {
    if (isInlineEditing && inlineInputRef.current) {
      setTimeout(() => inlineInputRef.current?.focus(), 50)
    }
  }, [isInlineEditing])

  const handleInlineKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault()
      e.currentTarget.blur()
    } else if (e.key === "Escape") {
      e.preventDefault()
      onInlineCancel?.()
    }
  }

  const handleCtxMenu = useCallback((e) => {
    e.preventDefault()
    e.stopPropagation()
    if (interactionMode !== "fixed") return
    onContextMenu?.(activity, { x: e.clientX, y: e.clientY })
  }, [activity, onContextMenu, interactionMode])

  const displayLeft = style?.left ?? 0
  const displayWidth = style?.width ?? undefined

  return (
    <>
      <div
        data-event-wrapper="true"
        data-activity-id={activity.id}
        data-syncing={isSyncing ? "true" : undefined}
        {...(tutorialTarget ? { "data-tutorial-target": tutorialTarget } : {})}
        onClick={handleDetailClick}
        onDoubleClick={(e) => e.stopPropagation()}
        onContextMenu={handleCtxMenu}
        title={displayTitle(activity)}
        className={`ab-block ${isDone ? "ab-block-done" : ""} ${isDragging ? "ab-dragging" : ""} ${isResizing ? "ab-resizing" : ""}`}
        style={{
          top,
          left: displayLeft,
          height: displayHeight,
          width: displayWidth,
          padding: isMini ? "2px 5px" : isCompact ? "3px 8px" : "4px 10px",
          cursor: isTaskMarker ? "pointer" : (isCrossDaySeg ? "default" : interactionMode === "fixed" ? "pointer" : "grab"),
          ...es.style,
        }}
      >
        {continuesPrev && !isMini && (
          <div className="ab-continue-arrow" style={{ top: -1, left: 0, right: 0 }}>
            <svg width="14" height="8" viewBox="0 0 14 8" fill="none">
              <path d="M7 0L13.9282 6H0.0718L7 0Z" fill={es.color} opacity="0.5" />
            </svg>
          </div>
        )}
        {continuesNext && !isMini && (
          <div className="ab-continue-arrow" style={{ bottom: -1, left: 0, right: 0 }}>
            <svg width="14" height="8" viewBox="0 0 14 8" fill="none">
              <path d="M7 8L0.0718 2H13.9282L7 8Z" fill={es.color} opacity="0.5" />
            </svg>
          </div>
        )}

        <div
          className="ab-top-row"
          style={{
            fontSize: isMini ? 9 : isCompact ? 10 : 11,
            fontWeight: isTaskMarker ? 500 : 600,
            color: es.titleColor,
            lineHeight: isMini ? 1.3 : 1.4,
          }}
        >
          <span className="ab-title-group">
            <span className="ab-title-inner">
              {typeInfo && (
                <span className="ab-type-icon" style={{ fontSize: isMini ? 8 : 9, opacity: 0.7 }}>
                  {isTaskMarker ? (activity._taskRole === "deadline" ? "\uD83C\uDFC1" : "\uD83D\uDEA9") : typeInfo.icon}
                </span>
              )}
              {isInlineEditing ? (
                <input
                  ref={inlineInputRef}
                  data-inline-input
                  value={inlineTitle}
                  onChange={(e) => setInlineTitle(e.target.value)}
                  onKeyDown={handleInlineKeyDown}
                  onBlur={() => {
                    if (inlineTitle.trim()) {
                      onInlineSave?.(inlineTitle)
                    } else {
                      onInlineCancel?.()
                    }
                  }}
                  placeholder={t("scheduling.eventForm.titlePlaceholder")}
                  className="ab-inline-input"
                  style={{
                    fontSize: isMini ? 9 : isCompact ? 10 : 11,
                    fontWeight: 600, color: es.titleColor,
                  }}
                />
              ) : (
                <span className="ab-title-text" style={{ textDecoration: isDone ? "line-through" : "none" }}>
                  {displayTitle(activity)}
                </span>
              )}
            </span>

            {typeInfo && !isMini && !isTaskMarker && (
              <span className="ab-deadline-badge" style={{ background: `${typeInfo.color}18`, color: typeInfo.color }}>
                {isDone ? `Finish on ${formatDeadlineDate(activity.endDatetime ? activity.endDatetime.slice(0, 10) : "")}` : "Deadline"}
              </span>
            )}

            {!activity.hasDeadline && activity.productivityLevel && LEVEL_META[activity.productivityLevel] && !isMini && (
              <span className="ab-level-badge" style={{ background: LEVEL_META[activity.productivityLevel].bg, color: LEVEL_META[activity.productivityLevel].color, border: `1px solid ${LEVEL_META[activity.productivityLevel].border}` }}>
                {t(`scheduling.eventForm.level_${activity.productivityLevel}`)}
              </span>
            )}
          </span>

          {isTaskMarker && !isMini && (() => {
            const isStart = activity._taskRole === "start"
            const roleColor = isStart ? "#10B981" : "#EF4444"
            return (
              <span className="ab-task-role-badge" style={{ background: `${roleColor}14`, color: roleColor, border: `1px solid ${roleColor}30` }}>
                {isStart ? "Start" : "Deadline"}
              </span>
            )
          })()}

          {statusMeta && !isMini && (
            <span
              onClick={handleStatusBadgeClick}
              className={`ab-status-badge ${statusUpdated ? "status-flash" : ""}`}
              style={{
                background: statusMeta.bg, color: statusMeta.color,
                border: `1px solid ${statusMeta.border}`,
                cursor: interactionMode === "fixed" ? "pointer" : "default",
              }}
            >
              {status}
              {interactionMode === "fixed" && (
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none" style={{ flexShrink: 0 }}>
                  <path d="M2 3L4 5L6 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </span>
          )}
        </div>

        {isDone && !isMini && activity.hasDeadline && activity.statusChangeAt && (
          <div className="ab-finished-at">Finished at: {formatCompletionTime(activity.statusChangeAt)}</div>
        )}

        {!isCompact && !hasDeadline && (
          <div className="ab-time-row" style={{ color: es.titleColor }}>
            {formatDisplayTime(displayStart)} – {formatDisplayTime(displayEnd)}
          </div>
        )}

        {!hasDeadline && !isCrossDaySeg && interactionMode !== "fixed" && (
          <div
            data-resize-top
            data-activity-id={activity.id}
            className="ab-resize-zone"
            style={{ top: -2, left: 0, right: 0, height: RESIZE_ZONE_HEIGHT }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(99,102,241,0.18)" }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
            onDoubleClick={(e) => e.stopPropagation()}
          />
        )}
        {!hasDeadline && !isCrossDaySeg && interactionMode !== "fixed" && (
          <div
            data-resize-bottom
            data-activity-id={activity.id}
            className="ab-resize-zone"
            style={{ top: height - RESIZE_ZONE_HEIGHT / 2, left: 0, right: 0, height: RESIZE_ZONE_HEIGHT }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(99,102,241,0.18)" }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
            onDoubleClick={(e) => e.stopPropagation()}
          />
        )}
      </div>

      {statusMenu && (
        <Portal>
          <div
            ref={statusMenuRef}
            data-status-menu
            className="ab-status-menu"
            style={{ right: menuPos.right, top: menuPos.top }}
          >
            {["To Do", "In Progress", "Done"].filter(s => s !== statusMenu.activity.status).map(s => {
              const meta = STATUS_META[s]
              return (
                <button
                  key={s}
                  onClick={() => { onStatusChange?.(statusMenu.activity, s); setStatusMenu(null) }}
                  className="ab-status-option"
                  style={{ color: meta.color }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = meta.bg }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
                >
                  {t(s === "Done" ? "scheduling.status.done" : s === "In Progress" ? "scheduling.status.inProgress" : "scheduling.status.todo")}
                </button>
              )
            })}
          </div>
        </Portal>
      )}
    </>
  )
})

export default ActivityBlock
