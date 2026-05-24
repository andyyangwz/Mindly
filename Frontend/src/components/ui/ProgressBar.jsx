import { theme } from "../../theme";

export function ProgressBar({ percent, color = theme.primary, height = 6 }) {
  return (
    <div style={{ height, background: theme.bg, borderRadius: height }}>
      <div
        style={{
          height: "100%",
          width: `${Math.min(percent, 100)}%`,
          background: color,
          borderRadius: height,
          transition: "width 0.5s",
        }}
      />
    </div>
  );
}
