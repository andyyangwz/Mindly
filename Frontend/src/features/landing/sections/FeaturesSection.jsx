import { Brain, MessageSquare, BarChart3, BookOpen } from "lucide-react";
import { useTranslation } from "react-i18next";
import ScrollReveal from "../components/ScrollReveal";

const ICON_MAP = { Brain, MessageSquare, BarChart3, BookOpen };

const GRADIENTS = [
  "linear-gradient(135deg, var(--landing-accent), var(--landing-accent-soft))",
  "linear-gradient(135deg, var(--landing-secondary), var(--landing-accent-soft))",
  "linear-gradient(135deg, var(--landing-accent-soft), var(--landing-accent))",
  "linear-gradient(135deg, var(--landing-accent), var(--landing-secondary))",
];

const ICON_KEYS = ["Brain", "BookOpen", "MessageSquare", "BarChart3"];

export default function FeaturesSection() {
  const { t } = useTranslation();
  const features = t("landing.features.cards", { returnObjects: true });
  return (
    <section className="landing-section">
      <div className="section-container--wide">
        <ScrollReveal>
          <p className="section-label text-center mb-12">{t("landing.features.label")}</p>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <h2 className="section-title section-title--center section-title--compact">{t("landing.features.title")}</h2>
        </ScrollReveal>

        <div className="feature-grid">
          {features.map((feature, i) => {
            const Icon = ICON_MAP[ICON_KEYS[i]];
            return (
              <ScrollReveal key={feature.title} delay={0.1 * i} distance={30}>
                <div className="feature-card">
                  <div
                    className="feature-icon-box"
                    style={{ background: GRADIENTS[i] }}
                  >
                    <Icon size={18} color="white" />
                  </div>

                  <h3 className="feature-card-title">{feature.title}</h3>

                  <p className="feature-card-desc">{feature.desc}</p>
                </div>
              </ScrollReveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
