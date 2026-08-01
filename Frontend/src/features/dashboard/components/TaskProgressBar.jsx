import { useState, useEffect } from "react";
import "../../../styles/dashboard/index.css"

export default function TaskProgressBar({ progress = 0, color = "#6366F1" }) {
  const [animatedProgress, setAnimatedProgress] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => setAnimatedProgress(progress), 50)
    return () => clearTimeout(timer)
  }, [progress])

  return (
    <div className="tpb-track" style={{ background: `${color}20` }}>
      <div className="tpb-fill" style={{
        width: `${animatedProgress}%`,
        background: color,
        boxShadow: progress > 0 ? `0 0 6px ${color}50` : "none",
        transition: "width 0.6s ease",
      }} />
    </div>
  )
}
