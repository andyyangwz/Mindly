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
    <section className="landing-section--hero">
      <div className="hero-glow" />

      <motion.div
        initial={{ opacity: 0, scale: 0.85 }}
        animate={mounted ? { opacity: 1, scale: 1 } : {}}
        transition={{ duration: 0.8, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="mb-28"
      >
        <div className="hero-icon-box">
          <Brain size={22} color="white" />
        </div>
      </motion.div>

      <motion.h1
        initial={{ opacity: 0, scale: 0.96, y: 30 }}
        animate={mounted ? { opacity: 1, scale: 1, y: 0 } : {}}
        transition={{ duration: 1.2, delay: 0.15, ease: [0.25, 0.46, 0.45, 0.94] }}
        className="hero-title"
      >
        {t("landing.hero.title")}
      </motion.h1>

      <motion.p
        {...anim(0.45)}
        className="hero-tagline"
      >
        {t("landing.hero.tagline")}
      </motion.p>

      <motion.p
        {...anim(0.7)}
        className="hero-subtitle"
      >
        {t("landing.hero.subtitle")}
      </motion.p>

      <motion.div
        {...anim(1.0)}
        className="hero-actions"
      >
        <a href="/auth" className="btn-hero">
          {t("landing.hero.signUp")}
        </a>
        <a href="/auth" className="btn-secondary">
          {t("landing.hero.login")}
        </a>
      </motion.div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={mounted ? { opacity: 1 } : {}}
        transition={{ delay: 1.5, duration: 0.6 }}
        className="hero-scroll-indicator"
      >
        <span className="hero-scroll-text">{t("landing.hero.scroll")}</span>
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
