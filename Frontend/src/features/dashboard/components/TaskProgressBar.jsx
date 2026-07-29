import "../../../styles/dashboard/index.css"

export default function TaskProgressBar({ progress = 0, color = "#6366F1" }) {
  return (
    <div className="tpb-track" style={{ background: `${color}20` }}>
      <div className="tpb-fill" style={{
        width: `${progress}%`,
        background: color,
        boxShadow: progress > 0 ? `0 0 6px ${color}50` : "none",
      }} />
    </div>
  )
}
