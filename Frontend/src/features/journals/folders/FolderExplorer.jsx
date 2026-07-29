import { useState, useMemo, useCallback, useRef, useEffect } from "react"
import { X, Search, Plus, Pencil, Trash2, Check, Loader2 } from "lucide-react"
import { motion, AnimatePresence } from "framer-motion"
import { Portal } from "../../../utils/portal"
import "../../../styles/journals/index.css"

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

  const cardClass = `folder-card${isDragTarget ? " folder-card--drag-target" : isActive ? " folder-card--active" : ""}`

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
      className={cardClass}
    >
      {isDragTarget && (
        <div className="folder-card-drag-overlay" />
      )}

      {editingId === folder.id ? (
        <div className="folder-card-edit-area">
          <button
            ref={emojiBtnRef}
            type="button"
            onClick={() => setShowEmojiPicker(!showEmojiPicker)}
            className={`folder-card-emoji-btn${showEmojiPicker ? " folder-card-emoji-btn--active" : ""}`}
          >
            {editEmoji || "📁"}
          </button>
          {showEmojiPicker && (
            <div ref={emojiPickerRef} className="folder-card-emoji-picker">
              {EMOJI_PICKER.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => { setEditEmoji(e); setShowEmojiPicker(false) }}
                  className={`folder-card-emoji-option${editEmoji === e ? " folder-card-emoji-option--selected" : ""}`}
                >
                  {e}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="folder-card-emoji">{folder.emoji}</div>
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
            className="folder-card-edit-input"
          />
        </form>
      ) : (
        <p className="folder-card-name">{folder.name}</p>
      )}

      <p className="folder-card-count">
        {folder.journalCount} {folder.journalCount === 1 ? "journal" : "journals"}
      </p>

      <div className="folder-card-actions" onClick={(e) => e.stopPropagation()}>
        {editingId === folder.id ? (
          <button
            type="button"
            onMouseDown={(e) => {
              e.stopPropagation()
              onConfirmRename(folder.id)
            }}
            className="folder-card-save-btn"
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
              className="folder-card-icon-btn"
            >
              <Pencil size={11} />
            </button>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation()
                onDelete(folder)
              }}
              className="folder-card-icon-btn folder-card-icon-btn--delete"
            >
              <Trash2 size={11} />
            </button>
          </>
        )}
      </div>
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
      /* ignore */
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
      className="create-form-wrap"
    >
      <form onSubmit={handleSubmit} className="create-form">
        <div className="create-form-field">
          <label className="create-form-label">Folder Name</label>
          <input
            ref={inputRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Travel, Recipes, Ideas..."
            className="create-form-input"
            onKeyDown={(e) => {
              if (e.key === "Escape") onCancel()
            }}
          />
        </div>

        <div className="create-form-emoji-field">
          <label className="create-form-label">Emoji</label>
          <input
            value={emoji}
            onChange={(e) => setEmoji(e.target.value)}
            placeholder="📁"
            maxLength={2}
            className="create-form-emoji-input"
          />
          <div className="create-form-emoji-grid">
            {EMOJI_PICKER.map((e) => (
              <button
                key={e}
                type="button"
                onClick={() => setEmoji(e)}
                className={`create-form-emoji-option${emoji === e ? " create-form-emoji-option--selected" : ""}`}
              >
                {e}
              </button>
            ))}
          </div>
        </div>

        <div className="create-form-actions">
          <button type="button" onClick={onCancel} className="create-form-cancel-btn">
            Cancel
          </button>
          <button
            type="submit"
            disabled={!name.trim() || loading}
            className="create-form-submit-btn"
            style={{
              background: !name.trim()
                ? "var(--color-muted)"
                : "linear-gradient(135deg, var(--color-primary), var(--color-secondary))",
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
      className="delete-overlay"
      onClick={onCancel}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 8 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 8 }}
        transition={{ duration: 0.2, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
        className="delete-modal"
      >
        <div className="delete-header">
          <div className="delete-icon-box">
            <Trash2 size={20} color="#EF4444" />
          </div>
          <div className="delete-content">
            <h2 className="delete-title">
              Delete "{folder.emoji} {folder.name}"?
            </h2>
            <p className="delete-desc">
              This folder will be removed, but no journals will be deleted.
              Journals in this folder will become uncategorized.
            </p>
          </div>
          <button type="button" onClick={onCancel} className="delete-close-btn">
            <X size={16} color="var(--color-muted)" />
          </button>
        </div>

        <div className="delete-actions">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="delete-cancel-btn"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="delete-delete-btn"
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

  const [prevOpen, setPrevOpen] = useState(open)

  if (open !== prevOpen) {
    setPrevOpen(open)
    if (!open) {
      setSearch("")
      setShowCreate(false)
      setEditingId(null)
      setEditName("")
      setEditEmoji("")
      setDeleteTarget(null)
      setDragTargetId(null)
    }
  }

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
      /* ignore */
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
            className="folder-explorer-overlay"
            onClick={onClose}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 12 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              onClick={(e) => e.stopPropagation()}
              className="folder-explorer-modal"
            >
              <div className="folder-explorer-header">
                <div>
                  <h2 className="folder-explorer-title">Folder Explorer</h2>
                  <p className="folder-explorer-subtitle">Organize your journals into folders</p>
                </div>
                <button onClick={onClose} className="folder-explorer-close-btn">
                  <X size={16} />
                </button>
              </div>

              <div className="folder-explorer-search-bar">
                <div className="folder-explorer-search-container">
                  <Search size={15} color="var(--color-muted)" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search folders..."
                    className="folder-explorer-search-input"
                  />
                  {search && (
                    <button onClick={() => setSearch("")} className="folder-explorer-search-clear">
                      <X size={14} color="var(--color-muted)" />
                    </button>
                  )}
                </div>
                <button
                  onClick={() => setShowCreate(!showCreate)}
                  className={`folder-explorer-new-btn${showCreate ? " folder-explorer-new-btn--active" : ""}`}
                >
                  <Plus size={14} />
                  {showCreate ? "Close" : "New Folder"}
                </button>
              </div>

              <AnimatePresence>
                {showCreate && (
                  <div className="folder-explorer-create-wrapper">
                    <CreateFolderForm
                      onSubmit={handleCreateFolder}
                      onCancel={() => setShowCreate(false)}
                    />
                  </div>
                )}
              </AnimatePresence>

              <div className="folder-explorer-content">
                {foldersLoading ? (
                  <div className="folder-explorer-loading">
                    <Loader2 size={20} className="spin-loader" />
                    Loading folders...
                  </div>
                ) : filteredFolders.length === 0 ? (
                  <div className="folder-explorer-empty">
                    <span className="folder-explorer-empty-icon">
                      {search ? "🔍" : "📂"}
                    </span>
                    <p className="folder-explorer-empty-title">
                      {search ? "No folders match your search" : "No folders yet"}
                    </p>
                    <p className="folder-explorer-empty-desc">
                      {search
                        ? "Try a different search term"
                        : "Create your first folder to start organizing journals"}
                    </p>
                    {!search && (
                      <button
                        onClick={() => setShowCreate(true)}
                        className="folder-explorer-empty-btn"
                      >
                        Create Folder
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="folder-explorer-grid">
                    <AnimatePresence mode="popLayout">
                      {filteredFolders.map((f) => (
                        <div
                          key={f.id}
                          className="folder-card-wrapper"
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
              className="fe-ctx-menu"
              style={{ top: ctxMenu.y, left: ctxMenu.x }}
            >
              <button
                onMouseDown={(e) => {
                  e.stopPropagation();
                  e.preventDefault()
                  handleStartRename(ctxMenu.folder.id, ctxMenu.folder.name, ctxMenu.folder.emoji)
                  handleCloseCtxMenu()
                }}
                className="fe-ctx-menu-item"
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
                className="fe-ctx-menu-item fe-ctx-menu-item--danger"
              >
                <Trash2 size={13} />
                Delete
              </button>
            </div>
          )}
        </Portal>
      )}

      </AnimatePresence>
    </>
  )
}
