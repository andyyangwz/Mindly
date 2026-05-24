import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next"
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react"
import { theme } from "../../../theme"
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

  const defaultWeekDays = [
    { label: t("common.days.monday"), hours: 0, isPast: true, isToday: false, isFuture: false },
    { label: t("common.days.tuesday"), hours: 0, isPast: true, isToday: false, isFuture: false },
    { label: t("common.days.wednesday"), hours: 0, isPast: true, isToday: false, isFuture: false },
    { label: t("common.days.thursday"), hours: 0, isPast: true, isToday: false, isFuture: false },
    { label: t("common.days.friday"), hours: 0, isPast: true, isToday: false, isFuture: false },
    { label: t("common.days.saturday"), hours: 0, isPast: true, isToday: false, isFuture: false },
    { label: t("common.days.sunday"), hours: 0, isPast: true, isToday: false, isFuture: false },
  ]

  const [weekStart, setWeekStart] = useState(() => formatDate(getMonday(new Date())))
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState({
    weekDays: defaultWeekDays,
    totalHours: 0,
    tasksDone: 0,
    avgHours: 0,
    dateRange: "",
  })

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
    setLoading(true);
    let cancelled = false;
    statsService.getWeeklyStats(weekStart).then((res) => {
      if (cancelled) return;
      setData({
        weekDays: res.weekDays.map((d) => ({
          ...d,
          hours: +(d.minutes / 60).toFixed(1),
        })),
        totalHours: res.totalHours,
        tasksDone: res.tasksDone,
        avgHours: res.avgHours,
        dateRange: res.dateRange,
      });
      if (!cancelled) setLoading(false);
    }).catch(() => {
      if (!cancelled) setLoading(false);
    });
    return () => { cancelled = true; };
  }, [weekStart])

  const { weekDays, totalHours, tasksDone, avgHours, dateRange } = data
  const maxHours = Math.max(...weekDays.map(d => d.hours), 1)

  return (
    <div style={{
      background: "var(--color-card)",
      borderRadius: 18,
      padding: "22px",
      boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
    }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <Calendar size={16} color={theme.muted} />
          <span style={{ fontSize: 14, fontWeight: 600, color: theme.dark }}>{t("home.weeklyOverview.title")}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <button onClick={goBack} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", padding: 2, color: theme.muted }}>
            <ChevronLeft size={14} />
          </button>
          <span style={{ fontSize: 12, color: theme.muted, fontWeight: 500 }}>{dateRange}</span>
          <button onClick={goForward} style={{ background: "none", border: "none", cursor: "pointer", display: "flex", padding: 2, color: theme.muted }}>
            <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "flex-end", gap: 8, height: 200, marginBottom: 16 }}>
        {weekDays.map((d, i) => {
          const barH = d.isFuture ? 4 : Math.max((d.hours / maxHours) * 160, 12)
          const isActive = d.isToday
          return (
            <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
              {loading ? (
                <div style={{
                  width: "100%",
                  maxWidth: 40,
                  flex: 1,
                  borderRadius: 6,
                  background: `${theme.border}`,
                  opacity: 0.3,
                  minHeight: 12,
                }} />
              ) : (
                <>
                  <div style={{
                    width: "100%",
                    maxWidth: 40,
                    height: barH,
                    borderRadius: 6,
                    background: isActive
                      ? theme.primary
                      : d.isFuture
                        ? theme.border
                        : `color-mix(in srgb, ${theme.primary} 60%, transparent)`,
                    transition: "height 0.3s",
                    boxShadow: isActive ? `0 0 14px color-mix(in srgb, ${theme.primary} 66%, transparent)` : "none",
                  }} />
                  {isActive ? (
                    <div style={{
                      width: 26,
                      height: 26,
                      borderRadius: "50%",
                      background: theme.primary,
                      boxShadow: `0 0 10px color-mix(in srgb, ${theme.primary} 66%, transparent)`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}>
                      <span style={{ fontSize: 11, color: "white", fontWeight: 600 }}>{d.dayOfMonth}</span>
                    </div>
                  ) : (
                    <span style={{ fontSize: 11, color: theme.muted, fontWeight: 500 }}>{d.label}</span>
                  )}
                  {!d.isFuture && (
                    <span style={{ fontSize: 10, color: theme.muted, marginTop: -4 }}>{d.hours}h</span>
                  )}
                </>
              )}
            </div>
          )
        })}
      </div>

      <div style={{
        display: "flex",
        justifyContent: "space-around",
        paddingTop: 14,
        borderTop: `1px solid ${theme.border}`,
      }}>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: theme.primary, margin: 0 }}>{totalHours}h</p>
          <p style={{ fontSize: 10, color: theme.muted, margin: "2px 0 0 0" }}>{t("home.weeklyOverview.totalHours")}</p>
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: "#3B82F6", margin: 0 }}>{tasksDone}</p>
          <p style={{ fontSize: 10, color: theme.muted, margin: "2px 0 0 0" }}>{t("home.weeklyOverview.tasksDone")}</p>
        </div>
        <div style={{ textAlign: "center" }}>
          <p style={{ fontSize: 16, fontWeight: 700, color: "#10B981", margin: 0 }}>{avgHours}h</p>
          <p style={{ fontSize: 10, color: theme.muted, margin: "2px 0 0 0" }}>{t("home.weeklyOverview.avgDay")}</p>
        </div>
      </div>
    </div>
  )
}
