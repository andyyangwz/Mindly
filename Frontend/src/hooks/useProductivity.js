import { useState, useCallback } from "react"
import { productivityService } from "../services/productivityService"

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
    const result = await productivityService.create(data)
    setActivities((prev) => {
      const updated = [result.event]
      if (result.linkedEvent) updated.push(result.linkedEvent)
      return [...prev, ...updated].sort((a, b) => a.startTime.localeCompare(b.startTime))
    })
    return result
  }, [])

  const updateActivity = useCallback(async (id, data) => {
    const result = await productivityService.update(id, data)
    setActivities((prev) => {
      let updated = prev.map((e) => (e.id === id ? result.event : e))
      if (result.linkedEvent) {
        updated = updated.map((e) => (e.id === result.linkedEvent.id ? result.linkedEvent : e))
      }
      return updated.sort((a, b) => a.startTime.localeCompare(b.startTime))
    })
    return result
  }, [])

  const deleteActivity = useCallback(async (id) => {
    const result = await productivityService.delete(id)
    setActivities((prev) => prev.filter((e) => !result.deletedIds.includes(e.id)))
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
