import { useState, useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { ChevronDown, Heart, Lightbulb, Trophy } from "lucide-react"
import "../../../styles/spill/index.css"

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
    <div ref={ref} className="ps-root">
      <button
        onClick={() => setOpen(o => !o)}
        className="ps-trigger"
        style={{ borderColor: open ? cur.color : undefined, color: open ? cur.color : undefined }}
      >
        <cur.icon size={12} />
        {t(PERSONALITY_KEYS[cur.id])}
        <ChevronDown size={11} className={`ps-chevron${open ? " open" : ""}`} />
      </button>

      {open && (
        <div className="ps-dropdown">
          {PERSONALITIES.map(p => (
            <button
              key={p.id}
              onClick={() => handleSelect(p.id)}
              className="ps-option"
              style={{
                border: personality === p.id ? `1px solid ${p.color}33` : "1px solid transparent",
                background: personality === p.id ? `${p.color}08` : "transparent",
              }}
            >
              <p.icon size={13} color={p.color} />
              <span className="ps-option-label">{t(PERSONALITY_KEYS[p.id])}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
