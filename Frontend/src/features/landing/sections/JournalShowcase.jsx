import { motion } from "framer-motion"
import { useTranslation } from "react-i18next"
import ScrollReveal from "../components/ScrollReveal"

const ENTRY_EMOJIS = [["☕", "✨", "🎨"], ["🧠", "💡", "🛠️"], ["🎯", "🌅", "📝"]];

export default function JournalShowcase() {
  const { t } = useTranslation();
  const entries = t("landing.journal.entries", { returnObjects: true });
  return (
    <section className="landing-section">
      <div className="section-container">
        <ScrollReveal>
          <p className="section-label text-center mb-12">{t("landing.journal.label")}</p>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <h2 className="section-title section-title--center">{t("landing.journal.title")}</h2>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <div className="journal-list">
            {entries.map((entry, i) => (
              <motion.div
                key={entry.date}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                <div className="journal-card">
                  <div className="journal-card-header">
                    <span className="journal-card-date">
                      {entry.date} &middot; {entry.time}
                    </span>
                  </div>

                  <div className="flex-center gap-4 mb-10">
                    {(ENTRY_EMOJIS[i] || []).map((e, ei) => (
                      <span key={ei} className="journal-card-emoji">{e}</span>
                    ))}
                  </div>

                  <p className="journal-card-title">{entry.title}</p>

                  <p className="journal-card-preview">{entry.preview}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
