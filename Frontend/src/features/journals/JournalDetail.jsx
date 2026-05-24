import { useState, useMemo } from "react"
import { useTranslation } from "react-i18next"
import {
  ChevronLeft,
  Star,
  Edit,
  Trash2,
  MessageCircle,
  X,
} from "lucide-react"
import DOMPurify from "dompurify"
import { theme } from "../../theme"
import { formatDate } from "../../utils/formatters"
import ConfirmDialog from "../../components/ui/ConfirmDialog"

export default function JournalDetail({
  journal,
  onBack,
  onEdit,
  onDelete,
  toggleFavorite,
  togglePinned,
  toggleAllowAI,
  deleting,
}) {
  const { t } = useTranslation()
  const [highlights, setHighlights] = useState([])
  const [selectedText, setSelectedText] = useState("")
  const [confirmDelete, setConfirmDelete] = useState(false)

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
    <div style={{ padding: "0", maxWidth: "100%", margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "14px 32px",
          background: "var(--color-card, white)",
          borderBottom: `1px solid ${theme.border}`,
          position: "sticky",
          top: 0,
          zIndex: 10,
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
            gap: 6,
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 13,
            color: theme.dark,
            fontWeight: 500,
          }}
        >
          <ChevronLeft size={16} color={theme.dark} /> {t("journal.detail.back")}
        </button>
        <button
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "7px 18px",
            borderRadius: 24,
            border: "none",
            background: theme.primary,
            cursor: "pointer",
            fontSize: 12,
            color: "white",
            fontWeight: 500,
            boxShadow: `0 4px 12px color-mix(in srgb, ${theme.primary} 44%, transparent)`,
          }}
        >
          <MessageCircle size={13} color="white" /> {t("journal.detail.chatAboutIt")}
        </button>
      </div>

      <div style={{ padding: "28px 32px", maxWidth: 800, margin: "0 auto" }}>
        <div style={{ display: "flex", gap: 16, marginBottom: 20 }}>
          {journal.emojis.map(
            (e, i) =>
              e && (
                <span key={i} style={{ fontSize: 40 }}>
                  {e}
                </span>
              )
          )}
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            marginBottom: 6,
          }}
        >
          <h1 style={{ fontSize: 22, fontWeight: 700, color: theme.dark }}>
            {journal.title}
          </h1>
          {journal.isFavorite && (
            <Star size={20} fill="#F59E0B" color="#F59E0B" />
          )}
        </div>
        <p style={{ fontSize: 13, color: theme.muted, marginBottom: 24 }}>
          {formatDate(journal.date)}
        </p>

        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 24 }}>
          <button
            onClick={() => onEdit(journal.id)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 34,
              height: 34,
              borderRadius: 10,
              border: `1px solid ${theme.border}`,
              background: "var(--color-card, white)",
              cursor: "pointer",
              color: theme.muted,
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = theme.bg; e.currentTarget.style.color = theme.primaryText }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "var(--color-card, white)"; e.currentTarget.style.color = theme.muted }}
            aria-label={t("journal.detail.edit")}
          >
            <Edit size={14} />
          </button>
          <button
            onClick={handleDelete}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 34,
              height: 34,
              borderRadius: 10,
              border: "1px solid rgba(239,68,68,0.3)",
              background: "rgba(239,68,68,0.06)",
              cursor: "pointer",
              color: "#EF4444",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.15)" }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(239,68,68,0.06)" }}
            aria-label={t("journal.detail.delete")}
          >
            <Trash2 size={14} />
          </button>
          <button
            onClick={() => togglePinned(journal.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 14px",
              borderRadius: 10,
              border: `1px solid ${journal.isPinned ? "rgba(59,130,246,0.4)" : theme.border}`,
              background: journal.isPinned ? "rgba(59,130,246,0.1)" : "var(--color-card, white)",
              cursor: "pointer",
              fontSize: 12,
              color: journal.isPinned ? "#3B82F6" : theme.muted,
              fontWeight: 500,
              whiteSpace: "nowrap",
              transition: "all 0.15s",
            }}
          >
            📌 {journal.isPinned ? t("journal.detail.pinned") : t("journal.detail.pin")}
          </button>
          <button
            onClick={() => toggleFavorite(journal.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 14px",
              borderRadius: 10,
              border: `1px solid ${journal.isFavorite ? "rgba(245,158,11,0.4)" : theme.border}`,
              background: journal.isFavorite ? "rgba(245,158,11,0.1)" : "var(--color-card, white)",
              cursor: "pointer",
              fontSize: 12,
              color: journal.isFavorite ? "#F59E0B" : theme.muted,
              fontWeight: 500,
              whiteSpace: "nowrap",
              transition: "all 0.15s",
            }}
          >
            <Star
              size={13}
              fill={journal.isFavorite ? "#F59E0B" : "none"}
              color={journal.isFavorite ? "#F59E0B" : theme.muted}
            />
            {journal.isFavorite ? t("journal.detail.favorited") : t("journal.detail.favorite")}
          </button>
          <div style={{ width: 1, height: 20, background: theme.border, margin: "0 4px" }} />
          <button
            onClick={() => toggleAllowAI(journal.id)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "6px 14px",
              borderRadius: 10,
              border: "none",
              background: journal.allowAI ? "#5B21B6" : theme.primary,
              cursor: "pointer",
              fontSize: 12,
              color: "white",
              fontWeight: 600,
              transition: "all 0.15s",
              boxShadow: journal.allowAI ? "none" : `0 2px 8px color-mix(in srgb, ${theme.primary} 44%, transparent)`,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = journal.allowAI ? "#4C1D95" : "#6D28D9" }}
            onMouseLeave={(e) => { e.currentTarget.style.background = journal.allowAI ? "#5B21B6" : theme.primary }}
            aria-label={journal.allowAI ? t("journal.detail.stopSharing") : t("journal.detail.allowSharing")}
          >
            <MessageCircle size={13} color="white" />
            {journal.allowAI ? t("journal.detail.stopSharing") : t("journal.detail.allowSharing")}
          </button>
        </div>

        <div
          style={{
            background: "var(--color-card, white)",
            borderRadius: 16,
            border: `1px solid ${theme.border}`,
            padding: "28px 32px",
            marginBottom: 16,
            fontSize: 15,
            lineHeight: 1.85,
            color: theme.dark,
            userSelect: "text",
          }}
          className="jd-content"
          onMouseUp={handleMouseUp}
          dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(journal.content, { ADD_ATTR: ["target"] }) }}
        />

        {selectedText && (
          <div
            style={{
              position: "fixed",
              bottom: 100,
              left: "50%",
              transform: "translateX(-50%)",
              background: theme.dark,
              color: "white",
              borderRadius: 12,
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
                borderRadius: 8,
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

        {highlights.length > 0 && (
          <div
            style={{
              background: "rgba(245,158,11,0.06)",
              borderRadius: 16,
              border: `1px solid rgba(245,158,11,0.25)`,
              padding: "20px 24px",
            }}
          >
            <p
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "#B45309",
                marginBottom: 14,
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <Star size={16} fill="#F59E0B" color="#F59E0B" /> {t("journal.detail.savedHighlights", { count: highlights.length })}
            </p>
            {highlights.map((h, i) => (
              <div
                key={i}
                style={{
                  background: "var(--color-card, white)",
                  borderRadius: 10,
                  padding: "12px 16px",
                  marginBottom: 8,
                  fontSize: 13,
                  color: theme.dark,
                   border: `1px solid rgba(245,158,11,0.25)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <span>&ldquo;{h}&rdquo;</span>
                <button
                  onClick={() =>
                    setHighlights((hh) => hh.filter((_, idx) => idx !== i))
                  }
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: theme.muted,
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

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
    </div>
  )
}
