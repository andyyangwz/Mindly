import { BookOpen, X } from "lucide-react"
import "../../../styles/spill/index.css"

export default function JournalPreviewCard({ title, content, onRemove, compact = false }) {
  const snippet = content.length > 180 ? content.slice(0, 180) + "…" : content

  return (
    <div className={`jpc-root${compact ? " compact" : ""}`}>
      <div className="jpc-header">
        <div className="jpc-title-wrap">
          <BookOpen size={compact ? 10 : 11} color="var(--color-primary)" />
          <span className={`jpc-title${compact ? " compact" : ""}`} title={title}>
            {title}
          </span>
        </div>
        {onRemove && (
          <button onClick={onRemove} className="jpc-remove-btn">
            <X size={12} />
          </button>
        )}
      </div>
      <p className="jpc-snippet">
        {snippet}
      </p>
    </div>
  )
}
