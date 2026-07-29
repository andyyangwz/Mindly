import HeroTitle from "./components/HeroTitle"
import StatsGrid from "./components/StatsGrid"
import WeeklyOverview from "./components/WeeklyOverview"
import QuickActions from "./components/QuickActions"
import DailyInspiration from "./components/DailyInspiration"
import HighPriorityTasks from "./components/HighPriorityTasks"
import NextTasks from "./components/NextTasks"
import RemindersSection from "./components/RemindersSection"
import AnimatedSection from "./components/AnimatedSection"
import "../../styles/dashboard/index.css"

export default function DashboardMobile() {
  return (
    <div className="dashboard-mobile">
      <HeroTitle />
      <AnimatedSection delay={0.05}><DailyInspiration /></AnimatedSection>
      <AnimatedSection delay={0.1}><QuickActions /></AnimatedSection>
      <AnimatedSection delay={0.15}><HighPriorityTasks /></AnimatedSection>
      <AnimatedSection delay={0.2}><RemindersSection /></AnimatedSection>
      <AnimatedSection delay={0.25}><NextTasks /></AnimatedSection>
      <AnimatedSection delay={0.3}><StatsGrid /></AnimatedSection>
      <AnimatedSection delay={0.35}><WeeklyOverview /></AnimatedSection>
    </div>
  )
}
