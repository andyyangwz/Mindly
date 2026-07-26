import { useState, useEffect, useCallback } from "react";
import { useTranslation } from "react-i18next"
import { Target, TrendingUp } from "lucide-react"
import { theme } from "../../../theme"
import InfoButton from "../../../components/tutorial/InfoButton"
import { statsService } from "../services/statsService";
import { EVENT_TASKS_UPDATED } from "../../../utils/events";

export default function StatsGrid() {
  const { t } = useTranslation()

  const defaultStats = [
    {
      label: t("home.statsGrid.tasksCompleted"),
      value: "0/0",
      icon: Target,
      iconBg: "#3B82F6",
    },
    {
      label: t("home.statsGrid.productivity"),
      value: "0%",
      icon: TrendingUp,
      iconBg: "#10B981",
    },
  ]

  const [stats, setStats] = useState(defaultStats);

  const fetchStats = useCallback(() => {
    let cancelled = false;
    statsService.getHomeStats().then((data) => {
      if (cancelled) return;
      setStats([
        {
          label: t("home.statsGrid.tasksCompleted"),
          value: data.tasks_total === "0" ? t("home.statsGrid.noOngoingTask", "No On Going Task") : `${data.tasks_completed}/${data.tasks_total}`,
          icon: Target,
          iconBg: "#3B82F6",
        },
        {
          label: t("home.statsGrid.productivity"),
          value: data.productivity_pct !== null && data.productivity_pct !== undefined ? `${data.productivity_pct}%` : "Unknown",
          icon: TrendingUp,
          iconBg: "#10B981",
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
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1 }}>
        {stats.map((s, i) => {
          const tutorialId = i === 0 ? "task-completed" : "productivity-score"
          return (
            <div key={i} data-tutorial-target={tutorialId} style={{
              padding: "20px 16px",
              position: "relative",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              gap: 10,
              borderRight: i === 0 ? `1px solid ${theme.border}` : "none",
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <div style={{
                  width: 32,
                  height: 32,
                  borderRadius: 9,
                  background: `${s.iconBg}12`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}>
                  <s.icon size={15} color={s.iconBg} />
                </div>
                <div>
                  <p style={{ fontSize: 20, fontWeight: 700, color: theme.dark, margin: 0, letterSpacing: "-0.03em", lineHeight: 1.1 }}>
                    {s.value}
                  </p>
                  <p style={{ fontSize: 11, color: theme.muted, margin: "2px 0 0 0", fontWeight: 500 }}>
                    {s.label}
                  </p>
                </div>
              </div>
              <div style={{ position: "absolute", top: 8, right: 8 }}>
                <InfoButton tutorialId={tutorialId} size={12} showTooltip={false} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
