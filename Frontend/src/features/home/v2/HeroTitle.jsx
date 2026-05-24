import { useTranslation } from "react-i18next"
import { theme } from "../../../theme"
import { useAuth } from "../../../context/AuthContext"

export default function HeroTitle() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const now = new Date()
  const locale = i18n.language?.startsWith("id") ? "id-ID" : "en-US"
  const dateStr = now.toLocaleDateString(locale, { weekday: "long", month: "long", day: "numeric", year: "numeric" })

  return (
    <div style={{ marginBottom: 24 }}>
      <h1 style={{ fontSize: 26, fontWeight: 700, color: theme.dark, margin: 0, marginBottom: 6, letterSpacing: "-0.02em" }}>
        {t("home.hero.welcome", { name: user?.first_name || "there" })} 👋
      </h1>
      <p style={{ fontSize: 14, color: theme.muted, margin: 0, fontWeight: 400 }}>
        {dateStr}
      </p>
    </div>
  )
}
