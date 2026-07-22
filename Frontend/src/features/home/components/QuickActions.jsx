import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import { PenSquare, Calendar, CheckSquare, MessageCircle } from "lucide-react"
import { theme } from "../../../theme"

export default function QuickActions() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const actions = [
    { label: t("home.quickActions.addActivity"), icon: Calendar, color: "#3B82F6", to: "/app/productivity?action=createActivity" },
    { label: t("home.quickActions.addTask"), icon: CheckSquare, color: "#10B981", to: "/app/productivity?action=createTask" },
    { label: t("home.quickActions.addJournal"), icon: PenSquare, color: "#8B5CF6", to: "/app/journals/new" },
    { label: t("home.quickActions.spillAI"), icon: MessageCircle, color: "#8B5CF6", to: "/app/spill" },
  ]

  return (
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
  )
}
