import HeroTitle from "./components/HeroTitle"
import WeeklyOverview from "./components/WeeklyOverview"
import QuickActions from "./components/QuickActions"
import DailyInspiration from "./components/DailyInspiration"
import HighPriorityTasks from "./components/HighPriorityTasks"
import NextTasks from "./components/NextTasks"
import RemindersSection from "./components/RemindersSection"
import StatsGrid from "./components/StatsGrid"
import AnimatedSection from "./components/AnimatedSection"
import "../../styles/dashboard/index.css"

export default function DashboardDesktop() {
  return (
    <div className="dashboard-desktop">
      <HeroTitle />
      <AnimatedSection delay={0.05}><DailyInspiration /></AnimatedSection>
      <AnimatedSection delay={0.1}><QuickActions /></AnimatedSection>

      <AnimatedSection delay={0.15}>
        <div className="dashboard-grid-2col" style={{ gridTemplateColumns: "1fr 280px" }}>
          <div className="dashboard-grid-2col-tasks">
            <HighPriorityTasks />
            <RemindersSection />
          </div>
          <NextTasks />
        </div>
      </AnimatedSection>

      <AnimatedSection delay={0.2}>
        <div className="dashboard-grid-2col" style={{ gridTemplateColumns: "1fr 320px" }}>
          <WeeklyOverview />
          <StatsGrid />
        </div>
      </AnimatedSection>
    </div>
  )
}
