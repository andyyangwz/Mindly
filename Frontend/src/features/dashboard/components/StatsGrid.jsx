import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next"
import { TrendingUp, Target, Clock } from "lucide-react"
import { statsService } from "../services/statsService";
import { EVENT_TASKS_UPDATED } from "../../../utils/events";
import { formatMinutes } from "../../../utils/formatters";
import "../../../styles/dashboard/index.css"

export default function StatsGrid() {
  const { t } = useTranslation()

  const [stats, setStats] = useState([
    { label: t("dashboard.statsGrid.schedulingPercentage"), value: "—", icon: TrendingUp, iconBg: "#10B981" },
    { label: t("dashboard.statsGrid.taskLeft"), value: "0", icon: Target, iconBg: "#3B82F6" },
    { label: t("dashboard.statsGrid.totalUnproductiveTime"), value: "0h 00m", icon: Clock, iconBg: "#EF4444" },
  ]);

  const fetchStats = useCallback(() => {
    let cancelled = false;
    statsService.getDashboardStats().then((data) => {
      if (cancelled) return;
      setStats([
        {
          label: t("dashboard.statsGrid.schedulingPercentage"),
          value: data.productivity_pct != null ? `${data.productivity_pct}%` : "—",
          icon: TrendingUp,
          iconBg: "#10B981",
        },
        {
          label: t("dashboard.statsGrid.taskLeft"),
          value: String(data.task_left ?? 0),
          icon: Target,
          iconBg: "#3B82F6",
        },
        {
          label: t("dashboard.statsGrid.totalUnproductiveTime"),
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
      <h2 className="stats-grid-title">
        {t("dashboard.statsGrid.title", "Overview")}
      </h2>
      <div className="stats-grid-list">
        {stats.map((s, i) => (
          <div key={i} className="stats-grid-item">
            <div className="stats-grid-icon" style={{ background: `${s.iconBg}12` }}>
              <s.icon size={17} color={s.iconBg} />
            </div>
            <div className="stats-grid-content">
              <p className="stats-grid-value">{s.value}</p>
              <p className="stats-grid-label">{s.label}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
