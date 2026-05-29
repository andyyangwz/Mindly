/**
 * Cross-day activity segmentation utility.
 *
 * Takes an activity and a target date, returns the visual segment
 * that should be rendered for that day — or null if the activity
 * doesn't overlap the target date.
 *
 * Each segment shares the source activity's id so editing/dragging
 * any segment affects the original record.
 */

export function getDaySegment(activity, dateStr) {

  const sd = new Date(activity.startDatetime)
  const ed = new Date(activity.endDatetime)
  const target = new Date(dateStr + "T00:00:00")
  const nextDay = new Date(target)
  nextDay.setDate(nextDay.getDate() + 1)

  if (ed <= target || sd >= nextDay) return null

  const startsOnDay = sd >= target && sd < nextDay
  const endsOnDay = ed > target && ed < nextDay
  const startsBefore = sd < target
  const endsAfter = ed >= nextDay

  const dayStart = dateStr + "T00:00"
  const dayEnd = dateStr + "T23:59"

  const segmentStart = startsBefore || !startsOnDay ? dayStart : activity.startDatetime.slice(0, 16)
  const segmentEnd = endsAfter || !endsOnDay ? dayEnd : activity.endDatetime.slice(0, 16)

  return {
    ...activity,
    segmentStart,
    segmentEnd,
    startTime: startsBefore ? undefined : activity.startTime,
    endTime: endsAfter ? undefined : activity.endTime,
    isCrossDay: startsBefore || endsAfter,
    continuesPrev: startsBefore,
    continuesNext: endsAfter,
  }
}

/**
 * Memoization helper — caches segments per (activity.id, dateStr).
 */
const segmentCache = new Map()

export function getCachedDaySegment(activity, dateStr) {
  const key = `${activity.id}|${dateStr}`
  if (segmentCache.has(key)) return segmentCache.get(key)
  const seg = getDaySegment(activity, dateStr)
  segmentCache.set(key, seg)
  return seg
}

export function clearSegmentCache() {
  segmentCache.clear()
}
