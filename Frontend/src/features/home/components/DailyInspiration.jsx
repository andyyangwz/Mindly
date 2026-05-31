import { motion } from "framer-motion"
import { useTranslation } from "react-i18next"
import { theme } from "../../../theme"
import { useRandomHomeContent } from "../hooks/useRandomHomeContent"
import mascotSrc from "../../../assets/mascot_images/empathic.png"

export default function DailyInspiration() {
  const { t } = useTranslation()
  const { quote } = useRandomHomeContent()

  return (
    <div style={{
      display: "flex",
      gap: 12,
      alignItems: "flex-start",
    }}>
      {/* Mascot */}
      <motion.img
        src={mascotSrc}
        alt=""
        animate={{ y: [0, -6, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        style={{
          width: 80,
          height: 80,
          objectFit: "contain",
          flexShrink: 0,
          marginTop: 2,
          filter: "drop-shadow(0 2px 6px rgba(0,0,0,0.08))",
        }}
      />
      {/* Speech bubble */}
      <div style={{
        flex: 1,
        background: "var(--color-card)",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        borderRadius: 14,
        border: `1px solid color-mix(in srgb, ${theme.primary} 22%, transparent)`,
        padding: "12px 16px",
        position: "relative",
        boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
      }}>
        {/* Bubble tail */}
        <div style={{
          position: "absolute",
          left: -7,
          top: 16,
          width: 12,
          height: 12,
          background: "var(--color-card)",
          borderLeft: `1px solid color-mix(in srgb, ${theme.primary} 22%, transparent)`,
          borderBottom: `1px solid color-mix(in srgb, ${theme.primary} 22%, transparent)`,
          transform: "rotate(45deg)",
          borderRadius: "0 0 0 3px",
        }} />
        <span style={{
          fontSize: 10,
          fontWeight: 600,
          color: theme.primary,
          letterSpacing: "0.08em",
          textTransform: "uppercase",
        }}>
          {t("home.dailyInspiration.title")}
        </span>
        <p style={{
          fontSize: 13,
          color: theme.dark,
          lineHeight: 1.6,
          margin: "4px 0 0 0",
          fontWeight: 400,
        }}>
          &ldquo;{quote.text}&rdquo;
        </p>
      </div>
    </div>
  )
}
