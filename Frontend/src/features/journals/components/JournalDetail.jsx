import { useState, useRef, useEffect } from "react"
import { useTranslation } from "react-i18next"
import {
  ChevronLeft,
  Star,
  Pin,
  Edit,
  Trash2,
  MessageCircle,
  X,
  Plus,
  Loader2,
  MoreHorizontal,
  Folder,
} from "lucide-react"
import DOMPurify from "dompurify"
import { theme } from "../../../theme"
import { formatDate } from "../../../utils/formatters"
import ConfirmDialog from "../../../components/ui/ConfirmDialog"

export default function JournalDetail({
  journal,
  folders,
  onBack,
  onEdit,
  onDelete,
  toggleFavorite,
  togglePinned,
  toggleAllowAI,
  onChatAboutIt,
  chatAboutItLoading,
  deleting,
  onAssignFolders,
}) {
  const { t } = useTranslation()
  const [highlights, setHighlights] = useState([])
  const [selectedText, setSelectedText] = useState("")
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [showFolderPicker, setShowFolderPicker] = useState(false)
  const [showActions, setShowActions] = useState(false)
  const [folderAssigning, setFolderAssigning] = useState(false)
  const [showFolderFab, setShowFolderFab] = useState(false)
  const folderPickerRef = useRef(null)
  const actionsRef = useRef(null)
  const folderFabRef = useRef(null)

  useEffect(() => {
    if (!showFolderPicker) return
    const handleClick = (e) => {
      if (folderPickerRef.current && !folderPickerRef.current.contains(e.target)) {
        setShowFolderPicker(false)
      }
    }
    const handleKey = (e) => {
      if (e.key === "Escape") setShowFolderPicker(false)
    }
    document.addEventListener("mousedown", handleClick)
    document.addEventListener("keydown", handleKey)
    return () => {
      document.removeEventListener("mousedown", handleClick)
      document.removeEventListener("keydown", handleKey)
    }
  }, [showFolderPicker])

  useEffect(() => {
    if (!showActions) return
    const handleClick = (e) => {
      if (actionsRef.current && !actionsRef.current.contains(e.target)) {
        setShowActions(false)
      }
    }
    const handleKey = (e) => {
      if (e.key === "Escape") setShowActions(false)
    }
    document.addEventListener("mousedown", handleClick)
    document.addEventListener("keydown", handleKey)
    return () => {
      document.removeEventListener("mousedown", handleClick)
      document.removeEventListener("keydown", handleKey)
    }
  }, [showActions])

  useEffect(() => {
    if (!showFolderFab) return
    const handleClick = (e) => {
      if (folderFabRef.current && !folderFabRef.current.contains(e.target) &&
          !e.target.closest("[data-folder-fab-btn]")) {
        setShowFolderFab(false)
      }
    }
    const handleKey = (e) => {
      if (e.key === "Escape") setShowFolderFab(false)
    }
    document.addEventListener("mousedown", handleClick)
    document.addEventListener("keydown", handleKey)
    return () => {
      document.removeEventListener("mousedown", handleClick)
      document.removeEventListener("keydown", handleKey)
    }
  }, [showFolderFab])

  const handleToggleFolder = async (folderId) => {
    setFolderAssigning(true)
    const current = journal.folderIds || []
    const next = current.includes(folderId)
      ? current.filter((id) => id !== folderId)
      : [...current, folderId]
    try {
      await onAssignFolders(journal.id, next)
    } catch {
    } finally {
      setFolderAssigning(false)
    }
  }

  const handleMouseUp = () => {
    const sel = window.getSelection()
    const text = sel?.toString().trim()
    if (text && text.length > 2) setSelectedText(text)
    else setSelectedText("")
  }

  const saveHighlight = () => {
    if (!selectedText || highlights.includes(selectedText)) return
    setHighlights((h) => [...h, selectedText])
    setSelectedText("")
    window.getSelection()?.removeAllRanges()
  }

  const handleDelete = () => {
    setConfirmDelete(true)
  }

  const handleConfirmDelete = async () => {
    await onDelete(journal.id)
    setConfirmDelete(false)
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: theme.bg,
      }}
    >
      {/* Minimal top bar */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "8px 24px",
          position: "sticky",
          top: 0,
          zIndex: 20,
          background: theme.bg,
        }}
      >
        <button
          onClick={() => {
            onBack()
            setHighlights([])
            setSelectedText("")
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 13,
            color: theme.muted,
            fontWeight: 400,
            padding: "4px 6px",
            borderRadius: 6,
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.background = theme.bg }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
        >
          <ChevronLeft size={15} color={theme.muted} /> {t("journal.detail.back")}
        </button>

        <div style={{ display: "flex", alignItems: "center", gap: 2, position: "relative" }} ref={actionsRef}>
          {/* Pin toggle */}
          <button
            onClick={() => togglePinned(journal.id)}
            aria-label={journal.isPinned ? t("journal.detail.pinned") : t("journal.detail.pin")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 30,
              height: 30,
              borderRadius: 6,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: journal.isPinned ? "#3B82F6" : theme.muted,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = theme.bg }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
          >
            <Pin
              size={15}
              fill={journal.isPinned ? "#3B82F6" : "none"}
              color={journal.isPinned ? "#3B82F6" : theme.muted}
            />
          </button>

          {/* Share with Spill AI toggle */}
          <button
            onClick={() => toggleAllowAI(journal.id)}
            aria-label={journal.allowAI ? t("journal.detail.stopSharing") : t("journal.detail.allowSharing")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 30,
              height: 30,
              borderRadius: 6,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: journal.allowAI ? theme.primary : theme.muted,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = theme.bg }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
          >
            <MessageCircle
              size={15}
              fill={journal.allowAI ? theme.primary : "none"}
              color={journal.allowAI ? theme.primary : theme.muted}
            />
          </button>

          {/* Favorite toggle */}
          <button
            onClick={() => toggleFavorite(journal.id)}
            aria-label={journal.isFavorite ? t("journal.detail.favorited") : t("journal.detail.favorite")}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 30,
              height: 30,
              borderRadius: 6,
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: theme.muted,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = theme.bg }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
          >
            <Star
              size={15}
              fill={journal.isFavorite ? "#F59E0B" : "none"}
              color={journal.isFavorite ? "#F59E0B" : theme.muted}
            />
          </button>

          {/* More actions toggle */}
          <button
            onClick={() => setShowActions((s) => !s)}
            aria-label="More actions"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 30,
              height: 30,
              borderRadius: 6,
              border: "none",
              background: showActions ? theme.bg : "transparent",
              cursor: "pointer",
              color: theme.muted,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = theme.bg }}
            onMouseLeave={(e) => {
              if (!showActions) e.currentTarget.style.background = "transparent"
            }}
          >
            <MoreHorizontal size={15} />
          </button>

          {/* Actions dropdown */}
          {showActions && (
            <div
              style={{
                position: "absolute",
                top: "calc(100% + 4px)",
                right: 0,
                zIndex: 30,
                background: "var(--color-card, white)",
                borderRadius: 10,
                border: `1px solid ${theme.border}`,
                boxShadow: "0 8px 32px rgba(0,0,0,0.1)",
                padding: "6px",
                minWidth: 180,
                display: "flex",
                flexDirection: "column",
                gap: 2,
              }}
            >
              <ActionRow icon={<Edit size={14} />} label={t("journal.detail.edit")} onClick={() => { onEdit(journal.id); setShowActions(false) }} />
              <ActionRow icon={<Trash2 size={14} />} label={t("journal.detail.delete")} onClick={() => { handleDelete(); setShowActions(false) }} color="#EF4444" />
            </div>
          )}
        </div>
      </div>

      {/* Document area */}
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "48px 32px 80px" }}>
        {/* Title */}
        <h1
          style={{
            fontSize: 38,
            fontWeight: 700,
            color: theme.dark,
            margin: "0 0 16px",
            lineHeight: 1.25,
            letterSpacing: "-0.02em",
          }}
        >
          {journal.title}
        </h1>

        {/* Emoji circle + Date row */}
        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 32 }}>
          <div style={{
            width: 44,
            height: 44,
            borderRadius: "50%",
            border: `1.5px solid ${theme.border}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}>
            <span style={{ fontSize: 26, lineHeight: 1 }}>
              {journal.emojis.find(Boolean) || "📖"}
            </span>
          </div>
          <p
            style={{
              fontSize: 13,
              color: theme.muted,
              margin: 0,
              fontWeight: 400,
            }}
          >
            {formatDate(journal.date)}
          </p>
        </div>

        {/* Folder tags */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            flexWrap: "wrap",
            marginBottom: 40,
            position: "relative",
          }}
        >
          {(journal.folderIds || []).map((fid) => {
            const f = folders?.find((x) => x.id === fid)
            if (!f) return null
            return (
              <span
                key={fid}
                style={{
                  fontSize: 12,
                  background: "var(--color-hover)",
                  color: theme.dark,
                  borderRadius: 4,
                  padding: "3px 8px",
                  fontWeight: 500,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 4,
                }}
              >
                {f.emoji} {f.name}
                <button
                  type="button"
                  onClick={() => handleToggleFolder(fid)}
                  disabled={folderAssigning}
                  style={{
                    background: "none",
                    border: "none",
                    cursor: folderAssigning ? "not-allowed" : "pointer",
                    padding: 0,
                    display: "flex",
                    color: theme.muted,
                    fontSize: 11,
                    marginLeft: 1,
                  }}
                >
                  <X size={11} />
                </button>
              </span>
            )
          })}
        </div>

        {/* Content */}
        <div
          style={{
            fontSize: 16,
            lineHeight: 1.75,
            color: theme.dark,
            userSelect: "text",
          }}
          className="jd-content"
          onMouseUp={handleMouseUp}
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(journal.content, { ADD_ATTR: ["target"] }) }}
        />

        {/* Floating highlight save bar */}
        {selectedText && (
          <div
            style={{
              position: "fixed",
              bottom: 100,
              left: "50%",
              transform: "translateX(-50%)",
              background: theme.dark,
              color: "white",
              borderRadius: 10,
              padding: "10px 18px",
              display: "flex",
              alignItems: "center",
              gap: 12,
              zIndex: 100,
              boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
            }}
          >
            <span style={{ fontSize: 13 }}>
              &ldquo;{selectedText.slice(0, 40)}
              {selectedText.length > 40 ? "..." : ""}&rdquo;
            </span>
            <button
              onClick={saveHighlight}
              style={{
                background: theme.primary,
                border: "none",
                borderRadius: 6,
                padding: "6px 14px",
                color: "white",
                fontSize: 12,
                cursor: "pointer",
                fontWeight: 500,
              }}
            >
              {t("journal.detail.saveHighlight")}
            </button>
          </div>
        )}

        {/* Saved highlights section */}
        {highlights.length > 0 && (
          <div
            style={{
              marginTop: 48,
              paddingTop: 24,
              borderTop: `1px solid ${theme.border}`,
            }}
          >
            <p
              style={{
                fontSize: 13,
                fontWeight: 600,
                color: theme.dark,
                marginBottom: 12,
                display: "flex",
                alignItems: "center",
                gap: 6,
                textTransform: "uppercase",
                letterSpacing: "0.04em",
              }}
            >
              <Star size={13} fill="#F59E0B" color="#F59E0B" />{" "}
              {t("journal.detail.savedHighlights", { count: highlights.length })}
            </p>
            {highlights.map((h, i) => (
              <div
                key={i}
                style={{
                  padding: "10px 0",
                  borderBottom: i < highlights.length - 1 ? `1px solid ${theme.border}` : "none",
                  fontSize: 14,
                  color: theme.dark,
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 8,
                }}
              >
                <span style={{ lineHeight: 1.6 }}>
                  &ldquo;{h}&rdquo;
                </span>
                <button
                  onClick={() =>
                    setHighlights((hh) => hh.filter((_, idx) => idx !== i))
                  }
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: theme.muted,
                    padding: 4,
                    flexShrink: 0,
                    borderRadius: 4,
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-hover)" }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
                >
                  <X size={13} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Folder FAB */}
      <button
        data-folder-fab-btn
        onClick={() => setShowFolderFab((v) => !v)}
        aria-label="Manage folder"
        style={{
          position: "fixed",
          bottom: 32,
          right: 88,
          zIndex: 50,
          width: 48,
          height: 48,
          borderRadius: "50%",
          border: "none",
          background: showFolderFab ? theme.primary : "var(--color-card, white)",
          cursor: "pointer",
          color: showFolderFab ? "white" : theme.primary,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: showFolderFab
            ? `0 4px 16px color-mix(in srgb, ${theme.primary} 44%, transparent)`
            : "0 4px 16px rgba(0,0,0,0.1)",
          transition: "all 0.2s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.transform = "scale(1.05)" }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)" }}
      >
        <Folder size={20} fill={showFolderFab ? "white" : "none"} />
      </button>

      {/* Folder FAB popup */}
      {showFolderFab && (
        <div
          ref={folderFabRef}
          style={{
            position: "fixed",
            bottom: 90,
            right: 88,
            zIndex: 60,
            background: "var(--color-card, white)",
            borderRadius: 12,
            border: `1px solid ${theme.border}`,
            boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
            padding: 14,
            minWidth: 220,
          }}
        >
          <p style={{
            fontSize: 11, fontWeight: 600, color: theme.muted,
            textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 8,
          }}>
            Current Folder
          </p>
          {(journal.folderIds || []).length === 0 ? (
            <p style={{ fontSize: 12, color: theme.muted, margin: "0 0 10px", fontStyle: "italic" }}>
              No folder assigned
            </p>
          ) : (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 10 }}>
              {(journal.folderIds || []).map((fid) => {
                const f = folders?.find((x) => x.id === fid)
                if (!f) return null
                return (
                  <span key={fid} style={{
                    fontSize: 12, background: "var(--color-hover)",
                    borderRadius: 4, padding: "3px 8px", fontWeight: 500,
                  }}>
                    {f.emoji} {f.name}
                  </span>
                )
              })}
            </div>
          )}
          <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: 8, marginTop: 4 }}>
            <p style={{
              fontSize: 11, fontWeight: 600, color: theme.muted,
              textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6,
            }}>
              Move to
            </p>
            {folders?.map((f) => {
              const isSelected = (journal.folderIds || []).includes(f.id)
              return (
                <button
                  key={f.id}
                  type="button"
                  onClick={() => handleToggleFolder(f.id)}
                  disabled={folderAssigning}
                  style={{
                    display: "flex", alignItems: "center", gap: 8,
                    padding: "6px 8px", borderRadius: 6, border: "none",
                    background: isSelected ? "var(--color-hover)" : "transparent",
                    cursor: folderAssigning ? "not-allowed" : "pointer",
                    width: "100%", textAlign: "left",
                    fontSize: 13, color: theme.dark,
                    fontWeight: isSelected ? 500 : 400,
                    opacity: folderAssigning ? 0.6 : 1,
                    transition: "all 0.1s",
                  }}
                  onMouseEnter={(e) => { if (!isSelected) e.currentTarget.style.background = "var(--color-hover)" }}
                  onMouseLeave={(e) => { if (!isSelected) e.currentTarget.style.background = "transparent" }}
                >
                  <span style={{ fontSize: 15 }}>{f.emoji}</span>
                  <span style={{ flex: 1 }}>{f.name}</span>
                  {isSelected && <span style={{ fontSize: 11, color: theme.primary }}>✓</span>}
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Spill AI FAB */}
      <button
        onClick={onChatAboutIt}
        disabled={chatAboutItLoading}
        aria-label={t("journal.detail.chatAboutIt")}
        style={{
          position: "fixed",
          bottom: 32,
          right: 32,
          zIndex: 50,
          width: 48,
          height: 48,
          borderRadius: "50%",
          border: "none",
          background: theme.primary,
          cursor: chatAboutItLoading ? "not-allowed" : "pointer",
          color: "white",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: `0 4px 16px color-mix(in srgb, ${theme.primary} 44%, transparent)`,
          transition: "all 0.2s",
          opacity: chatAboutItLoading ? 0.7 : 1,
        }}
        onMouseEnter={(e) => { if (!chatAboutItLoading) e.currentTarget.style.transform = "scale(1.05)" }}
        onMouseLeave={(e) => { e.currentTarget.style.transform = "scale(1)" }}
      >
        {chatAboutItLoading ? <Loader2 size={20} className="jd-folder-spin" /> : <MessageCircle size={20} />}
      </button>

      <ConfirmDialog
        open={confirmDelete}
        title={t("journal.detail.deleteDialog")}
        message={t("journal.detail.deleteConfirm", { title: journal.title })}
        confirmLabel={t("journal.detail.confirm")}
        cancelLabel={t("common.cancel")}
        variant="danger"
        loading={deleting}
        onConfirm={handleConfirmDelete}
        onCancel={() => setConfirmDelete(false)}
      />
      <style>{`
        .jd-folder-spin {
          animation: jd-spin 0.8s linear infinite;
        }
        @keyframes jd-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  )
}

function ActionRow({ icon, label, onClick, color = "var(--color-dark)" }) {
  return (
    <button
      onClick={onClick}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "7px 10px",
        borderRadius: 8,
        border: "none",
        background: "transparent",
        color,
        fontSize: 13,
        fontWeight: 400,
        cursor: "pointer",
        textAlign: "left",
        width: "100%",
        transition: "all 0.1s",
      }}
      onMouseEnter={(e) => { e.currentTarget.style.background = "var(--color-hover)" }}
      onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
    >
      {icon}
      <span>{label}</span>
    </button>
  )
}
