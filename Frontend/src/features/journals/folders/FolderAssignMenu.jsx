import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Portal } from "../../../utils/portal"
import "../../../styles/journals/index.css"

function FolderAssignContent({ folders, journalFolderIds, onSave, onClose, adjustedPos }) {
  const [selection, setSelection] = useState(() =>
    (journalFolderIds || []).reduce((acc, id) => { acc[id] = true; return acc }, {})
  )
  const [saving, setSaving] = useState(false)
  const menuRef = useRef(null)
  const initialFocusRef = useRef(null)

  const handleGlobalClick = useCallback(
    (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose()
      }
    },
    [onClose]
  )

  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === "Escape") {
        e.stopPropagation()
        onClose()
      }
    },
    [onClose]
  )

  useEffect(() => {
    document.addEventListener("mousedown", handleGlobalClick, true)
    document.addEventListener("keydown", handleKeyDown, true)
    initialFocusRef.current?.focus()
    return () => {
      document.removeEventListener("mousedown", handleGlobalClick, true)
      document.removeEventListener("keydown", handleKeyDown, true)
    }
  }, [handleGlobalClick, handleKeyDown])

  const toggle = useCallback((folderId) => {
    setSelection((prev) => ({
      ...prev,
      [folderId]: !prev[folderId],
    }))
  }, [])

  const selectedCount = useMemo(
    () => Object.values(selection).filter(Boolean).length,
    [selection]
  )

  const handleSave = useCallback(async () => {
    setSaving(true)
    try {
      const selected = Object.entries(selection)
        .filter(([, v]) => v)
        .map(([k]) => k)
      await onSave(selected)
      onClose()
    } catch {
      /* ignore */
    } finally {
      setSaving(false)
    }
  }, [selection, onSave, onClose])

  return (
    <>
      <div className="folder-assign-backdrop" />
      <motion.div
        ref={menuRef}
        data-tutorial-target="journal-folder-assign"
        initial={{ opacity: 0, scale: 0.93, y: -4 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.93, y: -4 }}
        transition={{ duration: 0.12, ease: "easeOut" }}
        className="folder-assign-menu"
        style={{ left: adjustedPos.left, top: adjustedPos.top }}
      >
        <div className="folder-assign-header">
          Assign to Folder
        </div>

        <div className="folder-assign-list">
          {folders.length === 0 ? (
            <div className="folder-assign-empty">
              No folders yet. Create one in Folder Explorer.
            </div>
          ) : (
            folders.map((f) => {
              const checked = !!selection[f.id]
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => toggle(f.id)}
                  className={`folder-assign-item${checked ? " checked" : ""}`}
                >
                  <span className={`folder-assign-checkbox${checked ? " checked" : ""}`}>
                    {checked ? "✓" : ""}
                  </span>
                  <span className="folder-assign-emoji">{f.emoji}</span>
                  <span className="folder-assign-name">
                    {f.name}
                  </span>
                </button>
              )
            })
          )}
        </div>

        <div className="folder-assign-footer">
          <span className="folder-assign-count">
            {selectedCount} selected
          </span>
          <div className="folder-assign-actions">
            <button
              type="button"
              onClick={onClose}
              className="folder-assign-cancel"
            >
              Cancel
            </button>
            <button
              ref={initialFocusRef}
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="folder-assign-save"
              style={{ opacity: saving ? 0.7 : 1, cursor: saving ? "not-allowed" : "pointer" }}
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>
      </motion.div>
    </>
  )
}

export default function FolderAssignMenu({
  open,
  x,
  y,
  folders,
  journalFolderIds,
  onSave,
  onClose,
}) {
  const adjustedPos = useMemo(() => {
    const panelWidth = 220
    const panelHeight = Math.min(folders.length * 42 + 90, 400)
    const padding = 12
    let left = x
    let top = y
    if (left + panelWidth + padding > window.innerWidth) {
      left = window.innerWidth - panelWidth - padding
    }
    if (top + panelHeight + padding > window.innerHeight) {
      top = window.innerHeight - panelHeight - padding
    }
    if (left < padding) left = padding
    if (top < padding) top = padding
    return { left, top }
  }, [x, y, folders.length])

  return (
    <AnimatePresence>
      {open && (
        <Portal>
          <FolderAssignContent
            key={open ? "open" : "closed"}
            folders={folders}
            journalFolderIds={journalFolderIds}
            onSave={onSave}
            onClose={onClose}
            adjustedPos={adjustedPos}
          />
        </Portal>
      )}
    </AnimatePresence>
  )
}
