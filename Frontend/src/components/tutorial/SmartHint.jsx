import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { useTutorial } from "./TutorialContext"
import { theme } from "../../theme"

const HINT_STORAGE = "mindly_smart_hints"

function loadDismissed() {
  try {
    return new Set(JSON.parse(localStorage.getItem(HINT_STORAGE) || "[]"))
  } catch {
    return new Set()
  }
}

function saveDismissed(set) {
  localStorage.setItem(HINT_STORAGE, JSON.stringify([...set]))
}

export default function SmartHint({ id, text, position = "bottom-left", offset = 12 }) {
  const { openTutorial } = useTutorial()
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    const dismissed = loadDismissed()
    if (dismissed.has(id)) return

    const showTimer = setTimeout(() => setVisible(true), 1200)
    return () => clearTimeout(showTimer)
  }, [id])

  if (!visible) return null

  const dismiss = () => {
    setVisible(false)
    const dismissed = loadDismissed()
    dismissed.add(id)
    saveDismissed(dismissed)
  }

  const posStyles = {
    "bottom-left": { bottom: offset, left: offset },
    "bottom-right": { bottom: offset, right: offset },
    "top-left": { top: offset, left: offset },
    "top-right": { top: offset, right: offset },
  }

  return (
    <div
      style={{
        position: "absolute",
        ...(posStyles[position] || posStyles["bottom-left"]),
        zIndex: 100,
        maxWidth: 260,
        padding: "10px 14px",
        borderRadius: 12,
        background: "var(--color-card, white)",
        border: `1px solid ${theme.border}`,
        boxShadow: `0 8px 28px rgba(0,0,0,0.1), 0 0 0 1px ${theme.primary}11`,
        fontSize: 12,
        lineHeight: 1.5,
        color: theme.dark,
        animation: "hint-fade-in 0.4s ease both",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
        <p style={{ margin: 0, flex: 1 }}>
          {text}{" "}
        </p>
        <button
          type="button"
          onClick={dismiss}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 2,
            display: "flex",
            color: theme.muted,
            flexShrink: 0,
            marginTop: -2,
          }}
        >
          <X size={12} />
        </button>
      </div>
      <style>{`
        @keyframes hint-fade-in {
          from { opacity: 0; transform: translateY(8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
