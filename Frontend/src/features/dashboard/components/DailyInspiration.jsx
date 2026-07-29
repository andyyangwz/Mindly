import { motion } from "framer-motion"
import { useTranslation } from "react-i18next"
import { useRandomDashboardContent } from "../../../hooks/dashboard/useRandomDashboardContent"
import mascotSrc from "../../../assets/mascot_images/empathic.png"
import "../../../styles/dashboard/index.css"

export default function DailyInspiration() {
  const { t } = useTranslation()
  const { quote } = useRandomDashboardContent()

  return (
    <div className="daily-inspiration">
      <motion.img
        src={mascotSrc}
        alt=""
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="daily-inspiration-img"
      />
      <div className="daily-inspiration-bubble">
        <div className="daily-inspiration-tail" />
        <span className="daily-inspiration-label">{t("dashboard.dailyInspiration.title")}</span>
        <p className="daily-inspiration-quote">&ldquo;{quote.text}&rdquo;</p>
      </div>
    </div>
  )
}
