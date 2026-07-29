import { useState, useEffect } from "react"
import { toDateStr, HOUR_HEIGHT } from "../../features/scheduling/utils/calendarConstants"

const STORAGE_KEY = "scheduling_calendar_date"

function loadSavedDate() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const d = new Date(saved + "T00:00:00")
      if (!isNaN(d.getTime())) return d
    }
  } catch {
    /* ignore */
  }
  return new Date()
}

export function useCalendarDate(scrollContainerRef) {
  const [currentDate, setCurrentDate] = useState(loadSavedDate)

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, toDateStr(currentDate))
    } catch {
      /* ignore */
    }
  }, [currentDate])

  useEffect(() => {
    const container = scrollContainerRef?.current
    if (!container) return

    const raf = requestAnimationFrame(() => {
      const now = new Date()
      const todayStr = toDateStr(now)
      const dateStr = toDateStr(currentDate)
      const maxScroll = container.scrollHeight - container.clientHeight
      let targetPx

      if (dateStr < todayStr) {
        targetPx = maxScroll
      } else if (dateStr === todayStr) {
        const hourDecimal = now.getHours() + now.getMinutes() / 60
        const hourPx = hourDecimal * HOUR_HEIGHT
        const viewportH = container.clientHeight
        targetPx = Math.max(0, Math.min(hourPx - viewportH / 2, maxScroll))
      } else {
        targetPx = 5 * HOUR_HEIGHT
      }

      container.scrollTop = Math.max(0, Math.min(targetPx, maxScroll))
    })

    return () => cancelAnimationFrame(raf)
  }, [currentDate, scrollContainerRef])

  return { currentDate, setCurrentDate }
}
