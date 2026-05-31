import { Check, Brain, Heart, Sparkles, GraduationCap, Users, Target, Compass } from "lucide-react";
import { useTranslation } from "react-i18next";
import ScrollReveal from "../components/ScrollReveal";
import mascotSrc from "../../../assets/mascot_images/empathic.png";

const HIGHLIGHT_ICONS = [Brain, Heart, Sparkles];
const HIGHLIGHT_GRADIENTS = [
  "linear-gradient(135deg, var(--landing-accent), var(--landing-accent-soft))",
  "linear-gradient(135deg, #EC4899, #F472B6)",
  "linear-gradient(135deg, #10B981, #34D399)",
];
const PERSONA_ICONS = [GraduationCap, Users, Target, Compass];

export default function WhySection() {
  const { t } = useTranslation();
  const highlightLabels = t("landing.why.highlightLabels", { returnObjects: true });
  const highlightTexts = t("landing.why.highlightTexts", { returnObjects: true });
  const personaTitles = t("landing.why.personaTitles", { returnObjects: true });
  const personaDescs = t("landing.why.personaDescs", { returnObjects: true });
  const checklistItems = t("landing.why.checklistItems", { returnObjects: true });
  return (
    <section
      style={{
        position: "relative",
        zIndex: 1,
        padding: "100px 32px 80px",
      }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position: "absolute",
          top: "40%",
          left: "50%",
          width: "50vw",
          maxWidth: 600,
          height: "50vw",
          maxHeight: 600,
          borderRadius: "50%",
          background: "var(--landing-hero-glow)",
          filter: "blur(120px)",
          transform: "translate(-50%, -50%)",
          opacity: 0.4,
          pointerEvents: "none",
        }}
      />

      <div style={{ maxWidth: 1100, margin: "0 auto", position: "relative" }}>
        {/* Section label */}
        <ScrollReveal>
          <div style={{ textAlign: "center", marginBottom: 56 }}>
            <p
              style={{
                fontSize: "clamp(11px, 1.2vw, 14px)",
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: "var(--landing-accent)",
                fontWeight: 600,
                margin: "0 0 12px",
              }}
            >
              {t("landing.why.label")}
            </p>
            <h2
              style={{
                fontSize: "clamp(26px, 3.5vw, 40px)",
                fontWeight: 300,
                color: "var(--landing-text)",
                margin: 0,
                letterSpacing: "-0.03em",
                lineHeight: 1.2,
              }}
            >
              {t("landing.why.title")}
            </h2>
          </div>
        </ScrollReveal>

        {/* ===== Two-Column Content ===== */}
        <div
          className="why-grid"
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 48,
            alignItems: "start",
          }}
        >
          {/* Left Column: The idea behind Mindly */}
          <ScrollReveal direction="left" distance={30}>
            <div>
              <h3
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: "var(--landing-text)",
                  margin: "0 0 20px",
                  letterSpacing: "-0.01em",
                }}
              >
                {t("landing.why.ideaTitle")}
              </h3>

              <div
                style={{
                  fontSize: 14,
                  lineHeight: 1.8,
                  color: "var(--landing-text-secondary)",
                  fontWeight: 350,
                  display: "flex",
                  flexDirection: "column",
                  gap: 16,
                }}
              >
                <p style={{ margin: 0 }}>{t("landing.why.ideaPara1")}</p>
                <p style={{ margin: 0 }}>{t("landing.why.ideaPara2")}</p>
                <p
                  style={{
                    margin: 0,
                    color: "var(--landing-text)",
                    fontWeight: 450,
                    borderLeft: `2px solid var(--landing-accent)`,
                    paddingLeft: 14,
                  }}
                >
                  {t("landing.why.emphasis1")}
                  <br />
                  {t("landing.why.emphasis2")}
                </p>
                <p style={{ margin: 0 }}>{t("landing.why.ideaPara3")}</p>
              </div>

              {/* Highlight cards */}
              <div
                style={{
                  display: "flex",
                  gap: 12,
                  marginTop: 28,
                }}
                className="why-highlights"
              >
                {highlightLabels.map((label, idx) => {
                  const Icon = HIGHLIGHT_ICONS[idx];
                  return (
                    <div
                      key={label}
                      style={{
                        flex: 1,
                        borderRadius: 14,
                        background: "var(--landing-surface)",
                        border: `1px solid var(--landing-border)`,
                        padding: "16px 14px",
                        textAlign: "center",
                      }}
                    >
                      <div
                        style={{
                          width: 32,
                          height: 32,
                          borderRadius: 10,
                          background: HIGHLIGHT_GRADIENTS[idx],
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          margin: "0 auto 10px",
                          opacity: 0.85,
                        }}
                      >
                        <Icon size={15} color="white" />
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          fontWeight: 600,
                          color: "var(--landing-text)",
                          marginBottom: 3,
                        }}
                      >
                        {label}
                      </div>
                      <div
                        style={{
                          fontSize: 11,
                          color: "var(--landing-text-muted)",
                          fontWeight: 400,
                          lineHeight: 1.3,
                        }}
                      >
                        {highlightTexts[idx]}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </ScrollReveal>

          {/* Right Column: Who Is This For? */}
          <ScrollReveal direction="right" distance={30}>
            <div>
              <h3
                style={{
                  fontSize: 18,
                  fontWeight: 600,
                  color: "var(--landing-text)",
                  margin: "0 0 20px",
                  letterSpacing: "-0.01em",
                }}
              >
                {t("landing.why.forTitle")}
              </h3>

              <p
                style={{
                  fontSize: 14,
                  lineHeight: 1.7,
                  color: "var(--landing-text-secondary)",
                  fontWeight: 350,
                  margin: "0 0 24px",
                }}
              >
                {t("landing.why.forIntro")}
              </p>

              {/* Persona cards — 2x2 grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: 10,
                  marginBottom: 28,
                }}
              >
                {personaTitles.map((title, idx) => {
                  const Icon = PERSONA_ICONS[idx];
                  return (
                    <div
                      key={title}
                      style={{
                        borderRadius: 12,
                        background: "var(--landing-surface)",
                        border: `1px solid var(--landing-border)`,
                        padding: "14px 14px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 8,
                          marginBottom: 4,
                        }}
                      >
                        <div
                          style={{
                            width: 26,
                            height: 26,
                            borderRadius: 7,
                            background: `color-mix(in srgb, var(--landing-accent) 10%, transparent)`,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                          }}
                        >
                          <Icon size={13} color="var(--landing-accent)" />
                        </div>
                        <span
                          style={{
                            fontSize: 12,
                            fontWeight: 600,
                            color: "var(--landing-text)",
                          }}
                        >
                          {title}
                        </span>
                      </div>
                      <p
                        style={{
                          fontSize: 11,
                          color: "var(--landing-text-muted)",
                          fontWeight: 400,
                          margin: 0,
                          lineHeight: 1.4,
                        }}
                      >
                        {personaDescs[idx]}
                      </p>
                    </div>
                  );
                })}
              </div>

              {/* Checklist */}
              <div
                style={{
                  background: "var(--landing-surface)",
                  borderRadius: 14,
                  border: `1px solid var(--landing-border)`,
                  padding: "18px 20px",
                  marginBottom: 20,
                }}
              >
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 600,
                    color: "var(--landing-text)",
                    margin: "0 0 12px",
                  }}
                >
                  {t("landing.why.checklistTitle")}
                </p>
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: 8,
                  }}
                >
                  {checklistItems.map((item) => (
                    <div
                      key={item}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 8,
                        fontSize: 12,
                        color: "var(--landing-text-secondary)",
                        fontWeight: 400,
                      }}
                    >
                      <Check
                        size={13}
                        color="var(--landing-accent)"
                        style={{ flexShrink: 0, opacity: 0.7 }}
                      />
                      {item}
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </ScrollReveal>
        </div>

        {/* ===== Mascot with Speech Bubble (centered below) ===== */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 16,
            marginTop: 56,
          }}
        >
          <ScrollReveal delay={0.2}>
            <div
              style={{
                maxWidth: 360,
                padding: "18px 22px",
                borderRadius: 16,
                background: "var(--landing-surface)",
                border: `1px solid var(--landing-border)`,
                fontSize: 13,
                lineHeight: 1.7,
                color: "var(--landing-text-secondary)",
                fontWeight: 380,
                position: "relative",
                textAlign: "center",
                boxShadow: "var(--landing-shadow-sm)",
              }}
            >
              <span style={{ color: "var(--landing-text)", fontWeight: 500 }}>
                {t("landing.why.speechBold")}
              </span>{" "}
              {t("landing.why.speechNormal")}
              <br />
              {t("landing.why.speechEnd")}
              {/* Speech bubble tail */}
              <div
                style={{
                  position: "absolute",
                  bottom: -8,
                  left: "50%",
                  transform: "translateX(-50%) rotate(45deg)",
                  width: 14,
                  height: 14,
                  background: "var(--landing-surface)",
                  borderRight: `1px solid var(--landing-border)`,
                  borderBottom: `1px solid var(--landing-border)`,
                }}
              />
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.3}>
            <img
              src={mascotSrc}
              alt={t("landing.why.mascotAlt")}
              style={{
                width: 120,
                height: 120,
                objectFit: "contain",
                filter: "drop-shadow(0 4px 20px rgba(0,0,0,0.08))",
              }}
            />
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
