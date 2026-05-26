import { useRef, useEffect, useMemo, useCallback, useState } from "react"
import { theme } from "../../theme"
import ActivityBlock from "./ActivityBlock"
import { HOUR_HEIGHT, TIME_COL_WIDTH, formatHour, isSameDay, layoutEvents } from "./calendarConstants"

const HOURS = Array.from({ length: 25 }, (_, i) => i)
const MIN_BLOCK_HEIGHT = 15
const SNAP_MINUTES = 5
const DRAG_THRESHOLD_PX = 5

function calcScrollTarget(date, containerHeight) {
  const today = new Date()
  if (!isSameDay(date, today)) return 6 * HOUR_HEIGHT - 8
  const now = new Date()
  const currentMinute = now.getHours() * 60 + now.getMinutes()
  const targetPx = (currentMinute / 60) * HOUR_HEIGHT
  const centerOffset = containerHeight * 0.35
  return Math.max(0, targetPx - centerOffset)
}

function posFromEvent(gridEl, clientY) {
  const rect = gridEl.getBoundingClientRect()
  const y = clientY - rect.top + gridEl.scrollTop
  const totalMinutes = (y / HOUR_HEIGHT) * 60
  const clampedMinutes = Math.max(0, Math.min(24 * 60, Math.round(totalMinutes)))
  const snappedMinutes = Math.round(clampedMinutes / 5) * 5
  const hour = Math.floor(snappedMinutes / 60)
  const minute = snappedMinutes % 60
  const start = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
  const endMinutes = Math.min(snappedMinutes + 60, 24 * 60)
  const endHour = Math.floor(endMinutes / 60)
  const endMinute = endMinutes % 60
  const end = `${String(endHour).padStart(2, "0")}:${String(endMinute).padStart(2, "0")}`
  return { start, end }
}

function timeToMinutes(timeStr) {
  if (!timeStr) return 0
  const [h, m] = timeStr.split(":").map(Number)
  return h * 60 + m
}

function minutesToTime(mins) {
  const clamped = Math.max(0, Math.min(24 * 60, Math.round(mins)))
  const h = Math.floor(clamped / 60)
  const m = clamped % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

function snapMinutes(mins) {
  return Math.round(mins / SNAP_MINUTES) * SNAP_MINUTES
}

export default function CalendarGrid({ activities, currentDate, dragOverrides, inlineDraftId, onViewDetails, onActivityContextMenu, onActivityResize, onDragUpdate, onDragEnd, onInlineCreate, onInlineSave, onInlineCancel, onStatusChange, interactionMode, isSyncing, scrollToHour }) {
  const gridRef = useRef(null)
  const [canvasWidth, setCanvasWidth] = useState(0)

  // Interaction state (ref-based, survives rerenders)
  const ixRef = useRef(null)
  const onDragUpdateRef = useRef(onDragUpdate)
  const onDragEndRef = useRef(onDragEnd)
  const onResizeRef = useRef(onActivityResize)
  onDragUpdateRef.current = onDragUpdate
  onDragEndRef.current = onDragEnd
  onResizeRef.current = onActivityResize

  // Cleanup ref for pointer listeners
  const pointerCleanupRef = useRef(null)

  useEffect(() => {
    const el = gridRef.current
    if (!el) return
    if (scrollToHour != null) {
      const targetPx = scrollToHour * HOUR_HEIGHT
      const centerOffset = el.clientHeight * 0.35
      el.scrollTop = Math.max(0, targetPx - centerOffset)
    } else {
      el.scrollTop = calcScrollTarget(currentDate, el.clientHeight)
    }
  }, [scrollToHour, currentDate])

  useEffect(() => {
    const el = gridRef.current
    if (!el) return
    const measure = () => {
      const canvasEl = el.querySelector("[data-event-canvas]")
      if (canvasEl) {
        setCanvasWidth(canvasEl.getBoundingClientRect().width)
      }
    }
    measure()
    const observer = new ResizeObserver(measure)
    observer.observe(el)
    return () => observer.disconnect()
  }, [])

  const laidOut = useMemo(
    () => {
      const merged = activities.map((act) => {
        const override = dragOverrides?.[act.id]
        return override ? { ...act, ...override } : act
      })
      return layoutEvents(merged, canvasWidth)
    },
    [activities, canvasWidth, dragOverrides]
  )

  const today = new Date()
  const isTodayView = isSameDay(currentDate, today)
  const currentHour = new Date().getHours()

  const nowPosition = useMemo(() => {
    if (!isTodayView) return null
    const now = new Date()
    return (now.getHours() + now.getMinutes() / 60) * HOUR_HEIGHT
  }, [isTodayView])

  const isOnBlock = useCallback((e) => {
    return !!(e.target.closest("[data-event-wrapper]") || e.target.closest("[data-resize-top]") || e.target.closest("[data-resize-bottom]"))
  }, [])

  /* ---- Centralized Pointer Interaction Engine ---- */

  const cleanupPointer = useCallback(() => {
    if (pointerCleanupRef.current) {
      pointerCleanupRef.current()
      pointerCleanupRef.current = null
    }
  }, [])

  const handlePointerDown = useCallback((e) => {
    if (interactionMode !== "reschedule") return

    // Determine what was hit
    const wrapper = e.target.closest("[data-event-wrapper]")
    const resizeTop = e.target.closest("[data-resize-top]")
    const resizeBottom = e.target.closest("[data-resize-bottom]")

    if (!wrapper && !resizeTop && !resizeBottom) return

    // Find activity id from whichever element was hit
    const targetEl = wrapper || resizeTop || resizeBottom
    if (!targetEl) return
    const activityId = targetEl.dataset.activityId
    if (!activityId) return

    // Find the activity from laidOut (normalize ID type — dataset returns string)
    const entry = laidOut.find(l => String(l.event.id) === activityId)
    if (!entry) return
    if (entry.event.isSegmented) return

    const act = entry.event
    const startMin = timeToMinutes(act.startTime)
    const endMin = timeToMinutes(act.endTime)

    // Determine interaction type
    let type = "dragging"
    if (resizeTop) type = "resizingTop"
    else if (resizeBottom) type = "resizingBottom"

    // Store interaction state in ref
    ixRef.current = {
      type,
      activityId: act.id,
      originY: e.clientY,
      originStartMin: startMin,
      originEndMin: endMin,
      activity: act,
    }

    e.preventDefault()
    e.stopPropagation()

    // Clean up any stale listeners first
    cleanupPointer()

    const handleMove = (me) => {
      const ix = ixRef.current
      if (!ix) return

      const deltaY = me.clientY - ix.originY
      const deltaMin = deltaY * (60 / HOUR_HEIGHT)

      // Drag threshold: ignore micro-movements
      if (Math.abs(deltaY) < DRAG_THRESHOLD_PX) return

      let newStartMin, newEndMin

      if (ix.type === "dragging") {
        newStartMin = snapMinutes(ix.originStartMin + deltaMin)
        newEndMin = snapMinutes(ix.originEndMin + deltaMin)
      } else if (ix.type === "resizingTop") {
        newStartMin = snapMinutes(ix.originStartMin + deltaMin)
        newEndMin = ix.originEndMin
      } else {
        newStartMin = ix.originStartMin
        newEndMin = snapMinutes(ix.originEndMin + deltaMin)
      }

      // Clamp
      newStartMin = Math.max(0, Math.min(24 * 60, newStartMin))
      newEndMin = Math.max(0, Math.min(24 * 60, newEndMin))

      if (newEndMin - newStartMin < MIN_BLOCK_HEIGHT) return

      const newStart = minutesToTime(newStartMin)
      const newEnd = minutesToTime(newEndMin)

      me.preventDefault()
      onDragUpdateRef.current?.(ix.activityId, newStart, newEnd)
    }

    const handleUp = (ue) => {
      const ix = ixRef.current
      cleanupPointer()

      if (!ix) return

      ue.preventDefault()

      const deltaY = ue.clientY - ix.originY
      const deltaMin = deltaY * (60 / HOUR_HEIGHT)

      // Ignore sub-threshold movements
      if (Math.abs(deltaY) < DRAG_THRESHOLD_PX) {
        ixRef.current = null
        return
      }

      let newStartMin, newEndMin

      if (ix.type === "dragging") {
        newStartMin = snapMinutes(ix.originStartMin + deltaMin)
        newEndMin = snapMinutes(ix.originEndMin + deltaMin)
      } else if (ix.type === "resizingTop") {
        newStartMin = snapMinutes(ix.originStartMin + deltaMin)
        newEndMin = ix.originEndMin
      } else {
        newStartMin = ix.originStartMin
        newEndMin = snapMinutes(ix.originEndMin + deltaMin)
      }

      newStartMin = Math.max(0, Math.min(24 * 60, newStartMin))
      newEndMin = Math.max(0, Math.min(24 * 60, newEndMin))

      const oldStart = minutesToTime(ix.originStartMin)
      const oldEnd = minutesToTime(ix.originEndMin)
      const newStart = minutesToTime(newStartMin)
      const newEnd = minutesToTime(newEndMin)

      if (newStart !== oldStart || newEnd !== oldEnd) {
        if (ix.type === "dragging") {
          onDragEndRef.current?.(ix.activityId, oldStart, oldEnd, newStart, newEnd)
        } else {
          onResizeRef.current?.(ix.activity, oldStart, oldEnd, newStart, newEnd)
        }
      }

      onDragUpdateRef.current?.(ix.activityId, null, null)
      ixRef.current = null
    }

    document.addEventListener("pointermove", handleMove)
    document.addEventListener("pointerup", handleUp)
    pointerCleanupRef.current = () => {
      document.removeEventListener("pointermove", handleMove)
      document.removeEventListener("pointerup", handleUp)
    }
  }, [interactionMode, laidOut, cleanupPointer])

  /* ---- Fixed Mode Handlers ---- */

  const handleDoubleClick = useCallback((e) => {
    if (interactionMode !== "fixed") return
    if (isOnBlock(e)) return
    const container = gridRef.current
    if (!container) return
    const { start, end } = posFromEvent(container, e.clientY)
    onInlineCreate?.(currentDate, start, end)
  }, [currentDate, onInlineCreate, isOnBlock, interactionMode])

  const handleKeyDown = useCallback((e) => {
    if (e.target.closest("[data-inline-input]")) return
    if (e.key === "Enter" && inlineDraftId) {
      e.preventDefault()
      const input = gridRef.current?.querySelector('[data-inline-input]')
      if (input) {
        onInlineSave?.(input.value)
      }
    } else if (e.key === "Escape" && inlineDraftId) {
      e.preventDefault()
      onInlineCancel?.()
    }
  }, [inlineDraftId, onInlineSave, onInlineCancel])

  // Cleanup pointer listeners on unmount
  useEffect(() => {
    return () => cleanupPointer()
  }, [cleanupPointer])

  return (
    <div
      ref={gridRef}
      tabIndex={0}
      onKeyDown={handleKeyDown}
      style={{
        display: "flex",
        height: 540,
        overflowY: "auto",
        userSelect: "none",
        WebkitUserSelect: "none",
        MozUserSelect: "none",
        msUserSelect: "none",
        outline: "none",
      }}
    >
      {/* Time Gutter */}
      <div
        style={{
          width: TIME_COL_WIDTH,
          flexShrink: 0,
          position: "relative",
          height: 25 * HOUR_HEIGHT,
        }}
      >
        {HOURS.map((hour) => (
          <div
            key={hour}
            style={{
              position: "absolute",
              top: hour * HOUR_HEIGHT,
              left: 0,
              right: 0,
              height: HOUR_HEIGHT,
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "flex-end",
              paddingRight: 12,
              paddingTop: 3,
            }}
          >
            <span
              style={{
                fontSize: 10,
                color: isTodayView && hour === currentHour ? theme.primaryText : theme.muted,
                fontWeight: isTodayView && hour === currentHour ? 700 : 500,
                userSelect: "none",
                letterSpacing: "0.01em",
              }}
            >
              {formatHour(hour)}
            </span>
          </div>
        ))}
      </div>

      {/* Event Canvas */}
      <div
        data-event-canvas
        style={{
          flex: 1,
          position: "relative",
          height: 25 * HOUR_HEIGHT,
          borderLeft: `1px solid ${theme.border}`,
          touchAction: "none",
        }}
        onPointerDown={handlePointerDown}
      >
        <div
          onDoubleClick={handleDoubleClick}
          style={{ position: "relative", height: 25 * HOUR_HEIGHT }}
        >
          {/* Horizontal grid lines */}
          {HOURS.map((hour) => (
            <div
              key={hour}
              style={{
                position: "absolute",
                top: hour * HOUR_HEIGHT,
                left: 0,
                right: 0,
                height: HOUR_HEIGHT,
                borderBottom: `1px solid ${theme.border}`,
                background: "transparent",
                pointerEvents: "none",
              }}
            />
          ))}

          {/* Current time indicator */}
          {nowPosition !== null && (
            <div
              style={{
                position: "absolute",
                top: nowPosition,
                left: 0,
                right: 0,
                zIndex: 0,
                pointerEvents: "none",
                display: "flex",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  borderRadius: "50%",
                  background: "#F87171",
                  marginLeft: 4,
                  boxShadow: "0 0 0 1px white",
                  flexShrink: 0,
                }}
              />
              <div
                style={{
                  flex: 1,
                  height: 1,
                  background: "#F87171",
                  marginLeft: 4,
                }}
              />
            </div>
          )}

          {/* Activity blocks */}
          {laidOut.map(({ event: activity, style }) => (
            <ActivityBlock
              key={activity.id}
              activity={activity}
              style={style}
              onViewDetails={onViewDetails}
              onContextMenu={onActivityContextMenu}
              onStatusChange={onStatusChange}
              isInlineEditing={activity.id === inlineDraftId}
              onInlineSave={onInlineSave}
              onInlineCancel={onInlineCancel}
              interactionMode={interactionMode}
              isSyncing={isSyncing}
              tutorialTarget={activity.id === "tutorial-demo" ? "demo-activity-block" : undefined}
            />
          ))}

          {/* Sync sweep overlay */}
          {isSyncing && (
            <div className="sync-sweep" />
          )}
        </div>
      </div>

      <style>{`
        @keyframes syncSweep {
          0% {
            top: -2%;
            opacity: 0;
          }
          8% {
            opacity: 1;
          }
          85% {
            opacity: 1;
          }
          100% {
            top: 102%;
            opacity: 0;
          }
        }
        .sync-sweep {
          position: absolute;
          left: 0;
          right: 0;
          height: 40%;
          pointer-events: none;
          z-index: 20;
          background: linear-gradient(
            180deg,
            transparent 0%,
            color-mix(in srgb, ${theme.primary} 6%, transparent) 30%,
            color-mix(in srgb, ${theme.primary} 10%, transparent) 50%,
            color-mix(in srgb, ${theme.primary} 6%, transparent) 70%,
            transparent 100%
          );
          animation: syncSweep 1.2s cubic-bezier(0.4, 0, 0.2, 1) forwards;
          will-change: top, opacity;
        }
        .sync-sweep::before {
          content: '';
          position: absolute;
          left: 10%;
          right: 10%;
          top: 45%;
          height: 10%;
          background: linear-gradient(
            90deg,
            transparent 0%,
            color-mix(in srgb, ${theme.primary} 20%, transparent) 30%,
            color-mix(in srgb, ${theme.primary} 30%, transparent) 50%,
            color-mix(in srgb, ${theme.primary} 20%, transparent) 70%,
            transparent 100%
          );
          border-radius: 50%;
          filter: blur(6px);
        }
      `}</style>
    </div>
  )
}
