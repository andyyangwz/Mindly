import { useState, useEffect, useMemo, useCallback, useRef, forwardRef, useImperativeHandle } from "react"
import { motion } from "framer-motion"
import { useSearchParams } from "react-router-dom"

import "../../../styles/scheduling/index.css"
import { useToast } from "../../../components/ui/Toast"
import { useScheduling } from "../../../hooks/scheduling/useScheduling"
import { useCalendarHistory } from "../../../hooks/scheduling/useCalendarHistory"
import { useCalendarDate } from "../../../hooks/scheduling/useCalendarDate"
import { useCalendarTutorial } from "../../../hooks/scheduling/useCalendarTutorial"
import { useCalendarReminderCrud } from "../../../hooks/scheduling/useCalendarReminderCrud"
import { useCalendarContextMenu } from "../../../hooks/scheduling/useCalendarContextMenu"
import { useCalendarVoice } from "../../../hooks/scheduling/useCalendarVoice"
import { useCalendarActivityCrud } from "../../../hooks/scheduling/useCalendarActivityCrud"
import CalendarHeader from "../calendar/CalendarHeader"
import CalendarGrid from "../calendar/CalendarGrid"
import AddActivityModal from "../modals/AddActivityModal"
import AddTaskModal from "../tasks/AddTaskModal"
import AddReminderModal from "../reminders/AddReminderModal"
import ActivityDetailModal from "../modals/ActivityDetailModal"
import ReminderDetailModal from "../reminders/ReminderDetailModal"
import ActivityContextMenu from "../interactions/ActivityContextMenu"
import VoiceRecorderModal from "../modals/VoiceRecorderModal"
import VoiceReviewPopup from "../modals/VoiceReviewPopup"
import {
  toDateStr,
  getCachedDaySegment,
  clearSegmentCache,
} from "../utils/calendarConstants"

function createTaskMarker(activity, role) {
  const dt = role === "start" ? activity.startDatetime : activity.endDatetime
  const rest = { ...activity }
  delete rest.startTime
  delete rest.endTime
  return {
    ...rest,
    segmentStart: dt?.slice(0, 16) || "",
    segmentEnd: dt?.slice(0, 16) || "",
    _isTaskMarker: true,
    _taskRole: role,
    isSegmented: false,
  }
}

const SchedulingCalendar = forwardRef(function SchedulingCalendar({ onActivityUpdated, calendarRefreshKey, onQuickAdd, onDrawerToggle, showDrawerToggle, scrollContainerRef }, ref) {

  const toast = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const calendarRef = useRef(null)
  const [interactionMode, setInteractionMode] = useState("fixed")

  const { currentDate, setCurrentDate } = useCalendarDate(scrollContainerRef)

  const { isTutorialDemoMode, isStep4, tutorialBlock, setTutorialBlock, demoActivity } =
    useCalendarTutorial(currentDate, scrollContainerRef)

  const { fetchActivities, createActivity, updateActivity, deleteActivity } = useScheduling()
  const { record, undo, redo, canUndo, canRedo } = useCalendarHistory()

  const crud = useCalendarActivityCrud({
    currentDate, calendarRefreshKey, onActivityUpdated,
    fetchActivities, createActivity, updateActivity, deleteActivity,
    record, undo, redo,
    isTutorialDemoMode, setTutorialBlock,
  })

  const reminders = useCalendarReminderCrud({
    onActivityUpdated,
    setSelectedSlot: crud.setSelectedSlot,
  })

  const ctx = useCalendarContextMenu({
    isTutorialDemoMode, isStep4,
    setEditingActivity: crud.setEditingActivity,
    setSelectedSlot: crud.setSelectedSlot,
    setActivityFormOpen: crud.setActivityFormOpen,
    setTaskFormOpen: crud.setTaskFormOpen,
    setEditingReminder: reminders.setEditingReminder,
    setReminderFormOpen: reminders.setReminderFormOpen,
  })

  const voice = useCalendarVoice({
    currentDate, toast, createActivity, onActivityUpdated,
    setLocalActivities: crud.setLocalActivities,
    setUseRealData: crud.setUseRealData,
    setActivityFormOpen: crud.setActivityFormOpen,
    setTaskFormOpen: crud.setTaskFormOpen,
    setReminderFormOpen: reminders.setReminderFormOpen,
    setSelectedSlot: crud.setSelectedSlot,
    setEditingActivity: crud.setEditingActivity,
    setEditingReminder: reminders.setEditingReminder,
  })

  useImperativeHandle(ref, () => ({
    editActivity(activity) {
      crud.setEditingActivity(activity)
      crud.setSelectedSlot(null)
      if (activity.hasDeadline) {
        crud.setTaskFormOpen(true)
      } else {
        crud.setActivityFormOpen(true)
      }
    },
    viewActivity(activity) {
      crud.setViewingActivity(activity)
    },
  }))

  useEffect(() => {
    const action = searchParams.get("action")
    if (action === "create" || action === "createActivity") {
      crud.setActivityFormOpen(true)
      setSearchParams({}, { replace: true })
    } else if (action === "createTask") {
      crud.setTaskFormOpen(true)
      setSearchParams({}, { replace: true })
    } else if (action === "createReminder") {
      reminders.setReminderFormOpen(true)
      setSearchParams({}, { replace: true })
    }
  }, [searchParams, setSearchParams, crud, reminders])

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

  const handleSave = useCallback(async (data) => {
    crud.handleSave(data, {
      onSaveComplete: (savedData) => {
        voice.markVoiceItemSaved(savedData)
      },
    })
  }, [crud, voice])

  const closeModals = useCallback(() => {
    crud.setActivityFormOpen(false)
    crud.setTaskFormOpen(false)
    crud.setEditingActivity(null)
    crud.setSelectedSlot(null)
    reminders.setReminderFormOpen(false)
    reminders.setEditingReminder(null)
  }, [crud, reminders])

  const displayActivities = useMemo(() => {
    if (isTutorialDemoMode) return tutorialBlock.visible ? [demoActivity] : []
    const base = crud.useRealData ? crud.localActivities : []
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
    if (crud.inlineDraft) segmented.push(crud.inlineDraft)
    return segmented
  }, [crud.useRealData, crud.localActivities, crud.inlineDraft, currentDate, isTutorialDemoMode, tutorialBlock, demoActivity])

  const handleAddReminder = useCallback(() => {
    reminders.setEditingReminder(null)
    crud.setSelectedSlot({ date: currentDate })
    reminders.setReminderFormOpen(true)
  }, [currentDate, crud, reminders])

  const handleModalClose = useCallback(() => {
    closeModals()
    voice.setVoiceAutofill(null)
    if (voice.voiceSelectedActivity) {
      voice.setVoiceSelectedActivity(null)
    }
  }, [closeModals, voice])

  const handleReminderModalClose = useCallback(() => {
    closeModals()
    voice.setVoiceAutofill(null)
    if (voice.voiceSelectedActivity) {
      voice.setVoiceSelectedActivity(null)
    }
  }, [closeModals, voice])

  const handleVoiceClose = useCallback(() => {
    voice.setVoiceOpen(false)
  }, [voice])

  const handleVoiceReviewClose = useCallback(() => {
    voice.setVoiceReviewOpen(false)
    voice.setVoiceReviewActivities(null)
    voice.setVoiceSavedIds(null)
    voice.setVoiceDrafts(null)
    voice.setVoiceSelectedActivity(null)
    voice.setVoiceAutofill(null)
  }, [voice])

  const handleViewingActivityClose = useCallback(() => {
    crud.setViewingActivity(null)
  }, [crud])

  const handleViewingReminderClose = useCallback(() => {
    reminders.setViewingReminder(null)
  }, [reminders])

  const handleDetailEdit = useCallback((activity) => {
    crud.setEditingActivity(activity)
    crud.setSelectedSlot(null)
    if (activity.hasDeadline) {
      crud.setTaskFormOpen(true)
    } else {
      crud.setActivityFormOpen(true)
    }
    crud.setViewingActivity(null)
  }, [crud])

  const handleDetailDelete = useCallback((id) => {
    crud.handleDelete(id)
    crud.setViewingActivity(null)
  }, [crud])

  const handleCtxDelete = useCallback((id) => {
    crud.handleDelete(id)
    ctx.setCtxMenu(null)
  }, [crud, ctx])

  const hasMoreUndrafted = useMemo(() => {
    if (!voice.voiceReviewActivities) return false
    return voice.voiceReviewActivities.some(
      (a) => a._voiceId !== voice.voiceSelectedActivity?._voiceId &&
        !voice.voiceSavedIds?.has(a._voiceId) &&
        !(voice.voiceDrafts && voice.voiceDrafts.has(a._voiceId))
    )
  }, [voice.voiceReviewActivities, voice.voiceSelectedActivity, voice.voiceSavedIds, voice.voiceDrafts])

  return (
    <motion.div
      ref={calendarRef}
      className="pc-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <CalendarHeader
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        onUndo={crud.handleUndo}
        onRedo={crud.handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        onAddActivity={crud.handleAddActivity}
        onAddTask={crud.handleAddTask}
        onAddReminder={handleAddReminder}
        onVoice={voice.handleVoice}
        onQuickAdd={onQuickAdd}
        interactionMode={interactionMode}
        onModeChange={setInteractionMode}
        onAutoSync={crud.handleAutoSync}
        onDrawerToggle={onDrawerToggle}
        showDrawerToggle={showDrawerToggle}
      />

      <div className="pc-calendar-body">
          <CalendarGrid
            activities={displayActivities}
            currentDate={currentDate}
            dragOverrides={crud.dragOverrides}
            inlineDraftId={crud.inlineDraft?.id}
            onViewDetails={crud.handleActivityViewDetails}
            onActivityContextMenu={ctx.handleContextMenu}
            onActivityResize={crud.handleActivityResize}
            onDragUpdate={crud.handleDragUpdate}
            onDragEnd={crud.handleDragEnd}
            onInlineCreate={crud.handleInlineCreate}
            onInlineSave={crud.handleInlineSave}
            onInlineCancel={crud.handleInlineCancel}
            onStatusChange={crud.handleStatusChange}
            interactionMode={interactionMode}
            isSyncing={crud.isSyncing}
            scrollToHour={null}
          />
      </div>

      <AddActivityModal
        open={crud.activityFormOpen}
        onClose={handleModalClose}
        onSave={handleSave}
        editingActivity={crud.editingActivity && !crud.editingActivity.hasDeadline ? crud.editingActivity : null}
        selectedSlot={!crud.editingActivity ? crud.selectedSlot : null}
        voiceAutofill={voice.voiceAutofill?.type === "activity" ? voice.voiceAutofill : null}
        voiceMode={!!voice.voiceSelectedActivity}
        onSaveDraft={voice.handleSaveDraft}
        hasMoreUndrafted={hasMoreUndrafted}
      />

      <AddTaskModal
        open={crud.taskFormOpen}
        onClose={handleModalClose}
        onSave={handleSave}
        editingActivity={crud.editingActivity && crud.editingActivity.hasDeadline ? crud.editingActivity : null}
        selectedSlot={!crud.editingActivity ? crud.selectedSlot : null}
        voiceAutofill={voice.voiceAutofill?.type === "task" ? voice.voiceAutofill : null}
        voiceMode={!!voice.voiceSelectedActivity}
        onSaveDraft={voice.handleSaveDraft}
        hasMoreUndrafted={hasMoreUndrafted}
      />

      <AddReminderModal
        open={reminders.reminderFormOpen}
        onClose={handleReminderModalClose}
        onSave={reminders.handleReminderSave}
        editingReminder={reminders.editingReminder}
        selectedSlot={!reminders.editingReminder ? crud.selectedSlot : null}
        voiceAutofill={voice.voiceAutofill?.type === "reminder" ? voice.voiceAutofill : null}
        voiceMode={!!voice.voiceSelectedActivity}
      />

      <VoiceRecorderModal
        open={voice.voiceOpen}
        onClose={handleVoiceClose}
        onResult={voice.handleVoiceResult}
        referenceDate={currentDate}
      />

      <VoiceReviewPopup
        open={voice.voiceReviewOpen}
        onClose={handleVoiceReviewClose}
        activities={voice.voiceReviewActivities || []}
        onSelect={voice.handleVoiceReviewSelect}
        savedIds={voice.voiceSavedIds}
        drafts={voice.voiceDrafts}
        onCreateAll={voice.handleVoiceCreateAll}
      />

      {ctx.ctxMenu && (
        <ActivityContextMenu
          x={ctx.ctxMenu.x}
          y={ctx.ctxMenu.y}
          activity={ctx.ctxMenu.activity}
          menuRef={ctx.menuRef}
          containerRef={calendarRef}
          onEdit={ctx.handleCtxEdit}
          onDelete={handleCtxDelete}
          onAddActivity={ctx.handleCtxAddActivity}
          onAddTask={ctx.handleCtxAddTask}
          onAddReminder={ctx.handleCtxAddReminder}
          onVoice={() => { ctx.setCtxMenu(null); voice.handleVoice() }}
        />
      )}

      <ActivityDetailModal
        activity={crud.viewingActivity}
        open={!!crud.viewingActivity}
        onClose={handleViewingActivityClose}
        onStatusChange={crud.handleStatusChange}
        onProgressChange={crud.handleProgressChange}
        onEdit={handleDetailEdit}
        onDelete={handleDetailDelete}
      />

      <ReminderDetailModal
        reminder={reminders.viewingReminder}
        open={!!reminders.viewingReminder}
        onClose={handleViewingReminderClose}
        onEdit={reminders.handleReminderEdit}
        onDelete={reminders.handleReminderDelete}
      />
    </motion.div>
  )
})

export default SchedulingCalendar
