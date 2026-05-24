import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next"
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react"
import { theme } from "../../../theme"
import InfoButton from "../../../components/tutorial/InfoButton"
import { statsService } from "../services/statsService"

function getMonday(d) {
  const date = new Date(d);
  const day = date.getDay();
  const diff = date.getDate() - day + (day === 0 ? -6 : 1);
  date.setDate(diff);
  return date;
}

function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function WeeklyOverview() {
  const { t } = useTranslation()

  const [weekStart, setWeekStart] = useState(() => formatDate(getMonday(new Date())))
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [data, setData] = useState(null)
  const fetchId = useRef(0)

  const goBack = useCallback(() => {
    setWeekStart((prev) => {
      const d = new Date(prev + "T00:00:00");
      d.setDate(d.getDate() - 7);
      return formatDate(d);
    });
  }, [])

  const goForward = useCallback(() => {
    setWeekStart((prev) => {
      const d = new Date(prev + "T00:00:00");
      d.setDate(d.getDate() + 7);
      return formatDate(d);
    });
  }, [])

  useEffect(() => {
    const id = ++fetchId.current
    setLoading(true)
    setError(false)

    statsService.getWeeklyStats(weekStart).then((res) => {
      if (id !== fetchId.current) return
      setData({
        weekDays: res.weekDays.map((d) => ({
          ...d,
          hours: +(d.minutes / 60).toFixed(1),
        })),
        totalHours: res.totalHours,
        tasksDone: res.tasksDone,
        avgHours: res.avgHours,
        dateRange: res.dateRange,
      })
      setLoading(false)
    }).catch(() => {
      if (id !== fetchId.current) return
      setError(true)
      setLoading(false)
    })
  }, [weekStart])

  const apiDays = data?.weekDays ?? null
  const maxHours = apiDays ? Math.max(...apiDays.map(d => d.hours), 1) : 1
  const displayDateRange = data?.dateRange ?? ""
  const displayTotalHours = data?.totalHours ?? 0
  const displayTasksDone = data?.tasksDone ?? 0
  const displayAvgHours = data?.avgHours ?? 0

  return (
    <div data-tutorial-target="weekly-overview" style={{
      background: "var(--color-card)",
      borderRadius: 18,
      padding: "22px",
      boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Calendar size={16} color={theme.muted} />
          <span style={{ fontSize: 14, fontWeight: 600, color: theme.dark, display: "inline-flex", alignItems: "center", gap: 6 }}>
            {t("home.weeklyOverview.title")}
            <InfoButton tutorialId="weekly-overview" />
          </span>
        </div>
        <div data-tutorial-target="weekly-overview-nav" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button onClick={goBack} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", padding: 2, color: theme.muted }}>
            <ChevronLeft size={14} />
          </button>
          <span style={{ fontSize: 12, color: theme.muted, fontWeight: 500 }}>{displayDateRange}</span>
          <button onClick={goForward} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", padding: 2, color: theme.muted }}>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {error && !loading && (
        <div style={{ textAlign: "center", padding: "20px 0" }}>
          <p style={{ fontSize: 12, color: theme.muted }}>Could not load weekly data. Try again later.</p>
        </div>
      )}

      <div data-tutorial-target="weekly-overview-chart" style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 200, marginBottom: 16 }}>
        {Array.from({ length: 7 }).map((_, i) => {
          if (loading || !apiDays) {
            return (
              <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
                <div style={{
                  width: "100%",
                  maxWidth: 40,
                  height: 40,
                  borderRadius: 6,
                  background: theme.border,
                  opacity: 0.3,
                }} />
              </div>
            )
          }
          const day = apiDays[i]
          const barH = day.isFuture ? 4 : Math.max((day.hours / maxHours) * 160, 12)
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              <div style={{
                width: "100%",
                maxWidth: 40,
                height: barH,
                borderRadius: 6,
                background: day.isToday
                  ? theme.primary
                  : day.isFuture
                    ? theme.border
                    : `color-mix(in srgb, ${theme.primary} 60%, transparent)`,
                transition: "height 0.3s",
                boxShadow: day.isToday ? `0 0 14px color-mix(in srgb, ${theme.primary} 66%, transparent)` : "none",
              }} />
              {day.isToday ? (
                <div style={{
                  padding: "4px 8px",
                  borderRadius: 12,
                  background: theme.primary,
                  boxShadow: `0 0 10px color-mix(in srgb, ${theme.primary} 66%, transparent)`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}>
                  <span style={{ fontSize: 10, color: "white", fontWeight: 600, whiteSpace: "nowrap" }}>{day.month} {day.dayOfMonth}</span>
                </div>
              ) : (
                <span style={{ fontSize: 11, color: theme.muted, fontWeight: 500 }}>{day.label}</span>
              )}
              {!day.isFuture && (
                <span style={{ fontSize: 10, color: theme.muted, marginTop: -4 }}>{day.hours}h</span>
              )}
            </div>
          )
        })}
      </div>

      <div data-tutorial-target="weekly-overview-stats" style={{
        display: "flex",
        justifyContent: "space-around",
        paddingTop: 14,
        borderTop: `1px solid ${theme.border}`,
      }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: theme.primary, margin: 0 }}>{displayTotalHours}h</p>
          <p style={{ fontSize: 10, color: theme.muted, margin: "2px 0 0 0" }}>{t("home.weeklyOverview.totalHours")}</p>
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: "#3B82F6", margin: 0 }}>{displayTasksDone}</p>
          <p style={{ fontSize: 10, color: theme.muted, margin: "2px 0 0 0" }}>{t("home.weeklyOverview.tasksDone")}</p>
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: "#10B981", margin: 0 }}>{displayAvgHours}h</p>
          <p style={{ fontSize: 10, color: theme.muted, margin: "2px 0 0 0" }}>{t("home.weeklyOverview.avgDay")}</p>
        </div>
      </div>
    </div>
  )
}
