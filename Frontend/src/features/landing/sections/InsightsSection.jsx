import { TrendingUp, Target, Clock, Sparkles } from "lucide-react";
import ScrollReveal from "../components/ScrollReveal";

const INSIGHTS = [
  {
    icon: TrendingUp,
    label: "Focus Score",
    value: "+23%",
    description: "Deep work hours increased this week",
    color: "var(--landing-accent)",
  },
  {
    icon: Target,
    label: "Goals Completed",
    value: "7/10",
    description: "On track for your weekly targets",
    color: "var(--landing-accent-soft)",
  },
  {
    icon: Clock,
    label: "Best Time",
    value: "8 AM",
    description: "Your peak productivity window",
    color: "var(--landing-secondary)",
  },
  {
    icon: Sparkles,
    label: "Insight",
    value: "Reflective",
    description: "Your journaling depth is growing",
    color: "var(--landing-accent)",
  },
];

export default function InsightsSection() {
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
            Weekly Insights
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
            AI that gently helps you grow
          </h2>
        </ScrollReveal>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 20,
          }}
        >
          {INSIGHTS.map((item, i) => {
            const Icon = item.icon;
            return (
              <ScrollReveal key={item.label} delay={0.1 * i}>
                <div
                  style={{
                    borderRadius: 20,
                    background: "var(--landing-surface)",
                    border: "1px solid var(--landing-border)",
                    padding: "24px",
                    transition: "all 0.3s",
                    position: "relative",
                    overflow: "hidden",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = "translateY(-4px)";
                    e.currentTarget.style.boxShadow = "var(--landing-shadow-lg)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = "none";
                  }}
                >
                  <div
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      background: item.color,
                      opacity: 0.12,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      marginBottom: 14,
                    }}
                  >
                    <Icon size={16} color={item.color} />
                  </div>

                  <p
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: "var(--landing-text-muted)",
                      letterSpacing: "0.05em",
                      textTransform: "uppercase",
                      margin: "0 0 4px",
                    }}
                  >
                    {item.label}
                  </p>

                  <p
                    style={{
                      fontSize: 26,
                      fontWeight: 300,
                      color: "var(--landing-text)",
                      margin: "0 0 6px",
                      letterSpacing: "-0.02em",
                    }}
                  >
                    {item.value}
                  </p>

                  <p
                    style={{
                      fontSize: 12,
                      color: "var(--landing-text-secondary)",
                      lineHeight: 1.5,
                      margin: 0,
                      fontWeight: 350,
                    }}
                  >
                    {item.description}
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
