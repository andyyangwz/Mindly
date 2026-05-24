import { BookOpen, X } from "lucide-react"
import { theme } from "../../theme"

/**
 * Compact journal preview card — renders as a reply/attachment-style UI.
 * Used both in the composer (before send) and in chat messages (after send).
 */
export default function JournalPreviewCard({ title, content, onRemove, compact = false }) {
  // Truncate content to ~3 lines worth (~180 chars)
  const snippet = content.length > 180 ? content.slice(0, 180) + "…" : content

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        gap: compact ? 3 : 4,
        padding: compact ? "6px 10px" : "8px 12px",
        background: `color-mix(in srgb, ${theme.primary} 6%, transparent)`,
        borderLeft: `2.5px solid color-mix(in srgb, ${theme.primary} 44%, transparent)`,
        borderRadius: compact ? 6 : 8,
        maxWidth: compact ? 260 : 420,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <BookOpen size={compact ? 10 : 11} color={theme.primary} />
          <span
            style={{
              fontSize: compact ? 10 : 11,
              fontWeight: 600,
              color: theme.primary,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
              maxWidth: compact ? 180 : 320,
            }}
            title={title}
          >
            {title}
          </span>
        </div>
        {onRemove && (
          <button
            onClick={onRemove}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center",
              width: 18, height: 18, borderRadius: "50%",
              border: "none", background: "transparent",
              cursor: "pointer", padding: 0, flexShrink: 0,
              color: theme.muted,
            }}
            onMouseEnter={(e) => { e.currentTarget.style.color = theme.dark }}
            onMouseLeave={(e) => { e.currentTarget.style.color = theme.muted }}
          >
            <X size={12} />
          </button>
        )}
      </div>
      <p
        style={{
          fontSize: compact ? 9 : 10,
          color: theme.muted,
          lineHeight: 1.4,
          margin: 0,
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical",
        }}
      >
        {snippet}
      </p>
    </div>
  )
}
