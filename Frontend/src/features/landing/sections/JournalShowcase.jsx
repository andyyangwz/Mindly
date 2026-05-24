import { motion } from "framer-motion"
import { Sparkles } from "lucide-react"
import ScrollReveal from "../components/ScrollReveal"

const ENTRIES = [
  {
    date: "May 20, 2026",
    time: "8:42 AM",
    emojis: ["☕", "✨", "🎨"],
    title: "Morning Creative Flow",
    preview: "I feel most creative in the morning. The quiet hours before the world wakes up let my thoughts wander freely, and today's session was particularly productive...",
  },
  {
    date: "May 19, 2026",
    time: "10:15 PM",
    emojis: ["🧠", "💡", "🛠️"],
    title: "Understanding Procrastination",
    preview: "Realized that my procrastination isn't laziness — it's a signal that the task feels too big. Breaking it down into tiny steps helped me actually start...",
  },
  {
    date: "May 18, 2026",
    time: "7:30 AM",
    emojis: ["🎯", "🌅", "📝"],
    title: "Setting Daily Intentions",
    preview: "New intention: be present. Not just in meditation, but in conversations, during meals, and while walking between meetings. The moments in between matter most...",
  },
]

export default function JournalShowcase() {
  return (
    <section
      style={{
        position: "relative",
        zIndex: 1,
        padding: "80px 32px",
      }}
    >
      <div style={{ maxWidth: 1000, margin: "0 auto" }}>
        <ScrollReveal>
          <p
            style={{
              fontSize: "clamp(11px, 1.2vw, 14px)",
              letterSpacing: "0.3em",
              textTransform: "uppercase",
              color: "var(--landing-accent)",
              fontWeight: 600,
              marginBottom: 12,
              textAlign: "center",
            }}
          >
            Personal Journaling
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <h2
            style={{
              fontSize: "clamp(24px, 3.5vw, 40px)",
              fontWeight: 300,
              color: "var(--landing-text)",
              textAlign: "center",
              margin: "0 0 48px",
              letterSpacing: "-0.03em",
              lineHeight: 1.2,
            }}
          >
            Your thoughts, beautifully captured
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <div
            style={{
              maxWidth: 500,
              margin: "0 auto",
              display: "flex",
              flexDirection: "column",
              gap: 16,
            }}
          >
            {ENTRIES.map((entry, i) => (
              <motion.div
                key={entry.date}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.08 }}
              >
                <div
                  style={{
                    borderRadius: 20,
                    background: "var(--landing-surface)",
                    border: "1px solid var(--landing-border)",
                    padding: "24px 26px",
                    boxShadow: "0 8px 32px rgba(0,0,0,0.07), 0 2px 8px rgba(0,0,0,0.03)",
                    transition: "all 0.3s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-2px)"
                    e.currentTarget.style.boxShadow = "0 12px 40px rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.04)"
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)"
                    e.currentTarget.style.boxShadow = "0 8px 32px rgba(0,0,0,0.07), 0 2px 8px rgba(0,0,0,0.03)"
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 8,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 10,
                        fontWeight: 600,
                        color: "var(--landing-text-muted)",
                        letterSpacing: "0.03em",
                      }}
                    >
                      {entry.date} &middot; {entry.time}
                    </span>
                  </div>

                  <div style={{ display: "flex", gap: 4, marginBottom: 10 }}>
                    {entry.emojis.map((e, ei) => (
                      <span key={ei} style={{ fontSize: 15 }}>{e}</span>
                    ))}
                  </div>

                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: 600,
                      color: "var(--landing-text)",
                      margin: "0 0 6px",
                      lineHeight: 1.3,
                    }}
                  >
                    {entry.title}
                  </p>

                  <p
                    style={{
                      fontSize: 13,
                      lineHeight: 1.5,
                      color: "var(--landing-text-secondary)",
                      margin: 0,
                      fontWeight: 400,
                    }}
                  >
                    {entry.preview}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  )
}
