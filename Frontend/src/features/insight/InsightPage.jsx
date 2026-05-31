import { useState } from "react"
import { motion } from "framer-motion"
import { useTranslation } from "react-i18next"
import { Brain, Clock, Calendar, BookOpen, Gamepad2, Target, TrendingUp, Zap, Sun, AlertTriangle, CheckCircle, Lightbulb, Star, BarChart3, PieChart as PieChartIcon, ChevronDown } from "lucide-react"
import mascotSrc from "../../assets/mascot_images/empathic.png"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { theme } from "../../theme"
import { insightData, timeDistData } from "../../data/mockData"

const KNOW_YOU_KEYS = [
  { icon: Clock, labelKey: "insight.knowYouItems.bestTime", valueKey: "insight.knowYouItems.bestTimeValue", color: theme.primaryText },
  { icon: Calendar, labelKey: "insight.knowYouItems.bestDay", valueKey: "insight.knowYouItems.bestDayValue", color: theme.secondary },
  { icon: BookOpen, labelKey: "insight.knowYouItems.strongestHabit", valueKey: "insight.knowYouItems.strongestHabitValue", color: theme.accent },
  { icon: Gamepad2, labelKey: "insight.knowYouItems.biggestDistraction", valueKey: "insight.knowYouItems.biggestDistractionValue", color: "#EF4444" },
  { icon: Target, labelKey: "insight.knowYouItems.strongestActivity", valueKey: "insight.knowYouItems.strongestActivityValue", color: "#10B981" },
  { icon: Sun, labelKey: "insight.knowYouItems.peakEnergy", valueKey: "insight.knowYouItems.peakEnergyValue", color: "#F59E0B" },
]

const DONUT_COLORS = [theme.primary, theme.secondary, theme.accent, "#F59E0B"]

function CollapsibleSection({ icon: Icon, title, count, defaultOpen = false, children, iconColor }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div style={{ marginBottom: 40 }}>
      <div
        onClick={() => setOpen(v => !v)}
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          cursor: "pointer",
          marginBottom: open ? 14 : 0,
          userSelect: "none",
        }}
      >
        <Icon size={16} color={iconColor || theme.primaryText} />
        <h2 style={{ fontSize: 15, fontWeight: 600, color: theme.dark, margin: 0, flex: 1 }}>
          {title}{count != null ? ` (${count})` : ""}
        </h2>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          style={{
            width: 22,
            height: 22,
            borderRadius: 6,
            background: `color-mix(in srgb, ${theme.muted} 10%, transparent)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <ChevronDown size={13} color={theme.muted} />
        </motion.div>
      </div>
      <motion.div
        animate={{ height: open ? "auto" : 0 }}
        transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{ overflow: "hidden" }}
      >
        {children}
      </motion.div>
    </div>
  )
}

export default function InsightPage() {
  const { t } = useTranslation()
  const [period, setPeriod] = useState("weekly")
  const [reflectionOpen, setReflectionOpen] = useState(false)
  const chartData = insightData[period]
  const patternItems = t("insight.patternItems", { returnObjects: true })
  const areaItems = t("insight.areaItems", { returnObjects: true })
  const winItems = t("insight.winItems", { returnObjects: true })
  const experimentItems = t("insight.experimentItems", { returnObjects: true })

  return (
    <div style={{ padding: "28px 32px", maxWidth: 1200, margin: "0 auto" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 48 }}>
        <div>
          <h1 style={{ fontSize: 20, fontWeight: 600, color: theme.dark, margin: 0 }}>{t("insight.title")}</h1>
          <p style={{ fontSize: 12, color: theme.muted, margin: "3px 0 0" }}>{t("insight.subtitle")}</p>
        </div>
        <div style={{ display: "flex", gap: 4, background: "var(--color-card, white)", borderRadius: 24, padding: 3, border: `1px solid ${theme.border}` }}>
          {["weekly", "monthly"].map(v => (
            <button key={v} onClick={() => setPeriod(v)} style={{ padding: "6px 18px", borderRadius: 20, border: "none", cursor: "pointer", background: period === v ? theme.primary : "transparent", color: period === v ? "white" : theme.muted, fontWeight: 500, fontSize: 12, transition: "all 0.15s" }}>
              {v === "weekly" ? t("insight.weekly") : t("insight.monthly")}
            </button>
          ))}
        </div>
      </div>

      {/* Section 1: AI Reflection */}
      <div style={{ display: "flex", gap: 12, alignItems: "flex-start", marginBottom: 48 }}>
        <motion.img
          src={mascotSrc}
          alt=""
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          style={{
            width: 80,
            height: 80,
            objectFit: "contain",
            flexShrink: 0,
            marginTop: 2,
            filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.08))",
          }}
        />
        <div style={{
          flex: 1,
          background: "var(--color-card)",
          borderRadius: 20,
          border: `1px solid ${theme.border}`,
          padding: "20px 24px",
          position: "relative",
          boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
        }}>
          <div style={{
            position: "absolute",
            left: -7,
            top: 20,
            width: 12,
            height: 12,
            background: "var(--color-card)",
            borderLeft: `1px solid ${theme.border}`,
            borderBottom: `1px solid ${theme.border}`,
            transform: "rotate(45deg)",
            borderRadius: "0 0 0 3px",
          }} />
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
            <Brain size={15} color={theme.primaryText} />
            <h2 style={{ fontSize: 14, fontWeight: 600, color: theme.dark, margin: 0 }}>{t("insight.reflectionTitle")}</h2>
          </div>
          <ul style={{ margin: 0, padding: 0, listStyle: "none" }}>
            {t(`insight.aiPreview.${period}`, { returnObjects: true, defaultValue: ["You perform best on Tuesday and Thursday mornings.", "Late-night activities continue to affect your next-day productivity.", "Reading remains your most consistent habit."] }).map((s, i) => (
              <li key={i} style={{ fontSize: 13, color: theme.dark, lineHeight: 1.6, marginBottom: 2 }}>
                {s}
              </li>
            ))}
          </ul>
          <motion.div
            animate={{ height: reflectionOpen ? "auto" : 0, opacity: reflectionOpen ? 1 : 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            style={{ overflow: "hidden" }}
          >
            <p style={{ fontSize: 13, color: theme.muted, lineHeight: 1.7, margin: "6px 0 0", maxWidth: 640 }}>
              {t(`insight.aiFull.${period}`, { defaultValue: "Over the last 7 days, you've been remarkably consistent with your study habits. Your strongest days are Tuesday and Thursday, where your productivity consistently peaks. Morning hours (9–11 AM) show your highest focus levels, and you tend to complete more tasks when you start your first session before 10 AM. However, late-night activities on Fridays often reduce your completion rate the following day. Overall, this was a solid week — your discipline is building." })}
            </p>
          </motion.div>
          <button
            onClick={() => setReflectionOpen(v => !v)}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 5,
              marginTop: 8,
              padding: "5px 12px",
              borderRadius: 8,
              border: `1px solid ${theme.border}`,
              background: "var(--color-card)",
              color: theme.primaryText,
              fontSize: 11,
              fontWeight: 500,
              cursor: "pointer",
              transition: "background 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = `color-mix(in srgb, ${theme.bg} 50%, transparent)` }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "var(--color-card)" }}
          >
            {reflectionOpen ? t("insight.showLess") : t("insight.viewFullReflection")}
          </button>
        </div>
      </div>

      {/* Section 2: What We Know About You */}
      <div style={{ marginBottom: 48 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <Brain size={15} color={theme.primaryText} />
          <h2 style={{ fontSize: 14, fontWeight: 600, color: theme.dark, margin: 0 }}>{t("insight.knowYou")}</h2>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 10 }}>
          {KNOW_YOU_KEYS.map((item, i) => {
            const Icon = item.icon
            return (
              <div key={i} style={{ background: "var(--color-card, white)", borderRadius: 14, border: `1px solid ${theme.border}`, padding: "14px 16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <div style={{ background: `${item.color}18`, borderRadius: 8, padding: 6, display: "flex", flexShrink: 0 }}>
                    <Icon size={13} color={item.color} />
                  </div>
                  <span style={{ fontSize: 10, fontWeight: 500, color: theme.muted, textTransform: "uppercase", letterSpacing: "0.04em" }}>{t(item.labelKey)}</span>
                </div>
                <p style={{ fontSize: 15, fontWeight: 700, color: theme.dark, margin: 0 }}>{t(item.valueKey)}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Section 4: Performance Overview + Time Distribution (side by side) */}
      <div style={{ marginBottom: 48 }}>
        <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: 20 }}>
          <div style={{ background: "var(--color-card, white)", borderRadius: 16, border: `1px solid ${theme.border}`, padding: "16px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
              <TrendingUp size={14} color={theme.muted} />
              <h2 style={{ fontSize: 13, fontWeight: 600, color: theme.dark, margin: 0 }}>{t("insight.performanceOverview")}</h2>
            </div>
            <p style={{ fontSize: 10, color: theme.muted, margin: "4px 0 10px" }}>
              {t("insight.performanceDesc", { period: period === "weekly" ? t("insight.period7days") : t("insight.period4weeks") })}
            </p>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData} margin={{ top: 5, right: 16, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke={theme.bg} vertical={false} />
                <XAxis dataKey="day" stroke={theme.muted} fontSize={10} tickLine={false} axisLine={false} />
                <YAxis yAxisId="l" stroke={theme.primaryText} fontSize={10} tickLine={false} axisLine={false} domain={[0, 10]} />
                <YAxis yAxisId="r" orientation="right" stroke={theme.secondary} fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip contentStyle={{ background: "var(--color-card, white)", border: `1px solid ${theme.border}`, borderRadius: 10, fontSize: 11 }} />
                <Line yAxisId="l" type="monotone" dataKey="studyTime" stroke={theme.primary} strokeWidth={2} dot={{ fill: theme.primary, r: 3 }} />
                <Line yAxisId="r" type="monotone" dataKey="productivity" stroke={theme.secondary} strokeWidth={2} dot={{ fill: theme.secondary, r: 3 }} />
                <Line yAxisId="r" type="monotone" dataKey="focus" stroke={theme.accent} strokeWidth={2} dot={{ fill: theme.accent, r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
            <div style={{ display: "flex", gap: 12, justifyContent: "center", marginTop: 6 }}>
              {[{ labelKey: "insight.chart.studyTime", color: theme.primary }, { labelKey: "insight.chart.productivity", color: theme.secondary }, { labelKey: "insight.chart.focus", color: theme.accent }].map((leg, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <div style={{ width: 7, height: 7, borderRadius: "50%", background: leg.color }} />
                  <span style={{ fontSize: 10, color: theme.muted }}>{t(leg.labelKey)}</span>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: "var(--color-card, white)", borderRadius: 16, border: `1px solid ${theme.border}`, padding: "16px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 2 }}>
              <PieChartIcon size={14} color={theme.muted} />
              <h2 style={{ fontSize: 13, fontWeight: 600, color: theme.dark, margin: 0 }}>{t("insight.timeDistribution")}</h2>
            </div>
            <p style={{ fontSize: 10, color: theme.muted, margin: "4px 0 8px" }}>{t("insight.timeDistributionDesc")}</p>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4 }}>
              <ResponsiveContainer width="100%" height={130}>
                <PieChart>
                  <Pie data={timeDistData} cx="50%" cy="50%" innerRadius={38} outerRadius={60} paddingAngle={3} dataKey="value">
                    {timeDistData.map((e, i) => <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2px 12px" }}>
                {timeDistData.map((d, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ width: 7, height: 7, borderRadius: "50%", background: DONUT_COLORS[i % DONUT_COLORS.length], flexShrink: 0 }} />
                    <div style={{ display: "flex", alignItems: "baseline", gap: 4 }}>
                      <span style={{ fontSize: 11, color: theme.muted }}>{d.name}</span>
                      <span style={{ fontSize: 13, fontWeight: 700, color: theme.dark }}>{d.value}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Patterns We've Noticed */}
      <CollapsibleSection icon={BarChart3} title={t("insight.patterns")} count={5} iconColor={theme.primaryText}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {patternItems.map((text, i) => (
            <div key={i} style={{ background: "var(--color-card, white)", borderRadius: 10, border: `1px solid ${theme.border}`, padding: "11px 14px", display: "flex", alignItems: "center", gap: 10 }}>
              <div style={{ width: 18, height: 18, borderRadius: "50%", background: `${theme.primaryText}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <CheckCircle size={12} color={theme.primaryText} />
              </div>
              <span style={{ fontSize: 12, color: theme.dark, lineHeight: 1.4 }}>{text}</span>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Section 5: Areas to Improve */}
      <CollapsibleSection icon={AlertTriangle} title={t("insight.areasToImprove")} count={4} iconColor="#F59E0B">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {areaItems.map((text, i) => (
            <div key={i} style={{ background: "var(--color-card, white)", borderRadius: 10, border: `1px solid ${theme.border}`, padding: "11px 14px", display: "flex", alignItems: "center", gap: 9 }}>
              <AlertTriangle size={13} color="#F59E0B" style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: theme.dark, lineHeight: 1.4 }}>{text}</span>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Section 6: Small Wins */}
      <CollapsibleSection icon={CheckCircle} title={t("insight.smallWins")} count={4} iconColor="#10B981">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {winItems.map((text, i) => {
            const icons = [Zap, TrendingUp, CheckCircle, Star]
            const colors = ["#10B981", theme.primaryText, theme.secondary, "#F59E0B"]
            const Icon = icons[i % icons.length]
            return (
              <div key={i} style={{ background: "var(--color-card, white)", borderRadius: 10, border: `1px solid ${theme.border}`, padding: "11px 14px", display: "flex", alignItems: "center", gap: 9 }}>
                <div style={{ width: 22, height: 22, borderRadius: 8, background: `${colors[i]}18`, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Icon size={13} color={colors[i]} />
                </div>
                <span style={{ fontSize: 12, fontWeight: 600, color: theme.dark }}>{text}</span>
              </div>
            )
          })}
        </div>
      </CollapsibleSection>

      {/* Section 7: Suggested Experiments */}
      <CollapsibleSection icon={Lightbulb} title={t("insight.suggestedExperiments")} count={5} iconColor="#F59E0B">
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
          {experimentItems.map((text, i) => (
            <div key={i} style={{ background: "var(--color-card, white)", borderRadius: 10, border: `1px solid ${theme.border}`, padding: "11px 14px", display: "flex", alignItems: "center", gap: 9 }}>
              <Lightbulb size={13} color={theme.primaryText} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: theme.dark, lineHeight: 1.4 }}>{text}</span>
            </div>
          ))}
        </div>
      </CollapsibleSection>
    </div>
  )
}
