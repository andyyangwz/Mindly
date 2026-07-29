import { useTranslation } from "react-i18next";
import { ArrowRight } from "lucide-react";
import ScrollReveal from "../components/ScrollReveal";

export default function FinalCTASection() {
  const { t } = useTranslation();
  return (
    <section className="landing-section--final-cta">
      <div
        className="ambient-glow"
        style={{
          top: "50%",
          left: "50%",
          width: "50vw",
          height: "50vw",
          maxWidth: 700,
          maxHeight: 700,
          filter: "blur(120px)",
          transform: "translate(-50%, -50%)",
          opacity: 0.4,
        }}
      />

      <div className="section-container--narrow">
        <ScrollReveal>
          <h2 className="section-title--jumbo">{t("landing.finalCta.title")}</h2>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <p className="section-subtitle--desc">{t("landing.finalCta.desc")}</p>
        </ScrollReveal>

        <ScrollReveal delay={0.4}>
          <div className="flex-center gap-16 flex-wrap">
            <a href="/auth" className="btn-primary">
              {t("landing.finalCta.button")}
              <ArrowRight size={16} />
            </a>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.6}>
          <p className="final-cta-tagline">{t("landing.finalCta.tagline")}</p>
        </ScrollReveal>
      </div>
    </section>
  );
}
