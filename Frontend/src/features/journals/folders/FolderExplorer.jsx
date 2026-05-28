import { useState, useMemo, useCallback, useRef, useEffect } from "react"
import { X, Search, Plus, Folder, Pencil, Trash2, Check, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Portal } from "../../../utils/portal"
import { theme } from "../../../theme"

const EMOJI_PICKER = [
  "📁", "📂", "🗂️", "📖", "📝", "✍️", "💭", "🧠",
  "💡", "🎯", "⭐", "❤️", "🌈", "🌱", "🔥", "💪",
  "🎨", "🎵", "✈️", "🏠", "🌍", "📸", "🎬", "📚",
]

function FolderCard({
  folder,
  isActive,
  editingId,
  editName,
  setEditName,
  editEmoji,
  setEditEmoji,
  onStartRename,
  onConfirmRename,
  onCancelRename,
  onDelete,
  onSelect,
  onDragOver,
  onDragLeave,
  onDrop,
  isDragTarget,
}) {
  const [showEmojiPicker, setShowEmojiPicker] = useState(false)
  const emojiBtnRef = useRef(null)
  const emojiPickerRef = useRef(null)

  useEffect(() => {
    if (!showEmojiPicker) return
    const handleClick = (e) => {
      if (
        emojiPickerRef.current && !emojiPickerRef.current.contains(e.target) &&
        emojiBtnRef.current && !emojiBtnRef.current.contains(e.target)
      ) {
        setShowEmojiPicker(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [showEmojiPicker])
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ duration: 0.25, ease: "easeOut" }}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => !editingId && onSelect(folder.id)}
      style={{
        background: isDragTarget
          ? `color-mix(in srgb, ${theme.primary} 12%, transparent)`
          : isActive
            ? `color-mix(in srgb, ${theme.primary} 8%, transparent)`
            : "var(--color-card, white)",
        borderRadius: 16,
        border: `1.5px solid ${
          isDragTarget
            ? theme.primary
            : isActive
              ? theme.primary
              : theme.border
        }`,
        padding: 24,
        cursor: "pointer",
        transition: "all 0.2s, background 0.1s",
        position: "relative",
        overflow: "hidden",
        boxShadow: isDragTarget
          ? `0 0 0 2px ${theme.primary}, 0 8px 24px color-mix(in srgb, ${theme.primary} 20%, transparent)`
          : isActive
            ? `0 0 0 1px color-mix(in srgb, ${theme.primary} 30%, transparent), 0 4px 16px color-mix(in srgb, ${theme.primary} 12%, transparent)`
            : "0 1px 4px rgba(0,0,0,0.04)",
      }}
      onMouseEnter={(e) => {
        if (!isActive && !isDragTarget) {
          e.currentTarget.style.borderColor = theme.primary
          e.currentTarget.style.boxShadow = "0 4px 16px rgba(0,0,0,0.06)"
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive && !isDragTarget) {
          e.currentTarget.style.borderColor = theme.border
          e.currentTarget.style.boxShadow = "0 1px 4px rgba(0,0,0,0.04)"
        }
      }}
    >
      {isDragTarget && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            borderRadius: 14,
            background: `repeating-linear-gradient(45deg, transparent, transparent 8px, color-mix(in srgb, ${theme.primary} 6%, transparent) 8px, color-mix(in srgb, ${theme.primary} 6%, transparent) 16px)`,
            pointerEvents: "none",
          }}
        />
      )}

      {editingId === folder.id ? (
        <div style={{ position: "relative" }}>
          <button
            ref={emojiBtnRef}
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            style={{
              fontSize: 36, lineHeight: 1, marginBottom: 12, display: "block",
              background: "none", border: showEmojiPicker ? `2px solid ${theme.primary}` : "2px solid transparent",
              borderRadius: 12, cursor: "pointer", padding: "2px 6px",
              transition: "border-color 0.15s",
            }}
          >
            {editEmoji || "📁"}
          </button>
          {showEmojiPicker && (
            <div
              ref={emojiPickerRef}
              style={{
                position: "absolute", top: "100%", left: 0, zIndex: 10,
                background: "var(--color-card, white)",
                borderRadius: 12, border: `1px solid ${theme.border}`,
                boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
                padding: 10, display: "grid",
                gridTemplateColumns: "repeat(6, 1fr)", gap: 4, width: 220,
              }}
            >
              {EMOJI_PICKER.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => { setEditEmoji(e); setShowEmojiPicker(false) }}
                  style={{
                    fontSize: 20, padding: 4, borderRadius: 6,
                    border: editEmoji === e ? `2px solid ${theme.primary}` : "1px solid transparent",
                    background: editEmoji === e ? `color-mix(in srgb, ${theme.primary} 10%, transparent)` : "transparent",
                    cursor: "pointer", lineHeight: 1,
                  }}
                >
                  {e}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={{ fontSize: 36, marginBottom: 12, lineHeight: 1 }}>
          {folder.emoji}
        </div>
      )}

      {editingId === folder.id ? (
        <form
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            onConfirmRename(folder.id)
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <input
            value={editName}
            onChange={(e) => setEditName(e.target.value)}
            autoFocus
            onBlur={() => onCancelRename()}
            onKeyDown={(e) => {
              if (e.key === "Escape") onCancelRename()
            }}
            style={{
              width: "100%",
              padding: "6px 8px",
              borderRadius: 8,
              border: `1.5px solid ${theme.primary}`,
              fontSize: 14,
              fontWeight: 600,
              color: theme.dark,
              background: "var(--color-input)",
              outline: "none",
              boxSizing: "border-box",
              marginBottom: 4,
            }}
          />
        </form>
      ) : (
        <p
          style={{
            fontSize: 14,
            fontWeight: 600,
            color: theme.dark,
            marginBottom: 6,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {folder.name}
        </p>
      )}

      <p style={{ fontSize: 12, color: theme.muted, margin: 0 }}>
        {folder.journalCount} {folder.journalCount === 1 ? "journal" : "journals"}
      </p>

      <div
        style={{
          display: "flex",
          gap: 4,
          marginTop: 14,
          opacity: 0,
          transition: "opacity 0.15s",
        }}
        className="folder-actions"
        onClick={(e) => e.stopPropagation()}
        onMouseEnter={() => {}}
      >
        {editingId === folder.id ? (
          <button
            type="button"
            onMouseDown={(e) => {
              e.stopPropagation()
              onConfirmRename(folder.id)
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              padding: "5px 10px",
              borderRadius: 8,
              border: "none",
              background: theme.primary,
              color: "white",
              fontSize: 11,
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <Check size={12} /> Save
          </button>
        ) : (
          <>
            <button
              type="button"
              onMouseDown={(e) => {
                e.stopPropagation()
                e.preventDefault()
                onStartRename(folder.id, folder.name, folder.emoji)
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 28,
                height: 28,
                borderRadius: 8,
                border: `1px solid ${theme.border}`,
                background: "var(--color-card, white)",
                cursor: "pointer",
                color: theme.muted,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = theme.bg
                e.currentTarget.style.color = theme.primaryText
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "var(--color-card, white)"
                e.currentTarget.style.color = theme.muted
              }}
            >
              <Pencil size={11} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(folder)
              }}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                width: 28,
                height: 28,
                borderRadius: 8,
                border: "1px solid rgba(239,68,68,0.25)",
                background: "rgba(239,68,68,0.06)",
                cursor: "pointer",
                color: "#EF4444",
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "rgba(239,68,68,0.15)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "rgba(239,68,68,0.06)"
              }}
            >
              <Trash2 size={11} />
            </button>
          </>
        )}
      </div>

      <style>{`
        .folder-actions {
          opacity: 0;
        }
        div:hover > .folder-actions {
          opacity: 1;
        }
      `}</style>
    </motion.div>
  )
}

function CreateFolderForm({ onSubmit, onCancel }) {
  const [name, setName] = useState("")
  const [emoji, setEmoji] = useState("")
  const [loading, setLoading] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    inputRef.current?.focus()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!name.trim()) return
    setLoading(true)
    try {
      await onSubmit({
        name: name.trim(),
        emoji: emoji.trim() || "📁",
      })
      setName("")
      setEmoji("")
      inputRef.current?.focus()
    } catch {
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      exit={{ opacity: 0, height: 0 }}
      transition={{ duration: 0.25, ease: "easeInOut" }}
      style={{ overflow: "hidden" }}
    >
      <form
        onSubmit={handleSubmit}
        style={{
          background: "var(--color-input)",
          borderRadius: 16,
          border: `1px solid ${theme.border}`,
          padding: 20,
          marginBottom: 20,
        }}
      >
        <div style={{ marginBottom: 12 }}>
          <label
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: theme.muted,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: 6,
              display: "block",
            }}
          >
            Folder Name
          </label>
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Travel, Recipes, Ideas..."
            style={{
              width: "100%",
              padding: "10px 14px",
              borderRadius: 10,
              border: `1px solid ${theme.border}`,
              fontSize: 14,
              color: theme.dark,
              background: "var(--color-card, white)",
              outline: "none",
              boxSizing: "border-box",
            }}
            onKeyDown={(e) => {
              if (e.key === "Escape") onCancel()
            }}
          />
        </div>

        <div style={{ marginBottom: 16 }}>
          <label
            style={{
              fontSize: 11,
              fontWeight: 600,
              color: theme.muted,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              marginBottom: 6,
              display: "block",
            }}
          >
            Emoji
          </label>
          <input
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            placeholder="📁"
            maxLength={2}
            style={{
              width: 60,
              padding: "8px 10px",
              borderRadius: 10,
              border: `1px solid ${theme.border}`,
              fontSize: 20,
              color: theme.dark,
              background: "var(--color-card, white)",
              outline: "none",
              textAlign: "center",
              boxSizing: "border-box",
            }}
          />
          <div
            style={{
              display: "flex",
              gap: 6,
              flexWrap: "wrap",
              marginTop: 10,
            }}
          >
            {EMOJI_PICKER.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEmoji(e)}
                style={{
                  fontSize: 20,
                  padding: "4px 6px",
                  borderRadius: 8,
                  border: emoji === e
                    ? `2px solid ${theme.primary}`
                    : `1px solid ${theme.border}`,
                  background: emoji === e
                    ? `color-mix(in srgb, ${theme.primary} 10%, transparent)`
                    : "transparent",
                  cursor: "pointer",
                  lineHeight: 1,
                  transition: "all 0.15s",
                }}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <div style={{ display: "flex", gap: 8, justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onCancel}
            style={{
              padding: "8px 16px",
              borderRadius: 10,
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
            type="submit"
            disabled={!name.trim() || loading}
            style={{
              padding: "8px 16px",
              borderRadius: 10,
              border: "none",
              background: !name.trim()
                ? theme.muted
                : `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
              color: "white",
              fontSize: 12,
              fontWeight: 600,
              cursor: !name.trim() || loading ? "not-allowed" : "pointer",
              display: "flex",
              alignItems: "center",
              gap: 6,
              opacity: !name.trim() || loading ? 0.6 : 1,
            }}
          >
            {loading ? (
              <>
                <Loader2 size={12} className="spin-loader" /> Creating...
              </>
            ) : (
              <>
                <Plus size={12} /> Create Folder
              </>
            )}
          </button>
        </div>
      </form>
    </motion.div>
  )
}

function DeleteConfirmModal({ folder, onConfirm, onCancel, loading }) {
  if (!folder) return null

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.15 }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: theme.z.modalOverlay + 1,
        background: "rgba(0,0,0,0.4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
      onClick={onCancel}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--color-card, white)",
          borderRadius: 20,
          padding: "28px 32px",
          maxWidth: 400,
          width: "100%",
          boxShadow: "0 24px 64px rgba(0,0,0,0.2)",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: 14, marginBottom: 16 }}>
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: "rgba(239,68,68,0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Trash2 size={20} color="#EF4444" />
          </div>
          <div style={{ flex: 1 }}>
            <h2
              style={{
                fontSize: 16,
                fontWeight: 600,
                color: theme.dark,
                margin: 0,
                marginBottom: 4,
              }}
            >
              Delete "{folder.emoji} {folder.name}"?
            </h2>
            <p style={{ fontSize: 13, color: theme.muted, margin: 0, lineHeight: 1.5 }}>
              This folder will be removed, but no journals will be deleted.
              Journals in this folder will become uncategorized.
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 4,
              display: "flex",
            }}
          >
            <X size={16} color={theme.muted} />
          </button>
        </div>

        <div style={{ display: "flex", gap: 10, justifyContent: "flex-end" }}>
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            style={{
              padding: "9px 20px",
              borderRadius: 10,
              border: `1px solid ${theme.border}`,
              background: "var(--color-card, white)",
              color: theme.dark,
              fontSize: 13,
              fontWeight: 500,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.5 : 1,
            }}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            style={{
              padding: "9px 20px",
              borderRadius: 10,
              border: "none",
              background: loading ? theme.muted : "#EF4444",
              color: "white",
              fontSize: 13,
              fontWeight: 500,
              cursor: loading ? "not-allowed" : "pointer",
              opacity: loading ? 0.7 : 1,
              display: "flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            {loading ? (
              <>
                <Loader2 size={12} className="spin-loader" /> Deleting...
              </>
            ) : (
              "Delete Folder"
            )}
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function FolderExplorer({
  open,
  onClose,
  folders,
  foldersLoading,
  activeFolderId,
  onSelectFolder,
  onCreateFolder,
  onUpdateFolder,
  onDeleteFolder,
}) {
  const [search, setSearch] = useState("")
  const [showCreate, setShowCreate] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editName, setEditName] = useState("")
  const [editEmoji, setEditEmoji] = useState("")
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const [dragTargetId, setDragTargetId] = useState(null)
  const dragCounter = useRef(0)
  const [ctxMenu, setCtxMenu] = useState({ open: false, x: 0, y: 0, folder: null })

  const handleCtxMenu = useCallback((e, folder) => {
    e.preventDefault()
    e.stopPropagation()
    setCtxMenu({ open: true, x: e.clientX, y: e.clientY, folder })
  }, [])

  const handleCloseCtxMenu = useCallback(() => {
    setCtxMenu((prev) => ({ ...prev, open: false }))
  }, [])

  useEffect(() => {
    if (!ctxMenu.open) return
    const handleClick = () => setCtxMenu((prev) => ({ ...prev, open: false }))
    const handleKey = (e) => {
      if (e.key === "Escape") setCtxMenu((prev) => ({ ...prev, open: false }))
    }
    document.addEventListener("mousedown", handleClick)
    document.addEventListener("keydown", handleKey)
    return () => {
      document.removeEventListener("mousedown", handleClick)
      document.removeEventListener("keydown", handleKey)
    }
  }, [ctxMenu.open])

  useEffect(() => {
    if (!open) {
      setSearch("")
      setShowCreate(false)
      setEditingId(null)
      setEditName("")
      setEditEmoji("")
      setDeleteTarget(null)
      setDragTargetId(null)
    }
  }, [open])

  const filteredFolders = useMemo(() => {
    if (!search.trim()) return folders
    const q = search.toLowerCase()
    return folders.filter(
      (f) =>
        f.name.toLowerCase().includes(q) ||
        f.emoji.toLowerCase().includes(q)
    )
  }, [folders, search])

  const handleCreateFolder = async (data) => {
    await onCreateFolder(data)
    setShowCreate(false)
  }

  const handleStartRename = useCallback((id, currentName, currentEmoji) => {
    setEditingId(id)
    setEditName(currentName)
    setEditEmoji(currentEmoji || "📁")
  }, [])

  const handleConfirmRename = useCallback(
    async (id) => {
      if (!editName.trim()) {
        setEditingId(null)
        return
      }
      await onUpdateFolder(id, { name: editName.trim(), emoji: editEmoji })
      setEditingId(null)
      setEditName("")
      setEditEmoji("")
    },
    [editName, editEmoji, onUpdateFolder]
  )

  const handleCancelRename = useCallback(() => {
    setEditingId(null)
    setEditName("")
    setEditEmoji("")
  }, [])

  const handleDeleteConfirm = useCallback(async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      await onDeleteFolder(deleteTarget.id)
      setDeleteTarget(null)
    } catch {
    } finally {
      setDeleting(false)
    }
  }, [deleteTarget, onDeleteFolder])

  const handleDragOver = useCallback((e, folderId) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragTargetId(folderId)
  }, [])

  const handleDragLeave = useCallback(
    (e, folderId) => {
      dragCounter.current -= 1
      if (dragCounter.current <= 0) {
        dragCounter.current = 0
        if (dragTargetId === folderId) {
          setDragTargetId(null)
        }
      }
    },
    [dragTargetId]
  )

  const handleDrop = useCallback(
    (e, folderId) => {
      e.preventDefault()
      setDragTargetId(null)
      dragCounter.current = 0
      const journalId = e.dataTransfer.getData("text/journal-id")
      if (journalId) {
        const folder = folders.find((f) => f.id === folderId)
        if (folder) {
          const ev = new CustomEvent("journal-drop-folder", {
            detail: { journalId, folderId },
          })
          window.dispatchEvent(ev)
        }
      }
    },
    [folders]
  )

  const handleGlobalDragOver = useCallback((e) => {
    const journalId = e.dataTransfer.types.includes("text/journal-id")
    if (journalId) {
      e.preventDefault()
    }
  }, [])

  useEffect(() => {
    if (!open) return
    document.addEventListener("dragover", handleGlobalDragOver)
    return () => document.removeEventListener("dragover", handleGlobalDragOver)
  }, [open, handleGlobalDragOver])

  return (
    <>
      <AnimatePresence>
        {open && (
          <Portal>
            <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: theme.z.modalOverlay,
              background: "rgba(0,0,0,0.4)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: 16,
            }}
            onClick={onClose}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              style={{
                background: "var(--color-bg)",
                borderRadius: 24,
                width: "100%",
                maxWidth: 720,
                maxHeight: "85vh",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 32px 80px rgba(0,0,0,0.25)",
                overflow: "hidden",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "24px 28px 0",
                }}
              >
                <div>
                  <h2
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      color: theme.dark,
                      margin: 0,
                    }}
                  >
                    Folder Explorer
                  </h2>
                  <p style={{ fontSize: 13, color: theme.muted, margin: "4px 0 0" }}>
                    Organize your journals into folders
                  </p>
                </div>
                <button
                  onClick={onClose}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    width: 36,
                    height: 36,
                    borderRadius: 10,
                    border: `1px solid ${theme.border}`,
                    background: "var(--color-card, white)",
                    cursor: "pointer",
                    color: theme.muted,
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = theme.bg
                    e.currentTarget.style.color = theme.dark
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "var(--color-card, white)"
                    e.currentTarget.style.color = theme.muted
                  }}
                >
                  <X size={16} />
                </button>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "16px 28px 0",
                }}
              >
                <div
                  style={{
                    flex: 1,
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    background: "var(--color-card, white)",
                    borderRadius: 12,
                    border: `1px solid ${theme.border}`,
                    padding: "8px 12px",
                  }}
                >
                  <Search size={15} color={theme.muted} />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search folders..."
                    style={{
                      flex: 1,
                      border: "none",
                      outline: "none",
                      fontSize: 13,
                      color: theme.dark,
                      background: "transparent",
                    }}
                  />
                  {search && (
                    <button
                      onClick={() => setSearch("")}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        padding: 0,
                      }}
                    >
                      <X size={14} color={theme.muted} />
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setShowCreate(!showCreate)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    padding: "9px 16px",
                    borderRadius: 12,
                    border: "none",
                    background: showCreate
                      ? theme.muted
                      : `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                    color: "white",
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                    transition: "all 0.15s",
                  }}
                >
                  <Plus size={14} />
                  {showCreate ? "Close" : "New Folder"}
                </button>
              </div>

              <AnimatePresence>
                {showCreate && (
                  <div style={{ padding: "16px 28px 0" }}>
                    <CreateFolderForm
                      onSubmit={handleCreateFolder}
                      onCancel={() => setShowCreate(false)}
                    />
                  </div>
                )}
              </AnimatePresence>

              <div
                style={{
                  flex: 1,
                  overflowY: "auto",
                  padding: "20px 28px 28px",
                }}
              >
                {foldersLoading ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "48px 0",
                      color: theme.muted,
                      fontSize: 14,
                    }}
                  >
                    <Loader2 size={20} className="spin-loader" style={{ margin: "0 auto 12px" }} />
                    Loading folders...
                  </div>
                ) : filteredFolders.length === 0 ? (
                  <div
                    style={{
                      textAlign: "center",
                      padding: "48px 0",
                    }}
                  >
                    <span style={{ fontSize: 40, opacity: 0.4, display: "block", marginBottom: 12 }}>
                      {search ? "🔍" : "📂"}
                    </span>
                    <p
                      style={{
                        fontSize: 14,
                        fontWeight: 600,
                        color: theme.dark,
                        marginBottom: 4,
                      }}
                    >
                      {search ? "No folders match your search" : "No folders yet"}
                    </p>
                    <p style={{ fontSize: 12, color: theme.muted, marginBottom: 16 }}>
                      {search
                        ? "Try a different search term"
                        : "Create your first folder to start organizing journals"}
                    </p>
                    {!search && (
                      <button
                        onClick={() => setShowCreate(true)}
                        style={{
                          padding: "9px 20px",
                          borderRadius: 24,
                          border: "none",
                          background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                          color: "white",
                          fontSize: 13,
                          fontWeight: 500,
                          cursor: "pointer",
                        }}
                      >
                        Create Folder
                      </button>
                    )}
                  </div>
                ) : (
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                      gap: 14,
                    }}
                  >
                    <AnimatePresence mode="popLayout">
                      {filteredFolders.map((f) => (
                        <div
                          key={f.id}
                          className="folder-card-wrapper"
                          onMouseEnter={() => {}}
                          onContextMenu={(e) => handleCtxMenu(e, f)}
                        >
                          <FolderCard
                            folder={f}
                            isActive={activeFolderId === f.id}
                            editingId={editingId}
                            editName={editName}
                            setEditName={setEditName}
                            editEmoji={editEmoji}
                            setEditEmoji={setEditEmoji}
                            onStartRename={handleStartRename}
                            onConfirmRename={handleConfirmRename}
                            onCancelRename={handleCancelRename}
                            onDelete={setDeleteTarget}
                            onSelect={onSelectFolder}
                            onDragOver={(e) => handleDragOver(e, f.id)}
                            onDragLeave={(e) => handleDragLeave(e, f.id)}
                            onDrop={(e) => handleDrop(e, f.id)}
                            isDragTarget={dragTargetId === f.id}
                          />
                        </div>
                      ))}
                    </AnimatePresence>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>

          <AnimatePresence>
            {deleteTarget && (
              <DeleteConfirmModal
                folder={deleteTarget}
                onConfirm={handleDeleteConfirm}
                onCancel={() => setDeleteTarget(null)}
                loading={deleting}
              />
            )}
          </AnimatePresence>

          {ctxMenu.open && (
            <div
              style={{
                position: "fixed",
                top: ctxMenu.y,
                left: ctxMenu.x,
                zIndex: theme.z.modalOverlay + 2,
                background: "var(--color-card)",
                borderRadius: 12,
                border: `1px solid ${theme.border}`,
                boxShadow: "0 8px 32px rgba(0,0,0,0.15)",
                minWidth: 140,
                padding: 4,
                overflow: "hidden",
              }}
            >
              <button
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault()
                  handleStartRename(ctxMenu.folder.id, ctxMenu.folder.name, ctxMenu.folder.emoji)
                  handleCloseCtxMenu()
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  width: "100%",
                  padding: "8px 14px",
                  border: "none",
                  background: "transparent",
                  color: theme.dark,
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  borderRadius: 8,
                  textAlign: "left",
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-hover)" }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
              >
                <Pencil size={13} />
                Edit
              </button>
              <button
                onMouseDown={(e) => {
                  e.stopPropagation()
                  setDeleteTarget(ctxMenu.folder)
                  handleCloseCtxMenu()
                }}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  width: "100%",
                  padding: "8px 14px",
                  border: "none",
                  background: "transparent",
                  color: "#EF4444",
                  fontSize: 13,
                  fontWeight: 500,
                  cursor: "pointer",
                  borderRadius: 8,
                  textAlign: "left",
                  transition: "background 0.1s",
                }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.08)" }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
              >
                <Trash2 size={13} />
                Delete
              </button>
            </div>
          )}
        </Portal>
      )}

      </AnimatePresence>

      <style>{`
        .spin-loader {
          animation: folder-spin 0.8s linear infinite;
        }
        @keyframes folder-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </>
  )
}
