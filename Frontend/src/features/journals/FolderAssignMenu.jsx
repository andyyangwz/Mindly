import { useState, useEffect, useRef, useCallback, useMemo } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { Portal } from "../../utils/portal"
import { theme } from "../../theme"

export default function FolderAssignMenu({
  open,
  x,
  y,
  folders,
  journalFolderIds,
  onSave,
  onClose,
}) {
  const [selection, setSelection] = useState({})
  const [saving, setSaving] = useState(false)
  const menuRef = useRef(null)
  const initialFocusRef = useRef(null)

  useEffect(() => {
    if (open) {
      setSelection(
        (journalFolderIds || []).reduce((acc, id) => {
          acc[id] = true
          return acc
        }, {})
      )
    }
  }, [open, journalFolderIds])

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
    if (!open) return
    document.addEventListener("mousedown", handleGlobalClick, true)
    document.addEventListener("keydown", handleKeyDown, true)
    initialFocusRef.current?.focus()
    return () => {
      document.removeEventListener("mousedown", handleGlobalClick, true)
      document.removeEventListener("keydown", handleKeyDown, true)
    }
  }, [open, handleGlobalClick, handleKeyDown])

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
    } finally {
      setSaving(false)
    }
  }, [selection, onSave, onClose])

  return (
    <AnimatePresence>
      {open && (
        <Portal>
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: theme.z.contextMenu - 1,
            }}
          />
          <motion.div
            ref={menuRef}
            initial={{ opacity: 0, scale: 0.93, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.93, y: -4 }}
            transition={{ duration: 0.12, ease: "easeOut" }}
            style={{
              position: "fixed",
              left: adjustedPos.left,
              top: adjustedPos.top,
              zIndex: theme.z.contextMenu,
              background: "var(--color-card, white)",
              borderRadius: 14,
              border: `1px solid ${theme.border}`,
              boxShadow: "0 12px 44px rgba(0,0,0,0.16), 0 2px 8px rgba(0,0,0,0.06)",
              minWidth: 200,
              maxWidth: 240,
              maxHeight: 380,
              display: "flex",
              flexDirection: "column",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                padding: "12px 14px 6px",
                fontSize: 11,
                fontWeight: 600,
                color: theme.muted,
                textTransform: "uppercase",
                letterSpacing: "0.06em",
              }}
            >
              Assign to Folder
            </div>

            <div
              style={{
                flex: 1,
                overflowY: "auto",
                padding: "4px 6px",
              }}
            >
              {folders.length === 0 ? (
                <div
                  style={{
                    padding: "16px 10px",
                    textAlign: "center",
                    fontSize: 12,
                    color: theme.muted,
                  }}
                >
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
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        width: "100%",
                        padding: "7px 10px",
                        borderRadius: 8,
                        border: "none",
                        background: checked
                          ? `color-mix(in srgb, ${theme.primary} 8%, transparent)`
                          : "transparent",
                        color: checked ? theme.primaryText : theme.dark,
                        fontSize: 13,
                        fontWeight: checked ? 600 : 400,
                        cursor: "pointer",
                        textAlign: "left",
                        transition: "background 0.08s",
                      }}
                      onMouseEnter={(e) => {
                        if (!checked) {
                          e.currentTarget.style.background = theme.bg
                        }
                      }}
                      onMouseLeave={(e) => {
                        if (!checked) {
                          e.currentTarget.style.background = "transparent"
                        }
                      }}
                    >
                      <span
                        style={{
                          width: 17,
                          height: 17,
                          borderRadius: 4,
                          border: `1.5px solid ${
                            checked ? theme.primary : theme.border
                          }`,
                          background: checked ? theme.primary : "transparent",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          flexShrink: 0,
                          transition: "all 0.12s",
                          fontSize: 10,
                          color: "white",
                          fontWeight: 700,
                        }}
                      >
                        {checked ? "✓" : ""}
                      </span>
                      <span style={{ fontSize: 14 }}>{f.emoji}</span>
                      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {f.name}
                      </span>
                    </button>
                  )
                })
              )}
            </div>

            <div
              style={{
                padding: "8px 10px",
                borderTop: `1px solid ${theme.border}`,
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 8,
              }}
            >
              <span style={{ fontSize: 11, color: theme.muted }}>
                {selectedCount} selected
              </span>
              <div style={{ display: "flex", gap: 6 }}>
                <button
                  type="button"
                  onClick={onClose}
                  style={{
                    padding: "6px 12px",
                    borderRadius: 8,
                    border: `1px solid ${theme.border}`,
                    background: "transparent",
                    color: theme.dark,
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  ref={initialFocusRef}
                  type="button"
                  onClick={handleSave}
                  disabled={saving}
                  style={{
                    padding: "6px 14px",
                    borderRadius: 8,
                    border: "none",
                    background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                    color: "white",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: saving ? "not-allowed" : "pointer",
                    opacity: saving ? 0.7 : 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 5,
                  }}
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>
          </motion.div>
        </Portal>
      )}
    </AnimatePresence>
  )
}
