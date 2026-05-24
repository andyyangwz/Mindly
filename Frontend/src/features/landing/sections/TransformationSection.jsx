import { ArrowRight } from "lucide-react"
import ScrollReveal from "../components/ScrollReveal"

const BEFORE = [
  "distracted",
  "overwhelmed",
  "inconsistent",
  "mentally cluttered",
  "reactive",
  "drifting",
]

const AFTER = [
  "focused",
  "intentional",
  "disciplined",
  "clear-minded",
  "structured",
  "aligned",
]

export default function TransformationSection() {
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
            The Shift
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
            Who you become using Mindly
          </h2>
        </ScrollReveal>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 24,
          }}
        >
          {/* Before card */}
          <ScrollReveal delay={0.2} style={{ flex: 1 }}>
            <div
              style={{
                borderRadius: 20,
                background: "var(--landing-surface)",
                border: "1px solid var(--landing-border)",
                padding: "32px 28px",
                transition: "all 0.3s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)"
                e.currentTarget.style.boxShadow = "var(--landing-shadow-lg)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)"
                e.currentTarget.style.boxShadow = "none"
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "var(--landing-text-muted)",
                  margin: "0 0 20px",
                  opacity: 0.5,
                }}
              >
                Before
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {BEFORE.map((item) => (
                  <div
                    key={item}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px 12px",
                      borderRadius: 10,
                      background: "var(--landing-card-bg)",
                      border: "1px solid var(--landing-border)",
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: "var(--landing-text-muted)",
                        opacity: 0.3,
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontSize: 13,
                        color: "var(--landing-text-secondary)",
                        fontWeight: 400,
                        opacity: 0.6,
                      }}
                    >
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>

          {/* Transition arrow */}
          <ScrollReveal delay={0.3}>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 8,
                flexShrink: 0,
              }}
            >
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "var(--landing-accent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: 0.15,
                }}
              >
                <ArrowRight size={18} color="var(--landing-accent)" />
              </div>
              <div
                style={{
                  width: 1,
                  height: 60,
                  background: "var(--landing-border)",
                }}
              />
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  letterSpacing: "0.1em",
                  textTransform: "uppercase",
                  color: "var(--landing-text-muted)",
                  opacity: 0.4,
                  writingMode: "vertical-rl",
                }}
              >
                transformation
              </span>
              <div
                style={{
                  width: 1,
                  height: 60,
                  background: "var(--landing-border)",
                }}
              />
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: "50%",
                  background: "var(--landing-accent)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  opacity: 0.4,
                }}
              >
                <ArrowRight size={18} color="var(--landing-accent)" />
              </div>
            </div>
          </ScrollReveal>

          {/* After card */}
          <ScrollReveal delay={0.4} style={{ flex: 1 }}>
            <div
              style={{
                borderRadius: 20,
                background: "var(--landing-surface)",
                border: "1px solid var(--landing-border)",
                padding: "32px 28px",
                transition: "all 0.3s",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-4px)"
                e.currentTarget.style.boxShadow = "var(--landing-shadow-lg)"
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)"
                e.currentTarget.style.boxShadow = "none"
              }}
            >
              <p
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: "0.15em",
                  textTransform: "uppercase",
                  color: "var(--landing-accent)",
                  margin: "0 0 20px",
                }}
              >
                After
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {AFTER.map((item) => (
                  <div
                    key={item}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                      padding: "8px 12px",
                      borderRadius: 10,
                      background: "var(--landing-card-bg)",
                      border: "1px solid var(--landing-border)",
                    }}
                  >
                    <span
                      style={{
                        width: 6,
                        height: 6,
                        borderRadius: "50%",
                        background: "var(--landing-accent)",
                        opacity: 0.6,
                        flexShrink: 0,
                      }}
                    />
                    <span
                      style={{
                        fontSize: 13,
                        color: "var(--landing-text)",
                        fontWeight: 500,
                      }}
                    >
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>
        </div>
      </div>
    </section>
  )
}
