import { useState } from "react"
import { motion } from "framer-motion"
import { X, Plus, Zap, ChevronDown } from "lucide-react"
import { Portal } from "../../../utils/portal"
import { theme } from "../../../theme"
import { useToast } from "../../../components/ui/Toast"

const LEVEL_META = {
  productive: { color: "#10B981", bg: "#10B98114", border: "#10B98130" },
  neutral: { color: "#6B7280", bg: "#6B728010", border: "#6B728020" },
  unproductive: { color: "#EF4444", bg: "#EF444414", border: "#EF444430" },
}

const TEMPLATES = [
  { id: "calc", title: "Calculus Class", startTime: "09:20", endTime: "11:00", color: "#3B82F6", level: "productive" },
  { id: "gym", title: "Gym Session", startTime: "07:00", endTime: "08:00", color: "#10B981", level: "neutral" },
  { id: "study", title: "Deep Study", startTime: "14:00", endTime: "17:00", color: "#8B5CF6", level: "productive" },
  { id: "piano", title: "Piano Practice", startTime: "18:00", endTime: "19:00", color: "#F59E0B", level: "productive" },
  { id: "church", title: "Church", startTime: "08:00", endTime: "10:00", color: "#EF4444", level: "neutral" },
]

function formatDateDisplay(dateStr) {
  const d = new Date(dateStr + "T00:00:00")
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
}

export default function QuickAddModal({ open, onClose }) {
  const [expandedId, setExpandedId] = useState(null)
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
  })
  const toast = useToast()

  if (!open) return null

  return (
    <Portal>
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 10000,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
        onClick={onClose}
      >
        <div
          style={{
            position: "absolute",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
          }}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          style={{
            position: "relative",
            width: 420,
            maxWidth: "calc(100vw - 32px)",
            background: "var(--color-card, white)",
            borderRadius: 16,
            border: `1px solid ${theme.border}`,
            boxShadow: "0 20px 60px rgba(0,0,0,0.15)",
            padding: 24,
            maxHeight: "calc(100vh - 80px)",
            overflowY: "auto",
          }}
        >
          {/* Header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Zap size={16} color={theme.primaryText} />
              <h2 style={{ fontSize: 14, fontWeight: 600, color: theme.dark, margin: 0 }}>
                Reusable Activities
              </h2>
            </div>
            <button
              onClick={onClose}
              style={{
                width: 28,
                height: 28,
                borderRadius: 8,
                border: "none",
                background: "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: theme.muted,
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = `color-mix(in srgb, ${theme.muted} 12%, transparent)`
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "transparent"
              }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Templates */}
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {TEMPLATES.map((template) => {
              const isExpanded = expandedId === template.id
              return (
                <div
                  key={template.id}
                  style={{
                    border: `1px solid ${isExpanded ? template.color : theme.border}`,
                    borderRadius: 12,
                    overflow: "hidden",
                    transition: "border-color 0.2s ease",
                  }}
                >
                  {/* Template row — always visible */}
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : template.id)}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "10px 14px",
                      cursor: "pointer",
                      background: isExpanded
                        ? `color-mix(in srgb, ${template.color} 6%, transparent)`
                        : "transparent",
                      transition: "background 0.15s ease",
                    }}
                    onMouseEnter={(e) => {
                      if (!isExpanded) {
                        e.currentTarget.style.background = `color-mix(in srgb, ${theme.muted} 6%, transparent)`
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isExpanded) {
                        e.currentTarget.style.background = "transparent"
                      }
                    }}
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <p style={{ fontSize: 13, fontWeight: 500, color: theme.dark, margin: 0 }}>
                          {template.title}
                        </p>
                        <span
                          style={{
                            fontSize: 8,
                            fontWeight: 600,
                            padding: "1px 6px",
                            borderRadius: 3,
                            background: LEVEL_META[template.level]?.bg || "#6B728010",
                            color: LEVEL_META[template.level]?.color || "#6B7280",
                            border: `1px solid ${LEVEL_META[template.level]?.border || "#6B728020"}`,
                            lineHeight: 1.4,
                            letterSpacing: "0.01em",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {template.level.charAt(0).toUpperCase() + template.level.slice(1)}
                        </span>
                      </div>
                      <p style={{ fontSize: 11, color: theme.muted, margin: "2px 0 0" }}>
                        {template.startTime} – {template.endTime}
                      </p>
                    </div>
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      style={{
                        width: 20,
                        height: 20,
                        borderRadius: 5,
                        background: `color-mix(in srgb, ${theme.muted} 10%, transparent)`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <ChevronDown size={12} color={theme.muted} />
                    </motion.div>
                  </div>

                  {/* Expanded section — date picker */}
                  <motion.div
                    animate={{ height: isExpanded ? "auto" : 0 }}
                    transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                    style={{ overflow: "hidden" }}
                  >
                    <div style={{ padding: "0 14px 12px" }}>
                      <div style={{ borderTop: `1px solid ${theme.border}`, paddingTop: 10 }}>
                        <div style={{ display: "flex", alignItems: "flex-end", gap: 10 }}>
                          <div style={{ flex: 1 }}>
                            <label
                              style={{
                                display: "block",
                                fontSize: 10,
                                fontWeight: 500,
                                color: theme.muted,
                                marginBottom: 4,
                              }}
                            >
                              Date
                            </label>
                            <input
                              type="date"
                              value={selectedDate}
                              onChange={(e) => setSelectedDate(e.target.value)}
                              style={{
                                width: "100%",
                                padding: "7px 10px",
                                borderRadius: 8,
                                border: `1px solid ${theme.border}`,
                                fontSize: 12,
                                color: theme.dark,
                                background: "var(--color-card, white)",
                                outline: "none",
                                boxSizing: "border-box",
                                fontFamily: "inherit",
                              }}
                            />
                          </div>
                          <button
                            onClick={() => {
                              toast.show(
                                `${template.title} added — ${formatDateDisplay(selectedDate)}`
                              )
                              setExpandedId(null)
                            }}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 5,
                              padding: "7px 14px",
                              borderRadius: 8,
                              border: "none",
                              background: `linear-gradient(135deg, ${template.color}, ${template.color}dd)`,
                              color: "white",
                              fontSize: 11,
                              fontWeight: 600,
                              cursor: "pointer",
                              whiteSpace: "nowrap",
                              transition: "opacity 0.15s",
                              height: 32,
                            }}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.opacity = "0.85"
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.opacity = "1"
                            }}
                          >
                            <Plus size={12} />
                            Add Activity
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              )
            })}
          </div>
        </motion.div>
      </div>
    </Portal>
  )
}
