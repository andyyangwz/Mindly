import { useState, useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { Plus, Target, Waves, Mic, Pencil, Trash2 } from "lucide-react"
import { theme } from "../../../theme"

const GAP = 6

export default function ActivityContextMenu({ x, y, activity, menuRef, containerRef, onEdit, onDelete, onAddActivity, onAddTask, onVoice }) {
  const { t } = useTranslation()
  const [pos, setPos] = useState({ left: 0, top: 0 })

  useEffect(() => {
    if (!menuRef?.current || !containerRef?.current) return
    const cr = containerRef.current.getBoundingClientRect()

    // Convert viewport coords to container-relative
    const originLeft = x - cr.left
    const originTop = y - cr.top

    requestAnimationFrame(() => {
      if (!menuRef?.current) return
      const mr = menuRef.current.getBoundingClientRect()
      const mw = mr.width
      const mh = mr.height

      let left = originLeft
      let top = originTop

      // Horizontal: stay within container
      if (left + mw > cr.width - GAP) left = cr.width - mw - GAP
      if (left < GAP) left = GAP

      // Vertical: try below first, flip upward if no space
      const spaceBelow = cr.height - originTop
      const spaceAbove = originTop
      if (mh > spaceBelow && spaceAbove >= mh) {
        top = originTop - mh
      } else if (mh > spaceBelow) {
        top = cr.height - mh - GAP
      }
      if (top < GAP) top = GAP

      setPos({ left, top })
    })
  }, [x, y, menuRef, containerRef])

  if (activity) {
    return (
      <div
        ref={menuRef}
        style={{
          position: "absolute",
          left: pos.left,
          top: pos.top,
          zIndex: theme.z.modal + 10,
          background: "var(--color-card, white)",
          borderRadius: 12,
          border: `1px solid ${theme.border}`,
          boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
          padding: 4,
          minWidth: 140,
        }}
      >
        <button
          onClick={() => onEdit(activity)}
          style={menuItemStyle()}
          onMouseEnter={(e) => { e.currentTarget.style.background = `color-mix(in srgb, ${theme.primary} 10%, transparent)` }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
        >
          <Pencil size={14} />
          {t("productivity.event.edit")}
        </button>
        <button
          onClick={() => onDelete(activity.id)}
          style={menuItemStyle("#EF4444")}
          onMouseEnter={(e) => { e.currentTarget.style.background = "#EF444410" }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
        >
          <Trash2 size={14} />
          {t("productivity.event.delete")}
        </button>
      </div>
    )
  }

  return (
    <div
      ref={menuRef}
      style={{
        position: "absolute",
        left: pos.left,
        top: pos.top,
        zIndex: theme.z.modal + 10,
        background: "var(--color-card, white)",
        borderRadius: 12,
        border: `1px solid ${theme.border}`,
        boxShadow: "0 8px 32px rgba(0,0,0,0.18)",
        padding: 4,
        minWidth: 180,
        overflow: "hidden",
      }}
    >
      <div style={{ padding: "6px 12px 4px", fontSize: 10, fontWeight: 600, color: theme.muted, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        Add to Calendar
      </div>
      <button
        onClick={onAddActivity}
        style={{
          ...menuItemStyle("#10B981"),
          gap: 10,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "#10B9810C" }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
      >
        <span style={{
          width: 26, height: 26, borderRadius: 8,
          background: "#10B98114",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <Waves size={14} color="#10B981" />
        </span>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: theme.dark }}>Activity</span>
          <span style={{ fontSize: 10, color: theme.muted, fontWeight: 400 }}>Schedule a time block</span>
        </div>
      </button>
      <button
        onClick={onAddTask}
        style={{
          ...menuItemStyle("#6366F1"),
          gap: 10,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "#6366F10C" }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
      >
        <span style={{
          width: 26, height: 26, borderRadius: 8,
          background: "#6366F114",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <Target size={14} color="#6366F1" />
        </span>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: theme.dark }}>Task</span>
          <span style={{ fontSize: 10, color: theme.muted, fontWeight: 400 }}>Create a deadline</span>
        </div>
      </button>
      <div style={{ height: 1, background: theme.border, margin: "4px 0" }} />
      <button
        onClick={onVoice}
        style={{
          ...menuItemStyle("#7C3AED"),
          gap: 10,
        }}
        onMouseEnter={(e) => { e.currentTarget.style.background = "#7C3AED0C" }}
        onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
      >
        <span style={{
          width: 26, height: 26, borderRadius: 8,
          background: "#7C3AED14",
          display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
        }}>
          <Mic size={14} color="#7C3AED" />
        </span>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 1 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: theme.dark }}>Use Voice</span>
          <span style={{ fontSize: 10, color: theme.muted, fontWeight: 400 }}>Speak your plan</span>
        </div>
      </button>
    </div>
  )
}

function menuItemStyle(color) {
  return {
    display: "flex",
    alignItems: "center",
    gap: 8,
    width: "100%",
    padding: "8px 12px",
    border: "none",
    background: "transparent",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 13,
    fontWeight: 500,
    color: color || theme.dark,
    transition: "background 0.1s",
  }
}
