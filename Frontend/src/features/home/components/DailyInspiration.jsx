import { useTranslation } from "react-i18next"
import { Sparkles } from "lucide-react"
import { theme } from "../../../theme"
import { useRandomHomeContent } from "../hooks/useRandomHomeContent"

export default function DailyInspiration() {
  const { t } = useTranslation()
  const { quote } = useRandomHomeContent()

  return (
    <div style={{
      background: "var(--color-card)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      borderRadius: 14,
      border: `1px solid color-mix(in srgb, ${theme.primary} 22%, transparent)`,
      padding: "12px 16px",
      display: "flex",
      gap: 10,
      alignItems: "flex-start",
      boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
    }}>
      <div style={{
        width: 32,
        height: 32,
        borderRadius: 9,
        background: theme.primary,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}>
        <Sparkles size={16} color="white" />
      </div>
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: 10, fontWeight: 600, color: theme.primary, letterSpacing: "0.08em", textTransform: "uppercase" }}>
          {t("home.dailyInspiration.title")}
        </span>
        <p style={{ fontSize: 13, color: theme.dark, lineHeight: 1.6, margin: "4px 0 0 0", fontWeight: 400 }}>
          &ldquo;{quote.text}&rdquo;
        </p>
      </div>
    </div>
  )
}
