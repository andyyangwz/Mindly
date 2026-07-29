import { useState, useEffect, useRef, useCallback } from "react"
import { journalService } from "../../services/journalService"
import { refreshPinnedJournals } from "./usePinnedJournals"
import { getUniqueTitle } from "../../utils/editor"

export default function useJournalAutosave({
  journal, title, content, emojis, folderIds,
  updateJournal, journals, journalId,
  onTitleChange,
}) {
  const [saveState, setSaveState] = useState("idle")
  const dirtyRef = useRef(false)
  const saveTimerRef = useRef(null)
  const originalRef = useRef(null)

  const journalRef = useRef(journal)
  const journalsRef = useRef(journals)
  const updateRef = useRef(updateJournal)
  useEffect(() => {
    journalRef.current = journal
    journalsRef.current = journals
    updateRef.current = updateJournal
  }, [journal, journals, updateJournal])

  useEffect(() => {
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [])

  const prevId = useRef(journalId)
  useEffect(() => {
    if (prevId.current !== journalId) {
      prevId.current = journalId
      setSaveState("idle")
      dirtyRef.current = false
      originalRef.current = null
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    }
  }, [journalId])

  const saveNow = useCallback(async () => {
    if (!dirtyRef.current) return
    const j = journalRef.current
    if (!j) return
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    setSaveState("saving")
    try {
      const orig = originalRef.current
      const curTitle = title
      const curContent = content
      const curEmojis = emojis
      const curFolderIds = folderIds
      const changes = {}
      let titleToSave = curTitle
      if (orig && curTitle !== orig.title) {
        titleToSave = getUniqueTitle(curTitle || "Untitled", journals, journalId)
        changes.title = titleToSave
        if (titleToSave !== curTitle && onTitleChange) onTitleChange(titleToSave)
      }
      if (orig && curContent !== orig.content) changes.content = curContent
      if (orig && JSON.stringify(curEmojis) !== JSON.stringify(orig.emojis)) {
        changes.emojis = curEmojis.filter(Boolean).length > 0 ? curEmojis : ["📝", "", ""]
      }
      if (orig && JSON.stringify(curFolderIds) !== JSON.stringify(orig.folderIds)) {
        changes.folderIds = curFolderIds
      }
      if (Object.keys(changes).length === 0) {
        setSaveState("saved")
        return
      }
      const updater = updateRef.current
      if (updater) {
        await updater(j.id, changes)
      } else {
        await journalService.update(j.id, changes)
      }
      originalRef.current = { ...orig, ...changes }
      dirtyRef.current = false
      setSaveState("saved")
      refreshPinnedJournals()
    } catch {
      setSaveState("failed")
    }
  }, [title, content, emojis, folderIds, journals, journalId, onTitleChange])

  const scheduleAutosave = useCallback(() => {
    if (!dirtyRef.current) {
      dirtyRef.current = true
      setSaveState("editing")
    }
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current)
    saveTimerRef.current = setTimeout(() => saveNow(), 2000)
  }, [saveNow])

  useEffect(() => {
    if (dirtyRef.current) return
    if (!journal) return
    if (!originalRef.current) return
    const isDirty =
      title !== originalRef.current.title ||
      content !== originalRef.current.content ||
      JSON.stringify(emojis) !== JSON.stringify(originalRef.current.emojis) ||
      JSON.stringify(folderIds) !== JSON.stringify(originalRef.current.folderIds)
    if (isDirty) scheduleAutosave()
  }, [title, content, emojis, folderIds, journal, scheduleAutosave])

  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault()
        if (dirtyRef.current) saveNow()
      }
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [saveNow])

  const setOriginal = useCallback((vals) => {
    originalRef.current = vals
  }, [])

  return { saveState, saveNow, dirtyRef, originalRef, scheduleAutosave, setOriginal }
}
