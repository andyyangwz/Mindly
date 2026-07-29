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
    <section className="landing-section landing-section--why">
      <div
        className="ambient-glow"
        style={{
          top: "40%",
          left: "50%",
          width: "50vw",
          maxWidth: 600,
          height: "50vw",
          maxHeight: 600,
          filter: "blur(120px)",
          transform: "translate(-50%, -50%)",
          opacity: 0.4,
        }}
      />

      <div className="section-container--wide">
        <ScrollReveal>
          <div className="text-center mb-48">
            <p className="section-label">{t("landing.why.label")}</p>
            <h2 className="section-title">{t("landing.why.title")}</h2>
          </div>
        </ScrollReveal>

        <div className="why-grid">
          <ScrollReveal direction="left" distance={30}>
            <div>
              <h3 className="why-subtitle">{t("landing.why.ideaTitle")}</h3>

              <div className="why-body">
                <p>{t("landing.why.ideaPara1")}</p>
                <p>{t("landing.why.ideaPara2")}</p>
                <p className="why-emphasis">
                  {t("landing.why.emphasis1")}
                  <br />
                  {t("landing.why.emphasis2")}
                </p>
                <p>{t("landing.why.ideaPara3")}</p>
              </div>

              <div className="why-highlights">
                {highlightLabels.map((label, idx) => {
                  const Icon = HIGHLIGHT_ICONS[idx];
                  return (
                    <div key={label} className="why-highlight-card">
                      <div
                        className="why-highlight-icon"
                        style={{ background: HIGHLIGHT_GRADIENTS[idx] }}
                      >
                        <Icon size={15} color="white" />
                      </div>
                      <div className="why-highlight-title">{label}</div>
                      <div className="why-highlight-desc">{highlightTexts[idx]}</div>
                    </div>
                  );
                })}
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal direction="right" distance={30}>
            <div>
              <h3 className="why-subtitle">{t("landing.why.forTitle")}</h3>

              <p className="why-intro">{t("landing.why.forIntro")}</p>

              <div className="why-persona-grid">
                {personaTitles.map((title, idx) => {
                  const Icon = PERSONA_ICONS[idx];
                  return (
                    <div key={title} className="why-persona-card">
                      <div className="why-persona-header">
                        <div className="why-persona-icon">
                          <Icon size={13} color="var(--landing-accent)" />
                        </div>
                        <span className="why-persona-name">{title}</span>
                      </div>
                      <p className="why-persona-desc">{personaDescs[idx]}</p>
                    </div>
                  );
                })}
              </div>

              <div className="why-checklist">
                <p className="why-checklist-title">{t("landing.why.checklistTitle")}</p>
                <div className="why-checklist-items">
                  {checklistItems.map((item) => (
                    <div key={item} className="why-checklist-item">
                      <Check size={13} color="var(--landing-accent)" className="why-checklist-check" />
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </ScrollReveal>
        </div>

        <div className="why-mascot-section">
          <ScrollReveal delay={0.2}>
            <div className="why-speech-bubble">
              <span className="why-speech-bold">{t("landing.why.speechBold")}</span>{" "}
              {t("landing.why.speechNormal")}
              <br />
              {t("landing.why.speechEnd")}
              <div className="why-speech-tail" />
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.3}>
            <img
              src={mascotSrc}
              alt={t("landing.why.mascotAlt")}
              className="why-mascot-img"
            />
          </ScrollReveal>
        </div>
      </div>
    </section>
  );
}
