import { theme } from "../../theme"
import HeroTitle from "./components/HeroTitle"
import StatsGrid from "./components/StatsGrid"
import WeeklyOverview from "./components/WeeklyOverview"
import QuickActions from "./components/QuickActions"
import DailyInspiration from "./components/DailyInspiration"
import HabitRelics from "./components/HabitRelics"
import HighPriorityTasks from "./components/HighPriorityTasks"
import NextTasks from "./components/NextTasks"

export default function HomeMobile() {
  return (
    <div style={{
      padding: "20px 16px 40px",
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
      <HighPriorityTasks />
      <NextTasks />
      <HabitRelics />
      <StatsGrid />
      <WeeklyOverview />
    </div>
  )
}
