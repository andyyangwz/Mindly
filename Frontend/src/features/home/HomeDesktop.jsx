import { theme } from "../../theme"
import HeroTitle from "./components/HeroTitle"
import StatsGrid from "./components/StatsGrid"
import WeeklyOverview from "./components/WeeklyOverview"
import QuickActions from "./components/QuickActions"
import DailyInspiration from "./components/DailyInspiration"
import HabitRelics from "./components/HabitRelics"
import HighPriorityTasks from "./components/HighPriorityTasks"
import NextTasks from "./components/NextTasks"

export default function HomeDesktop() {
  return (
    <div style={{
      padding: "28px 32px",
      margin: "0 auto",
      background: theme.bg,
      minHeight: "100vh",
      overflowY: "auto",
      display: "flex",
      flexDirection: "column",
      gap: 16,
    }}>
      <HeroTitle />
      <DailyInspiration />
      <QuickActions />

      <div style={{
        display: "grid",
        gridTemplateColumns: "calc((100% - 16px) * 0.55) calc((100% - 16px) * 0.45)",
        gap: 16,
        alignItems: "start",
      }}>
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
