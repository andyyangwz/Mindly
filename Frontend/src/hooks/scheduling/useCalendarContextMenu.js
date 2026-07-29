import { useState, useCallback, useRef, useEffect } from "react"

export function useCalendarContextMenu({
  isTutorialDemoMode,
  isStep4,
  setEditingActivity,
  setSelectedSlot,
  setActivityFormOpen,
  setTaskFormOpen,
  setEditingReminder,
  setReminderFormOpen,
}) {
  const [ctxMenu, setCtxMenu] = useState(null)
  const menuRef = useRef(null)

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

  const handleContextMenu = useCallback(
    (activity, pos) => {
      if (isTutorialDemoMode) {
        if (isStep4) return
        if (activity.id === "tutorial-demo") {
          setCtxMenu({ activity, x: pos.x, y: pos.y })
        }
        return
      }
      setCtxMenu({ activity, x: pos.x, y: pos.y })
    },
    [isTutorialDemoMode, isStep4]
  )

  const handleCtxEdit = useCallback(
    (activity) => {
      if (isTutorialDemoMode) {
        setCtxMenu(null)
        return
      }
      setEditingActivity(activity)
      setSelectedSlot(null)
      if (activity.hasDeadline) {
        setTaskFormOpen(true)
      } else {
        setActivityFormOpen(true)
      }
      setCtxMenu(null)
    },
    [isTutorialDemoMode, setEditingActivity, setSelectedSlot, setTaskFormOpen, setActivityFormOpen]
  )

  const handleCtxAddActivity = useCallback(() => {
    if (!ctxMenu) return
    setSelectedSlot({
      date: ctxMenu.date,
      startTime: ctxMenu.startTime,
      endTime: ctxMenu.endTime,
    })
    setEditingActivity(null)
    setActivityFormOpen(true)
    setCtxMenu(null)
  }, [ctxMenu, setSelectedSlot, setEditingActivity, setActivityFormOpen])

  const handleCtxAddTask = useCallback(() => {
    if (!ctxMenu) return
    setSelectedSlot({
      date: ctxMenu.date,
      startTime: ctxMenu.startTime,
      endTime: ctxMenu.endTime,
    })
    setEditingActivity(null)
    setTaskFormOpen(true)
    setCtxMenu(null)
  }, [ctxMenu, setSelectedSlot, setEditingActivity, setTaskFormOpen])

  const handleCtxAddReminder = useCallback(() => {
    if (!ctxMenu) return
    setSelectedSlot({ date: ctxMenu.date })
    setEditingReminder(null)
    setReminderFormOpen(true)
    setCtxMenu(null)
  }, [ctxMenu, setSelectedSlot, setEditingReminder, setReminderFormOpen])

  return {
    ctxMenu,
    setCtxMenu,
    menuRef,
    handleContextMenu,
    handleCtxEdit,
    handleCtxAddActivity,
    handleCtxAddTask,
    handleCtxAddReminder,
  }
}
