import { useState, useEffect } from "react"
import { X } from "lucide-react"
import { useTutorial } from "./TutorialContext"
import "../../styles/shared/index.css"

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
  useTutorial()
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
      className="sh-hint"
      style={{
        ...(posStyles[position] || posStyles["bottom-left"]),
      }}
    >
      <div className="sh-content">
        <p className="sh-text">{text}</p>
        <button type="button" onClick={dismiss} className="sh-dismiss-btn">
          <X size={12} />
        </button>
      </div>
    </div>
  )
}
