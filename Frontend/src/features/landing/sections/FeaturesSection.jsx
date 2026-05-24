import { Brain, MessageSquare, BarChart3, BookOpen } from "lucide-react";
import ScrollReveal from "../components/ScrollReveal";

const FEATURES = [
  {
    icon: Brain,
    title: "Productivity Manager",
    description: "Intelligent time blocks that adapt to your energy levels. Focus on what matters.",
    gradient: "linear-gradient(135deg, var(--landing-accent), var(--landing-accent-soft))",
  },
  {
    icon: BookOpen,
    title: "Goal Setting & Journaling",
    description: "Write with purpose. Set intentions that stick. Your journal becomes a map of your growth.",
    gradient: "linear-gradient(135deg, var(--landing-secondary), var(--landing-accent-soft))",
  },
  {
    icon: MessageSquare,
    title: "AI Integrated Chat",
    description: "A thinking partner that listens, reflects, and helps you untangle complex thoughts.",
    gradient: "linear-gradient(135deg, var(--landing-accent-soft), var(--landing-accent))",
  },
  {
    icon: BarChart3,
    title: "Weekly Improvement Insights",
    description: "Gentle, data-informed reflections on your patterns. See where you thrive.",
    gradient: "linear-gradient(135deg, var(--landing-accent), var(--landing-secondary))",
  },
];

export default function FeaturesSection() {
  return (
    <section
      style={{
        position: "relative",
        zIndex: 1,
        padding: "80px 32px",
      }}
    >
      <div style={{ maxWidth: 1100, margin: "0 auto" }}>
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
            Everything You Need
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <h2
            style={{
              fontSize: "clamp(26px, 3.5vw, 40px)",
              fontWeight: 300,
              color: "var(--landing-text)",
              textAlign: "center",
              margin: "0 0 60px",
              letterSpacing: "-0.03em",
              lineHeight: 1.2,
            }}
          >
            A complete cognitive toolkit
          </h2>
        </ScrollReveal>

        <div className="feature-grid">
          {FEATURES.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <ScrollReveal key={feature.title} delay={0.1 * i} distance={30}>
                <div
                  className="feature-card"
                  style={{
                    borderRadius: 20,
                    background: "var(--landing-surface)",
                    border: "1px solid var(--landing-border)",
                    padding: "28px 24px",
                    transition: "all 0.3s",
                    position: "relative",
                    overflow: "hidden",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "var(--landing-shadow-md)";
                    e.currentTarget.style.borderColor = "var(--landing-accent-soft)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                    e.currentTarget.style.borderColor = "var(--landing-border)";
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: feature.gradient,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 16,
                      opacity: 0.9,
                    }}
                  >
                    <Icon size={18} color="white" />
                  </div>

                  <h3
                    style={{
                      fontSize: 16,
                      fontWeight: 600,
                      color: "var(--landing-text)",
                      margin: "0 0 8px",
                      letterSpacing: "-0.01em",
                    }}
                  >
                    {feature.title}
                  </h3>

                  <p
                    style={{
                      fontSize: 13,
                      lineHeight: 1.6,
                      color: "var(--landing-text-secondary)",
                      margin: 0,
                      fontWeight: 350,
                    }}
                  >
                    {feature.description}
                  </p>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
