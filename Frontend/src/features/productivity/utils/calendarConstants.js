export const HOUR_HEIGHT = 60
export const TIME_COL_WIDTH = 80
export const EVENT_CANVAS_LEFT_PAD = 12
export const RIGHT_PAD = 24
export const COL_GAP = 4

export function layoutEvents(events, canvasWidth) {
  if (!events.length) return []
  if (canvasWidth <= 0) return []

  const toMin = (t) => {
    if (!t) return 0
    const timePart = t.length > 5 && t.includes("T") ? t.split("T")[1] : t
    const [h, m] = timePart.split(":").map(Number)
    return h * 60 + m
  }

  const parsed = events
    .map((e) => {
      const s = e.startTime || e.segmentStart
      const sEnd = e.endTime || e.segmentEnd

      // ---- DEFENSIVE GUARD: protect against invalid time strings ----
      let start = toMin(s)
      let baseEnd = toMin(sEnd)

      if (isNaN(start) || isNaN(baseEnd)) {
        console.warn("[layoutEvents] NaN time for event", e.id, {
          title: e.title,
          startTime: e.startTime,
          endTime: e.endTime,
          segmentStart: e.segmentStart,
          segmentEnd: e.segmentEnd,
          s,
          sEnd,
        })
        start = isNaN(start) ? 0 : start
        baseEnd = isNaN(baseEnd) ? start + 60 : baseEnd
      }

      const isDeadlineLinked = e.hasDeadline

      let rawHeight = ((baseEnd - start) / 60) * HOUR_HEIGHT
      if (isNaN(rawHeight) || rawHeight < 0) {
        console.warn("[layoutEvents] Invalid height for event", e.id, { rawHeight, start, baseEnd })
        rawHeight = 22
      }
      const _height = isDeadlineLinked ? 28 : Math.max(rawHeight, 22)

      let rawTop = (start / 60) * HOUR_HEIGHT
      if (isNaN(rawTop) || rawTop < 0) {
        console.warn("[layoutEvents] Invalid top for event", e.id, { rawTop, start })
        rawTop = 0
      }

      const _end = isDeadlineLinked ? start + 30 : baseEnd

      return {
        ...e,
        _start: start,
        _end,
        _top: rawTop,
        _height,
      }
    })
    .sort((a, b) => a._start - b._start || (b._end - b._start) - (a._end - a._start))

  const groups = []
  let idx = 0
  while (idx < parsed.length) {
    const group = [parsed[idx]]
    let groupEnd = parsed[idx]._end
    let j = idx + 1
    while (j < parsed.length && parsed[j]._start < groupEnd) {
      group.push(parsed[j])
      groupEnd = Math.max(groupEnd, parsed[j]._end)
      j++
    }
    groups.push(group)
    idx = j
  }

  const result = []
  for (const group of groups) {
    const changes = []
    for (const ev of group) {
      changes.push({ t: ev._start, d: 1 })
      changes.push({ t: ev._end, d: -1 })
    }
    changes.sort((a, b) => a.t - b.t || a.d - b.d)

    let active = 0
    let maxActive = 0
    for (const c of changes) {
      active += c.d
      maxActive = Math.max(maxActive, active)
    }

    const maxCols = Math.max(1, Math.min(maxActive, group.length))
    const availableWidth = canvasWidth - EVENT_CANVAS_LEFT_PAD - RIGHT_PAD
    const colWidth = (availableWidth - (maxCols - 1) * COL_GAP) / maxCols

    const colEnds = Array(maxCols).fill(0)
    for (const ev of group) {
      let placed = false
      for (let col = 0; col < maxCols; col++) {
        if (colEnds[col] <= ev._start) {
          colEnds[col] = ev._end
          result.push({
            event: ev,
            style: {
              top: ev._top,
              height: ev._height,
              left: EVENT_CANVAS_LEFT_PAD + col * (colWidth + COL_GAP),
              width: colWidth,
            },
          })
          placed = true
          break
        }
      }
      if (!placed) {
        result.push({
          event: ev,
          style: {
            top: ev._top,
            height: ev._height,
            left: EVENT_CANVAS_LEFT_PAD,
            width: availableWidth,
          },
        })
      }
    }
  }

  return result
}

export const ACTIVITY_COLORS = [
  { label: "Purple", value: "#7C3AED" },
  { label: "Blue", value: "#3B82F6" },
  { label: "Green", value: "#10B981" },
  { label: "Yellow", value: "#F59E0B" },
  { label: "Orange", value: "#F97316" },
  { label: "Red", value: "#EF4444" },
  { label: "Pink", value: "#EC4899" },
  { label: "Teal", value: "#14B8A6" },
]

export const COLOR_NAME_MAP = {
  purple: "#7C3AED",
  blue: "#3B82F6",
  green: "#10B981",
  yellow: "#F59E0B",
  orange: "#F97316",
  red: "#EF4444",
  pink: "#EC4899",
  teal: "#14B8A6",
}

export const PRIORITY_LABELS = {
  low: "Low",
  medium: "Medium",
  high: "High",
}

export const PRODUCTIVITY_LEVELS = {
  unproductive: "Unproductive",
  neutral: "Neutral",
  productive: "Productive",
}

export const PRODUCTIVITY_LEVEL_COLORS = {
  unproductive: "#EF4444",
  neutral: "#6B7280",
  productive: "#10B981",
}

export const STATUS_META = {
  "Done": { color: "#10B981", bg: "#10B98114", border: "#10B98130" },
  "In Progress": { color: "#B45309", bg: "#B4530918", border: "#B4530940" },
  "To Do": { color: "#6B7280", bg: "#6B728010", border: "#6B728020" },
}

export function formatHour(hour) {
  if (hour === 0 || hour === 24) return "12 AM"
  if (hour < 12) return `${hour} AM`
  if (hour === 12) return "12 PM"
  return `${hour - 12} PM`
}

export function formatTime(timeStr) {
  if (!timeStr) return ""
  const [h, m] = timeStr.split(":").map(Number)
  const hn = h === 24 ? 0 : h
  const ampm = hn >= 12 ? "PM" : "AM"
  const hour12 = hn === 0 ? 12 : hn > 12 ? hn - 12 : hn
  return `${hour12}:${String(m).padStart(2, "0")} ${ampm}`
}

export function toDateStr(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  )
}


