import { theme } from "../../theme"
import HeroTitle from "./components/HeroTitle"
import WeeklyOverview from "./components/WeeklyOverview"
import QuickActions from "./components/QuickActions"
import DailyInspiration from "./components/DailyInspiration"
import HighPriorityTasks from "./components/HighPriorityTasks"
import NextTasks from "./components/NextTasks"
import RemindersSection from "./components/RemindersSection"
import StatsGrid from "./components/StatsGrid"

export default function HomeDesktop() {
  return (
    <div style={{
      padding: "36px 48px 80px",
      margin: "0 auto",
      background: theme.bg,
      minHeight: "100vh",
      overflowY: "auto",
      display: "flex",
      flexDirection: "column",
      gap: 44,
    }}>
      <HeroTitle />
      <DailyInspiration />
      <QuickActions />

      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: 48, alignItems: "start" }}>
        <div style={{ display: "flex", gap: 24, alignItems: "start" }}>
          <div style={{ flex: 1 }}><HighPriorityTasks /></div>
          <div style={{ flex: 1 }}><RemindersSection /></div>
        </div>
        <NextTasks />
      </div>

      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 320px",
        gap: 48,
        alignItems: "start",
      }}>
        <WeeklyOverview />
        <StatsGrid />
      </div>
    </div>
  )
}
