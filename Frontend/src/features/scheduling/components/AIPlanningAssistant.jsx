import { motion } from "framer-motion"
import { useTranslation } from "react-i18next"
import { Lightbulb, Bot, Send } from "lucide-react"
import mascotSrc from "../../../assets/mascot_images/empathic.png"
import "../../../styles/scheduling/index.css"

export default function AIPlanningAssistant() {
  const { t } = useTranslation()
  const suggestions = Object.values(t("scheduling.aiPlanningAssistant.suggestions", { returnObjects: true }) ?? {})

  return (
    <motion.div
      className="apa-content-grid"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: 0.15, ease: "easeOut" }}
    >
      <div className="apa-section-card">
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

      <div className="apa-section-card">
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
            <motion.button
              className="apa-send-btn"
              style={{ background: "linear-gradient(135deg, var(--color-primary), var(--color-secondary))" }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.97 }}
            >
              <Send size={12} />
              {t("scheduling.aiPlanningAssistant.generateSchedule")}
            </motion.button>
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
    </motion.div>
  )
}
