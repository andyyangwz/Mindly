import { useState, useEffect } from "react"
import HomeDesktop from "./HomeDesktop"
import HomeMobile from "./HomeMobile"

export default function HomePage() {
  const [isCompact, setIsCompact] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 900px)")
    setIsCompact(mq.matches)
    const handler = (e) => setIsCompact(e.matches)
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  return isCompact ? <HomeMobile /> : <HomeDesktop />
}
