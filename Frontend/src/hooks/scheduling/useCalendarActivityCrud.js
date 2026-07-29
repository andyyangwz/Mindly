import { useState, useCallback, useRef, useEffect } from "react"
import { schedulingService } from "../../services/schedulingService"
import { notifyTasksUpdated } from "../../utils/events"
import { toDateStr, clearSegmentCache } from "../../features/scheduling/utils/calendarConstants"

export function useCalendarActivityCrud({
  currentDate,
  calendarRefreshKey,
  onActivityUpdated,
  fetchActivities,
  createActivity,
  updateActivity,
  deleteActivity,
  record,
  undo,
  redo,
  isTutorialDemoMode,
  setTutorialBlock,
}) {
  const [localActivities, setLocalActivities] = useState([])
  const localActivitiesRef = useRef([])
  useEffect(() => {
    localActivitiesRef.current = localActivities
  }, [localActivities])

  const [editingActivity, setEditingActivity] = useState(null)
  const [viewingActivity, setViewingActivity] = useState(null)
  const [activityFormOpen, setActivityFormOpen] = useState(false)
  const [taskFormOpen, setTaskFormOpen] = useState(false)
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [useRealData, setUseRealData] = useState(false)
  const [isSyncing, setIsSyncing] = useState(false)
  const [dragOverrides, setDragOverrides] = useState({})
  const [inlineDraft, setInlineDraft] = useState(null)

  const navCountRef = useRef(0)

  useEffect(() => {
    navCountRef.current += 1
    const navId = navCountRef.current
    /* eslint-disable react-hooks/set-state-in-effect */
    setLocalActivities([])
    setUseRealData(false)
    /* eslint-enable react-hooks/set-state-in-effect */

    fetchActivities(currentDate).then((events) => {
      if (navCountRef.current !== navId) return
      setLocalActivities(events)
      setUseRealData(true)
    })
  }, [currentDate, fetchActivities, calendarRefreshKey])

  useEffect(() => {
    clearSegmentCache()
  }, [currentDate])

  const applyHistoryEntry = useCallback((entry, direction) => {
    const { type, prev, next } = entry

    if (type === "create") {
      if (direction === "undo") {
        setLocalActivities((acts) => acts.filter((e) => e.id !== next.id))
      } else {
        setLocalActivities((acts) => [...acts, next])
      }
    } else if (type === "delete") {
      if (direction === "undo") {
        setLocalActivities((acts) => [...acts, prev])
      } else {
        setLocalActivities((acts) => acts.filter((e) => e.id !== prev.id))
      }
    } else if (type === "move" || type === "resize" || type === "edit") {
      const target = direction === "undo" ? prev : next
      setLocalActivities((acts) =>
        acts.map((e) => (e.id === target.id ? { ...e, ...target } : e))
      )
    }
  }, [])

  const handleUndo = useCallback(async () => {
    const entry = undo()
    if (!entry) return
    const { type, prev, next } = entry
    if (type === "create") {
      applyHistoryEntry(entry, "undo")
      await deleteActivity(next.id)
    } else if (type === "delete") {
      applyHistoryEntry(entry, "undo")
      const created = await createActivity(prev)
      setLocalActivities((acts) =>
        acts.map((e) => (e.id === prev.id ? created : e))
      )
    } else if (type === "move" || type === "resize" || type === "edit") {
      applyHistoryEntry(entry, "undo")
      await updateActivity(prev.id, prev)
    }
    onActivityUpdated?.()
  }, [undo, applyHistoryEntry, deleteActivity, createActivity, updateActivity, onActivityUpdated])

  const handleRedo = useCallback(async () => {
    const entry = redo()
    if (!entry) return
    const { type, prev, next } = entry
    if (type === "create") {
      applyHistoryEntry(entry, "redo")
      const created = await createActivity(next)
      setLocalActivities((acts) =>
        acts.map((e) => (e.id === next.id ? created : e))
      )
    } else if (type === "delete") {
      applyHistoryEntry(entry, "redo")
      await deleteActivity(prev.id)
    } else if (type === "move" || type === "resize" || type === "edit") {
      applyHistoryEntry(entry, "redo")
      await updateActivity(next.id, next)
    }
    onActivityUpdated?.()
  }, [redo, applyHistoryEntry, createActivity, deleteActivity, updateActivity, onActivityUpdated])

  const handleStatusChange = useCallback(
    async (activity, newStatus) => {
      if (activity.status === newStatus) return
      if (isTutorialDemoMode && activity.id === "tutorial-demo") {
        setTutorialBlock((prev) => ({ ...prev, status: newStatus }))
        return
      }
      const prev = { ...activity }
      const update = { status: newStatus }
      if (newStatus === "Done" && activity.hasDeadline) {
        update.progress = 100
      }
      const next = { ...activity, ...update }
      setLocalActivities((prevActivities) =>
        prevActivities.map((e) => (e.id === activity.id ? next : e))
      )
      setViewingActivity(next)
      record({ type: "edit", prev, next })
      await updateActivity(activity.id, update)
      onActivityUpdated?.()
    },
    [updateActivity, onActivityUpdated, record, isTutorialDemoMode, setTutorialBlock]
  )

  const handleProgressChange = useCallback(
    async (activity, newProgress) => {
      const prev = { ...activity }
      const next = { ...activity, progress: newProgress }
      setLocalActivities((prevActivities) =>
        prevActivities.map((e) => (e.id === activity.id ? next : e))
      )
      setViewingActivity(next)
      record({ type: "edit", prev, next })
      await updateActivity(activity.id, { progress: newProgress })
      onActivityUpdated?.()
    },
    [updateActivity, onActivityUpdated, record]
  )

  const handleActivityViewDetails = useCallback(
    (activity) => {
      if (isTutorialDemoMode && activity.id !== "tutorial-demo") return
      setViewingActivity(activity)
    },
    [isTutorialDemoMode]
  )

  const handleSave = useCallback(
    async (data, options) => {
      try {
        if (editingActivity) {
          const prev = localActivitiesRef.current.find(
            (e) => e.id === editingActivity.id
          )
          const prevSnapshot = prev ? { ...prev } : null

          let payload = { ...data }
          let startDt = data.startDatetime || editingActivity.startDatetime
          let endDt = data.endDatetime || editingActivity.endDatetime
          if (
            (!startDt || !endDt) &&
            data.startDate &&
            data.endDate &&
            data.startTime &&
            data.endTime
          ) {
            startDt = `${data.startDate}T${data.startTime}`
            endDt = `${data.endDate}T${data.endTime}`
          }
          if (startDt && endDt) {
            payload = { ...data, startDatetime: startDt, endDatetime: endDt }
            payload.startTime = startDt.slice(11)
            payload.endTime = endDt.slice(11)
          }

          if (prev) {
            const next = { ...prev, ...payload }
            setLocalActivities((prevActivities) =>
              prevActivities.map((e) =>
                e.id === editingActivity.id ? next : e
              )
            )
            record({ type: "edit", prev: prevSnapshot, next })
          }

          try {
            const result = await updateActivity(editingActivity.id, payload)
            if (result && prev) {
              setLocalActivities((prevActivities) =>
                prevActivities.map((e) =>
                  e.id === editingActivity.id ? result : e
                )
              )
            }
            setUseRealData(true)
          } catch (err) {
            if (prev) {
              setLocalActivities((prevActivities) =>
                prevActivities.map((e) =>
                  e.id === editingActivity.id ? prevSnapshot : e
                )
              )
            }
            throw err
          }
        } else {
          let payload = { ...data }
          if (!data.hasDeadline) {
            let startDt = data.startDatetime
            let endDt = data.endDatetime
            if (
              (!startDt || !endDt) &&
              data.startDate &&
              data.endDate &&
              data.startTime &&
              data.endTime
            ) {
              startDt = `${data.startDate}T${data.startTime}`
              endDt = `${data.endDate}T${data.endTime}`
            }
            if (startDt && endDt) {
              payload = { ...data, startDatetime: startDt, endDatetime: endDt }
            }
          }
          const created = await createActivity(payload)
          setLocalActivities((prevActivities) => [...prevActivities, created])
          record({ type: "create", prev: null, next: { ...created } })
          setUseRealData(true)
        }
        setActivityFormOpen(false)
        setTaskFormOpen(false)
        setEditingActivity(null)
        setSelectedSlot(null)

        options?.onSaveComplete?.(data)
      } finally {
        onActivityUpdated?.()
      }
    },
    [editingActivity, updateActivity, createActivity, onActivityUpdated, record]
  )

  const handleDelete = useCallback(
    async (id) => {
      if (isTutorialDemoMode && id === "tutorial-demo") {
        setTutorialBlock((prev) => ({ ...prev, visible: false }))
        setViewingActivity(null)
        return
      }
      const prev = localActivitiesRef.current.find((e) => e.id === id)
      if (!prev) return
      const prevSnapshot = { ...prev }
      setLocalActivities((prevActivities) =>
        prevActivities.filter((e) => e.id !== id)
      )
      record({ type: "delete", prev: prevSnapshot, next: null })
      await deleteActivity(id)
      setViewingActivity(null)
      onActivityUpdated?.()
    },
    [deleteActivity, onActivityUpdated, record, isTutorialDemoMode, setTutorialBlock]
  )

  const handleActivityResize = useCallback(
    async (activity, oldStartTime, oldEndTime, newStartTime, newEndTime) => {
      if (activity.isSegmented) return
      if (isTutorialDemoMode && activity.id === "tutorial-demo") {
        setTutorialBlock((prev) => ({
          ...prev,
          startTime: newStartTime,
          endTime: newEndTime,
        }))
        return
      }
      clearSegmentCache()
      const prev = {
        ...activity,
        startTime: oldStartTime,
        endTime: oldEndTime,
      }
      const next = {
        ...activity,
        startTime: newStartTime,
        endTime: newEndTime,
      }
      if (activity.startDatetime) {
        const sd = new Date(activity.startDatetime)
        if (newEndTime !== oldEndTime) {
          const [eh, em] = newEndTime.split(":").map(Number)
          const newEd = new Date(sd)
          newEd.setHours(eh, em, 0, 0)
          if (newEd <= sd) newEd.setDate(newEd.getDate() + 1)
          const y = newEd.getFullYear()
          const mo = String(newEd.getMonth() + 1).padStart(2, "0")
          const d = String(newEd.getDate()).padStart(2, "0")
          const h = String(newEd.getHours()).padStart(2, "0")
          const mi = String(newEd.getMinutes()).padStart(2, "0")
          next.endDatetime = `${y}-${mo}-${d}T${h}:${mi}`
        }
        if (newStartTime !== oldStartTime) {
          const ed = activity.endDatetime
            ? new Date(activity.endDatetime)
            : new Date(sd.getTime() + 3600000)
          const [sh, sm] = newStartTime.split(":").map(Number)
          const newSd = new Date(ed)
          newSd.setHours(sh, sm, 0, 0)
          if (newSd >= ed) newSd.setDate(newSd.getDate() - 1)
          const y = newSd.getFullYear()
          const mo = String(newSd.getMonth() + 1).padStart(2, "0")
          const d = String(newSd.getDate()).padStart(2, "0")
          const h = String(newSd.getHours()).padStart(2, "0")
          const mi = String(newSd.getMinutes()).padStart(2, "0")
          next.startDatetime = `${y}-${mo}-${d}T${h}:${mi}`
        }
      }
      const stripSeconds = (s) => (s && s.length > 16 ? s.slice(0, 16) : s)
      next.startDatetime = stripSeconds(next.startDatetime)
      next.endDatetime = stripSeconds(next.endDatetime)

      setLocalActivities((prevActivities) =>
        prevActivities.map((e) => (e.id === activity.id ? next : e))
      )
      record({ type: "resize", prev, next })
      try {
        const payload = {
          startDatetime: next.startDatetime,
          endDatetime: next.endDatetime,
        }
        const result = await updateActivity(activity.id, payload)
        if (result) {
          setLocalActivities((prevActivities) =>
            prevActivities.map((e) => (e.id === activity.id ? result : e))
          )
        }
        onActivityUpdated?.()
      } catch {
        setLocalActivities((prevActivities) =>
          prevActivities.map((e) => (e.id === activity.id ? prev : e))
        )
      }
    },
    [updateActivity, record, onActivityUpdated, isTutorialDemoMode, setTutorialBlock]
  )

  const handleDragEnd = useCallback(
    async (id, oldStartTime, oldEndTime, newStartTime, newEndTime, rawDeltaMin) => {
      if (!newStartTime) return
      if (isTutorialDemoMode && id === "tutorial-demo") {
        setDragOverrides((prev) => {
          const next = { ...prev }
          delete next[id]
          return next
        })
        setTutorialBlock((prev) => ({
          ...prev,
          startTime: newStartTime,
          endTime: newEndTime,
        }))
        return
      }
      clearSegmentCache()
      const prev = localActivitiesRef.current.find((e) => e.id === id)
      if (!prev) return
      const prevSnapshot = {
        ...prev,
        startTime: oldStartTime,
        endTime: oldEndTime,
      }
      const next = { ...prev, startTime: newStartTime, endTime: newEndTime }
      if (prev.startDatetime && prev.endDatetime) {
        let deltaMin
        if (rawDeltaMin !== undefined) {
          deltaMin = rawDeltaMin
        } else {
          const toMin = (t) => {
            const [h, m] = t.split(":").map(Number)
            return h * 60 + m
          }
          const oldStartMin = toMin(oldStartTime)
          const newStartMin = toMin(newStartTime)
          deltaMin = newStartMin - oldStartMin
          if (deltaMin < -12 * 60) deltaMin += 24 * 60
          if (deltaMin > 12 * 60) deltaMin -= 24 * 60
        }
        const oldSd = new Date(prev.startDatetime)
        const oldEd = new Date(prev.endDatetime)
        const newSd = new Date(oldSd.getTime() + deltaMin * 60000)
        const newEd = new Date(oldEd.getTime() + deltaMin * 60000)
        const toLocal = (d) => {
          const y = d.getFullYear()
          const mo = String(d.getMonth() + 1).padStart(2, "0")
          const day = String(d.getDate()).padStart(2, "0")
          const h = String(d.getHours()).padStart(2, "0")
          const mi = String(d.getMinutes()).padStart(2, "0")
          return `${y}-${mo}-${day}T${h}:${mi}`
        }
        next.startDatetime = toLocal(newSd)
        next.endDatetime = toLocal(newEd)
      }
      const stripSeconds = (s) => (s && s.length > 16 ? s.slice(0, 16) : s)
      next.startDatetime = stripSeconds(next.startDatetime)
      next.endDatetime = stripSeconds(next.endDatetime)

      setLocalActivities((prevActivities) =>
        prevActivities.map((e) => (e.id === id ? next : e))
      )
      record({ type: "move", prev: prevSnapshot, next })
      try {
        const payload = {
          startDatetime: next.startDatetime,
          endDatetime: next.endDatetime,
        }
        const result = await updateActivity(id, payload)
        if (result) {
          setLocalActivities((prevActivities) =>
            prevActivities.map((e) => (e.id === id ? result : e))
          )
        }
        onActivityUpdated?.()
      } catch {
        setLocalActivities((prevActivities) =>
          prevActivities.map((e) => (e.id === id ? prevSnapshot : e))
        )
      }
    },
    [record, updateActivity, onActivityUpdated, isTutorialDemoMode, setTutorialBlock]
  )

  const handleDragUpdate = useCallback(
    (id, startTime, endTime) => {
      if (isTutorialDemoMode && id === "tutorial-demo") {
        setDragOverrides((prev) => {
          if (startTime === null) {
            const next = { ...prev }
            delete next[id]
            return next
          }
          return { ...prev, [id]: { startTime, endTime } }
        })
        return
      }
      setDragOverrides((prev) => {
        if (startTime === null) {
          const next = { ...prev }
          delete next[id]
          return next
        }
        return { ...prev, [id]: { startTime, endTime } }
      })
    },
    [isTutorialDemoMode]
  )

  const handleInlineCreate = useCallback((date, startTime, endTime) => {
    const id = `inline-${Date.now()}`
    const dateStr = toDateStr(date)
    setInlineDraft({
      id,
      title: "",
      description: "",
      startDatetime: `${dateStr}T${startTime}`,
      endDatetime: `${dateStr}T${endTime}`,
      startTime,
      endTime,
      color: "#7C3AED",
      priority: "medium",
      productivityLevel: "neutral",
      hasDeadline: false,
      status: "To Do",
    })
  }, [])

  const handleInlineSave = useCallback(
    async (title) => {
      if (!inlineDraft || !title.trim()) {
        setInlineDraft(null)
        return
      }
      const draft = inlineDraft
      try {
        let productivityLevel = draft.productivityLevel
        let priority = draft.priority
        try {
          const classification = await schedulingService.classifyTitle(
            title.trim()
          )
          productivityLevel = classification.productivityLevel
          priority = classification.priority
        } catch {
          productivityLevel = "neutral"
          priority = "medium"
        }

        const payload = {
          title: title.trim(),
          description: draft.description,
          color: draft.color,
          priority,
          productivityLevel,
          hasDeadline: draft.hasDeadline,
          status: draft.status,
        }
        let startDt = draft.startDatetime
        let endDt = draft.endDatetime
        if (!startDt) {
          startDt = `${toDateStr(new Date())}T${draft.startTime}`
        }
        if (!endDt && draft.endTime) {
          const ds = startDt.slice(0, 10)
          if (draft.endTime <= draft.startTime) {
            const dt = new Date(ds + "T00:00:00Z")
            dt.setUTCDate(dt.getUTCDate() + 1)
            const y = dt.getUTCFullYear()
            const m = String(dt.getUTCMonth() + 1).padStart(2, "0")
            const d = String(dt.getUTCDate()).padStart(2, "0")
            endDt = `${y}-${m}-${d}T${draft.endTime}`
          } else {
            endDt = `${ds}T${draft.endTime}`
          }
        }
        payload.startDatetime = startDt
        payload.endDatetime = endDt
        const created = await createActivity(payload)
        const next = created
        setLocalActivities((prevActivities) => [...prevActivities, next])
        record({ type: "create", prev: null, next })
        setUseRealData(true)
        setInlineDraft(null)
        onActivityUpdated?.()
      } catch {
        setInlineDraft(null)
      }
    },
    [inlineDraft, createActivity, record, onActivityUpdated]
  )

  const handleInlineCancel = useCallback(() => {
    setInlineDraft(null)
  }, [])

  const handleAddActivity = useCallback(() => {
    setEditingActivity(null)
    setSelectedSlot({ date: currentDate })
    setActivityFormOpen(true)
  }, [currentDate])

  const handleAddTask = useCallback(() => {
    setEditingActivity(null)
    setSelectedSlot({ date: currentDate })
    setTaskFormOpen(true)
  }, [currentDate])

  const handleAutoSync = useCallback(async () => {
    setIsSyncing(true)
    try {
      const now = new Date()

      const allData = await schedulingService.getAll()
      const allEvents = allData.events || []

      const updates = []
      for (const event of allEvents) {
        if (event.hasDeadline) continue
        if (!event.endDatetime) continue

        const endDate = new Date(event.endDatetime)
        const shouldBeDone = endDate < now
        const expectedStatus = shouldBeDone ? "Done" : "To Do"

        if (event.status !== expectedStatus) {
          updates.push(
            updateActivity(event.id, { status: expectedStatus })
          )
        }
      }

      await Promise.allSettled(updates)

      const events = await fetchActivities(currentDate)
      setLocalActivities(events)
      setUseRealData(true)
      onActivityUpdated?.()
      notifyTasksUpdated()
    } finally {
      setTimeout(() => setIsSyncing(false), 600)
    }
  }, [currentDate, fetchActivities, onActivityUpdated, updateActivity])

  return {
    localActivities,
    setLocalActivities,
    localActivitiesRef,
    editingActivity,
    setEditingActivity,
    viewingActivity,
    setViewingActivity,
    activityFormOpen,
    setActivityFormOpen,
    taskFormOpen,
    setTaskFormOpen,
    selectedSlot,
    setSelectedSlot,
    useRealData,
    setUseRealData,
    isSyncing,
    setIsSyncing,
    dragOverrides,
    setDragOverrides,
    inlineDraft,
    setInlineDraft,
    handleSave,
    handleDelete,
    handleStatusChange,
    handleProgressChange,
    handleActivityViewDetails,
    handleAddActivity,
    handleAddTask,
    handleAutoSync,
    handleUndo,
    handleRedo,
    handleActivityResize,
    handleDragEnd,
    handleDragUpdate,
    handleInlineCreate,
    handleInlineSave,
    handleInlineCancel,
  }
}
