import { useState, useEffect, useRef, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { Calendar } from "lucide-react"
import { theme } from "../../../theme"
import { journalService } from "../../../services/journalService"

export default function ForwardJournalPopover({ onSelect, onClose }) {
  const { t } = useTranslation()
  const [journals, setJournals] = useState([])
  const [loading, setLoading] = useState(true)
  const ref = useRef(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const result = await journalService.getForwardable()
        if (!cancelled) setJournals(result.journals)
      } catch {
        if (!cancelled) setJournals([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) onClose?.()
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [onClose])

  return (
    <div
      ref={ref}
      style={{
        position: "absolute", bottom: "calc(100% + 8px)", left: 0,
        background: "var(--color-card, white)", borderRadius: 12,
        border: `1px solid ${theme.border}`,
        boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
        zIndex: 100, width: 280, padding: 6,
        maxHeight: 280, overflowY: "auto",
      }}
    >
      <p style={{ fontSize: 9, fontWeight: 700, color: theme.muted, textTransform: "uppercase", letterSpacing: "0.08em", padding: "4px 8px 4px" }}>{t("spill.forwardJournal.title")}</p>
      {loading && (
        <p style={{ fontSize: 11, color: theme.muted, textAlign: "center", padding: "16px 0" }}>{t("common.loading")}</p>
      )}
      {!loading && journals.length === 0 && (
        <p style={{ fontSize: 11, color: theme.muted, textAlign: "center", padding: "16px 0" }}>{t("spill.forwardJournal.empty")}</p>
      )}
      {journals.map(j => (
        <button
          key={j.id}
          onClick={() => onSelect(j)}
          style={{
            width: "100%", display: "flex", flexDirection: "column", gap: 4,
            padding: "8px 10px", borderRadius: 8,
            border: "1px solid transparent",
            background: "transparent",
            cursor: "pointer", transition: "all 0.12s",
            textAlign: "left",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = `color-mix(in srgb, ${theme.primary} 8%, transparent)`
            e.currentTarget.style.borderColor = `color-mix(in srgb, ${theme.primary} 22%, transparent)`
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "transparent"
            e.currentTarget.style.borderColor = "transparent"
          }}
        >
          <p
            style={{
              fontSize: 12, fontWeight: 600, color: theme.dark,
              overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              margin: 0,
            }}
            title={j.title}
          >
            {j.title}
          </p>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            <Calendar size={10} color={theme.muted} />
            <span style={{ fontSize: 9, color: theme.muted }}>{j.date}</span>
          </div>
        </button>
      ))}
    </div>
  )
}
