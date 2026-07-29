import { useState, useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { Calendar } from "lucide-react"
import { journalService } from "../../../services/journalService"
import "../../../styles/spill/index.css"

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
    <div ref={ref} className="fjp-root">
      <p className="fjp-title">{t("spill.forwardJournal.title")}</p>
      {loading && (
        <p className="fjp-loading">{t("common.loading")}</p>
      )}
      {!loading && journals.length === 0 && (
        <p className="fjp-empty">{t("spill.forwardJournal.empty")}</p>
      )}
      {journals.map(j => (
        <button
          key={j.id}
          onClick={() => onSelect(j)}
          className="fjp-item"
        >
          <p className="fjp-item-title" title={j.title}>
            {j.title}
          </p>
          <div className="fjp-item-meta">
            <Calendar size={10} color="var(--color-muted)" />
            <span className="fjp-item-date">{j.date}</span>
          </div>
        </button>
      ))}
    </div>
  )
}
