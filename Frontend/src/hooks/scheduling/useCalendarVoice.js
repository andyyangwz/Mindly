import { useState, useCallback } from "react"
import { reminderService } from "../../services/reminderService"
import { notifyTasksUpdated } from "../../utils/events"
import { colorToHex, toDateStr } from "../../features/scheduling/utils/calendarConstants"

export function useCalendarVoice({
  currentDate,
  toast,
  createActivity,
  onActivityUpdated,
  setLocalActivities,
  setUseRealData,
  setActivityFormOpen,
  setTaskFormOpen,
  setReminderFormOpen,
  setSelectedSlot,
  setEditingActivity,
  setEditingReminder,
}) {
  const [voiceOpen, setVoiceOpen] = useState(false)
  const [voiceAutofill, setVoiceAutofill] = useState(null)
  const [voiceReviewActivities, setVoiceReviewActivities] = useState(null)
  const [voiceReviewOpen, setVoiceReviewOpen] = useState(false)
  const [voiceSelectedActivity, setVoiceSelectedActivity] = useState(null)
  const [voiceSavedIds, setVoiceSavedIds] = useState(null)
  const [voiceDrafts, setVoiceDrafts] = useState(null)

  const handleVoice = useCallback(() => {
    setVoiceAutofill(null)
    setVoiceOpen(true)
  }, [])

  const handleVoiceResult = useCallback(
    (parsed) => {
      const activities = parsed.activities
      if (!Array.isArray(activities)) {
        return
      }

      const filled = activities.map((item) => ({
        ...item,
        start_date: item.start_date || toDateStr(currentDate),
        end_date: item.end_date || item.start_date || toDateStr(currentDate),
      }))

      if (filled.length === 0) {
        toast.show("No activities detected. Try speaking more clearly.")
        return
      }

      if (filled.length === 1) {
        const single = filled[0]
        setVoiceAutofill(single)
        requestAnimationFrame(() => {
          setSelectedSlot(null)
          setEditingActivity(null)
          setEditingReminder(null)
          if (single.type === "task") {
            setTaskFormOpen(true)
          } else if (single.type === "reminder") {
            setReminderFormOpen(true)
          } else {
            setActivityFormOpen(true)
          }
        })
        return
      }

      const withIds = filled.map((item, i) => ({
        ...item,
        _voiceId: `voice-${Date.now()}-${i}`,
      }))
      setVoiceReviewActivities(withIds)
      setVoiceSavedIds(new Set())
      setVoiceDrafts(new Map())
      requestAnimationFrame(() => {
        setVoiceReviewOpen(true)
      })
    },
    [currentDate, toast, setSelectedSlot, setEditingActivity, setEditingReminder, setTaskFormOpen, setReminderFormOpen, setActivityFormOpen]
  )

  const handleVoiceReviewSelect = useCallback(
    (activity) => {
      setVoiceSelectedActivity(activity)
      const draft = voiceDrafts?.get(activity._voiceId)
      setVoiceAutofill(draft || activity)
      requestAnimationFrame(() => {
        setSelectedSlot(null)
        setEditingActivity(null)
        setEditingReminder(null)
        if (activity.type === "reminder") {
          setReminderFormOpen(true)
        } else {
          setActivityFormOpen(true)
        }
      })
    },
    [voiceDrafts, setSelectedSlot, setEditingActivity, setEditingReminder, setReminderFormOpen, setActivityFormOpen]
  )

  const handleVoiceReviewSaveAll = useCallback(() => {
    onActivityUpdated?.()
    notifyTasksUpdated()
    setVoiceReviewActivities(null)
    setVoiceReviewOpen(false)
    setVoiceSelectedActivity(null)
    setVoiceSavedIds(null)
    setVoiceDrafts(null)
  }, [onActivityUpdated])

  const handleVoiceReviewDeleteAll = useCallback(() => {
    setVoiceReviewActivities(null)
    setVoiceReviewOpen(false)
    setVoiceSelectedActivity(null)
    setVoiceSavedIds(null)
    setVoiceDrafts(null)
  }, [])

  const handleSaveDraft = useCallback(
    (draftData) => {
      const voiceId = draftData._voiceId
      setVoiceDrafts((prev) => {
        const next = new Map(prev)
        next.set(voiceId, draftData)
        return next
      })
      setVoiceSelectedActivity(null)
      setVoiceAutofill(null)

      const nextUndrafted = voiceReviewActivities?.find(
        (a) =>
          a._voiceId !== voiceId &&
          !voiceSavedIds?.has(a._voiceId) &&
          !(voiceDrafts && voiceDrafts.has(a._voiceId))
      )
      if (nextUndrafted) {
        const draft = voiceDrafts?.get(nextUndrafted._voiceId)
        setVoiceSelectedActivity(nextUndrafted)
        setVoiceAutofill(draft || nextUndrafted)
      } else {
        setActivityFormOpen(false)
        setTaskFormOpen(false)
        setReminderFormOpen(false)
      }
    },
    [voiceReviewActivities, voiceSavedIds, voiceDrafts, setActivityFormOpen, setTaskFormOpen, setReminderFormOpen]
  )

  const markVoiceItemSaved = useCallback(
    (formData) => {
      if (!voiceSelectedActivity) return
      const voiceId = voiceSelectedActivity._voiceId
      setVoiceReviewActivities((prev) => {
        if (!prev) return prev
        return prev.map((a) => {
          if (a._voiceId !== voiceId) return a
          return {
            ...a,
            title: formData.title || a.title,
            description: formData.description ?? a.description,
            start_date: formData.startDatetime?.slice(0, 10) || a.start_date,
            end_date: formData.endDatetime?.slice(0, 10) || a.end_date,
            start_time: formData.startDatetime?.slice(11, 16) || a.start_time,
            end_time: formData.endDatetime?.slice(11, 16) || a.end_time,
            color: formData.color || a.color,
            priority: formData.priority || a.priority,
            productivity_level: formData.productivityLevel || a.productivity_level,
          }
        })
      })
      setVoiceSavedIds((prev) => {
        const next = new Set(prev)
        next.add(voiceId)
        return next
      })
      setVoiceSelectedActivity(null)
      setVoiceAutofill(null)
    },
    [voiceSelectedActivity]
  )

  const handleVoiceCreateAll = useCallback(async () => {
    if (!voiceReviewActivities) return
    const toCreatePayload = (data) => {
      const color = colorToHex(data.color)
      const startDate = data.start_date || data.startDate || ""
      const endDate = data.end_date || data.endDate || startDate
      const startTime = data.start_time || data.startTime || ""
      const endTime = data.end_time || data.endTime || ""
      return {
        title: (data.title || "").trim(),
        description: (data.description || "").trim(),
        color,
        priority: data.priority || "medium",
        productivityLevel: data.productivity_level || "neutral",
        status: "To Do",
        hasDeadline: data.type === "task",
        startDatetime: startDate && startTime ? `${startDate}T${startTime}` : undefined,
        endDatetime: endDate && endTime ? `${endDate}T${endTime}` : undefined,
      }
    }

    for (const activity of voiceReviewActivities) {
      if (voiceSavedIds?.has(activity._voiceId)) continue
      const draft = voiceDrafts?.get(activity._voiceId)
      const data = draft || activity
      try {
        if (data.type === "reminder") {
          const dt =
            data.datetime ||
            (data.start_date && data.start_time
              ? `${data.start_date}T${data.start_time}`
              : data.start_date
                ? `${data.start_date}T09:00`
                : undefined)
          const payload = {
            title: (data.title || "").trim(),
            description: (data.description || "").trim(),
            datetime: dt,
            color: colorToHex(data.color),
            priority: data.priority || "medium",
          }
          await reminderService.create(payload)
        } else {
          const payload = toCreatePayload(data)
          const created = await createActivity(payload)
          setLocalActivities((prev) => [...prev, created])
        }
        setVoiceSavedIds((prev) => new Set(prev).add(activity._voiceId))
      } catch (err) {
        console.error("[Voice] Create All failed for:", activity.title, err)
      }
    }

    setVoiceReviewOpen(false)
    setVoiceReviewActivities(null)
    setVoiceSavedIds(null)
    setVoiceDrafts(null)
    setVoiceSelectedActivity(null)
    setVoiceAutofill(null)
    setUseRealData(true)
    onActivityUpdated?.()
    notifyTasksUpdated()
  }, [
    voiceReviewActivities,
    voiceSavedIds,
    voiceDrafts,
    createActivity,
    onActivityUpdated,
    setLocalActivities,
    setUseRealData,
  ])

  return {
    voiceOpen,
    setVoiceOpen,
    voiceAutofill,
    setVoiceAutofill,
    voiceReviewActivities,
    setVoiceReviewActivities,
    voiceReviewOpen,
    setVoiceReviewOpen,
    voiceSelectedActivity,
    setVoiceSelectedActivity,
    voiceSavedIds,
    setVoiceSavedIds,
    voiceDrafts,
    setVoiceDrafts,
    handleVoice,
    handleVoiceResult,
    handleVoiceReviewSelect,
    handleVoiceReviewSaveAll,
    handleVoiceReviewDeleteAll,
    handleSaveDraft,
    handleVoiceCreateAll,
    markVoiceItemSaved,
  }
}
