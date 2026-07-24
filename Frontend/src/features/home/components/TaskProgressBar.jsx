export default function TaskProgressBar({ progress = 0, color = "#6366F1" }) {
  return (
    <div style={{
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      height: 4,
      background: `${color}20`,
      overflow: "hidden",
    }}>
      <div style={{
        width: `${progress}%`,
        height: "100%",
        background: color,
        transition: "width 0.3s ease",
        boxShadow: progress > 0 ? `0 0 6px ${color}50` : "none",
      }} />
    </div>
  )
}
