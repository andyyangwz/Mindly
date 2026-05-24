export const HOUR_HEIGHT = 60
export const TIME_COL_WIDTH = 80
export const EVENT_CANVAS_LEFT_PAD = 12
export const RIGHT_PAD = 24
export const COL_GAP = 4

export function timeToPixel(timeStr) {
  const [h, m] = timeStr.split(":").map(Number)
  return (h + m / 60) * HOUR_HEIGHT
}

export function durationToPixel(startStr, endStr) {
  return timeToPixel(endStr) - timeToPixel(startStr)
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
  obligation: "#F59E0B",
  Unproductive: "#EF4444",
  Neutral: "#6B7280",
  Productive: "#10B981",
  Obligation: "#F59E0B",
}

export function layoutEvents(events, canvasWidth) {
  if (!events.length) return []
  if (canvasWidth <= 0) return []

  const toMin = (t) => {
    const [h, m] = t.split(":").map(Number)
    return h * 60 + m
  }

  const parsed = events
    .map((e) => {
      const start = toMin(e.startTime)
      const baseEnd = toMin(e.endTime)
      const isDeadlineLinked = e.hasDeadline

      const _height = isDeadlineLinked
        ? 28
        : Math.max(((baseEnd - start) / 60) * HOUR_HEIGHT, 22)

      const _end = isDeadlineLinked ? start + 30 : baseEnd

      return {
        ...e,
        _start: start,
        _end,
        _top: (start / 60) * HOUR_HEIGHT,
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

export const PRIORITY_LABELS = {
  low: "Low",
  medium: "Medium",
  high: "High",
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

export function getMockEvents(dateStr) {
  return [
    {
      id: "mock-1",
      title: "Deep Work Session",
      description: "Focused coding on the main feature branch.",
      eventDate: dateStr,
      startTime: "09:00",
      endTime: "11:30",
      color: "#7C3AED",
      priority: "high",
    },
    {
      id: "mock-7",
      title: "Code Review",
      description: "Review PR #142 and #143.",
      eventDate: dateStr,
      startTime: "10:00",
      endTime: "10:45",
      color: "#3B82F6",
      priority: "medium",
    },
    {
      id: "mock-2",
      title: "Team Standup",
      description: "Daily sync with the engineering team.",
      eventDate: dateStr,
      startTime: "11:30",
      endTime: "12:00",
      color: "#F97316",
      priority: "medium",
    },
    {
      id: "mock-3",
      title: "Lunch Break",
      description: "",
      eventDate: dateStr,
      startTime: "12:00",
      endTime: "13:00",
      color: "#10B981",
      priority: "low",
    },
    {
      id: "mock-4",
      title: "Project Planning",
      description: "Review Q3 roadmap milestones.",
      eventDate: dateStr,
      startTime: "14:00",
      endTime: "15:30",
      color: "#F59E0B",
      priority: "high",
    },
    {
      id: "mock-8",
      title: "1:1 with Manager",
      description: "Monthly catch-up.",
      eventDate: dateStr,
      startTime: "14:30",
      endTime: "15:00",
      color: "#EC4899",
      priority: "high",
    },
    {
      id: "mock-9",
      title: "Sprint Retro Prep",
      description: "Prepare slides for Friday retro.",
      eventDate: dateStr,
      startTime: "15:30",
      endTime: "16:00",
      color: "#3B82F6",
      priority: "medium",
    },
    {
      id: "mock-5",
      title: "Gym Session",
      description: "Upper body workout.",
      eventDate: dateStr,
      startTime: "17:00",
      endTime: "18:00",
      color: "#EC4899",
      priority: "medium",
    },
    {
      id: "mock-6",
      title: "Evening Reading",
      description: "Read 'Clean Architecture' chapters 5-6.",
      eventDate: dateStr,
      startTime: "20:00",
      endTime: "21:00",
      color: "#14B8A6",
      priority: "low",
    },
  ]
}
