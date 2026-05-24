import { useRef, useCallback } from "react"

const MAX_HISTORY = 50

export function useCalendarHistory() {
  const undoStack = useRef([])
  const redoStack = useRef([])

  const record = useCallback((entry) => {
    undoStack.current = [...undoStack.current, entry].slice(-MAX_HISTORY)
    redoStack.current = []
  }, [])

  const undo = useCallback(() => {
    if (undoStack.current.length === 0) return null
    const entry = undoStack.current[undoStack.current.length - 1]
    undoStack.current = undoStack.current.slice(0, -1)
    redoStack.current = [...redoStack.current, entry]
    return entry
  }, [])

  const redo = useCallback(() => {
    if (redoStack.current.length === 0) return null
    const entry = redoStack.current[redoStack.current.length - 1]
    redoStack.current = redoStack.current.slice(0, -1)
    undoStack.current = [...undoStack.current, entry]
    return entry
  }, [])

  const canUndo = () => undoStack.current.length > 0
  const canRedo = () => redoStack.current.length > 0
  const undoSize = () => undoStack.current.length
  const redoSize = () => redoStack.current.length

  return { record, undo, redo, canUndo, canRedo, undoSize, redoSize }
}
