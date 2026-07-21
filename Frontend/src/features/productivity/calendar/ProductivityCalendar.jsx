import { useState, useEffect, useMemo, useCallback, useRef, forwardRef, useImperativeHandle } from "react"
import { useTranslation } from "react-i18next"
import { useSearchParams } from "react-router-dom"

import { theme } from "../../../theme"
import { useTutorial } from "../../../components/tutorial/TutorialContext"
import { useProductivity } from "../../../hooks/useProductivity"
import { productivityService } from "../../../services/productivityService"
import { useCalendarHistory } from "../hooks/useCalendarHistory"
import CalendarHeader from "../calendar/CalendarHeader"
import CalendarGrid from "../calendar/CalendarGrid"
import AddActivityModal from "../modals/AddActivityModal"
import AddTaskModal from "../tasks/AddTaskModal"
import ActivityDetailModal from "../modals/ActivityDetailModal"
import ActivityContextMenu from "../interactions/ActivityContextMenu"
import { notifyTasksUpdated } from "../../../utils/events"
import VoiceRecorderModal from "../modals/VoiceRecorderModal"
import {
  toDateStr,
} from "../utils/calendarConstants"
import {
  getCachedDaySegment,
  clearSegmentCache,
} from "../utils/segmentActivity"

const STORAGE_KEY = "productivity_calendar_date"

function loadSavedDate() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const d = new Date(saved + "T00:00:00")
      if (!isNaN(d.getTime())) return d
    }
  } catch {}
  return new Date()
}

const ProductivityCalendar = forwardRef(function ProductivityCalendar({ onActivityUpdated, calendarRefreshKey, onQuickAdd }, ref) {

useImperativeHandle(ref, () => ({
  editActivity(activity) {
    setEditingActivity(activity)
    setSelectedSlot(null)
    if (activity.hasDeadline) {
      setTaskFormOpen(true)
    } else {
      setActivityFormOpen(true)
    }
  },
  viewActivity(activity) {
    setViewingActivity(activity)
  },
}))


  const [currentDate, setCurrentDate] = useState(loadSavedDate)
  const [interactionMode, setInteractionMode] = useState("fixed")
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [editingActivity, setEditingActivity] = useState(null)
  const [viewingActivity, setViewingActivity] = useState(null)
  const [activityFormOpen, setActivityFormOpen] = useState(false)
  const [taskFormOpen, setTaskFormOpen] = useState(false)
  const [useRealData, setUseRealData] = useState(false)
  const [ctxMenu, setCtxMenu] = useState(null)
  const [voiceOpen, setVoiceOpen] = useState(false)
  const [voiceAutofill, setVoiceAutofill] = useState(null)
  const [dragOverrides, setDragOverrides] = useState({})
  const [inlineDraft, setInlineDraft] = useState(null)
  const { tutorialId, tutorialStep, closeTutorial, updateSpotlightTarget } = useTutorial()
  const demoModeStep4 = tutorialId === "productivity-calendar" && tutorialStep === 5
  const demoModeStep5 = tutorialId === "productivity-calendar" && tutorialStep === 6
  const isTutorialDemoMode = demoModeStep4 || demoModeStep5
  const isStep4 = demoModeStep4

  const [tutorialBlock, setTutorialBlock] = useState({ startTime: "00:00", endTime: "02:30", status: "To Do", visible: true })

  const demoActivity = useMemo(() => {
    const dateStr = toDateStr(currentDate)
    return {
      id: "tutorial-demo",
      title: "Demo Activity",
      description: "Try moving or resizing me",
      startDatetime: `${dateStr}T${tutorialBlock.startTime}`,
      endDatetime: `${dateStr}T${tutorialBlock.endTime}`,
      color: "#7C3AED",
      priority: "medium",
      productivityLevel: "neutral",
      hasDeadline: false,
      status: "To Do",
    }
  }, [currentDate, tutorialBlock])

  useEffect(() => {
    if (!isTutorialDemoMode) {
      setTutorialBlock({ startTime: "12:00", endTime: "13:00", status: "To Do", visible: true })
    }
  }, [isTutorialDemoMode])

  useEffect(() => {
    if (isTutorialDemoMode) {
      const timer = setTimeout(() => {
        updateSpotlightTarget("demo-activity-block", true)
      }, 100)
      return () => clearTimeout(timer)
    }
  }, [isTutorialDemoMode, updateSpotlightTarget])

  useEffect(() => {
    if (isTutorialDemoMode) {
      const grid = document.querySelector("[data-calendar-grid]")
      if (grid) {
        const targetPx = 0
        const centerOffset = grid.clientHeight * 0.35
        grid.scrollTop = Math.max(0, targetPx - centerOffset)
      }
    }
  }, [isTutorialDemoMode])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, toDateStr(currentDate))
    } catch {}
  }, [currentDate])

  const [isSyncing, setIsSyncing] = useState(false)
  const [localActivities, setLocalActivities] = useState([])
  const localActivitiesRef = useRef([])
  useEffect(() => {
    localActivitiesRef.current = localActivities
  }, [localActivities])
  const menuRef = useRef(null)
  const calendarRef = useRef(null)
  const [searchParams, setSearchParams] = useSearchParams()

  useEffect(() => {
    const action = searchParams.get("action")
    if (action === "create" || action === "createActivity") {
      setActivityFormOpen(true)
      setSearchParams({}, { replace: true })
    } else if (action === "createTask") {
      setTaskFormOpen(true)
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const {
    fetchActivities,
    createActivity,
    updateActivity,
    deleteActivity,
  } = useProductivity()

  const { record, undo, redo, canUndo, canRedo } = useCalendarHistory()

  const navCountRef = useRef(0)

  useEffect(() => {
    navCountRef.current += 1
    const navId = navCountRef.current
    setLocalActivities([])
    setUseRealData(false)

    fetchActivities(currentDate).then((events) => {
      if (navCountRef.current !== navId) return
      setLocalActivities(events)
      setUseRealData(true)
    })
  }, [currentDate, fetchActivities])

  useEffect(() => {
    clearSegmentCache()
  }, [currentDate])

  useEffect(() => {
    if (!ctxMenu) return
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setCtxMenu(null)
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [ctxMenu])

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

  const handleStatusChange = useCallback(async (activity, newStatus) => {
    setCtxMenu(null)
    if (activity.status === newStatus) return
    if (isTutorialDemoMode && activity.id === "tutorial-demo") {
      setTutorialBlock(prev => ({ ...prev, status: newStatus }))
      return
    }
    const prev = { ...activity }
    const next = { ...activity, status: newStatus }
    setLocalActivities((prevActivities) =>
      prevActivities.map((e) => (e.id === activity.id ? next : e))
    )
    setViewingActivity(next)
    record({ type: "edit", prev, next })
    await updateActivity(activity.id, { status: newStatus })
    onActivityUpdated?.()
  }, [updateActivity, onActivityUpdated, record, isTutorialDemoMode, setViewingActivity])

  const handleContextMenu = useCallback((activity, pos) => {
    if (isTutorialDemoMode) {
      if (isStep4) return
      if (activity.id === "tutorial-demo") {
        setCtxMenu({ activity, x: pos.x, y: pos.y })
      }
      return
    }
    setCtxMenu({ activity, x: pos.x, y: pos.y })
  }, [isTutorialDemoMode, isStep4])

  const displayActivities = useMemo(() => {
    if (isTutorialDemoMode) return tutorialBlock.visible ? [demoActivity] : []
    const base = useRealData ? localActivities : []
    const dateStr = toDateStr(currentDate)
    clearSegmentCache()
    const segmented = []
    for (const act of base) {
      if (act.hasDeadline) {
        const startDate = act.startDatetime?.slice(0, 10)
        const endDate = act.endDatetime?.slice(0, 10)
        if (startDate === dateStr) {
          segmented.push(createTaskMarker(act, "start"))
        }
        if (endDate === dateStr) {
          segmented.push(createTaskMarker(act, "deadline"))
        }
      } else {
        const seg = getCachedDaySegment(act, dateStr)
        if (!seg) continue
        segmented.push({
          ...seg,
          isSegmented: seg.isCrossDay,
        })
      }
    }
    if (inlineDraft) segmented.push(inlineDraft)
    return segmented
  }, [useRealData, localActivities, inlineDraft, currentDate, isTutorialDemoMode, tutorialBlock, demoActivity])

  function createTaskMarker(activity, role) {
    const dt = role === "start" ? activity.startDatetime : activity.endDatetime
    const { startTime: _s, endTime: _e, ...rest } = activity
    return {
      ...rest,
      segmentStart: dt?.slice(0, 16) || "",
      segmentEnd: dt?.slice(0, 16) || "",
      _isTaskMarker: true,
      _taskRole: role,
      isSegmented: false,
    }
  }

  const handleActivityViewDetails = useCallback((activity) => {
    setCtxMenu(null)
    if (isTutorialDemoMode && activity.id !== "tutorial-demo") return
    setViewingActivity(activity)
  }, [isTutorialDemoMode])

  const handleSave = useCallback(
    async (data) => {
      if (editingActivity) {
        const prev = localActivitiesRef.current.find((e) => e.id === editingActivity.id)
        const prevSnapshot = prev ? { ...prev } : null

        let payload = { ...data }
        let startDt = data.startDatetime || editingActivity.startDatetime
        let endDt = data.endDatetime || editingActivity.endDatetime
        if ((!startDt || !endDt) && data.startDate && data.endDate && data.startTime && data.endTime) {
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
            prevActivities.map((e) => (e.id === editingActivity.id ? next : e))
          )
          record({ type: "edit", prev: prevSnapshot, next })
        }

        try {
          const result = await updateActivity(editingActivity.id, payload)
          if (result && prev) {
            setLocalActivities((prevActivities) =>
              prevActivities.map((e) => (e.id === editingActivity.id ? result : e))
            )
          }
          setUseRealData(true)
        } catch (err) {
          if (prev) {
            setLocalActivities((prevActivities) =>
              prevActivities.map((e) => (e.id === editingActivity.id ? prevSnapshot : e))
            )
          }
          throw err
        }
      } else {
        let payload = { ...data }
        if (!data.hasDeadline) {
          let startDt = data.startDatetime
          let endDt = data.endDatetime
          if ((!startDt || !endDt) && data.startDate && data.endDate && data.startTime && data.endTime) {
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
      onActivityUpdated?.()
    },
    [editingActivity, updateActivity, createActivity, onActivityUpdated, record]
  )

  const handleDelete = useCallback(
    async (id) => {
      if (isTutorialDemoMode && id === "tutorial-demo") {
        setTutorialBlock(prev => ({ ...prev, visible: false }))
        setCtxMenu(null)
        setViewingActivity(null)
        return
      }
      const prev = localActivitiesRef.current.find((e) => e.id === id)
      if (!prev) return
      const prevSnapshot = { ...prev }
      setLocalActivities((prevActivities) => prevActivities.filter((e) => e.id !== id))
      record({ type: "delete", prev: prevSnapshot, next: null })
      await deleteActivity(id)
      setViewingActivity(null)
      onActivityUpdated?.()
    },
    [deleteActivity, onActivityUpdated, record, isTutorialDemoMode]
  )

  const handleActivityResize = useCallback(async (activity, oldStartTime, oldEndTime, newStartTime, newEndTime) => {
    if (activity.isSegmented) return
    if (isTutorialDemoMode && activity.id === "tutorial-demo") {
      setTutorialBlock(prev => ({ ...prev, startTime: newStartTime, endTime: newEndTime }))
      return
    }
    clearSegmentCache()
    const prev = { ...activity, startTime: oldStartTime, endTime: oldEndTime }
    const next = { ...activity, startTime: newStartTime, endTime: newEndTime }
    if (activity.startDatetime) {
      const sd = new Date(activity.startDatetime)
      if (newEndTime !== oldEndTime) {
        const [eh, em] = newEndTime.split(':').map(Number)
        const newEd = new Date(sd)
        newEd.setHours(eh, em, 0, 0)
        if (newEd <= sd) newEd.setDate(newEd.getDate() + 1)
        const y = newEd.getFullYear()
        const mo = String(newEd.getMonth() + 1).padStart(2, '0')
        const d = String(newEd.getDate()).padStart(2, '0')
        const h = String(newEd.getHours()).padStart(2, '0')
        const mi = String(newEd.getMinutes()).padStart(2, '0')
        next.endDatetime = `${y}-${mo}-${d}T${h}:${mi}`
      }
      if (newStartTime !== oldStartTime) {
        const ed = activity.endDatetime ? new Date(activity.endDatetime) : new Date(sd.getTime() + 3600000)
        const [sh, sm] = newStartTime.split(':').map(Number)
        const newSd = new Date(ed)
        newSd.setHours(sh, sm, 0, 0)
        if (newSd >= ed) newSd.setDate(newSd.getDate() - 1)
        const y = newSd.getFullYear()
        const mo = String(newSd.getMonth() + 1).padStart(2, '0')
        const d = String(newSd.getDate()).padStart(2, '0')
        const h = String(newSd.getHours()).padStart(2, '0')
        const mi = String(newSd.getMinutes()).padStart(2, '0')
        next.startDatetime = `${y}-${mo}-${d}T${h}:${mi}`
      }
    }
    // Strip trailing seconds from any datetime that came from the API isoformat
    const stripSeconds = (s) => s && s.length > 16 ? s.slice(0, 16) : s
    next.startDatetime = stripSeconds(next.startDatetime)
    next.endDatetime = stripSeconds(next.endDatetime)

    setLocalActivities((prevActivities) =>
      prevActivities.map((e) => (e.id === activity.id ? next : e))
    )
    record({ type: "resize", prev, next })
    try {
      const payload = { startDatetime: next.startDatetime, endDatetime: next.endDatetime }
      const result = await updateActivity(activity.id, payload)
      if (result) {
        setLocalActivities((prevActivities) =>
          prevActivities.map((e) => (e.id === activity.id ? result : e))
        )
      }
      onActivityUpdated?.()
    } catch (err) {
      console.error("[Resize] API failed:", err)
      setLocalActivities((prevActivities) =>
        prevActivities.map((e) => (e.id === activity.id ? prev : e))
      )
    }
  }, [updateActivity, record, onActivityUpdated, isTutorialDemoMode])

  const handleDragEnd = useCallback(async (id, oldStartTime, oldEndTime, newStartTime, newEndTime, rawDeltaMin) => {
    if (!newStartTime) return
    if (isTutorialDemoMode && id === "tutorial-demo") {
      setDragOverrides((prev) => {
        const next = { ...prev }
        delete next[id]
        return next
      })
      setTutorialBlock(prev => ({ ...prev, startTime: newStartTime, endTime: newEndTime }))
      return
    }
    clearSegmentCache()
    const prev = localActivitiesRef.current.find((e) => e.id === id)
    if (!prev) {
      console.warn("[Drag] prev not found in localActivitiesRef — aborting commit, id:", id)
      return
    }
    const prevSnapshot = { ...prev, startTime: oldStartTime, endTime: oldEndTime }
    const next = { ...prev, startTime: newStartTime, endTime: newEndTime }
    if (prev.startDatetime && prev.endDatetime) {
      let deltaMin
      if (rawDeltaMin !== undefined) {
        deltaMin = rawDeltaMin
      } else {
        const toMin = (t) => { const [h, m] = t.split(':').map(Number); return h * 60 + m }
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
        const mo = String(d.getMonth() + 1).padStart(2, '0')
        const day = String(d.getDate()).padStart(2, '0')
        const h = String(d.getHours()).padStart(2, '0')
        const mi = String(d.getMinutes()).padStart(2, '0')
        return `${y}-${mo}-${day}T${h}:${mi}`
      }
      next.startDatetime = toLocal(newSd)
      next.endDatetime = toLocal(newEd)
    } else {
      console.warn("[Drag] prev missing startDatetime/endDatetime, cannot compute shift", { startDatetime: prev.startDatetime, endDatetime: prev.endDatetime })
    }
    const stripSeconds = (s) => s && s.length > 16 ? s.slice(0, 16) : s
    next.startDatetime = stripSeconds(next.startDatetime)
    next.endDatetime = stripSeconds(next.endDatetime)

    setLocalActivities((prevActivities) =>
      prevActivities.map((e) => (e.id === id ? next : e))
    )
    record({ type: "move", prev: prevSnapshot, next })
    try {
      const payload = { startDatetime: next.startDatetime, endDatetime: next.endDatetime }
      const result = await updateActivity(id, payload)
      if (result) {
        setLocalActivities((prevActivities) =>
          prevActivities.map((e) => (e.id === id ? result : e))
        )
      }
      onActivityUpdated?.()
    } catch (err) {
      console.error("[Drag] API failed:", err)
      setLocalActivities((prevActivities) =>
        prevActivities.map((e) => (e.id === id ? prevSnapshot : e))
      )
    }
  }, [record, updateActivity, onActivityUpdated, isTutorialDemoMode])

  const handleDragUpdate = useCallback((id, startTime, endTime) => {
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
  }, [isTutorialDemoMode])

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

  const handleInlineSave = useCallback(async (title) => {
    if (!inlineDraft || !title.trim()) {
      setInlineDraft(null)
      return
    }
    const draft = inlineDraft
    try {
      let productivityLevel = draft.productivityLevel
      let priority = draft.priority
      try {
        const classification = await productivityService.classifyTitle(title.trim())
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
  }, [inlineDraft, createActivity, record, onActivityUpdated])

  const handleInlineCancel = useCallback(() => {
    setInlineDraft(null)
  }, [])

  const closeModals = useCallback(() => {
    setActivityFormOpen(false)
    setTaskFormOpen(false)
    setEditingActivity(null)
    setSelectedSlot(null)
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault()
        setInteractionMode(prev => prev === "fixed" ? "reschedule" : "fixed")
      }
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [])

  useEffect(() => {
    if (calendarRefreshKey == null) return
    const navId = ++navCountRef.current
    setLocalActivities([])
    setUseRealData(false)
    fetchActivities(currentDate).then((events) => {
      if (navCountRef.current !== navId) return
      setLocalActivities(events)
      setUseRealData(true)
    })
  }, [calendarRefreshKey, currentDate, fetchActivities])

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

  const handleVoice = useCallback(() => {
    setVoiceAutofill(null)
    setVoiceOpen(true)
  }, [])

  const handleVoiceResult = useCallback((parsed) => {
    const result = { ...parsed }
    if (!result.start_date) {
      result.start_date = toDateStr(currentDate)
    }
    if (result.type === "task" && !result.end_date) {
      result.end_date = toDateStr(currentDate)
    }
    setVoiceAutofill(result)
    requestAnimationFrame(() => {
      if (result.type === "activity") {
        setSelectedSlot(null)
        setEditingActivity(null)
        setActivityFormOpen(true)
      } else {
        setSelectedSlot(null)
        setEditingActivity(null)
        setTaskFormOpen(true)
      }
    })
  }, [currentDate])

  const handleAutoSync = useCallback(async () => {
    setIsSyncing(true)
    const dateStr = toDateStr(currentDate)
    await productivityService.syncDayStatuses(dateStr)
    const events = await fetchActivities(currentDate)
    setLocalActivities(events)
    setUseRealData(true)
    onActivityUpdated?.()
    notifyTasksUpdated()
    setTimeout(() => setIsSyncing(false), 600)
  }, [currentDate, fetchActivities, onActivityUpdated])

  const handleCtxAddActivity = useCallback(() => {
    if (!ctxMenu) return
    setSelectedSlot({ date: ctxMenu.date, startTime: ctxMenu.startTime, endTime: ctxMenu.endTime })
    setEditingActivity(null)
    setActivityFormOpen(true)
    setCtxMenu(null)
  }, [ctxMenu])

  const handleCtxAddTask = useCallback(() => {
    if (!ctxMenu) return
    setSelectedSlot({ date: ctxMenu.date, startTime: ctxMenu.startTime, endTime: ctxMenu.endTime })
    setEditingActivity(null)
    setTaskFormOpen(true)
    setCtxMenu(null)
  }, [ctxMenu])

  const handleCtxEdit = useCallback((activity) => {
    if (isTutorialDemoMode) { setCtxMenu(null); return }
    setEditingActivity(activity)
    setSelectedSlot(null)
    if (activity.hasDeadline) {
      setTaskFormOpen(true)
    } else {
      setActivityFormOpen(true)
    }
    setCtxMenu(null)
  }, [isTutorialDemoMode])

  return (
    <div
      ref={calendarRef}
      style={{
        marginBottom: 32,
        background: "var(--color-card, white)",
        borderRadius: 16,
        border: `1px solid ${theme.border}`,
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        overflow: "hidden",
        position: "relative",
      }}
    >
      <CalendarHeader
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        onAddActivity={handleAddActivity}
        onAddTask={handleAddTask}
        onVoice={handleVoice}
        onQuickAdd={onQuickAdd}
        interactionMode={interactionMode}
        onModeChange={setInteractionMode}
        onAutoSync={handleAutoSync}
      />

      <div style={{ borderTop: `1px solid ${theme.border}` }}>
          <CalendarGrid
            activities={displayActivities}
            currentDate={currentDate}
            dragOverrides={dragOverrides}
            inlineDraftId={inlineDraft?.id}
            onViewDetails={handleActivityViewDetails}
            onActivityContextMenu={handleContextMenu}
            onActivityResize={handleActivityResize}
            onDragUpdate={handleDragUpdate}
            onDragEnd={handleDragEnd}
            onInlineCreate={handleInlineCreate}
            onInlineSave={handleInlineSave}
            onInlineCancel={handleInlineCancel}
            onStatusChange={handleStatusChange}
            interactionMode={interactionMode}
            isSyncing={isSyncing}
            scrollToHour={null}
          />
      </div>

      <AddActivityModal
        open={activityFormOpen}
        onClose={() => { closeModals(); setVoiceAutofill(null) }}
        onSave={handleSave}
        editingActivity={editingActivity && !editingActivity.hasDeadline ? editingActivity : null}
        selectedSlot={!editingActivity ? selectedSlot : null}
        voiceAutofill={voiceAutofill?.type === "activity" ? voiceAutofill : null}
      />

      <AddTaskModal
        open={taskFormOpen}
        onClose={() => { closeModals(); setVoiceAutofill(null) }}
        onSave={handleSave}
        editingActivity={editingActivity && editingActivity.hasDeadline ? editingActivity : null}
        selectedSlot={!editingActivity ? selectedSlot : null}
        voiceAutofill={voiceAutofill?.type === "task" ? voiceAutofill : null}
      />

      <VoiceRecorderModal
        open={voiceOpen}
        onClose={() => setVoiceOpen(false)}
        onResult={handleVoiceResult}
        referenceDate={currentDate}
      />

      {ctxMenu && (
        <ActivityContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          activity={ctxMenu.activity}
          menuRef={menuRef}
          containerRef={calendarRef}
          onEdit={handleCtxEdit}
          onDelete={(id) => { handleDelete(id); setCtxMenu(null) }}
          onAddActivity={handleCtxAddActivity}
          onAddTask={handleCtxAddTask}
          onVoice={() => { setCtxMenu(null); handleVoice() }}
        />
      )}

      <ActivityDetailModal
        activity={viewingActivity}
        open={!!viewingActivity}
        onClose={() => { setViewingActivity(null) }}
        onStatusChange={handleStatusChange}
        onEdit={(activity) => { setEditingActivity(activity); setSelectedSlot(null); if (activity.hasDeadline) setTaskFormOpen(true); else setActivityFormOpen(true); setViewingActivity(null) }}
        onDelete={(id) => { handleDelete(id); setViewingActivity(null) }}
      />
    </div>
  )
})

export default ProductivityCalendar
