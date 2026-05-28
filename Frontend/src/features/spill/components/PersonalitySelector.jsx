import { useState, useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { ChevronDown, Heart, Lightbulb, Trophy } from "lucide-react"
import { theme } from "../../../theme"

const PERSONALITIES = [
  { id: "empathetic", icon: Heart, color: "#7B61FF" },
  { id: "problem_solver", icon: Lightbulb, color: "#14B8A6" },
  { id: "motivational", icon: Trophy, color: "#FFC107" },
]

const PERSONALITY_KEYS = {
  empathetic: "spill.personality.empathic",
  problem_solver: "spill.personality.problemSolver",
  motivational: "spill.personality.coach",
}

export default function PersonalitySelector({ personality, onChange }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)
  const cur = PERSONALITIES.find(p => p.id === personality) || PERSONALITIES[0]

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  const handleSelect = (id) => {
    onChange?.(id)
    setOpen(false)
  }

  return (
    <div ref={ref} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          padding: "4px 10px",
          border: `1px solid ${theme.border}`, borderRadius: 8,
          background: "transparent",
          cursor: "pointer", transition: "all 0.15s",
          fontSize: 11, fontWeight: 500, color: theme.muted,
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = cur.color
          e.currentTarget.style.color = cur.color
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = theme.border
          e.currentTarget.style.color = theme.muted
        }}
      >
        <cur.icon size={12} />
        {t(PERSONALITY_KEYS[cur.id])}
        <ChevronDown size={11} style={{ transform: open ? "rotate(180deg)" : "none", transition: "0.15s" }} />
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 4px)", right: 0,
          background: "var(--color-card, white)", borderRadius: 10,
          border: `1px solid ${theme.border}`,
          boxShadow: "0 8px 24px rgba(0,0,0,0.10)",
          zIndex: 100, width: 200, padding: 4,
        }}>
          {PERSONALITIES.map(p => (
            <button
              key={p.id}
              onClick={() => handleSelect(p.id)}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 8,
                padding: "7px 8px", borderRadius: 7,
                border: personality === p.id ? `1px solid ${p.color}33` : "1px solid transparent",
                background: personality === p.id ? `${p.color}08` : "transparent",
                cursor: "pointer", transition: "all 0.12s",
              }}
            >
              <p.icon size={13} color={p.color} />
              <span style={{ fontSize: 11, fontWeight: 500, color: theme.dark }}>{t(PERSONALITY_KEYS[p.id])}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
