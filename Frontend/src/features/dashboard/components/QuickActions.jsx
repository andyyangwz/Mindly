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
import "../../../styles/dashboard/index.css"

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
      label: t("dashboard.quickActions.addActivity"),
      icon: Calendar,
      color: "#3B82F6",
      to: "/app/scheduling?action=createActivity",
    },
    {
      label: t("dashboard.quickActions.addTask"),
      icon: CheckSquare,
      color: "#10B981",
      to: "/app/scheduling?action=createTask",
    },
    {
      label: t("dashboard.quickActions.addReminder"),
      icon: Bell,
      color: "#F59E0B",
      to: "/app/scheduling?action=createReminder",
    },
  ]

  return (
    <div className="quick-actions-row">
      <div ref={dropdownRef} className="quick-actions-dropdown">
        <button
          onClick={() => setDropdownOpen((o) => !o)}
          className="quick-actions-btn"
          style={{
            border: `1px solid ${dropdownOpen
              ? `color-mix(in srgb, ${theme.primary} 40%, transparent)`
              : "var(--color-border)"}`,
            background: dropdownOpen
              ? `color-mix(in srgb, ${theme.primary} 10%, transparent)`
              : "var(--color-hover)",
          }}
        >
          <div className="quick-actions-icon-box" style={{ background: "#3B82F614" }}>
            <Calendar size={12} color="#3B82F6" />
          </div>
          <span className="quick-actions-btn-label">
            {t("dashboard.quickActions.addToCalendar")}
          </span>
          <ChevronDown
            size={12}
            color={theme.muted}
            className="quick-actions-chevron"
            style={{ transform: dropdownOpen ? "rotate(180deg)" : "rotate(0deg)" }}
          />
        </button>

        {dropdownOpen && (
          <div className="quick-actions-dropdown-menu">
            {calendarItems.map((item, i) => (
              <button
                key={i}
                className="quick-actions-menu-item"
                onClick={() => {
                  setDropdownOpen(false)
                  navigate(item.to)
                }}
              >
                <div className="quick-actions-menu-icon" style={{ background: `${item.color}14` }}>
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
        className="quick-actions-btn"
      >
        <div className="quick-actions-icon-box" style={{ background: "#8B5CF614" }}>
          <PenSquare size={12} color="#8B5CF6" />
        </div>
        <span className="quick-actions-btn-label">
          {t("dashboard.quickActions.writeJournal")}
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
          className="quick-actions-btn"
          style={{
            background: latestJournal ? "var(--color-hover)" : "var(--color-bg)",
          }}
        >
          <div
            className="quick-actions-icon-box"
            style={{ background: latestJournal ? "#10B98114" : `${theme.muted}14` }}
          >
            <BookOpen size={12} color={latestJournal ? "#10B981" : theme.muted} />
          </div>
          <span
            className="quick-actions-btn-label quick-actions-truncated"
            style={{ color: latestJournal ? "var(--color-dark)" : "var(--color-muted)" }}
          >
            {latestJournal
              ? latestJournal.title
              : t("dashboard.quickActions.noRecentJournal")}
          </span>
        </button>
      )}
    </div>
  )
}
