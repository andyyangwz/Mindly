import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { Sparkles, PenSquare, Calendar, BarChart3, MessageCircle } from "lucide-react"
import { theme } from "../../../theme"

export default function QuickActions() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const actions = [
    { label: t("home.quickActions.newJournal"), icon: PenSquare, color: "#8B5CF6", to: "/app/journals/new" },
    { label: t("home.quickActions.addTask"), icon: Calendar, color: "#3B82F6", to: "/app/productivity?action=create" },
    { label: t("home.quickActions.viewInsights"), icon: BarChart3, color: "#10B981", to: "/app/insight" },
    { label: t("home.quickActions.talkToAI"), icon: MessageCircle, color: "#8B5CF6", to: "/app/spill" },
  ]

  return (
    <div style={{
      background: "var(--color-card)",
      borderRadius: 18,
      padding: "6px 14px",
      boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
      height: "100%",
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
    }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
        <Sparkles size={14} color={theme.primary} />
        <span style={{ fontSize: 14, fontWeight: 600, color: theme.dark }}>{t("home.quickActions.title")}</span>
      </div>
      <div style={{ display: "flex", gap: 8 }}>
        {actions.map((a, i) => (
          <button
            key={i}
            onClick={() => navigate(a.to)}
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              padding: "6px 6px",
              borderRadius: 12,
              border: `1px solid ${theme.border}`,
              background: theme.bg,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = `color-mix(in srgb, ${theme.primary} 10%, transparent)`; e.currentTarget.style.borderColor = `color-mix(in srgb, ${theme.primary} 40%, transparent)` }}
            onMouseLeave={(e) => { e.currentTarget.style.background = theme.bg; e.currentTarget.style.borderColor = theme.border }}
          >
            <div style={{
              width: 24,
              height: 24,
              borderRadius: 8,
              background: `${a.color}14`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}>
              <a.icon size={12} color={a.color} />
            </div>
            <span style={{ fontSize: 12, fontWeight: 500, color: theme.dark, whiteSpace: "nowrap" }}>{a.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
