import { useState, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next"
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react"
import { theme } from "../../../theme"
import InfoButton from "../../../components/tutorial/InfoButton"
import { statsService } from "../services/statsService"
import { EVENT_TASKS_UPDATED } from "../../../utils/events"
import { formatMinutes } from "../../../utils/formatters"

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
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Calendar size={14} color={theme.muted} />
          <span style={{ fontSize: 15, fontWeight: 650, color: theme.dark, display: "inline-flex", alignItems: "center", gap: 6 }}>
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

      <div style={{ position: "relative", marginBottom: 16 }}>
        <div data-tutorial-target="weekly-overview-chart" style={{
          display: "flex",
          alignItems: "flex-end",
          gap: 12,
          height: 200,
          padding: "16px 0 12px",
        }}>
          {Array.from({ length: 7 }).map((_, i) => {
            if (loading || !apiDays) {
              return (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
                  <div style={{
                    width: "100%",
                    maxWidth: 48,
                    height: 40,
                    borderRadius: 6,
                    background: theme.border,
                    opacity: 0.3,
                  }} />
                </div>
              )
            }
            const day = apiDays[i]
            if (!day) {
              return (
                <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8, justifyContent: "flex-end" }}>
                  <div style={{ width: "100%", maxWidth: 48, height: 40, borderRadius: 6, background: theme.border, opacity: 0.3 }} />
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
                style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}
                onMouseEnter={() => setHoveredDay(i)}
                onMouseLeave={() => setHoveredDay(null)}
              >
                <div style={{
                  width: "100%",
                  maxWidth: 48,
                  height: barHeight,
                  borderRadius: 6,
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "flex-end",
                  transition: "height 0.3s, filter 0.15s",
                  filter: isHovered ? "brightness(1.15)" : "none",
                  cursor: day.isFuture ? "default" : "pointer",
                  boxShadow: day.isToday ? `0 0 14px color-mix(in srgb, ${theme.primary} 66%, transparent)` : "none",
                }}>
                  <div style={{
                    width: "100%",
                    flex: 1,
                    background: trackedColor,
                    transition: "background 0.3s",
                  }} />
                  <div style={{
                    width: "100%",
                    height: productiveHeight,
                    background: "#10B981",
                    transition: "height 0.3s",
                    flexShrink: 0,
                  }} />
                </div>
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
                  <span style={{ fontSize: 10, color: theme.muted, marginTop: -4 }}>{totalH}h</span>
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
            <div style={{
              position: "absolute",
              left: `${leftPct}%`,
              top: "100%",
              transform: "translateX(-50%)",
              marginTop: 8,
              background: theme.dark,
              color: "white",
              borderRadius: 8,
              padding: "8px 14px",
              fontSize: 12,
              fontWeight: 500,
              lineHeight: 1.5,
              pointerEvents: "none",
              whiteSpace: "nowrap",
              boxShadow: "0 4px 12px rgba(0,0,0,0.18)",
              zIndex: 5,
              transition: "left 0.15s ease-out",
            }}>
              <div style={{ fontWeight: 600, marginBottom: 1 }}>{d.label}</div>
              <div>Tracked: {formatMinutes(d.minutes)}</div>
              <div style={{ color: "#6EE7B7" }}>Productive: {formatMinutes(d.productiveMinutes || 0)}</div>
              <div style={{ opacity: 0.7 }}>
                {pct !== null ? `${pct}% productive` : "No data"}
              </div>
            </div>
          )
        })()}
      </div>

      <div data-tutorial-target="weekly-overview-stats" style={{
        display: "flex",
        justifyContent: "space-around",
        paddingTop: 14,
      }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 18, fontWeight: 700, color: theme.primary, margin: 0, letterSpacing: "-0.02em" }}>{formatMinutes(displayTotalHoursRecorded)}</p>
          <p style={{ fontSize: 10, color: theme.muted, margin: "2px 0 0 0", fontWeight: 500 }}>{t("home.weeklyOverview.totalHoursRecorded")}</p>
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 18, fontWeight: 700, color: "#10B981", margin: 0, letterSpacing: "-0.02em" }}>{formatMinutes(displayTotalProductiveHours)}</p>
          <p style={{ fontSize: 10, color: theme.muted, margin: "2px 0 0 0", fontWeight: 500 }}>{t("home.weeklyOverview.totalProductiveHours")}</p>
        </div>
      </div>
    </div>
  )
}
