import { memo, useCallback, useRef, useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import i18n from "../../../i18n"
import { getActivityStyles } from "../utils/activityStyles"
import { STATUS_META, formatDateRange } from "../utils/calendarConstants"
import { theme } from "../../../theme"
import { Portal } from "../../../utils/portal"

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

const ActivityBlock = memo(function ActivityBlock({ activity, style, onContextMenu, onViewDetails, isInlineEditing, onInlineSave, onInlineCancel, onStatusChange, interactionMode, isSyncing, tutorialTarget }) {
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

      // Left-edge overflow: menu extends past left viewport edge
      if (right + mr.width > vw - gap) right = vw - mr.width - gap
      // Right-edge overflow: compressed by right gap constraint
      if (right < gap) right = gap
      // Bottom overflow: flip upward
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
        style={{
          position: "absolute",
          top,
          left: displayLeft,
          height: displayHeight,
          width: displayWidth,
          borderRadius: 6,
          padding: isMini ? "2px 5px" : isCompact ? "3px 8px" : "4px 10px",
          cursor: isTaskMarker ? "pointer" : (isCrossDaySeg ? "default" : interactionMode === "fixed" ? "pointer" : "grab"),
          overflow: "hidden",
          transition: "box-shadow 0.15s, background 0.15s",
          zIndex: 5,
          boxSizing: "border-box",
          opacity: isDone ? 0.8 : 1,
          filter: isDone ? "saturate(0.9)" : "none",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          ...es.style,
        }}
        onMouseEnter={(e) => {
          Object.assign(e.currentTarget.style, es.hover)
          e.currentTarget.style.zIndex = 6
        }}
        onMouseLeave={(e) => {
          Object.assign(e.currentTarget.style, es.leave)
          e.currentTarget.style.zIndex = 5
        }}
      >
        {continuesPrev && !isMini && (
          <div
            style={{
              position: "absolute", top: -1, left: 0, right: 0,
              display: "flex", justifyContent: "center",
              pointerEvents: "none", zIndex: 2,
            }}
          >
            <svg width="14" height="8" viewBox="0 0 14 8" fill="none">
              <path d="M7 0L13.9282 6H0.0718L7 0Z" fill={es.color} opacity="0.5" />
            </svg>
          </div>
        )}
        {continuesNext && !isMini && (
          <div
            style={{
              position: "absolute", bottom: -1, left: 0, right: 0,
              display: "flex", justifyContent: "center",
              pointerEvents: "none", zIndex: 2,
            }}
          >
            <svg width="14" height="8" viewBox="0 0 14 8" fill="none">
              <path d="M7 8L0.0718 2H13.9282L7 8Z" fill={es.color} opacity="0.5" />
            </svg>
          </div>
        )}

        <div
          style={{
            fontSize: isMini ? 9 : isCompact ? 10 : 11,
            fontWeight: isTaskMarker ? 500 : 600,
            color: es.titleColor,
            lineHeight: isMini ? 1.3 : 1.4,
            display: "flex", alignItems: "center", justifyContent: "space-between", gap: 6,
          }}
        >
          <span style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, flex: 1, overflow: "hidden" }}>
            <span style={{ display: "flex", alignItems: "center", gap: 3, minWidth: 0, flex: 1, overflow: "hidden" }}>
              {typeInfo && (
                <span style={{ fontSize: isMini ? 8 : 9, opacity: 0.7, flexShrink: 0, whiteSpace: "nowrap" }}>
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
                  placeholder={t("productivity.eventForm.titlePlaceholder")}
                  style={{
                    flex: 1, minWidth: 0,
                    fontSize: isMini ? 9 : isCompact ? 10 : 11,
                    fontWeight: 600, color: es.titleColor,
                    background: "transparent", border: "none", outline: "none",
                    padding: 0, fontFamily: "inherit",
                  }}
                />
              ) : (
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", textDecoration: isDone ? "line-through" : "none" }}>
                  {displayTitle(activity)}
                </span>
              )}
            </span>

            {typeInfo && !isMini && !isTaskMarker && (
              <span style={{ fontSize: 8, fontWeight: 600, padding: "1px 5px", borderRadius: 3, background: `${typeInfo.color}18`, color: typeInfo.color, lineHeight: 1.3, flexShrink: 0 }}>
                {isDone ? `Finish on ${formatDeadlineDate(activity.endDatetime ? activity.endDatetime.slice(0, 10) : "")}` : "Deadline"}
              </span>
            )}

            {!activity.hasDeadline && activity.productivityLevel && LEVEL_META[activity.productivityLevel] && !isMini && (
              <span style={{ fontSize: 8, fontWeight: 600, padding: "1px 6px", borderRadius: 3, background: LEVEL_META[activity.productivityLevel].bg, color: LEVEL_META[activity.productivityLevel].color, border: `1px solid ${LEVEL_META[activity.productivityLevel].border}`, lineHeight: 1.4, letterSpacing: "0.01em", flexShrink: 0 }}>
                {t(`productivity.eventForm.level_${activity.productivityLevel}`)}
              </span>
            )}
          </span>

          {isTaskMarker && !isMini && (() => {
            const isStart = activity._taskRole === "start"
            const roleColor = isStart ? "#10B981" : "#EF4444"
            return (
              <span
                style={{
                  fontSize: 8, fontWeight: 600,
                  padding: "1px 6px", borderRadius: 3,
                  background: `${roleColor}14`,
                  color: roleColor,
                  border: `1px solid ${roleColor}30`,
                  lineHeight: 1.4, letterSpacing: "0.01em",
                  flexShrink: 0,
                }}
              >
                {isStart ? "Start" : "Deadline"}
              </span>
            )
          })()}

          {statusMeta && !isMini && (
            <span
              onClick={handleStatusBadgeClick}
              className={statusUpdated ? "status-flash" : ""}
              style={{
                fontSize: 8, fontWeight: 600,
                padding: "1px 6px", borderRadius: 3,
                background: statusMeta.bg, color: statusMeta.color,
                border: `1px solid ${statusMeta.border}`,
                lineHeight: 1.4, letterSpacing: "0.01em",
                flexShrink: 0,
                cursor: interactionMode === "fixed" ? "pointer" : "default",
                display: "inline-flex", alignItems: "center", gap: 3,
                transition: "background 0.3s ease, color 0.3s ease, border-color 0.3s ease, transform 0.2s ease, opacity 0.1s",
              }}
              onMouseEnter={(e) => { if (interactionMode === "fixed") e.currentTarget.style.opacity = "0.7" }}
              onMouseLeave={(e) => { if (interactionMode === "fixed") e.currentTarget.style.opacity = "1" }}
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
          <div style={{ fontSize: 10, fontWeight: 600, color: "#10B981", lineHeight: 1.5, marginTop: 1 }}>
            Finished at: {formatCompletionTime(activity.statusChangeAt)}
          </div>
        )}

        {!isCompact && !hasDeadline && (
          <div style={{ fontSize: 10, fontWeight: 500, color: es.titleColor, opacity: 0.85, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", lineHeight: 1.5, marginTop: 2, pointerEvents: "none" }}>
            {formatDisplayTime(displayStart)} – {formatDisplayTime(displayEnd)}
          </div>
        )}

        {/* Resize zones inside wrapper so hover effects on wrapper fire correctly */}
        {!hasDeadline && !isCrossDaySeg && interactionMode !== "fixed" && (
          <div
            data-resize-top
            data-activity-id={activity.id}
            style={{
              position: "absolute",
              top: -2,
              left: 0,
              right: 0,
              height: RESIZE_ZONE_HEIGHT,
              cursor: "ns-resize",
              zIndex: 14,
              transition: "background 0.12s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(99,102,241,0.18)" }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
            onDoubleClick={(e) => e.stopPropagation()}
          />
        )}
        {!hasDeadline && !isCrossDaySeg && interactionMode !== "fixed" && (
          <div
            data-resize-bottom
            data-activity-id={activity.id}
            style={{
              position: "absolute",
              top: height - RESIZE_ZONE_HEIGHT / 2,
              left: 0,
              right: 0,
              height: RESIZE_ZONE_HEIGHT,
              cursor: "ns-resize",
              zIndex: 14,
              transition: "background 0.12s",
            }}
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
            style={{
              position: "fixed",
              right: menuPos.right,
              top: menuPos.top,
              zIndex: theme.z.modal + 10,
              background: "var(--color-card, white)",
              borderRadius: 8,
              border: `1px solid ${theme.border}`,
              boxShadow: "0 8px 24px rgba(0,0,0,0.15)",
              padding: 3,
              minWidth: 130,
            }}>
            {["To Do", "In Progress", "Done"].filter(s => s !== statusMenu.activity.status).map(s => {
              const meta = STATUS_META[s]
              return (
                <button
                  key={s}
                  onClick={() => { onStatusChange?.(statusMenu.activity, s); setStatusMenu(null) }}
                  style={{
                    display: "flex", alignItems: "center", gap: 6,
                    width: "100%", padding: "6px 10px",
                    border: "none", background: "transparent", borderRadius: 6,
                    cursor: "pointer", fontSize: 12, fontWeight: 500,
                    color: meta.color, transition: "background 0.1s",
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = meta.bg }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
                >
                  {t(s === "Done" ? "productivity.status.done" : s === "In Progress" ? "productivity.status.inProgress" : "productivity.status.todo")}
                </button>
              )
            })}
          </div>
        </Portal>
      )}
      <style>{`
        .status-flash {
          animation: statusPulse 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        @keyframes statusPulse {
          0% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
          }
          40% {
            transform: scale(1.15);
            box-shadow: 0 0 0 4px rgba(16, 185, 129, 0.15);
          }
          100% {
            transform: scale(1);
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
          }
        }

        @keyframes syncBlockGlow {
          0%, 100% {
            box-shadow: 0 0 0 0 color-mix(in srgb, ${theme.primary} 0%, transparent);
          }
          50% {
            box-shadow: 0 0 0 2px color-mix(in srgb, ${theme.primary} 12%, transparent), 0 0 12px color-mix(in srgb, ${theme.primary} 6%, transparent);
          }
        }
        [data-syncing="true"] {
          animation: syncBlockGlow 1.2s ease-in-out 1;
        }

        [data-tutorial-target="demo-activity-block"] {
          animation: tutorialBlockPulse 2s ease-in-out infinite;
          outline: 2px solid color-mix(in srgb, ${theme.primary} 40%, transparent);
          outline-offset: 1px;
        }
        @keyframes tutorialBlockPulse {
          0%, 100% {
            box-shadow: 0 0 6px color-mix(in srgb, ${theme.primary} 20%, transparent),
                        0 0 20px color-mix(in srgb, ${theme.primary} 8%, transparent);
          }
          50% {
            box-shadow: 0 0 12px color-mix(in srgb, ${theme.primary} 35%, transparent),
                        0 0 40px color-mix(in srgb, ${theme.primary} 12%, transparent);
          }
        }
      `}</style>
    </>
  )
})

export default ActivityBlock
