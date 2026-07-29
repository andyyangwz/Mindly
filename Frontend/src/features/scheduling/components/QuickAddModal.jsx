import { useState } from "react"
import { motion } from "framer-motion"
import { useTranslation } from "react-i18next"
import { X, Plus, Zap, ChevronDown } from "lucide-react"
import { Portal } from "../../../utils/portal"
import { useToast } from "../../../components/ui/Toast"
import "../../../styles/scheduling/index.css"

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
  const { t } = useTranslation()
  const [expandedId, setExpandedId] = useState(null)
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date()
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
  })
  const toast = useToast()

  if (!open) return null

  return (
    <Portal>
      <div className="qam-overlay" onClick={onClose}>
        <div className="qam-backdrop" />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          onClick={(e) => e.stopPropagation()}
          className="qam-modal"
        >
          <div className="qam-header">
            <div className="qam-header-left">
              <Zap size={16} color="var(--color-primary-text)" />
              <h2 className="qam-header-title">{t("scheduling.quickAdd.title")}</h2>
            </div>
            <button onClick={onClose} className="qam-close-btn">
              <X size={14} />
            </button>
          </div>

          <div className="qam-template-list">
            {TEMPLATES.map((template) => {
              const isExpanded = expandedId === template.id
              return (
                <div
                  key={template.id}
                  className={`qam-template-card ${isExpanded ? "" : "qam-template-card-default"}`}
                  style={{
                    border: isExpanded ? `1px solid ${template.color}` : undefined,
                  }}
                >
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : template.id)}
                    className="qam-template-row"
                    style={{
                      background: isExpanded
                        ? `color-mix(in srgb, ${template.color} 6%, transparent)`
                        : "transparent",
                    }}
                  >
                    <div className="qam-template-info">
                      <div className="qam-template-name-row">
                        <p className="qam-template-name">{template.title}</p>
                        <span
                          className="qam-template-level"
                          style={{
                            background: LEVEL_META[template.level]?.bg || "#6B728010",
                            color: LEVEL_META[template.level]?.color || "#6B7280",
                            border: `1px solid ${LEVEL_META[template.level]?.border || "#6B728020"}`,
                          }}
                        >
                          {t(`scheduling.eventForm.level_${template.level.charAt(0).toUpperCase() + template.level.slice(1)}`)}
                        </span>
                      </div>
                      <p className="qam-template-time">{template.startTime} – {template.endTime}</p>
                    </div>
                    <motion.div
                      animate={{ rotate: isExpanded ? 180 : 0 }}
                      transition={{ duration: 0.2, ease: "easeInOut" }}
                      className="qam-chevron-box"
                      style={{ background: `color-mix(in srgb, var(--color-muted) 10%, transparent)` }}
                    >
                      <ChevronDown size={12} color="var(--color-muted)" />
                    </motion.div>
                  </div>

                  <motion.div
                    animate={{ height: isExpanded ? "auto" : 0 }}
                    transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
                    className="qam-expanded-content"
                  >
                    <div className="qam-expanded-inner">
                      <div className="qam-expanded-border">
                        <div className="qam-date-row">
                          <div className="qam-date-field">
                            <label className="qam-date-label">{t("scheduling.quickAdd.date")}</label>
                            <input
                              type="date"
                              value={selectedDate}
                              onChange={(e) => setSelectedDate(e.target.value)}
                              className="qam-date-input"
                            />
                          </div>
                          <motion.button
                            onClick={() => {
                              toast.show(t("scheduling.quickAdd.added", { title: template.title, date: formatDateDisplay(selectedDate) }))
                              setExpandedId(null)
                            }}
                            className="qam-add-btn"
                            style={{
                              background: `linear-gradient(135deg, ${template.color}, ${template.color}dd)`,
                            }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <Plus size={12} />
                            {t("scheduling.quickAdd.addActivity")}
                          </motion.button>
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