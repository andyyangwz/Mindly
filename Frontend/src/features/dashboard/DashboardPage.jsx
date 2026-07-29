import { useState, useEffect } from "react"
import DashboardDesktop from "./DashboardDesktop"
import DashboardMobile from "./DashboardMobile"

export default function DashboardPage() {
  const [isCompact, setIsCompact] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)")
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsCompact(mq.matches)
    const handler = (e) => setIsCompact(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  return isCompact ? <DashboardMobile /> : <DashboardDesktop />
}
