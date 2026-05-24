import { useState, useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { Plus, Target, Waves, Mic, CheckCircle2, Circle, RotateCcw, Eye, Trash2 } from "lucide-react"
import { theme } from "../../theme"

const STATUS_META = {
  "Done": { color: "#10B981", bg: "#10B98114", border: "#10B98130", icon: CheckCircle2 },
  "In Progress": { color: "#B45309", bg: "#B4530918", border: "#B4530940", icon: RotateCcw },
  "To Do": { color: "#6B7280", bg: "#6B728010", border: "#6B728020", icon: Circle },
}

const STATUS_OPTIONS = ["To Do", "In Progress", "Done"]

export default function ContextMenu({ x, y, activity, menuRef, containerRef, onViewDetails, onStatusChange, onDelete, onAddActivity, onAddTask, onVoice }) {
  const { t } = useTranslation()
  const [pos, setPos] = useState({ left: 0, top: 0 })

  useEffect(() => {
    if (!menuRef?.current || !containerRef?.current) return
    const containerRect = containerRef.current.getBoundingClientRect()
    const vw = window.innerWidth
    const vh = window.innerHeight

    const left = x - containerRect.left
    const top = y - containerRect.top

    requestAnimationFrame(() => {
      if (!menuRef?.current) return
      const rect = menuRef.current.getBoundingClientRect()
      const menuH = rect.height
      const menuW = rect.width

      let finalLeft = left
      let finalTop = top

      const rightEdge = left + menuW
      const bottomEdge = top + menuH

      if (rightEdge > containerRect.width) {
        finalLeft = containerRect.width - menuW - 8
      }
      if (finalLeft < 0) {
        finalLeft = 8
      }
      if (bottomEdge > vh - containerRect.top) {
        finalTop = y - containerRect.top - menuH
      }
      if (finalTop < 0) {
        finalTop = 8
      }

      setPos({ left: finalLeft, top: finalTop })
    })
  }, [x, y, menuRef, containerRef])

  const tStatus = (s) => {
    const k = { "To Do": "todo", "In Progress": "inProgress", "Done": "done" }
    return t(`productivity.status.${k[s]}`)
  }

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
          minWidth: 170,
        }}
      >
        <button
          onClick={() => onViewDetails(activity)}
          style={menuItemStyle()}
          onMouseEnter={(e) => { e.currentTarget.style.background = `color-mix(in srgb, ${theme.primary} 10%, transparent)` }}
          onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
        >
          <Eye size={14} />
          {t("productivity.event.details")}
        </button>
        <div style={{ height: 1, background: theme.border, margin: "4px 0" }} />
        {STATUS_OPTIONS.filter(s => s !== activity.status).map(s => {
          const meta = STATUS_META[s]
          const Icon = meta.icon
          return (
            <button
              key={s}
              onClick={() => onStatusChange(activity, s)}
              style={menuItemStyle(s === "Done" ? "#10B981" : s === "In Progress" ? "#B45309" : "#6B7280")}
              onMouseEnter={(e) => { e.currentTarget.style.background = meta.bg }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
            >
              <Icon size={14} />
              {t("productivity.event.setTo", { status: tStatus(s) })}
            </button>
          )
        })}
        <div style={{ height: 1, background: theme.border, margin: "4px 0" }} />
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
