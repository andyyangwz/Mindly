import { useState, useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"
import {
  Calendar,
  CheckSquare,
  Bell,
  PenSquare,
  BookOpen,
  ChevronDown,
} from "lucide-react"
import { theme } from "../../../theme"
import { journalService } from "../../../services/journalService"

export default function QuickActions() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [latestJournal, setLatestJournal] = useState(undefined)
  const dropdownRef = useRef(null)

  useEffect(() => {
    journalService
      .getLatestOpened()
      .then((j) => setLatestJournal(j))
      .catch(() => setLatestJournal(null))
  }, [])

  useEffect(() => {
    if (!dropdownOpen) return
    const handleClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setDropdownOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [dropdownOpen])

  const calendarItems = [
    {
      label: t("home.quickActions.addActivity"),
      icon: Calendar,
      color: "#3B82F6",
      to: "/app/productivity?action=createActivity",
    },
    {
      label: t("home.quickActions.addTask"),
      icon: CheckSquare,
      color: "#10B981",
      to: "/app/productivity?action=createTask",
    },
    {
      label: t("home.quickActions.addReminder"),
      icon: Bell,
      color: "#F59E0B",
      to: "/app/productivity?action=createReminder",
    },
  ]

  return (
    <div style={{ display: "flex", gap: 8 }}>
      <div ref={dropdownRef} style={{ flex: 1, position: "relative" }}>
        <button
          onClick={() => setDropdownOpen((o) => !o)}
          style={{
            width: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            padding: "6px 6px",
            borderRadius: 12,
            border: `1px solid ${dropdownOpen
              ? `color-mix(in srgb, ${theme.primary} 40%, transparent)`
              : theme.border}`,
            background: dropdownOpen
              ? `color-mix(in srgb, ${theme.primary} 10%, transparent)`
              : "var(--color-hover)",
            cursor: "pointer",
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => {
            if (!dropdownOpen) {
              e.currentTarget.style.background = `color-mix(in srgb, ${theme.primary} 10%, transparent)`
              e.currentTarget.style.borderColor = `color-mix(in srgb, ${theme.primary} 40%, transparent)`
            }
          }}
          onMouseLeave={(e) => {
            if (!dropdownOpen) {
              e.currentTarget.style.background = "var(--color-hover)"
              e.currentTarget.style.borderColor = theme.border
            }
          }}
        >
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: 8,
              background: "#3B82F614",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Calendar size={12} color="#3B82F6" />
          </div>
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: theme.dark,
              whiteSpace: "nowrap",
            }}
          >
            {t("home.quickActions.addToCalendar")}
          </span>
          <ChevronDown
            size={12}
            color={theme.muted}
            style={{
              transition: "transform 0.15s",
              transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)",
            }}
          />
        </button>

        {dropdownOpen && (
          <div
            style={{
              position: "absolute",
              top: "100%",
              left: 0,
              right: 0,
              marginTop: 4,
              background: "var(--color-card, white)",
              border: `1px solid ${theme.border}`,
              borderRadius: 12,
              boxShadow: "0 8px 24px rgba(0,0,0,0.12)",
              overflow: "hidden",
              zIndex: 500,
              animation: "fadeIn 0.12s ease",
            }}
          >
            {calendarItems.map((item, i) => (
              <button
                key={i}
                onClick={() => {
                  setDropdownOpen(false)
                  navigate(item.to)
                }}
                style={{
                  width: "100%",
                  display: "flex",
                  alignItems: "center",
                  gap: 10,
                  padding: "9px 14px",
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                  transition: "background 0.1s",
                  fontSize: 13,
                  fontWeight: 500,
                  color: theme.dark,
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--color-hover)"
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent"
                }}
              >
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 7,
                    background: `${item.color}14`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <item.icon size={13} color={item.color} />
                </div>
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => navigate("/app/journals/new")}
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 6,
          padding: "6px 6px",
          borderRadius: 12,
          border: `1px solid ${theme.border}`,
          background: "var(--color-hover)",
          cursor: "pointer",
          transition: "all 0.15s",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.background = `color-mix(in srgb, ${theme.primary} 10%, transparent)`
          e.currentTarget.style.borderColor = `color-mix(in srgb, ${theme.primary} 40%, transparent)`
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = "var(--color-hover)"
          e.currentTarget.style.borderColor = theme.border
        }}
      >
        <div
          style={{
            width: 24,
            height: 24,
            borderRadius: 8,
            background: "#8B5CF614",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <PenSquare size={12} color="#8B5CF6" />
        </div>
        <span
          style={{
            fontSize: 12,
            fontWeight: 500,
            color: theme.dark,
            whiteSpace: "nowrap",
          }}
        >
          {t("home.quickActions.writeJournal")}
        </span>
      </button>

      {latestJournal !== undefined && (
        <button
          onClick={() => {
            if (latestJournal) {
              navigate(`/app/journals/${latestJournal.id}`)
            }
          }}
          disabled={!latestJournal}
          style={{
            flex: 1,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            padding: "6px 6px",
            borderRadius: 12,
            border: `1px solid ${theme.border}`,
            background: latestJournal ? "var(--color-hover)" : `${theme.bg}`,
            cursor: latestJournal ? "pointer" : "default",
            transition: "all 0.15s",
            opacity: latestJournal ? 1 : 0.5,
          }}
          onMouseEnter={(e) => {
            if (latestJournal) {
              e.currentTarget.style.background = `color-mix(in srgb, ${theme.primary} 10%, transparent)`
              e.currentTarget.style.borderColor = `color-mix(in srgb, ${theme.primary} 40%, transparent)`
            }
          }}
          onMouseLeave={(e) => {
            if (latestJournal) {
              e.currentTarget.style.background = "var(--color-hover)"
              e.currentTarget.style.borderColor = theme.border
            }
          }}
        >
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: 8,
              background: latestJournal ? "#10B98114" : `${theme.muted}14`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <BookOpen size={12} color={latestJournal ? "#10B981" : theme.muted} />
          </div>
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: latestJournal ? theme.dark : theme.muted,
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {latestJournal
              ? latestJournal.title
              : t("home.quickActions.noRecentJournal")}
          </span>
        </button>
      )}
    </div>
  )
}
