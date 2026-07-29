import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useAuth } from "../../../context/AuthContext"
import "../../../styles/dashboard/index.css"

export default function HeroTitle() {
  const { t, i18n } = useTranslation()
  const { user } = useAuth()
  const [showGreeting, setShowGreeting] = useState(true)
  const now = new Date()
  const locale = i18n.language?.startsWith("id") ? "id-ID" : "en-US"
  const dateStr = now.toLocaleDateString(locale, { weekday: "long", month: "long", day: "numeric", year: "numeric" })

  useEffect(() => {
    const timer = setTimeout(() => setShowGreeting(false), 3000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <div className="dashboard-hero-title" style={{ position: "relative", minHeight: 80 }}>
      <div
        style={{
          opacity: showGreeting ? 1 : 0,
          transform: showGreeting ? "translateY(0)" : "translateY(-8px)",
          transition: "opacity 0.6s ease, transform 0.6s ease",
          pointerEvents: showGreeting ? "auto" : "none",
        }}
      >
        <h1>{t("dashboard.hero.welcome", { name: user?.first_name || "there" })} 👋</h1>
        <p>{dateStr}</p>
      </div>
      <div
        style={{
          opacity: showGreeting ? 0 : 1,
          transform: showGreeting ? "translateY(8px)" : "translateY(0)",
          transition: "opacity 0.6s ease, transform 0.6s ease",
          position: "absolute",
          top: 0,
          left: 0,
          pointerEvents: showGreeting ? "none" : "auto",
        }}
      >
        <h1 style={{ margin: 0 }}>Dashboard</h1>
      </div>
    </div>
  )
}
