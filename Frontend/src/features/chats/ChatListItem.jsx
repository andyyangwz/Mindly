import { useState, memo, useCallback, useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { Edit3, Trash2 } from "lucide-react"
import { theme } from "../../theme"
import ContextMenu from "../../components/ui/ContextMenu"
import ConfirmDialog from "../../components/ui/ConfirmDialog"

const ChatListItem = memo(function ChatListItem({ chat, active, newSessionId, onSelect, onRename, onDelete }) {
  const { t } = useTranslation()
  const [menuOpen, setMenuOpen] = useState(false)
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 })
  const [showDelete, setShowDelete] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [deleted, setDeleted] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState("")
  const [revealCount, setRevealCount] = useState(null)
  const animRef = useRef(null)
  const inputRef = useRef(null)

  const isNew = chat.id === newSessionId && newSessionId

  useEffect(() => {
    if (isNew && chat.title) {
      const total = chat.title.length
      const duration = Math.min(total * 60, 700)
      const startTime = performance.now()
      let killed = false
      function frame(now) {
        if (killed) return
        const elapsed = now - startTime
        const progress = Math.min(elapsed / duration, 1)
        const eased = 1 - Math.pow(1 - progress, 3)
        setRevealCount(Math.min(Math.floor(eased * total), total))
        if (progress < 1) animRef.current = requestAnimationFrame(frame)
      }
      animRef.current = requestAnimationFrame(frame)
      return () => { killed = true; if (animRef.current) cancelAnimationFrame(animRef.current) }
    } else {
      setRevealCount(null)
    }
  }, [isNew, chat.title])

  useEffect(() => {
    if (isRenaming && inputRef.current) {
      inputRef.current.focus()
      inputRef.current.select()
    }
  }, [isRenaming])

  const handleContextMenu = useCallback((e) => {
    e.preventDefault()
    setMenuPos({ x: e.clientX, y: e.clientY })
    setMenuOpen(true)
  }, [])

  const handleCloseMenu = useCallback(() => {
    setMenuOpen(false)
  }, [])

  const startRename = useCallback(() => {
    setRenameValue(chat.title)
    setIsRenaming(true)
  }, [chat.title])

  const submitRename = useCallback(async () => {
    const trimmed = renameValue.trim()
    if (!trimmed || trimmed === chat.title) {
      setIsRenaming(false)
      return
    }
    try {
      await onRename(chat.id, trimmed)
      setIsRenaming(false)
    } catch {
      setRenameValue(chat.title)
      setIsRenaming(false)
    }
  }, [renameValue, chat.id, chat.title, onRename])

  const cancelRename = useCallback(() => {
    setRenameValue(chat.title)
    setIsRenaming(false)
  }, [chat.title])

  const handleDelete = useCallback(() => {
    setShowDelete(true)
  }, [])

  const handleConfirmDelete = useCallback(async () => {
    setDeleteLoading(true)
    try {
      await onDelete(chat.id)
      setDeleted(true)
    } catch {
      setDeleteLoading(false)
      setShowDelete(false)
    }
  }, [chat.id, onDelete])

  if (deleted) return null

  const menuItems = [
    { label: t("chat.rename"), icon: Edit3, onClick: startRename },
    { label: t("chat.delete"), icon: Trash2, onClick: handleDelete, danger: true },
  ]

  return (
    <>
      <div
        onContextMenu={handleContextMenu}
        onClick={() => { if (!isRenaming) onSelect(chat.id) }}
        style={{
          width: "100%",
          padding: "7px 12px",
          borderRadius: 8,
          background: active ? `color-mix(in srgb, ${theme.primary} 10%, transparent)` : "transparent",
          borderLeft: active ? `3px solid ${theme.primary}` : "3px solid transparent",
          cursor: isRenaming ? "default" : "pointer",
          marginBottom: 1,
          transition: "background 0.12s",
          boxSizing: "border-box",
        }}
        onMouseEnter={(e) => { if (!active && !isRenaming) e.currentTarget.style.background = "var(--color-hover, #F9FAFB)" }}
        onMouseLeave={(e) => { if (!active && !isRenaming) e.currentTarget.style.background = "transparent" }}
      >
        {isRenaming ? (
          <input ref={inputRef} value={renameValue} onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submitRename() } if (e.key === "Escape") cancelRename() }}
            onBlur={submitRename} onClick={(e) => e.stopPropagation()}
            style={{ width: "100%", padding: "4px 6px", border: `1.5px solid ${theme.primary}`, borderRadius: 6,
              fontSize: 13, fontWeight: 500, color: theme.dark, background: "var(--color-card, white)", outline: "none",
              fontFamily: "inherit", boxSizing: "border-box" }} />
        ) : (
          <p style={{
            fontSize: 13,
            fontWeight: active ? 600 : 500,
            color: active ? theme.primaryText : theme.dark,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            margin: 0,
            lineHeight: "22px",
          }}>{revealCount !== null ? chat.title?.slice(0, revealCount) : chat.title}</p>
        )}
      </div>

      <ContextMenu open={menuOpen} x={menuPos.x} y={menuPos.y} items={menuItems} onClose={handleCloseMenu} />

      <ConfirmDialog
        open={showDelete} title={t("chat.deleteDialog")}
        message={t("chat.deleteConfirm", { title: chat.title })}
        confirmLabel={t("chat.delete")} onConfirm={handleConfirmDelete} onCancel={() => setShowDelete(false)}
        loading={deleteLoading} variant="danger" />
    </>
  )
})

export default ChatListItem
