import { useState, useCallback } from "react"
import { reminderService } from "../../services/reminderService"
import { notifyTasksUpdated } from "../../utils/events"

export function useCalendarReminderCrud({ onActivityUpdated, setSelectedSlot }) {
  const [reminderFormOpen, setReminderFormOpen] = useState(false)
  const [editingReminder, setEditingReminder] = useState(null)
  const [viewingReminder, setViewingReminder] = useState(null)

  const handleReminderSave = useCallback(
    async (data) => {
      if (editingReminder) {
        await reminderService.update(editingReminder.id, data)
      } else {
        await reminderService.create(data)
      }
      onActivityUpdated?.()
      notifyTasksUpdated()
      setReminderFormOpen(false)
      setEditingReminder(null)
      setSelectedSlot?.(null)
    },
    [editingReminder, onActivityUpdated, setSelectedSlot]
  )

  const handleReminderDelete = useCallback(
    async (id) => {
      try {
        await reminderService.delete(id)
        setViewingReminder(null)
        onActivityUpdated?.()
        notifyTasksUpdated()
      } catch {
        /* ignore */
      }
    },
    [onActivityUpdated]
  )

  const handleReminderEdit = useCallback((reminder) => {
    setEditingReminder(reminder)
    setReminderFormOpen(true)
  }, [])

  return {
    reminderFormOpen,
    setReminderFormOpen,
    editingReminder,
    setEditingReminder,
    viewingReminder,
    setViewingReminder,
    handleReminderSave,
    handleReminderDelete,
    handleReminderEdit,
  }
}
