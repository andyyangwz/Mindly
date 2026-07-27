import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next"
import { TrendingUp, Target, Clock } from "lucide-react"
import { theme } from "../../../theme"
import { statsService } from "../services/statsService";
import { EVENT_TASKS_UPDATED } from "../../../utils/events";
import { formatMinutes } from "../../../utils/formatters";

export default function StatsGrid() {
  const { t } = useTranslation()

  const [stats, setStats] = useState([
    { label: t("home.statsGrid.productivityPercentage"), value: "—", icon: TrendingUp, iconBg: "#10B981" },
    { label: t("home.statsGrid.taskLeft"), value: "0", icon: Target, iconBg: "#3B82F6" },
    { label: t("home.statsGrid.totalUnproductiveTime"), value: "0h 00m", icon: Clock, iconBg: "#EF4444" },
  ]);

  const fetchStats = useCallback(() => {
    let cancelled = false;
    statsService.getHomeStats().then((data) => {
      if (cancelled) return;
      setStats([
        {
          label: t("home.statsGrid.productivityPercentage"),
          value: data.productivity_pct != null ? `${data.productivity_pct}%` : "—",
          icon: TrendingUp,
          iconBg: "#10B981",
        },
        {
          label: t("home.statsGrid.taskLeft"),
          value: String(data.task_left ?? 0),
          icon: Target,
          iconBg: "#3B82F6",
        },
        {
          label: t("home.statsGrid.totalUnproductiveTime"),
          value: formatMinutes(data.total_unproductive_minutes ?? 0),
          icon: Clock,
          iconBg: "#EF4444",
        },
      ]);
    }).catch(() => {
      if (cancelled) return;
    });
    return () => { cancelled = true; };
  }, [t]);

  useEffect(() => {
    const cancel = fetchStats();
    return () => cancel?.();
  }, [fetchStats]);

  useEffect(() => {
    const handler = () => fetchStats();
    window.addEventListener(EVENT_TASKS_UPDATED, handler);
    return () => window.removeEventListener(EVENT_TASKS_UPDATED, handler);
  }, [fetchStats]);

  return (
    <div>
      <h2 style={{
        fontSize: 13,
        fontWeight: 600,
        color: theme.muted,
        textTransform: "uppercase",
        letterSpacing: "0.06em",
        margin: "0 0 16px 0",
      }}>
        {t("home.statsGrid.title", "Overview")}
      </h2>
      <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
        {stats.map((s, i) => (
          <div key={i} style={{
            padding: "16px",
            display: "flex",
            alignItems: "center",
            gap: 12,
            borderBottom: i < stats.length - 1 ? `1px solid ${theme.border}` : "none",
          }}>
            <div style={{
              width: 36,
              height: 36,
              borderRadius: 10,
              background: `${s.iconBg}12`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}>
              <s.icon size={17} color={s.iconBg} />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: 20, fontWeight: 700, color: theme.dark, margin: 0, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
                {s.value}
              </p>
              <p style={{ fontSize: 11, color: theme.muted, margin: "3px 0 0 0", fontWeight: 500 }}>
                {s.label}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
