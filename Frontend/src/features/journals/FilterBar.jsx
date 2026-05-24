import { useTranslation } from "react-i18next"
import { Pin, Star, List } from "lucide-react"
import { theme } from "../../theme"

const FILTERS = [
  { key: "all", icon: List },
  { key: "pinned", icon: Pin },
  { key: "favorites", icon: Star },
]

export default function FilterBar({ activeFilter, onChange, counts }) {
  const { t } = useTranslation()

  return (
    <div style={{ display: "flex", gap: 6, marginBottom: 16 }}>
      {FILTERS.map(({ key, icon: Icon }) => {
        const isActive = activeFilter === key
        const count = counts?.[key] ?? 0
        const label = t(`journal.filter.${key}`)
        return (
          <button
            key={key}
            onClick={() => onChange(key)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              borderRadius: 24,
              border: isActive
                ? `1px solid ${theme.primary}`
                : `1px solid ${theme.border}`,
              background: isActive ? theme.bg : "var(--color-card, white)",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 500,
              color: isActive ? theme.primaryText : theme.muted,
              transition: "all 0.15s",
              outline: "none",
            }}
          >
            <Icon size={14} />
            {label}
            {count > 0 && (
              <span
                style={{
                  fontSize: 10,
                  background: isActive ? theme.primary : theme.border,
                  color: isActive ? "white" : theme.muted,
                  borderRadius: 10,
                  padding: "1px 6px",
                  minWidth: 18,
                  textAlign: "center",
                  lineHeight: "16px",
                }}
              >
                {count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
