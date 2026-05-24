import { memo, useCallback, useRef, useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import i18n from "../../i18n"
import { formatTime, HOUR_HEIGHT, PRODUCTIVITY_LEVEL_COLORS } from "./calendarConstants"
import { getActivityStyles } from "./activityStyles"
import { Portal } from "../../utils/portal"

const TYPE_META = {
  normal: null,
  deadlineTask: { icon: "▶", color: "#6366F1" },
  deadlineMarker: { icon: "⏰", color: "#DC2626" },
}

const STATUS_META = {
  "Done": { color: "#10B981", bg: "#10B98114", border: "#10B98130" },
  "In Progress": { color: "#B45309", bg: "#B4530918", border: "#B4530940" },
  "To Do": { color: "#6B7280", bg: "#6B728010", border: "#6B728020" },
}

const LEVEL_META = {
  productive: { color: "#10B981", bg: "#10B98114", border: "#10B98130" },
  neutral: { color: "#6B7280", bg: "#6B728010", border: "#6B728020" },
  unproductive: { color: "#EF4444", bg: "#EF444414", border: "#EF444430" },
}

const MIN_BLOCK_HEIGHT = 15

function displayTitle(activity) {
  const title = activity.title
  if (activity.isDeadlineMarker && title.endsWith(" Deadline")) {
    return title.slice(0, -9)
  }
  return title
}

function timeToMinutes(timeStr) {
  const [h, m] = timeStr.split(":").map(Number)
  return h * 60 + m
}

function minutesToTime(mins) {
  const clamped = Math.max(0, Math.min(24 * 60, Math.round(mins)))
  const h = Math.floor(clamped / 60)
  const m = clamped % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

function formatDisplayTime(timeStr) {
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

const ActivityBlock = memo(function ActivityBlock({ activity, style, onContextMenu, onResize, onDragEnd, onViewDetails, onDragUpdate, isInlineEditing, onInlineSave, onInlineCancel }) {
  const { t } = useTranslation()
  const { startTime, endTime, status, hasDeadline } = activity
  const height = style?.height || 60
  const top = style?.top || 0
  const isCompact = height < 32
  const isMini = height < 24
  const es = getActivityStyles(activity)
  const typeInfo = TYPE_META[es.variantKey] || null
  const statusMeta = STATUS_META[status] || null
  const isDone = status === "Done"
  const isResizable = !hasDeadline

  const [dragging, setDragging] = useState(null)
  const [moving, setMoving] = useState(false)
  const [tooltip, setTooltip] = useState(null)
  const [hovered, setHovered] = useState(false)
  const hoverTimerRef = useRef(null)

  const handleBlockMouseEnter = useCallback(() => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
    setHovered(true)
  }, [])

  const handleBlockMouseLeave = useCallback(() => {
    hoverTimerRef.current = setTimeout(() => setHovered(false), 50)
  }, [])

  const handleCircleMouseEnter = useCallback(() => {
    if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
    setHovered(true)
  }, [])

  const handleCircleMouseLeave = useCallback(() => {
    hoverTimerRef.current = setTimeout(() => setHovered(false), 50)
  }, [])
  const [inlineTitle, setInlineTitle] = useState("")
  const dragRef = useRef(null)
  const moveRef = useRef(null)
  const committedRef = useRef(null)
  const preDragTopRef = useRef(null)
  const inlineInputRef = useRef(null)

  const propsMatchCommitted = committedRef.current
    ? committedRef.current.top === top && committedRef.current.height === height
    : true

  const parentMovedFromPreDrag = preDragTopRef.current !== null && top !== preDragTopRef.current

  if (!dragging && !moving && parentMovedFromPreDrag) {
    committedRef.current = null
    preDragTopRef.current = null
  }

  if (!dragging && !moving && !parentMovedFromPreDrag && propsMatchCommitted && committedRef.current) {
    committedRef.current = null
    preDragTopRef.current = null
  }

  useEffect(() => {
    if (isInlineEditing && inlineInputRef.current) {
      setTimeout(() => inlineInputRef.current?.focus(), 50)
    }
  }, [isInlineEditing])

  useEffect(() => {
    return () => {
      if (hoverTimerRef.current) clearTimeout(hoverTimerRef.current)
    }
  }, [])

  const handleInlineKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault()
      onInlineSave?.(inlineTitle)
    } else if (e.key === "Escape") {
      e.preventDefault()
      onInlineCancel?.()
    }
  }

  const resizeClickRef = useRef(null)

  const handleResizeClick = useCallback((e, edge) => {
    e.preventDefault()
    const now = Date.now()
    const lastClick = resizeClickRef.current?.lastClickTime || 0
    const isDoubleClick = now - lastClick < 350

    if (isDoubleClick) {
      const startMinutes = timeToMinutes(startTime)
      const endMinutes = timeToMinutes(endTime)
      preDragTopRef.current = top
      dragRef.current = {
        edge,
        startY: e.clientY,
        startTop: top,
        startHeight: height,
        startStartMin: startMinutes,
        startEndMin: endMinutes,
        visual: { top, height, startTime, endTime },
      }
      setDragging(edge)
      setTooltip({ x: e.clientX, y: e.clientY, startTime, endTime })
    } else {
      resizeClickRef.current = { lastClickTime: now }
    }
  }, [startTime, endTime, top, height])

  const handleResizeStart = useCallback((e, edge) => {
    e.stopPropagation()
    e.preventDefault()
    const startMinutes = timeToMinutes(startTime)
    const endMinutes = timeToMinutes(endTime)
    preDragTopRef.current = top
    dragRef.current = {
      edge,
      startY: e.clientY,
      startTop: top,
      startHeight: height,
      startStartMin: startMinutes,
      startEndMin: endMinutes,
      visual: { top, height, startTime, endTime },
    }
    setDragging(edge)
    setTooltip({ x: e.clientX, y: e.clientY, startTime, endTime })
  }, [startTime, endTime, top, height])

  const handleMoveStart = useCallback((e) => {
    if (isInlineEditing) return
    e.stopPropagation()
    const now = Date.now()
    const lastClick = moveRef.current?.lastClickTime || 0
    const isDoubleClick = now - lastClick < 350

    if (isDoubleClick) {
      preDragTopRef.current = top
      moveRef.current = {
        startY: e.clientY,
        startTop: top,
        startStartMin: timeToMinutes(startTime),
        startEndMin: timeToMinutes(endTime),
        visual: { top, startTime, endTime },
      }
      setMoving(true)
      setTooltip({ x: e.clientX, y: e.clientY, startTime, endTime })
    } else {
      moveRef.current = { lastClickTime: now }
    }
  }, [startTime, endTime, top])

  useEffect(() => {
    if (!dragging && !moving) return

    const handleMouseMove = (e) => {
      if (dragging && dragRef.current) {
        const { edge, startY, startTop, startHeight, startStartMin, startEndMin } = dragRef.current
        const deltaY = e.clientY - startY
        const deltaMinutes = deltaY

        if (edge === "top") {
          const newStartMin = startStartMin + deltaMinutes
          const newEndMin = startEndMin
          if (newEndMin - newStartMin < MIN_BLOCK_HEIGHT) return
          const newTop = (newStartMin / 60) * HOUR_HEIGHT
          const newHeight = ((newEndMin - newStartMin) / 60) * HOUR_HEIGHT
          const newStartTime = minutesToTime(newStartMin)
          const newEndTime = minutesToTime(newEndMin)
          dragRef.current.visual = { top: newTop, height: newHeight, startTime: newStartTime, endTime: newEndTime }
          setTooltip({ x: e.clientX, y: e.clientY, startTime: newStartTime, endTime: newEndTime })
          onDragUpdate?.(activity.id, newStartTime, newEndTime)
        } else {
          const newStartMin = startStartMin
          const newEndMin = startEndMin + deltaMinutes
          if (newEndMin - newStartMin < MIN_BLOCK_HEIGHT) return
          const newHeight = ((newEndMin - newStartMin) / 60) * HOUR_HEIGHT
          const newStartTime = minutesToTime(newStartMin)
          const newEndTime = minutesToTime(newEndMin)
          dragRef.current.visual = { top: startTop, height: newHeight, startTime: newStartTime, endTime: newEndTime }
          setTooltip({ x: e.clientX, y: e.clientY, startTime: newStartTime, endTime: newEndTime })
          onDragUpdate?.(activity.id, newStartTime, newEndTime)
        }
      }

      if (moving && moveRef.current) {
        const { startY, startTop, startStartMin, startEndMin } = moveRef.current
        const deltaY = e.clientY - startY
        const deltaMinutes = deltaY
        const newStartMin = startStartMin + deltaMinutes
        const newEndMin = startEndMin + deltaMinutes
        const clampedStart = Math.max(0, Math.min(24 * 60, newStartMin))
        const clampedEnd = Math.max(0, Math.min(24 * 60, newEndMin))
        if (clampedEnd - clampedStart < MIN_BLOCK_HEIGHT) return
        const newTop = (clampedStart / 60) * HOUR_HEIGHT
        const newStartTime = minutesToTime(clampedStart)
        const newEndTime = minutesToTime(clampedEnd)
        moveRef.current.visual = { top: newTop, startTime: newStartTime, endTime: newEndTime }
        setTooltip({ x: e.clientX, y: e.clientY, startTime: newStartTime, endTime: newEndTime })
        onDragUpdate?.(activity.id, newStartTime, newEndTime)
      }
    }

    const handleMouseUp = () => {
      if (dragging && dragRef.current?.visual) {
        const { top: newTop, height: newHeight, startTime: newStart, endTime: newEnd } = dragRef.current.visual
        const oldStart = minutesToTime(dragRef.current.startStartMin)
        const oldEnd = minutesToTime(dragRef.current.startEndMin)
        committedRef.current = { top: newTop, height: newHeight }
        onResize?.(activity, oldStart, oldEnd, newStart, newEnd)
      }

      if (moving && moveRef.current?.visual) {
        const { top: newTop, startTime: newStart, endTime: newEnd } = moveRef.current.visual
        const oldStart = minutesToTime(moveRef.current.startStartMin)
        const oldEnd = minutesToTime(moveRef.current.startEndMin)
        committedRef.current = { top: newTop, height: committedRef.current?.height ?? height }
        onDragEnd?.(activity.id, oldStart, oldEnd, newStart, newEnd)
      }

      onDragUpdate?.(activity.id, null, null)
      setDragging(null)
      setMoving(false)
      setTooltip(null)
      dragRef.current = null
      moveRef.current = null
    }

    document.addEventListener("mousemove", handleMouseMove)
    document.addEventListener("mouseup", handleMouseUp)
    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
    }
  }, [dragging, moving, activity, onResize, onDragEnd, height, onDragUpdate])

  const visualStyle = dragging ? dragRef.current?.visual : null
  const moveStyle = moving ? moveRef.current?.visual : null
  const committedStyle = !dragging && !moving ? committedRef.current : null
  const isLocalControlled = !!(visualStyle || moveStyle || committedStyle)
  const displayTop = visualStyle?.top ?? moveStyle?.top ?? committedStyle?.top ?? top
  const displayHeight = visualStyle?.height ?? committedStyle?.height ?? height
  const displayLeft = style?.left ?? 0
  const displayWidth = style?.width ?? undefined

  const resizeCircleSize = 4
  const resizeCircleHalf = resizeCircleSize / 2

  const resizeCircleStyle = {
    position: "absolute",
    left: "50%",
    top: "50%",
    transform: "translate(-50%, -50%)",
    width: resizeCircleSize,
    height: resizeCircleSize,
    borderRadius: "50%",
    background: es.style.background,
    border: `1px solid ${es.color}55`,
    cursor: "ns-resize",
    zIndex: 15,
  }

  const wrapperCursor = dragging ? "ns-resize" : moving ? "grabbing" : "grab"

  return (
    <>
      <div
        data-event-wrapper="true"
        onMouseDown={handleMoveStart}
        onContextMenu={(e) => {
          e.preventDefault()
          e.stopPropagation()
          onContextMenu?.(activity, { x: e.clientX, y: e.clientY })
        }}
        title={displayTitle(activity)}
        style={{
          position: "absolute",
          top: displayTop,
          left: displayLeft,
          height: displayHeight,
          width: displayWidth,
          borderRadius: 6,
          padding: isMini ? "2px 5px" : isCompact ? "3px 8px" : "4px 10px",
          cursor: wrapperCursor,
          overflow: "hidden",
          transition: dragging || moving ? "none" : "box-shadow 0.15s, background 0.15s",
          zIndex: dragging || moving ? 20 : 5,
          boxSizing: "border-box",
          opacity: isDone ? 0.8 : 1,
          filter: isDone ? "saturate(0.9)" : "none",
          backdropFilter: "blur(6px)",
          WebkitBackdropFilter: "blur(6px)",
          ...es.style,
        }}
        onMouseEnter={(e) => {
          handleBlockMouseEnter()
          if (!dragging && !moving) {
            Object.assign(e.currentTarget.style, es.hover)
            e.currentTarget.style.zIndex = 6
          }
        }}
        onMouseLeave={(e) => {
          handleBlockMouseLeave()
          if (!dragging && !moving) {
            Object.assign(e.currentTarget.style, es.leave)
            e.currentTarget.style.zIndex = 5
          }
        }}
      >
        {/* Title row — always visible */}
        <div
          style={{
            fontSize: isMini ? 9 : isCompact ? 10 : 11,
            fontWeight: 600,
            color: es.titleColor,
            lineHeight: isMini ? 1.3 : 1.4,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 6,
            pointerEvents: "none",
          }}
        >
          <span style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            minWidth: 0,
            flex: 1,
            overflow: "hidden",
          }}>
            <span style={{
              display: "flex",
              alignItems: "center",
              gap: 3,
              minWidth: 0,
              flex: 1,
              overflow: "hidden",
            }}>
              {typeInfo && (
                <span
                  style={{
                    fontSize: isMini ? 8 : 9,
                    opacity: 0.7,
                    flexShrink: 0,
                    whiteSpace: "nowrap",
                  }}
                >
                  {typeInfo.icon}
                </span>
              )}
              {isInlineEditing ? (
                <input
                  ref={inlineInputRef}
                  value={inlineTitle}
                  onChange={(e) => setInlineTitle(e.target.value)}
                  onKeyDown={handleInlineKeyDown}
                  onBlur={() => onInlineCancel?.()}
                  placeholder={t("productivity.eventForm.titlePlaceholder")}
                  style={{
                    flex: 1,
                    minWidth: 0,
                    fontSize: isMini ? 9 : isCompact ? 10 : 11,
                    fontWeight: 600,
                    color: es.titleColor,
                    background: "transparent",
                    border: "none",
                    outline: "none",
                    padding: 0,
                    fontFamily: "inherit",
                  }}
                />
              ) : (
                <span style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  textDecoration: isDone ? "line-through" : "none",
                }}>
                  {displayTitle(activity)}
                </span>
              )}
            </span>

            {typeInfo && !isMini && (
              <span
                style={{
                  fontSize: 8,
                  fontWeight: 600,
                  padding: "1px 5px",
                  borderRadius: 3,
                  background: `${typeInfo.color}18`,
                  color: typeInfo.color,
                  lineHeight: 1.3,
                  flexShrink: 0,
                }}
              >
                {isDone && activity.isDeadlineMarker && activity.deadlineDate
                  ? `Finish on ${formatDeadlineDate(activity.deadlineDate)}`
                  : es.variantKey === "deadlineTask" ? "Start" : "Deadline"}
              </span>
            )}

            {!activity.hasDeadline && activity.productivityLevel && LEVEL_META[activity.productivityLevel] && !isMini && (
              <span
                style={{
                  fontSize: 8,
                  fontWeight: 600,
                  padding: "1px 6px",
                  borderRadius: 3,
                  background: LEVEL_META[activity.productivityLevel].bg,
                  color: LEVEL_META[activity.productivityLevel].color,
                  border: `1px solid ${LEVEL_META[activity.productivityLevel].border}`,
                  lineHeight: 1.4,
                  letterSpacing: "0.01em",
                  flexShrink: 0,
                }}
              >
                {t(`productivity.eventForm.level_${activity.productivityLevel}`)}
              </span>
            )}
          </span>

          {statusMeta && !isMini && (
            <span
              style={{
                fontSize: 8,
                fontWeight: 600,
                padding: "1px 6px",
                borderRadius: 3,
                background: statusMeta.bg,
                color: statusMeta.color,
                border: `1px solid ${statusMeta.border}`,
                lineHeight: 1.4,
                letterSpacing: "0.01em",
                flexShrink: 0,
              }}
            >
              {status}
            </span>
          )}
        </div>

        {/* Time row — only when enough space */}
        {!isCompact && (
          <div
            style={{
              fontSize: 10,
              fontWeight: 500,
              color: es.titleColor,
              opacity: 0.85,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
              lineHeight: 1.5,
              marginTop: 2,
              pointerEvents: "none",
            }}
          >
            {formatDisplayTime(visualStyle?.startTime ?? moveStyle?.startTime ?? startTime)} – {formatDisplayTime(visualStyle?.endTime ?? moveStyle?.endTime ?? endTime)}
          </div>
        )}
      </div>

      {isResizable && !dragging && !moving && (
        <div
          style={{
            position: "absolute",
            top: displayTop - resizeCircleHalf,
            left: displayLeft,
            width: displayWidth,
            height: resizeCircleSize,
            zIndex: 14,
          }}
        >
          <div
            data-resize-handle="true"
            style={{ ...resizeCircleStyle, opacity: hovered ? 1 : 0, transition: "opacity 0.15s" }}
            onMouseEnter={handleCircleMouseEnter}
            onMouseLeave={handleCircleMouseLeave}
            onMouseDown={(e) => { e.stopPropagation(); handleResizeClick(e, "top") }}
          />
        </div>
      )}

      {isResizable && !dragging && !moving && (
        <div
          style={{
            position: "absolute",
            top: displayTop + displayHeight - resizeCircleHalf,
            left: displayLeft,
            width: displayWidth,
            height: resizeCircleSize,
            zIndex: 14,
          }}
        >
          <div
            data-resize-handle="true"
            style={{ ...resizeCircleStyle, opacity: hovered ? 1 : 0, transition: "opacity 0.15s" }}
            onMouseEnter={handleCircleMouseEnter}
            onMouseLeave={handleCircleMouseLeave}
            onMouseDown={(e) => { e.stopPropagation(); handleResizeClick(e, "bottom") }}
          />
        </div>
      )}

      {tooltip && (
        <Portal>
          <div
            style={{
              position: "fixed",
              left: tooltip.x + 12,
              top: tooltip.y - 32,
              background: "#1E1B4B",
              color: "white",
              padding: "4px 10px",
              borderRadius: 8,
              fontSize: 12,
              fontWeight: 600,
              whiteSpace: "nowrap",
              zIndex: 9999,
              pointerEvents: "none",
              boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            }}
          >
            {formatDisplayTime(tooltip.startTime)} – {formatDisplayTime(tooltip.endTime)}
          </div>
        </Portal>
      )}
    </>
  )
})

export default ActivityBlock
