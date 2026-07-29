import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { Target, Waves, Bell, Mic, Pencil, Trash2 } from "lucide-react"
import "../../../styles/scheduling/index.css"

const GAP = 6

export default function ActivityContextMenu({ x, y, activity, menuRef, containerRef, onEdit, onDelete, onAddActivity, onAddTask, onAddReminder, onVoice }) {
  const { t } = useTranslation()
  const [pos, setPos] = useState({ left: 0, top: 0 })

  useEffect(() => {
    if (!menuRef?.current || !containerRef?.current) return
    const cr = containerRef.current.getBoundingClientRect()

    const originLeft = x - cr.left
    const originTop = y - cr.top

    requestAnimationFrame(() => {
      if (!menuRef?.current) return
      const mr = menuRef.current.getBoundingClientRect()
      const mw = mr.width
      const mh = mr.height

      let left = originLeft
      let top = originTop

      if (left + mw > cr.width - GAP) left = cr.width - mw - GAP
      if (left < GAP) left = GAP

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
        className="acm-menu acm-menu-sm"
        style={{ left: pos.left, top: pos.top }}
      >
        <button
          onClick={() => onEdit(activity)}
          className="acm-menu-item"
          style={{ color: "var(--color-dark)" }}
        >
          <Pencil size={14} />
          {t("scheduling.event.edit")}
        </button>
        <button
          onClick={() => onDelete(activity.id)}
          className="acm-menu-item"
          style={{ color: "#EF4444" }}
        >
          <Trash2 size={14} />
          {t("scheduling.event.delete")}
        </button>
      </div>
    )
  }

  return (
    <div
      ref={menuRef}
      className="acm-menu acm-menu-lg"
      style={{ left: pos.left, top: pos.top }}
    >
      <div className="acm-section-header">Add to Calendar</div>
      <button
        onClick={onAddActivity}
        className="acm-menu-item acm-menu-item-wide"
        style={{ color: "#10B981" }}
      >
        <span className="acm-icon-box" style={{ background: "#10B98114" }}>
          <Waves size={14} color="#10B981" />
        </span>
        <div className="acm-item-text">
          <span className="acm-item-title">Activity</span>
          <span className="acm-item-desc">Schedule a time block</span>
        </div>
      </button>
      <button
        onClick={onAddTask}
        className="acm-menu-item acm-menu-item-wide"
        style={{ color: "#6366F1" }}
      >
        <span className="acm-icon-box" style={{ background: "#6366F114" }}>
          <Target size={14} color="#6366F1" />
        </span>
        <div className="acm-item-text">
          <span className="acm-item-title">Task</span>
          <span className="acm-item-desc">Create a deadline</span>
        </div>
      </button>
      <button
        onClick={onAddReminder}
        className="acm-menu-item acm-menu-item-wide"
        style={{ color: "#F59E0B" }}
      >
        <span className="acm-icon-box" style={{ background: "#F59E0B14" }}>
          <Bell size={14} color="#F59E0B" />
        </span>
        <div className="acm-item-text">
          <span className="acm-item-title">Reminder</span>
          <span className="acm-item-desc">Set a reminder</span>
        </div>
      </button>
      <div className="acm-separator" />
      <button
        onClick={onVoice}
        className="acm-menu-item acm-menu-item-wide"
        style={{ color: "#7C3AED" }}
      >
        <span className="acm-icon-box" style={{ background: "#7C3AED14" }}>
          <Mic size={14} color="#7C3AED" />
        </span>
        <div className="acm-item-text">
          <span className="acm-item-title">Use Voice</span>
          <span className="acm-item-desc">Speak your plan</span>
        </div>
      </button>
    </div>
  )
}