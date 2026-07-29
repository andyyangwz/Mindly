import { useState } from "react"
import { motion } from "framer-motion"
import { useTranslation } from "react-i18next"
import { Brain, Clock, Calendar, BookOpen, Gamepad2, Target, TrendingUp, Zap, Sun, AlertTriangle, CheckCircle, Lightbulb, Star, BarChart3, PieChart as PieChartIcon, ChevronDown } from "lucide-react"
import mascotSrc from "../../assets/mascot_images/empathic.png"
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts"
import { insightData, timeDistData } from "../../data/mockData"
import "../../styles/insight/index.css"

const KNOW_YOU_KEYS = [
  { icon: Clock, labelKey: "insight.knowYouItems.bestTime", valueKey: "insight.knowYouItems.bestTimeValue", color: "var(--color-primary-text)" },
  { icon: Calendar, labelKey: "insight.knowYouItems.bestDay", valueKey: "insight.knowYouItems.bestDayValue", color: "var(--color-secondary)" },
  { icon: BookOpen, labelKey: "insight.knowYouItems.strongestHabit", valueKey: "insight.knowYouItems.strongestHabitValue", color: "var(--color-accent)" },
  { icon: Gamepad2, labelKey: "insight.knowYouItems.biggestDistraction", valueKey: "insight.knowYouItems.biggestDistractionValue", color: "#EF4444" },
  { icon: Target, labelKey: "insight.knowYouItems.strongestActivity", valueKey: "insight.knowYouItems.strongestActivityValue", color: "#10B981" },
  { icon: Sun, labelKey: "insight.knowYouItems.peakEnergy", valueKey: "insight.knowYouItems.peakEnergyValue", color: "#F59E0B" },
]

const DONUT_COLORS = ["var(--color-primary)", "var(--color-secondary)", "var(--color-accent)", "#F59E0B"]

function CollapsibleSection({ icon: Icon, title, count, defaultOpen = false, children, iconColor }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="insight-collapsible-section">
      <div
        onClick={() => setOpen(v => !v)}
        className="insight-collapsible-header"
        style={{ marginBottom: open ? 14 : 0 }}
      >
        <Icon size={16} color={iconColor || "var(--color-primary-text)"} />
        <h2>{title}{count != null ? ` (${count})` : ""}</h2>
        <motion.div
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2, ease: "easeInOut" }}
          className="insight-chevron-box"
        >
          <ChevronDown size={13} color="var(--color-muted)" />
        </motion.div>
      </div>
      <motion.div
        animate={{ height: open ? "auto" : 0 }}
        transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="insight-collapsible-body"
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
    <div className="insight-page">
      {/* Header */}
      <div className="insight-header">
        <div>
          <h1 className="insight-header-title">{t("insight.title")}</h1>
          <p className="insight-header-subtitle">{t("insight.subtitle")}</p>
        </div>
        <div className="insight-period-toggle">
          {["weekly", "monthly"].map(v => (
            <button
              key={v}
              onClick={() => setPeriod(v)}
              className={`insight-period-btn ${period === v ? "insight-period-btn--active" : "insight-period-btn--inactive"}`}
            >
              {v === "weekly" ? t("insight.weekly") : t("insight.monthly")}
            </button>
          ))}
        </div>
      </div>

      {/* Section 1: AI Reflection */}
      <div className="insight-reflection">
        <motion.img
          src={mascotSrc}
          alt=""
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
          className="insight-mascot"
        />
        <div className="insight-reflection-card">
          <div className="insight-reflection-arrow" />
          <div className="insight-reflection-title-row">
            <Brain size={15} color="var(--color-primary-text)" />
            <h2 className="insight-reflection-title">{t("insight.reflectionTitle")}</h2>
          </div>
          <ul className="insight-reflection-list">
            {t(`insight.aiPreview.${period}`, { returnObjects: true, defaultValue: ["You perform best on Tuesday and Thursday mornings.", "Late-night activities continue to affect your next-day productivity.", "Reading remains your most consistent habit."] }).map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
          <motion.div
            animate={{ height: reflectionOpen ? "auto" : 0, opacity: reflectionOpen ? 1 : 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="insight-collapsible-body"
          >
            <p className="insight-reflection-full-text">
              {t(`insight.aiFull.${period}`, { defaultValue: "Over the last 7 days, you've been remarkably consistent with your study habits. Your strongest days are Tuesday and Thursday, where your productivity consistently peaks. Morning hours (9–11 AM) show your highest focus levels, and you tend to complete more tasks when you start your first session before 10 AM. However, late-night activities on Fridays often reduce your completion rate the following day. Overall, this was a solid week — your discipline is building." })}
            </p>
          </motion.div>
          <button
            onClick={() => setReflectionOpen(v => !v)}
            className="insight-reflection-toggle"
          >
            {reflectionOpen ? t("insight.showLess") : t("insight.viewFullReflection")}
          </button>
        </div>
      </div>

      {/* Section 2: What We Know About You */}
      <div className="insight-section">
        <div className="insight-section-header">
          <Brain size={15} color="var(--color-primary-text)" />
          <h2 className="insight-section-title">{t("insight.knowYou")}</h2>
        </div>
        <div className="insight-know-you-grid">
          {KNOW_YOU_KEYS.map((item, i) => {
            const Icon = item.icon
            return (
              <div key={i} className="insight-know-you-card">
                <div className="insight-know-you-card-header">
                  <div className="insight-icon-box" style={{ background: `${item.color}18` }}>
                    <Icon size={13} color={item.color} />
                  </div>
                  <span className="insight-label">{t(item.labelKey)}</span>
                </div>
                <p className="insight-value">{t(item.valueKey)}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Section 4: Performance Overview + Time Distribution (side by side) */}
      <div className="insight-section">
        <div className="insight-performance-grid">
          <div className="insight-perf-card">
            <div className="insight-perf-title-row">
              <TrendingUp size={14} color="var(--color-muted)" />
              <h2 className="insight-perf-title">{t("insight.performanceOverview")}</h2>
            </div>
            <p className="insight-perf-desc">
              {t("insight.performanceDesc", { period: period === "weekly" ? t("insight.period7days") : t("insight.period4weeks") })}
            </p>
            <ResponsiveContainer width="100%" height={180}>
              <LineChart data={chartData} margin={{ top: 5, right: 16, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-bg)" vertical={false} />
                <XAxis dataKey="day" stroke="var(--color-muted)" fontSize={10} tickLine={false} axisLine={false} />
                <YAxis yAxisId="l" stroke="var(--color-primary-text)" fontSize={10} tickLine={false} axisLine={false} domain={[0, 10]} />
                <YAxis yAxisId="r" orientation="right" stroke="var(--color-secondary)" fontSize={10} tickLine={false} axisLine={false} domain={[0, 100]} />
                <Tooltip className="insight-tooltip" />
                <Line yAxisId="l" type="monotone" dataKey="studyTime" stroke="var(--color-primary)" strokeWidth={2} dot={{ fill: "var(--color-primary)", r: 3 }} />
                <Line yAxisId="r" type="monotone" dataKey="productivity" stroke="var(--color-secondary)" strokeWidth={2} dot={{ fill: "var(--color-secondary)", r: 3 }} />
                <Line yAxisId="r" type="monotone" dataKey="focus" stroke="var(--color-accent)" strokeWidth={2} dot={{ fill: "var(--color-accent)", r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
            <div className="insight-legend-row">
              {[{ labelKey: "insight.chart.studyTime", color: "var(--color-primary)" }, { labelKey: "insight.chart.productivity", color: "var(--color-secondary)" }, { labelKey: "insight.chart.focus", color: "var(--color-accent)" }].map((leg, i) => (
                <div key={i} className="insight-legend-item">
                  <div className="insight-legend-dot" style={{ background: leg.color }} />
                  <span className="insight-legend-label">{t(leg.labelKey)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="insight-perf-card">
            <div className="insight-perf-title-row">
              <PieChartIcon size={14} color="var(--color-muted)" />
              <h2 className="insight-perf-title">{t("insight.timeDistribution")}</h2>
            </div>
            <p className="insight-perf-desc">{t("insight.timeDistributionDesc")}</p>
            <div className="insight-dist-chart-wrap">
              <ResponsiveContainer width="100%" height={130}>
                <PieChart>
                  <Pie data={timeDistData} cx="50%" cy="50%" innerRadius={38} outerRadius={60} paddingAngle={3} dataKey="value">
                    {timeDistData.map((e, i) => <Cell key={i} fill={DONUT_COLORS[i % DONUT_COLORS.length]} />)}
                  </Pie>
                </PieChart>
              </ResponsiveContainer>
              <div className="insight-dist-legend-grid">
                {timeDistData.map((d, i) => (
                  <div key={i} className="insight-dist-legend-item">
                    <div className="insight-dist-legend-dot" style={{ background: DONUT_COLORS[i % DONUT_COLORS.length] }} />
                    <div className="insight-dist-legend-value-row">
                      <span className="insight-dist-legend-name">{d.name}</span>
                      <span className="insight-dist-legend-value">{d.value}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Section 3: Patterns We've Noticed */}
      <CollapsibleSection icon={BarChart3} title={t("insight.patterns")} count={5} iconColor="var(--color-primary-text)">
        <div className="insight-card-grid">
          {patternItems.map((text, i) => (
            <div key={i} className="insight-mini-card">
              <div className="insight-round-icon">
                <CheckCircle size={12} color="var(--color-primary-text)" />
              </div>
              <span className="insight-mini-card-text">{text}</span>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Section 5: Areas to Improve */}
      <CollapsibleSection icon={AlertTriangle} title={t("insight.areasToImprove")} count={4} iconColor="#F59E0B">
        <div className="insight-card-grid">
          {areaItems.map((text, i) => (
            <div key={i} className="insight-mini-card insight-mini-card--compact">
              <AlertTriangle size={13} color="#F59E0B" />
              <span className="insight-mini-card-text">{text}</span>
            </div>
          ))}
        </div>
      </CollapsibleSection>

      {/* Section 6: Small Wins */}
      <CollapsibleSection icon={CheckCircle} title={t("insight.smallWins")} count={4} iconColor="#10B981">
        <div className="insight-card-grid">
          {winItems.map((text, i) => {
            const icons = [Zap, TrendingUp, CheckCircle, Star]
            const colors = ["#10B981", "var(--color-primary-text)", "var(--color-secondary)", "#F59E0B"]
            const Icon = icons[i % icons.length]
            return (
              <div key={i} className="insight-mini-card">
                <div className="insight-icon-wins" style={{ background: `${colors[i]}18` }}>
                  <Icon size={13} color={colors[i]} />
                </div>
                <span className="insight-mini-card-text insight-mini-card-text--bold">{text}</span>
              </div>
            )
          })}
        </div>
      </CollapsibleSection>

      {/* Section 7: Suggested Experiments */}
      <CollapsibleSection icon={Lightbulb} title={t("insight.suggestedExperiments")} count={5} iconColor="#F59E0B">
        <div className="insight-card-grid">
          {experimentItems.map((text, i) => (
            <div key={i} className="insight-mini-card insight-mini-card--compact">
              <Lightbulb size={13} color="var(--color-primary-text)" />
              <span className="insight-mini-card-text">{text}</span>
            </div>
          ))}
        </div>
      </CollapsibleSection>
    </div>
  )
}
