import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Target, Clock, Timer, TrendingUp, Lightbulb, Moon, Coffee, BookOpen, Sparkles } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { theme } from "../../theme";
import { insightData, timeDistData } from "../../data/mockData";

export default function InsightPage() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState("weekly");
  const data = insightData[period];

  const statCards = [
    { label: t("insight.stats.productivityScore"), value: "82", unit: t("insight.stats.scoreUnit"), change: t("insight.stats.change.productivity"), icon: Target, color: theme.primaryText },
    { label: t("insight.stats.totalStudyTime"), value: "24h 30m", unit: "", change: t("insight.stats.change.studyTime"), icon: Clock, color: theme.secondary },
    { label: t("insight.stats.focusSessions"), value: "32", unit: t("insight.stats.completed"), change: t("insight.stats.change.focusSessions"), icon: Timer, color: theme.accent },
  ];

  const aiInsights = [
    { icon: TrendingUp, titleKey: "insight.insightTitles.peakPerformance", descKey: "insight.insightDescriptions.peakPerformance" },
    { icon: Lightbulb, titleKey: "insight.insightTitles.smartBreaks", descKey: "insight.insightDescriptions.smartBreaks" },
    { icon: Moon, titleKey: "insight.insightTitles.eveningDip", descKey: "insight.insightDescriptions.eveningDip" },
  ];

  const quickWins = [
    { icon: Moon, titleKey: "insight.insightTitles.sleepConsistency", descKey: "insight.quickWinDescriptions.sleepConsistency", impKey: "insight.impact.high", ic: theme.primaryText },
    { icon: Coffee, titleKey: "insight.insightTitles.breakScheduling", descKey: "insight.quickWinDescriptions.breakScheduling", impKey: "insight.impact.medium", ic: theme.secondary },
    { icon: Clock, titleKey: "insight.insightTitles.peakHoursFocus", descKey: "insight.quickWinDescriptions.peakHoursFocus", impKey: "insight.impact.high", ic: theme.primaryText },
    { icon: BookOpen, titleKey: "insight.insightTitles.reviewSessions", descKey: "insight.quickWinDescriptions.reviewSessions", impKey: "insight.impact.medium", ic: theme.secondary },
  ];

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1200, margin: "0 auto" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h1 style={{ fontSize: 22, fontWeight: 600, color: theme.dark }}>{t("insight.title")}</h1>
        <div style={{ display: "flex", gap: 4, background: "var(--color-card, white)", borderRadius: 24, padding: 4, border: `1px solid ${theme.border}` }}>
          {["weekly", "monthly"].map(v => (
            <button key={v} onClick={() => setPeriod(v)} style={{ padding: "7px 20px", borderRadius: 20, border: "none", cursor: "pointer", background: period === v ? theme.primary : "transparent", color: period === v ? "white" : theme.muted, fontWeight: 500, fontSize: 13, transition: "all 0.15s" }}>
              {v === "weekly" ? t("insight.weekly") : t("insight.monthly")}
            </button>
          ))}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16, marginBottom: 24 }}>
        {statCards.map((card, i) => {
          const Icon = card.icon;
          return (
            <div key={i} style={{ background: "var(--color-card, white)", borderRadius: 16, border: `1px solid ${theme.border}`, padding: "20px 22px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 }}>
                <div>
                  <p style={{ fontSize: 12, color: theme.muted, marginBottom: 4 }}>{card.label}</p>
                  <p style={{ fontSize: 26, fontWeight: 700, color: theme.dark }}>{card.value}<span style={{ fontSize: 14, color: theme.muted, fontWeight: 400 }}> {card.unit}</span></p>
                </div>
                <div style={{ background: `${card.color}18`, borderRadius: 12, padding: 10 }}><Icon size={20} color={card.color} /></div>
              </div>
              <div style={{ height: 4, background: theme.bg, borderRadius: 4 }}>
                <div style={{ height: "100%", width: i === 0 ? "82%" : i === 1 ? "78%" : "65%", background: card.color, borderRadius: 4 }} />
              </div>
              <p style={{ fontSize: 11, color: "#10B981", marginTop: 6, fontWeight: 500 }}>{card.change}</p>
            </div>
          );
        })}
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 20, marginBottom: 24 }}>
        <div style={{ background: "var(--color-card, white)", borderRadius: 16, border: `1px solid ${theme.border}`, padding: "20px 22px" }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: theme.dark, marginBottom: 4 }}>{t("insight.performanceOverview")}</h2>
          <p style={{ fontSize: 12, color: theme.muted, marginBottom: 16 }}>{t("insight.performanceDesc")}</p>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={data} margin={{ top: 5, right: 20, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.bg} vertical={false} />
              <XAxis dataKey="day" stroke={theme.muted} fontSize={11} tickLine={false} axisLine={false} />
              <YAxis yAxisId="l" stroke={theme.primaryText} fontSize={11} tickLine={false} axisLine={false} domain={[0, 10]} />
              <YAxis yAxisId="r" orientation="right" stroke={theme.secondary} fontSize={11} tickLine={false} axisLine={false} domain={[0, 100]} />
              <Tooltip contentStyle={{ background: "var(--color-card, white)", border: `1px solid ${theme.border}`, borderRadius: 10, fontSize: 12 }} />
              <Line yAxisId="l" type="monotone" dataKey="studyTime" stroke={theme.primary} strokeWidth={2.5} dot={{ fill: theme.primary, r: 4 }} />
              <Line yAxisId="r" type="monotone" dataKey="productivity" stroke={theme.secondary} strokeWidth={2.5} dot={{ fill: theme.secondary, r: 4 }} />
              <Line yAxisId="r" type="monotone" dataKey="focus" stroke={theme.accent} strokeWidth={2.5} dot={{ fill: theme.accent, r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", marginTop: 10 }}>
            {[{ label: t("insight.chart.studyTime"), color: theme.primary }, { label: t("insight.chart.productivity"), color: theme.secondary }, { label: t("insight.chart.focus"), color: theme.accent }].map((leg, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: leg.color }} />
                <span style={{ fontSize: 11, color: theme.muted }}>{leg.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div style={{ background: "var(--color-card, white)", borderRadius: 16, border: `1px solid ${theme.border}`, padding: "20px 22px" }}>
          <h2 style={{ fontSize: 15, fontWeight: 600, color: theme.dark, marginBottom: 4 }}>{t("insight.timeDistribution")}</h2>
          <p style={{ fontSize: 12, color: theme.muted, marginBottom: 8 }}>{t("insight.timeDistributionDesc")}</p>
          <ResponsiveContainer width="100%" height={160}>
            <PieChart>
              <Pie data={timeDistData} cx="50%" cy="50%" innerRadius={48} outerRadius={72} paddingAngle={3} dataKey="value">
                {timeDistData.map((e, i) => <Cell key={i} fill={e.color} />)}
              </Pie>
              <Tooltip contentStyle={{ background: "var(--color-card, white)", border: `1px solid ${theme.border}`, borderRadius: 10, fontSize: 12 }} />
            </PieChart>
          </ResponsiveContainer>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginTop: 8 }}>
            {timeDistData.map((d, i) => (
              <div key={i} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <div style={{ width: 10, height: 10, borderRadius: "50%", background: d.color, flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: 11, color: theme.muted }}>{d.name}</p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: theme.dark }}>{d.value}%</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`, borderRadius: 16, padding: "22px 28px", marginBottom: 24 }}>
        <div style={{ display: "flex", gap: 14, alignItems: "flex-start" }}>
          <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 12, padding: 10 }}><Sparkles size={22} color="white" /></div>
          <div>
            <h2 style={{ fontSize: 15, fontWeight: 600, color: "white", marginBottom: 4 }}>{t("insight.aiPowered")}</h2>
            <p style={{ fontSize: 13, color: "rgba(255,255,255,0.85)", lineHeight: 1.6, maxWidth: 600 }} dangerouslySetInnerHTML={{ __html: t("insight.aiPoweredDesc") }} />
          </div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 18 }}>
          {aiInsights.map((ins, i) => {
            const Icon = ins.icon;
            return (
              <div key={i} style={{ background: "rgba(255,255,255,0.15)", borderRadius: 12, padding: "14px 16px" }}>
                <div style={{ background: "rgba(255,255,255,0.2)", borderRadius: 8, padding: 8, width: "fit-content", marginBottom: 8 }}><Icon size={16} color="white" /></div>
                <p style={{ fontSize: 13, fontWeight: 600, color: "white", marginBottom: 4 }}>{t(ins.titleKey)}</p>
                <p style={{ fontSize: 11, color: "rgba(255,255,255,0.8)", lineHeight: 1.5 }}>{t(ins.descKey)}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ background: "var(--color-card, white)", borderRadius: 16, border: `1px solid ${theme.border}`, padding: "20px 22px" }}>
        <h2 style={{ fontSize: 15, fontWeight: 600, color: theme.dark, marginBottom: 16 }}>{t("insight.quickWins")}</h2>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
          {quickWins.map((r, i) => {
            const Icon = r.icon;
            return (
              <div key={i} style={{ padding: "14px 16px", borderRadius: 12, background: theme.bg, border: `1px solid ${theme.border}`, display: "flex", alignItems: "flex-start", gap: 12 }}>
                <div style={{ background: `${r.ic}18`, borderRadius: 10, padding: 8, flexShrink: 0 }}><Icon size={16} color={r.ic} /></div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 13, fontWeight: 600, color: theme.dark, marginBottom: 3 }}>{t(r.titleKey)}</p>
                  <p style={{ fontSize: 12, color: theme.muted, marginBottom: 6 }}>{t(r.descKey)}</p>
                  <span style={{ fontSize: 11, background: `${r.ic}18`, color: r.ic, borderRadius: 20, padding: "2px 10px", fontWeight: 500 }}>{t(r.impKey)}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
