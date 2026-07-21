import { useState, useCallback } from "react"
import { productivityService } from "../services/productivityService"
import { notifyTasksUpdated } from "../utils/events"

function toDateStr(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

export function useProductivity() {
  const [activities, setActivities] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const fetchActivities = useCallback(async (date, plan = false) => {
    setLoading(true)
    setError(null)
    try {
      const dateStr = toDateStr(date)
      const result = await productivityService.getByDate(dateStr, plan)
      setActivities(result.events)
      return result.events
    } catch (err) {
      setError(err.message)
      setActivities([])
      return []
    } finally {
      setLoading(false)
    }
  }, [])

  const createActivity = useCallback(async (data) => {
    const event = await productivityService.create(data)
    setActivities((prev) => {
      return [...prev, event].sort((a, b) => a.startTime.localeCompare(b.startTime))
    })
    notifyTasksUpdated()
    return event
  }, [])

  const updateActivity = useCallback(async (id, data) => {
    const event = await productivityService.update(id, data)
    setActivities((prev) => {
      return prev.map((e) => (e.id === id ? event : e))
    })
    notifyTasksUpdated()
    return event
  }, [])

  const deleteActivity = useCallback(async (id) => {
    const result = await productivityService.delete(id)
    setActivities((prev) => prev.filter((e) => !result.deletedIds.includes(e.id)))
    notifyTasksUpdated()
  }, [])

  return {
    activities,
    loading,
    error,
    fetchActivities,
    createActivity,
    updateActivity,
    deleteActivity,
  }
}
