import HeroTitle from "./components/HeroTitle"
import StatsGrid from "./components/StatsGrid"
import WeeklyOverview from "./components/WeeklyOverview"
import QuickActions from "./components/QuickActions"
import DailyInspiration from "./components/DailyInspiration"
import HighPriorityTasks from "./components/HighPriorityTasks"
import NextTasks from "./components/NextTasks"
import RemindersSection from "./components/RemindersSection"
import "../../styles/dashboard/index.css"

export default function DashboardMobile() {
  return (
    <div className="dashboard-mobile">
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
