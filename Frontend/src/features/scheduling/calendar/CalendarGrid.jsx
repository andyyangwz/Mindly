import { useRef, useEffect, useMemo, useCallback, useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import ActivityBlock from "./ActivityBlock"
import { TIME_COL_WIDTH, HOUR_HEIGHT, formatHour, isSameDay, layoutEvents } from "../utils/calendarConstants"
import "../../../styles/scheduling/index.css"

const HOURS = Array.from({ length: 25 }, (_, i) => i)
const MIN_BLOCK_HEIGHT = 15
const SNAP_MINUTES = 1
const DRAG_THRESHOLD_PX = 5

function posFromEvent(gridEl, clientY) {
  const rect = gridEl.getBoundingClientRect()
  const y = clientY - rect.top
  const totalMinutes = (y / HOUR_HEIGHT) * 60
  const clampedMinutes = Math.max(0, Math.min(24 * 60, Math.round(totalMinutes)))
  const snappedMinutes = Math.round(clampedMinutes / SNAP_MINUTES) * SNAP_MINUTES
  const hour = Math.floor(snappedMinutes / 60)
  const minute = snappedMinutes % 60
  const start = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`
  const endMinutes = Math.min(snappedMinutes + 60, 23 * 60 + 55)
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

function overflowMinutesToTime(mins) {
  const rounded = Math.max(0, Math.round(mins))
  const h = Math.floor(rounded / 60) % 24
  const m = rounded % 60
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`
}

function snapMinutes(mins) {
  return Math.round(mins / SNAP_MINUTES) * SNAP_MINUTES
}

export default function CalendarGrid({ activities, currentDate, dragOverrides, inlineDraftId, onViewDetails, onActivityContextMenu, onActivityResize, onDragUpdate, onDragEnd, onInlineCreate, onInlineSave, onInlineCancel, onStatusChange, interactionMode, isSyncing }) {
  const gridRef = useRef(null)
  const [canvasWidth, setCanvasWidth] = useState(0)
  const [draggingId, setDraggingId] = useState(null)
  const [resizingId, setResizingId] = useState(null)

  // Interaction state (ref-based, survives rerenders)
  const ixRef = useRef(null)
  const onDragUpdateRef = useRef(onDragUpdate)
  const onDragEndRef = useRef(onDragEnd)
  const onResizeRef = useRef(onActivityResize)

  useEffect(() => {
    onDragUpdateRef.current = onDragUpdate
    onDragEndRef.current = onDragEnd
    onResizeRef.current = onActivityResize
  }, [onDragUpdate, onDragEnd, onActivityResize])

  // Cleanup ref for pointer listeners
  const pointerCleanupRef = useRef(null)

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
        if (override) {
          return { ...act, ...override }
        }
        return act
      })
      const result = layoutEvents(merged, canvasWidth, HOUR_HEIGHT)
      return result
    },
    [activities, canvasWidth, dragOverrides]
  )

  const today = new Date()
  const isTodayView = isSameDay(currentDate, today)
  const currentHour = new Date().getHours()
  const [nowPosition, setNowPosition] = useState(null)

  useEffect(() => {
    if (!isTodayView) return
    let raf
    const tick = () => {
      const now = new Date()
      setNowPosition((now.getHours() + now.getMinutes() / 60 + now.getSeconds() / 3600) * HOUR_HEIGHT)
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      setNowPosition(null)
    }
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
    if (entry.event.isSegmented || entry.event._isTaskMarker) return

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

      if (ix.type === "dragging") setDraggingId(ix.activityId)
      else setResizingId(ix.activityId)

      let newStartMin, newEndMin

      if (ix.type === "dragging") {
        newStartMin = ix.originStartMin + deltaMin
        newEndMin = ix.originEndMin + deltaMin
      } else if (ix.type === "resizingTop") {
        newStartMin = ix.originStartMin + deltaMin
        newEndMin = ix.originEndMin
      } else {
        newStartMin = ix.originStartMin
        newEndMin = Math.min(24 * 60 - 1, ix.originEndMin + deltaMin)
      }

      // Clamp start, allow end to overflow past midnight
      newStartMin = Math.max(0, Math.min(24 * 60, newStartMin))
      newEndMin = Math.max(0, newEndMin)

      if (newEndMin - newStartMin < MIN_BLOCK_HEIGHT) return

      const newStart = minutesToTime(newStartMin)
      const newEnd = minutesToTime(newEndMin)

      me.preventDefault()
      onDragUpdateRef.current?.(ix.activityId, newStart, newEnd)
    }

    const handleUp = (ue) => {
      const ix = ixRef.current
      cleanupPointer()
      setDraggingId(null)
      setResizingId(null)

      if (!ix) return

      ue.preventDefault()

      const deltaY = ue.clientY - ix.originY
      const deltaMin = deltaY * (60 / HOUR_HEIGHT)

      // Ignore sub-threshold movements
      if (Math.abs(deltaY) < DRAG_THRESHOLD_PX) {
        onDragUpdateRef.current?.(ix.activityId, null, null)
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
        newEndMin = Math.min(24 * 60 - 1, snapMinutes(ix.originEndMin + deltaMin))
      }

      newStartMin = Math.max(0, newStartMin)
      newEndMin = Math.max(0, newEndMin)

      const oldStartTime = minutesToTime(ix.originStartMin)
      const oldEndTime = minutesToTime(ix.originEndMin)
      const newStartTime = ix.type === "dragging" ? overflowMinutesToTime(newStartMin) : minutesToTime(newStartMin)
      const newEndTime = overflowMinutesToTime(newEndMin)

      if (newStartMin !== ix.originStartMin || newEndMin !== ix.originEndMin) {
        if (ix.type === "dragging") {
          const rawDeltaMin = newStartMin - ix.originStartMin
          onDragEndRef.current?.(ix.activityId, oldStartTime, oldEndTime, newStartTime, newEndTime, rawDeltaMin)
        } else {
          onResizeRef.current?.(ix.activity, oldStartTime, oldEndTime, newStartTime, newEndTime)
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
      data-calendar-grid
      tabIndex={0}
      onKeyDown={handleKeyDown}
      className="cg-grid"
      style={{ height: HOUR_HEIGHT * 25 }}
    >
      {/* Time Gutter */}
      <div
        className="cg-gutter"
        style={{ width: TIME_COL_WIDTH, height: HOUR_HEIGHT * 25 }}
      >
        {HOURS.map((hour) => (
          <div
            key={hour}
            className="cg-hour-row"
            style={{ top: hour * HOUR_HEIGHT, height: HOUR_HEIGHT }}
          >
            <span
              className="cg-hour-label"
              style={{
                color: isTodayView && hour === currentHour ? "var(--color-primary-text)" : "var(--color-muted)",
                fontWeight: isTodayView && hour === currentHour ? 700 : 500,
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
        className="cg-canvas"
        style={{ height: HOUR_HEIGHT * 25, borderLeft: "1px solid var(--color-border)" }}
        onPointerDown={handlePointerDown}
      >
        <div
          onDoubleClick={handleDoubleClick}
          className="cg-canvas-inner"
          style={{ height: HOUR_HEIGHT * 25 }}
        >
          {/* Horizontal grid lines */}
          {HOURS.map((hour) => (
            <div
              key={hour}
              className="cg-grid-line"
              style={{ top: hour * HOUR_HEIGHT, height: HOUR_HEIGHT, borderBottom: "1px solid var(--color-border)" }}
            />
          ))}

          {/* Current time indicator */}
          {nowPosition !== null && (
            <div className="cg-time-indicator" style={{ top: nowPosition }}>
              <div className="cg-time-dot cg-time-dot-pulse" />
              <div className="cg-time-line" />
            </div>
          )}

          {/* Activity blocks */}
          <AnimatePresence mode="popLayout">
          {laidOut.map(({ event: activity, style }, i) => (
            <motion.div
              key={activity.id}
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.93, transition: { duration: 0.15, ease: "easeIn" } }}
              transition={{ duration: 0.25, delay: i * 0.015, ease: "easeOut" }}
              layout
            >
            <ActivityBlock
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
              isDragging={draggingId === activity.id}
              isResizing={resizingId === activity.id}
              tutorialTarget={activity.id === "tutorial-demo" ? "demo-activity-block" : undefined}
            />
            </motion.div>
          ))}
          </AnimatePresence>

          {/* Sync sweep overlay */}
          {isSyncing && (
            <div className="cg-sync-sweep" />
          )}
        </div>
      </div>
    </div>
  )
}
