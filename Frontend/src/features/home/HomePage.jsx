import { useState, useEffect } from "react"
import { theme } from "../../theme"
import HeroTitle from "./components/HeroTitle"
import StatsGrid from "./components/StatsGrid"
import WeeklyOverview from "./components/WeeklyOverview"
import QuickActions from "./components/QuickActions"
import DailyInspiration from "./components/DailyInspiration"
import HabitRelics from "./components/HabitRelics"
import HighPriorityTasks from "./components/HighPriorityTasks"
import NextTasks from "./components/NextTasks"

export default function HomePage() {
  const [isCompact, setIsCompact] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)")
    setIsCompact(mq.matches)
    const handler = (e) => setIsCompact(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  return (
    <div
      style={{
        padding: "28px 32px 40px",
        margin: "0 auto",
        background: theme.bg,
        minHeight: "100vh",
        overflowY: "auto",
        display: "flex",
        flexDirection: "column",
        gap: 16
      }}
    >
      <HeroTitle />
      <DailyInspiration />

      <QuickActions />

      <div
        style={{
          display: "grid",
          gridTemplateColumns: isCompact ? "1fr" : "calc((100% - 16px) * 0.55) calc((100% - 16px) * 0.45)",
          gap: 16,
          alignItems: "start",
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <HighPriorityTasks />
          <WeeklyOverview />
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          <StatsGrid />
          <NextTasks />
          <HabitRelics />
        </div>
      </div>
    </div>
  )
}
