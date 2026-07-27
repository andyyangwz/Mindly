import { theme } from "../../theme"
import HeroTitle from "./components/HeroTitle"
import StatsGrid from "./components/StatsGrid"
import WeeklyOverview from "./components/WeeklyOverview"
import QuickActions from "./components/QuickActions"
import DailyInspiration from "./components/DailyInspiration"
import HighPriorityTasks from "./components/HighPriorityTasks"
import NextTasks from "./components/NextTasks"
import RemindersSection from "./components/RemindersSection"

export default function HomeMobile() {
  return (
    <div style={{
      padding: "24px 20px 72px",
      margin: "0 auto",
      background: theme.bg,
      minHeight: "100vh",
      overflowY: "auto",
      display: "flex",
      flexDirection: "column",
      gap: 36,
    }}>
      <HeroTitle />
      <DailyInspiration />
      <QuickActions />
      <HighPriorityTasks />
      <RemindersSection />
      <NextTasks />
      <StatsGrid />
      <WeeklyOverview />
    </div>
  )
}
