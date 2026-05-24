import { useRef, useEffect, useMemo, useCallback, useState } from "react"
import { theme } from "../../theme"
import ActivityBlock from "./ActivityBlock"
import { HOUR_HEIGHT, TIME_COL_WIDTH, formatHour, isSameDay, layoutEvents } from "./calendarConstants"

const HOURS = Array.from({ length: 25 }, (_, i) => i)

function calcScrollTarget(date, containerHeight) {
  const today = new Date()
  if (!isSameDay(date, today)) return 6 * HOUR_HEIGHT - 8

  const now = new Date()
  const currentMinute = now.getHours() * 60 + now.getMinutes()
  const targetPx = (currentMinute / 60) * HOUR_HEIGHT
  const centerOffset = containerHeight * 0.35
  return Math.max(0, targetPx - centerOffset)
}

export default function CalendarGrid({ activities, currentDate, dragOverrides, inlineDraftId, onViewDetails, onActivityContextMenu, onEmptyContextMenu, onActivityResize, onDragUpdate, onDragEnd, onInlineCreate, onInlineSave, onInlineCancel }) {
  const gridRef = useRef(null)
  const [canvasWidth, setCanvasWidth] = useState(0)

  useEffect(() => {
    const el = gridRef.current
    if (!el) return
    el.scrollTop = calcScrollTarget(currentDate, el.clientHeight)
  }, [currentDate])

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

  const handleEmptyContextMenu = useCallback((e) => {
    if (e.target.closest("[data-event-wrapper]")) return
    e.preventDefault()
    const container = gridRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const y = e.clientY - rect.top + container.scrollTop
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
    onEmptyContextMenu?.(currentDate, start, end, { x: e.clientX, y: e.clientY })
  }, [currentDate, onEmptyContextMenu])

  const handleInlineCreate = useCallback((e) => {
    if (e.target.closest("[data-event-wrapper]")) return
    const container = gridRef.current
    if (!container) return
    const rect = container.getBoundingClientRect()
    const y = e.clientY - rect.top + container.scrollTop
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
    onInlineCreate?.(currentDate, start, end)
  }, [currentDate, onInlineCreate])

  return (
    <div
      ref={gridRef}
      onContextMenu={handleEmptyContextMenu}
      style={{
        display: "flex",
        height: 560,
        overflowY: "auto",
        userSelect: "none",
        WebkitUserSelect: "none",
        MozUserSelect: "none",
        msUserSelect: "none",
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
        }}
      >
        <div onDoubleClick={handleInlineCreate} style={{ position: "relative", height: 25 * HOUR_HEIGHT }}>
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
              onViewDetails={onViewDetails}
              onContextMenu={onActivityContextMenu}
              onResize={onActivityResize}
              onDragUpdate={onDragUpdate}
              onDragEnd={onDragEnd}
              style={style}
              isInlineEditing={activity.id === inlineDraftId}
              onInlineSave={onInlineSave}
              onInlineCancel={onInlineCancel}
            />
          ))}
        </div>
      </div>
    </div>
  )
}
