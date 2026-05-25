import { useState, useEffect, useMemo, useCallback, useRef } from "react"
import { useTranslation } from "react-i18next"
import { useSearchParams } from "react-router-dom"
import { RotateCcw, CheckCircle2, Circle, Plus } from "lucide-react"
import { theme } from "../../theme"
import { useProductivity } from "../../hooks/useProductivity"
import { useCalendarHistory } from "./useCalendarHistory"
import CalendarHeader from "./CalendarHeader"
import CalendarGrid from "./CalendarGrid"
import AddActivityModal from "./AddActivityModal"
import AddTaskModal from "./AddTaskModal"
import ActivityDetailModal from "./ActivityDetailModal"
import ContextMenu from "./ContextMenu"
import VoiceRecorderModal from "./VoiceRecorderModal"
import {
  toDateStr,
} from "./calendarConstants"

export default function ProductivityCalendar({ onActivityUpdated }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [editingActivity, setEditingActivity] = useState(null)
  const [viewingActivity, setViewingActivity] = useState(null)
  const [activityFormOpen, setActivityFormOpen] = useState(false)
  const [taskFormOpen, setTaskFormOpen] = useState(false)
  const [confirmDelete, setConfirmDelete] = useState(null)
  const [showStatusOptions, setShowStatusOptions] = useState(false)
  const [useRealData, setUseRealData] = useState(false)
  const [ctxMenu, setCtxMenu] = useState(null)
  const [voiceOpen, setVoiceOpen] = useState(false)
  const [voiceAutofill, setVoiceAutofill] = useState(null)
  const [dragOverrides, setDragOverrides] = useState({})
  const [inlineDraft, setInlineDraft] = useState(null)
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

  const { record, undo, redo, canUndo, canRedo, undoSize, redoSize } = useCalendarHistory()

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
    applyHistoryEntry(entry, "undo")
    const { type, prev } = entry
    if (type === "create") {
      await deleteActivity(entry.next.id)
    } else if (type === "delete") {
      await createActivity(prev)
    } else if (type === "move" || type === "resize" || type === "edit") {
      await updateActivity(prev.id, prev)
    }
    onActivityUpdated?.()
  }, [undo, applyHistoryEntry, deleteActivity, createActivity, updateActivity, onActivityUpdated])

  const handleRedo = useCallback(async () => {
    const entry = redo()
    if (!entry) return
    applyHistoryEntry(entry, "redo")
    const { type, prev, next } = entry
    if (type === "create") {
      await createActivity(next)
    } else if (type === "delete") {
      await deleteActivity(prev.id)
    } else if (type === "move" || type === "resize" || type === "edit") {
      await updateActivity(next.id, next)
    }
    onActivityUpdated?.()
  }, [redo, applyHistoryEntry, createActivity, deleteActivity, updateActivity, onActivityUpdated])

  const handleStatusChange = useCallback(async (activity, newStatus) => {
    setCtxMenu(null)
    if (activity.status === newStatus) return
    const prev = { ...activity }
    const next = { ...activity, status: newStatus }
    setLocalActivities((prevActivities) =>
      prevActivities.map((e) => (e.id === activity.id ? next : e))
    )
    record({ type: "edit", prev, next })
    await updateActivity(activity.id, { status: newStatus })
    onActivityUpdated?.()
  }, [updateActivity, onActivityUpdated, record])

  const handleContextMenu = useCallback((activity, pos) => {
    setCtxMenu({ activity, x: pos.x, y: pos.y })
  }, [])

  const handleEmptyContextMenu = useCallback((date, startTime, endTime, pos) => {
    setCtxMenu({ date, startTime, endTime, x: pos.x, y: pos.y })
  }, [])

  const displayActivities = useMemo(() => {
    const base = useRealData ? localActivities : []
    return inlineDraft ? [...base, inlineDraft] : base
  }, [useRealData, localActivities, inlineDraft])

  const handleActivityViewDetails = useCallback((activity) => {
    setCtxMenu(null)
    setViewingActivity(activity)
  }, [])

  const handleEditFromDetail = useCallback(() => {
    if (!viewingActivity) return
    setEditingActivity(viewingActivity)
    setSelectedSlot(null)
    if (viewingActivity.hasDeadline) {
      setTaskFormOpen(true)
    } else {
      setActivityFormOpen(true)
    }
    setViewingActivity(null)
  }, [viewingActivity])

  const handleSave = useCallback(
    async (data) => {
      if (editingActivity) {
        const prev = localActivitiesRef.current.find((e) => e.id === editingActivity.id)
        if (!prev) return
        const prevSnapshot = { ...prev }
        const next = { ...prev, ...data }
        setLocalActivities((prevActivities) =>
          prevActivities.map((e) => (e.id === editingActivity.id ? next : e))
        )
        record({ type: "edit", prev: prevSnapshot, next })
        await updateActivity(editingActivity.id, data)
        setUseRealData(true)
      } else {
        const next = { id: `new-${Date.now()}`, ...data }
        setLocalActivities((prevActivities) => [...prevActivities, next])
        record({ type: "create", prev: null, next: { ...next } })
        await createActivity(data)
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
      const prev = localActivitiesRef.current.find((e) => e.id === id)
      if (!prev) return
      const prevSnapshot = { ...prev }
      setLocalActivities((prevActivities) => prevActivities.filter((e) => e.id !== id))
      record({ type: "delete", prev: prevSnapshot, next: null })
      await deleteActivity(id)
      setConfirmDelete(null)
      setViewingActivity(null)
      onActivityUpdated?.()
    },
    [deleteActivity, onActivityUpdated, record]
  )

  const handleActivityResize = useCallback(async (activity, oldStartTime, oldEndTime, newStartTime, newEndTime) => {
    const prev = { ...activity, startTime: oldStartTime, endTime: oldEndTime }
    const next = { ...activity, startTime: newStartTime, endTime: newEndTime }
    setLocalActivities((prevActivities) =>
      prevActivities.map((e) => (e.id === activity.id ? next : e))
    )
    record({ type: "resize", prev, next })
    await updateActivity(activity.id, { startTime: newStartTime, endTime: newEndTime })
    onActivityUpdated?.()
  }, [updateActivity, record, onActivityUpdated])

  const handleDragEnd = useCallback(async (id, oldStartTime, oldEndTime, newStartTime, newEndTime) => {
    if (!newStartTime) return
    const prev = localActivitiesRef.current.find((e) => e.id === id)
    if (!prev) return
    const prevSnapshot = { ...prev, startTime: oldStartTime, endTime: oldEndTime }
    const next = { ...prev, startTime: newStartTime, endTime: newEndTime }
    setLocalActivities((prevActivities) =>
      prevActivities.map((e) => (e.id === id ? next : e))
    )
    record({ type: "move", prev: prevSnapshot, next })
    await updateActivity(id, { startTime: newStartTime, endTime: newEndTime })
    onActivityUpdated?.()
  }, [record, updateActivity, onActivityUpdated])

  const handleDragUpdate = useCallback((id, startTime, endTime) => {
    setDragOverrides((prev) => {
      if (startTime === null) {
        const next = { ...prev }
        delete next[id]
        return next
      }
      return { ...prev, [id]: { startTime, endTime } }
    })
  }, [])

  const handleInlineCreate = useCallback((date, startTime, endTime) => {
    const id = `inline-${Date.now()}`
    setInlineDraft({
      id,
      title: "",
      description: "",
      eventDate: toDateStr(date),
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
      const result = await createActivity({
        title: title.trim(),
        description: draft.description,
        eventDate: draft.eventDate,
        startTime: draft.startTime,
        endTime: draft.endTime,
        color: draft.color,
        priority: draft.priority,
        productivityLevel: draft.productivityLevel,
        hasDeadline: draft.hasDeadline,
        status: draft.status,
      })
      const next = result.event || { id: draft.id, title: title.trim(), ...draft }
      setLocalActivities((prevActivities) => [...prevActivities, next])
      record({ type: "create", prev: null, next })
      setUseRealData(true)
      requestAnimationFrame(() => setInlineDraft(null))
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
    setVoiceAutofill(parsed)
    requestAnimationFrame(() => {
      if (parsed.type === "activity") {
        setSelectedSlot(null)
        setEditingActivity(null)
        setActivityFormOpen(true)
      } else {
        setSelectedSlot(null)
        setEditingActivity(null)
        setTaskFormOpen(true)
      }
    })
  }, [])

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
      />

      <div style={{ borderTop: `1px solid ${theme.border}` }}>
        <CalendarGrid
          activities={displayActivities}
          currentDate={currentDate}
          dragOverrides={dragOverrides}
          inlineDraftId={inlineDraft?.id}
          onViewDetails={handleActivityViewDetails}
          onActivityContextMenu={handleContextMenu}
          onEmptyContextMenu={handleEmptyContextMenu}
          onActivityResize={handleActivityResize}
          onDragUpdate={handleDragUpdate}
          onDragEnd={handleDragEnd}
          onInlineCreate={handleInlineCreate}
          onInlineSave={handleInlineSave}
          onInlineCancel={handleInlineCancel}
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
      />

      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          activity={ctxMenu.activity}
          menuRef={menuRef}
          containerRef={calendarRef}
          onViewDetails={handleActivityViewDetails}
          onStatusChange={handleStatusChange}
          onDelete={(id) => { handleDelete(id); setCtxMenu(null) }}
          onAddActivity={handleCtxAddActivity}
          onAddTask={handleCtxAddTask}
          onVoice={() => { setCtxMenu(null); handleVoice() }}
        />
      )}

      <ActivityDetailModal
        activity={viewingActivity}
        open={!!viewingActivity}
        onClose={() => { setViewingActivity(null); setConfirmDelete(null); setShowStatusOptions(false) }}
        onStatusChange={handleStatusChange}
        onEdit={(activity) => { setEditingActivity(activity); setSelectedSlot(null); if (activity.hasDeadline) setTaskFormOpen(true); else setActivityFormOpen(true); setViewingActivity(null) }}
        onDelete={(id) => { handleDelete(id); setConfirmDelete(null); setViewingActivity(null) }}
      />
    </div>
  )
}
