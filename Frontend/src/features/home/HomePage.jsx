import { theme } from "../../theme"
import HeroTitle from "./v2/HeroTitle"
import StatsGrid from "./v2/StatsGrid"
import WeeklyOverview from "./v2/WeeklyOverview"
import QuickActions from "./v2/QuickActions"
import DailyInspiration from "./v1/DailyInspiration"
import HabitRelics from "./v1/HabitRelics"

export default function HomePage() {
  return (
    <div
      style={{
        padding: "28px 32px",
        margin: "0 auto",
        background: theme.bg,
        height: "100vh",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
        gap: 16
      }}
    >
      <HeroTitle />
      <DailyInspiration />

      <div
        style={{
            display: "grid",
            gridTemplateColumns: "calc((100% - 16px) * 0.55) calc((100% - 16px) * 0.45)",
            gap: 16,
            flex: 1,
            minHeight: 0,
            width: "100%",
            boxSizing: "border-box"
        }}
      >
        <div style={{ display: "flex", flexDirection: "column", gap: 16, minHeight: 0, minWidth: 0 }}>
          <div style={{ height: 100, display: "flex", flexDirection: "column", minWidth: 0 }}>
            <QuickActions />
          </div>

          <div style={{ flex: 1, minHeight: 0, minWidth: 0 }}>
            <WeeklyOverview />
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 16, minHeight: 0, minWidth: 0 }}>
          <div style={{ height: 100, display: "flex", flexDirection: "column", minWidth: 0 }}>
            <StatsGrid />
          </div>

          <div style={{ height: "auto" }}>
            <HabitRelics />
          </div>
        </div>
      </div>
    </div>
  )
}