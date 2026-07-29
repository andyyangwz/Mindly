import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next"
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react"
import { theme } from "../../../theme"
import InfoButton from "../../../components/tutorial/InfoButton"
import { statsService } from "../services/statsService"
import { EVENT_TASKS_UPDATED } from "../../../utils/events"
import { formatMinutes } from "../../../utils/formatters"
import "../../../styles/dashboard/index.css"

function formatDate(d) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function getRollingStart() {
  const d = new Date();
  d.setDate(d.getDate() - 6);
  return formatDate(d);
}

export default function WeeklyOverview() {
  const { t } = useTranslation()

  const [weekStart, setWeekStart] = useState(() => getRollingStart())
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [data, setData] = useState(null)
  const [hoveredDay, setHoveredDay] = useState(null)
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

  const fetchData = useCallback((ws) => {
    const id = ++fetchId.current
    setLoading(true)
    setError(false)
    statsService.getWeeklyStats(ws).then((res) => {
      if (id !== fetchId.current) return
      setData({
        weekDays: res.weekDays.map((d) => ({
          ...d,
          hours: +(d.minutes / 60).toFixed(1),
          productiveHours: +((d.productiveMinutes || 0) / 60).toFixed(1),
        })),
        totalHoursRecorded: res.totalHoursRecorded,
        totalProductiveHours: res.totalProductiveHours,
        dateRange: res.dateRange,
      })
      setLoading(false)
    }).catch(() => {
      if (id !== fetchId.current) return
      setError(true)
      setLoading(false)
    })
  }, [])

  useEffect(() => {
    fetchData(weekStart)
  }, [weekStart, fetchData])

  useEffect(() => {
    const handler = () => fetchData(weekStart)
    window.addEventListener(EVENT_TASKS_UPDATED, handler)
    return () => window.removeEventListener(EVENT_TASKS_UPDATED, handler)
  }, [weekStart, fetchData])

  const apiDays = data?.weekDays ?? null
  const maxHours = apiDays ? Math.max(...apiDays.map(d => d.hours), 1) : 1
  const displayDateRange = data?.dateRange ?? ""
  const displayTotalHoursRecorded = data?.totalHoursRecorded ?? 0
  const displayTotalProductiveHours = data?.totalProductiveHours ?? 0

  return (
    <div data-tutorial-target="weekly-overview">
      <div className="weekly-overview-header">
        <div className="weekly-overview-title-row">
          <Calendar size={14} color={theme.muted} />
          <span className="weekly-overview-title">
            {t("dashboard.weeklyOverview.title")}
            <InfoButton tutorialId="weekly-overview" />
          </span>
        </div>
        <div data-tutorial-target="weekly-overview-nav" className="weekly-overview-nav">
          <button onClick={goBack} className="weekly-overview-nav-btn">
            <ChevronLeft size={14} />
          </button>
          <span className="weekly-overview-date-range">{displayDateRange}</span>
          <button onClick={goForward} className="weekly-overview-nav-btn">
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      {error && !loading && (
        <div className="weekly-overview-error">
          <p>Could not load weekly data. Try again later.</p>
        </div>
      )}

      <div className="weekly-overview-chart-area">
        <div data-tutorial-target="weekly-overview-chart" className="weekly-overview-chart">
          {Array.from({ length: 7 }).map((_, i) => {
            if (loading || !apiDays) {
              return (
                <div className="weekly-overview-bar-column" style={{ justifyContent: "flex-end" }}>
                  <div className="weekly-overview-bar-skeleton" />
                </div>
              )
            }
            const day = apiDays[i]
            if (!day) {
              return (
                <div className="weekly-overview-bar-column" style={{ justifyContent: "flex-end" }}>
                  <div className="weekly-overview-bar-skeleton" />
                </div>
              )
            }

            const totalH = day.hours
            const productiveH = day.productiveHours
            const isHovered = hoveredDay === i
            const barHeight = day.isFuture ? 4 : totalH === 0 ? 2 : Math.max((totalH / maxHours) * 160, 12)
            const productiveHeight = totalH > 0 ? Math.max((productiveH / totalH) * barHeight, productiveH > 0 ? 6 : 0) : 0

            const trackedColor = day.isToday
              ? theme.primary
              : day.isFuture
                ? theme.border
                : `color-mix(in srgb, ${theme.primary} 60%, transparent)`

            return (
              <div
                key={i}
                className="weekly-overview-bar-column"
                onMouseEnter={() => setHoveredDay(i)}
                onMouseLeave={() => setHoveredDay(null)}
              >
                <div className="weekly-overview-bar" style={{
                  height: barHeight,
                  filter: isHovered ? "brightness(1.15)" : "none",
                  cursor: day.isFuture ? "default" : "pointer",
                  boxShadow: day.isToday ? `0 0 14px color-mix(in srgb, ${theme.primary} 66%, transparent)` : "none",
                }}>
                  <div className="weekly-overview-bar-tracked" style={{ background: trackedColor }} />
                  <div className="weekly-overview-bar-productive" style={{ height: productiveHeight }} />
                </div>
                {day.isToday ? (
                  <div className="weekly-overview-today-badge" style={{
                    boxShadow: `0 0 10px color-mix(in srgb, ${theme.primary} 66%, transparent)`,
                  }}>
                    <span>{day.month} {day.dayOfMonth}</span>
                  </div>
                ) : (
                  <span className="weekly-overview-day-label">{day.label}</span>
                )}
                {!day.isFuture && (
                  <div className="weekly-overview-day-stats">
                    <div className="weekly-overview-day-stats-total">{formatMinutes(day.minutes)}</div>
                    <div className="weekly-overview-day-stats-productive">{formatMinutes(day.productiveMinutes || 0)}</div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {hoveredDay !== null && apiDays?.[hoveredDay] && !apiDays[hoveredDay].isFuture && (() => {
          const d = apiDays[hoveredDay]
          const pct = d.minutes > 0 ? Math.round(((d.productiveMinutes || 0) / d.minutes) * 100) : null
          const leftPct = ((hoveredDay + 0.5) / 7) * 100
          return (
            <div className="weekly-overview-tooltip" style={{ left: `${leftPct}%` }}>
              <div className="weekly-overview-tooltip-title">{d.label}</div>
              <div>Tracked: {formatMinutes(d.minutes)}</div>
              <div className="weekly-overview-tooltip-productive">Productive: {formatMinutes(d.productiveMinutes || 0)}</div>
              <div className="weekly-overview-tooltip-pct">
                {pct !== null ? `${pct}% productive` : "No data"}
              </div>
            </div>
          )
        })()}
      </div>

      <div data-tutorial-target="weekly-overview-stats" className="weekly-overview-stats-row">
        <div className="weekly-overview-stat">
          <p className="weekly-overview-stat-value">{formatMinutes(displayTotalHoursRecorded)}</p>
          <p className="weekly-overview-stat-label">{t("dashboard.weeklyOverview.totalHoursRecorded")}</p>
        </div>
        <div className="weekly-overview-stat">
          <p className="weekly-overview-stat-value weekly-overview-stat-value-green">{formatMinutes(displayTotalProductiveHours)}</p>
          <p className="weekly-overview-stat-label">{t("dashboard.weeklyOverview.totalProductiveHours")}</p>
        </div>
      </div>
    </div>
  )
}
