import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { useTranslation } from "react-i18next"
import { Sparkles, Lightbulb, Bot, Send, ChevronDown } from "lucide-react"
import mascotSrc from "../../../assets/mascot_images/empathic.png"
import "../../../styles/scheduling/index.css"

export default function AIPlanningAssistant() {
  const { t } = useTranslation()
  const [expanded, setExpanded] = useState(false)
  const contentRef = useRef(null)
  const [contentHeight, setContentHeight] = useState(0)
  const suggestions = Object.values(t("scheduling.aiPlanningAssistant.suggestions", { returnObjects: true }) ?? {})

  useEffect(() => {
    if (contentRef.current) {
      setContentHeight(contentRef.current.scrollHeight)
    }
  }, [expanded])

  return (
    <div
      className="apa-container"
      style={{ cursor: expanded ? "default" : "pointer" }}
      onClick={() => !expanded && setExpanded(true)}
    >
      <div
        className="apa-header"
        style={{ cursor: expanded ? "pointer" : "default" }}
        onClick={() => expanded && setExpanded(false)}
      >
        <div className="apa-icon-box" style={{ background: "color-mix(in srgb, var(--color-primary) 22%, transparent)" }}>
          <Sparkles size={16} color="var(--color-primary-text)" />
        </div>
        <div className="apa-header-text">
          <p className="apa-title">{t("scheduling.aiPlanningAssistant.title")}</p>
          {!expanded && (
            <p className="apa-subtitle">{t("scheduling.aiPlanningAssistant.subtitle")}</p>
          )}
        </div>
        <motion.div
          animate={{ rotate: expanded ? 180 : 0 }}
          transition={{ duration: 0.25, ease: "easeInOut" }}
          className="apa-chevron-box"
          style={{ background: "color-mix(in srgb, var(--color-muted) 10%, transparent)" }}
        >
          <ChevronDown size={14} color="var(--color-muted)" />
        </motion.div>
      </div>

      <motion.div
        animate={{ height: expanded ? contentHeight : 0 }}
        transition={{ duration: 0.3, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="apa-expandable"
      >
        <div ref={contentRef}>
          <div className="apa-content-grid">
            <div>
              <div className="apa-section-header">
                <Lightbulb size={13} color="var(--color-primary-text)" />
                <p className="apa-section-title">{t("scheduling.aiPlanningAssistant.smartSuggestions")}</p>
              </div>
              {suggestions.map((s, i) => (
                <div key={i} className="apa-suggestion-card">
                  <div className="apa-suggestion-dot" style={{ background: "var(--color-secondary)" }} />
                  <p className="apa-suggestion-text">{s}</p>
                </div>
              ))}
            </div>

            <div>
              <div className="apa-section-header">
                <Bot size={13} color="var(--color-primary-text)" />
                <p className="apa-section-title">{t("scheduling.aiPlanningAssistant.aiScheduler")}</p>
              </div>
              <div className="apa-scheduler-box">
                <textarea
                  placeholder={t("scheduling.aiPlanningAssistant.placeholder")}
                  rows={4}
                  className="apa-textarea"
                />
                <div className="apa-scheduler-footer">
                  <button
                    className="apa-send-btn"
                    style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}
                  >
                    <Send size={12} />
                    {t("scheduling.aiPlanningAssistant.generateSchedule")}
                  </button>
                </div>
                <motion.img
                  src={mascotSrc}
                  alt=""
                  animate={{ y: [0, -4, 0] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className="apa-mascot"
                />
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}