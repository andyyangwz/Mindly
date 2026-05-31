import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { Brain, ChevronDown } from "lucide-react"
import { useTranslation } from "react-i18next"

export default function HeroSection() {
  const { t } = useTranslation()
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])

  const anim = (delay) => ({
    initial: { opacity: 0, y: 20 },
    animate: mounted ? { opacity: 1, y: 0 } : {},
    transition: { duration: 0.8, delay, ease: [0.25, 0.46, 0.45, 0.94] },
  })

  return (
    <section
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        zIndex: 1,
        padding: "40px 24px",
        textAlign: "center",
      }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: "60vw",
          height: "60vw",
          maxWidth: 800,
          maxHeight: 800,
          borderRadius: "50%",
          background: "var(--landing-hero-glow)",
          filter: "blur(100px)",
          transform: "translate(-50%, -50%)",
          opacity: 0.6,
          pointerEvents: "none",
        }}
      />

      {/* Icon */}
      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={mounted ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{ marginBottom: 28 }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: "linear-gradient(135deg, var(--landing-accent), var(--landing-accent-soft))",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 0 40px color-mix(in srgb, var(--landing-accent) 25%, transparent)",
          }}
        >
          <Brain size={22} color="white" />
        </div>
      </motion.div>

      {/* Mindly */}
      <motion.h1
        initial={{ opacity: 0, scale: 0.96, y: 30 }}
        animate={mounted ? { opacity: 1, scale: 1, y: 0 } : {}}
        transition={{ duration: 1.2, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
        style={{
          fontSize: "clamp(60px, 14vw, 140px)",
          fontWeight: 250,
          letterSpacing: "-0.04em",
          color: "var(--landing-text)",
          margin: 0,
          lineHeight: 1,
          fontFamily: "Georgia, 'Times New Roman', serif",
          background: "linear-gradient(135deg, var(--landing-text) 0%, var(--landing-accent) 50%, var(--landing-text) 100%)",
          WebkitBackgroundClip: "text",
          WebkitTextFillColor: "transparent",
          backgroundClip: "text",
        }}
      >
        {t("landing.hero.title")}
      </motion.h1>

      {/* CLEAR MIND, BETTER GRIND */}
      <motion.p
        {...anim(0.45)}
        style={{
          fontSize: "clamp(11px, 1.4vw, 16px)",
          letterSpacing: "0.4em",
          color: "var(--landing-accent)",
          fontWeight: 500,
          marginTop: 32,
          marginBottom: 0,
          textTransform: "uppercase",
        }}
      >
        {t("landing.hero.tagline")}
      </motion.p>

      {/* Description */}
      <motion.p
        {...anim(0.7)}
        style={{
          fontSize: "clamp(16px, 2vw, 22px)",
          color: "var(--landing-text-secondary)",
          fontWeight: 400,
          marginTop: 20,
          maxWidth: 500,
          lineHeight: 1.6,
          letterSpacing: "0.01em",
        }}
      >
        {t("landing.hero.subtitle")}
      </motion.p>

      {/* CTA Buttons */}
      <motion.div
        {...anim(1.0)}
        style={{
          display: "flex",
          gap: 14,
          justifyContent: "center",
          marginTop: 48,
          flexWrap: "wrap",
        }}
      >
        <a
          href="/auth"
          style={{
            padding: "14px 32px",
            borderRadius: 14,
            border: "none",
            background: "linear-gradient(135deg, var(--landing-accent), var(--landing-accent-soft))",
            color: "white",
            fontSize: 14,
            fontWeight: 600,
            cursor: "pointer",
            textDecoration: "none",
            transition: "all 0.3s",
            boxShadow: "0 4px 20px color-mix(in srgb, var(--landing-accent) 25%, transparent)",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = "translateY(-2px)"
            e.currentTarget.style.boxShadow = "0 8px 32px color-mix(in srgb, var(--landing-accent) 35%, transparent)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = "translateY(0)"
            e.currentTarget.style.boxShadow = "0 4px 20px color-mix(in srgb, var(--landing-accent) 25%, transparent)"
          }}
        >
          {t("landing.hero.signUp")}
        </a>
        <a
          href="/auth"
          style={{
            padding: "14px 32px",
            borderRadius: 14,
            border: "1px solid var(--landing-border)",
            background: "var(--landing-surface)",
            color: "var(--landing-text)",
            fontSize: 14,
            fontWeight: 500,
            cursor: "pointer",
            textDecoration: "none",
            transition: "all 0.3s",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--landing-accent-soft)"
            e.currentTarget.style.color = "var(--landing-accent)"
            e.currentTarget.style.background = "color-mix(in srgb, var(--landing-accent) 6%, transparent)"
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "var(--landing-border)"
            e.currentTarget.style.color = "var(--landing-text)"
            e.currentTarget.style.background = "var(--landing-surface)"
          }}
        >
          {t("landing.hero.login")}
        </a>
      </motion.div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={mounted ? { opacity: 1 } : {}}
        transition={{ delay: 1.5, duration: 0.6 }}
        style={{
          position: "absolute",
          bottom: 40,
          left: "50%",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 6,
          color: "var(--landing-text-muted)",
        }}
      >
        <span
          style={{
            fontSize: 10,
            letterSpacing: "0.15em",
            fontWeight: 500,
            textTransform: "uppercase",
          }}
        >
          {t("landing.hero.scroll")}
        </span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
        >
          <ChevronDown size={16} />
        </motion.div>
      </motion.div>
    </section>
  )
}
