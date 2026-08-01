import { useTranslation } from "react-i18next"
import { Sparkles } from "lucide-react"
import AIPlanningAssistant from "./components/AIPlanningAssistant"
import "../../styles/scheduling/index.css"

export default function AIPlanningPage() {
  const { t } = useTranslation()

  return (
    <div className="apa-page">
      <div className="apa-page-header">
        <div
          className="apa-page-icon"
          style={{ background: "color-mix(in srgb, var(--color-primary) 22%, transparent)" }}
        >
          <Sparkles size={18} color="var(--color-primary-text)" />
        </div>
        <div>
          <h1 className="apa-page-title">{t("scheduling.aiPlanningAssistant.title")}</h1>
          <p className="apa-page-subtitle">{t("scheduling.aiPlanningAssistant.subtitle")}</p>
        </div>
      </div>

      <AIPlanningAssistant />
    </div>
  )
}
