import { useTranslation } from "react-i18next";
import ScrollReveal from "../components/ScrollReveal";

export default function PhilosophySection() {
  const { t } = useTranslation();
  return (
    <section className="landing-section--philosophy">
      <div className="section-container--narrow text-center">
        <ScrollReveal>
          <p className="philosophy-text">{t("landing.philosophy.tagline")}</p>
        </ScrollReveal>
      </div>
    </section>
  );
}
