import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../../theme/ThemeProvider";

export default function ThemeToggle() {
  const { resolvedTheme, toggleTheme } = useTheme();
  const isLight = resolvedTheme === "light";

  return (
    <button
      onClick={toggleTheme}
      aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
      style={{
        position: "fixed",
        top: 24,
        right: 24,
        zIndex: 100,
        width: 44,
        height: 44,
        borderRadius: "50%",
        border: "1px solid var(--landing-border)",
        background: "var(--landing-surface)",
        color: "var(--landing-text-secondary)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        transition: "all 0.3s ease",
        boxShadow: "var(--landing-shadow-sm)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--landing-accent)";
        e.currentTarget.style.color = "var(--landing-accent)";
        e.currentTarget.style.transform = "scale(1.05)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--landing-border)";
        e.currentTarget.style.color = "var(--landing-text-secondary)";
        e.currentTarget.style.transform = "scale(1)";
      }}
    >
      {isLight ? <Moon size={16} /> : <Sun size={16} />}
    </button>
  );
}
