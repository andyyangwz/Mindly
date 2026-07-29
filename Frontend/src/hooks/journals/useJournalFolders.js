import { useState, useEffect, useRef, useCallback } from "react"

export default function useJournalFolders({ journal, onAssignFolders }) {
  const [folderIds, setFolderIds] = useState([])
  const [showFolderFab, setShowFolderFab] = useState(false)
  const [folderAssigning, setFolderAssigning] = useState(false)
  const folderFabRef = useRef(null)
  const prevJournalRef = useRef(journal)

  useEffect(() => {
    if (prevJournalRef.current !== journal) {
      prevJournalRef.current = journal
      setFolderIds(journal?.folderIds || [])
    }
  }, [journal])

  useEffect(() => {
    if (!showFolderFab) return
    const handleClick = (e) => {
      if (folderFabRef.current && !folderFabRef.current.contains(e.target) && !e.target.closest("[data-folder-fab-btn]")) {
        setShowFolderFab(false)
      }
    }
    const handleKey = (e) => { if (e.key === "Escape") setShowFolderFab(false) }
    document.addEventListener("mousedown", handleClick)
    document.addEventListener("keydown", handleKey)
    return () => {
      document.removeEventListener("mousedown", handleClick)
      document.removeEventListener("keydown", handleKey)
    }
  }, [showFolderFab])

  const handleToggleFolder = useCallback(async (folderId) => {
    setFolderAssigning(true)
    const next = folderIds.includes(folderId)
      ? folderIds.filter((id) => id !== folderId)
      : [...folderIds, folderId]
    setFolderIds(next)
    try {
      if (onAssignFolders && journal) await onAssignFolders(journal.id, next)
    } catch {
      /* ignore */
    } finally {
      setFolderAssigning(false)
    }
  }, [folderIds, journal, onAssignFolders])

  return { folderIds, setFolderIds, showFolderFab, setShowFolderFab, folderAssigning, folderFabRef, handleToggleFolder }
}
