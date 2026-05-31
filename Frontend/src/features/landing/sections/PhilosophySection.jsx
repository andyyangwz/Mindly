import { useTranslation } from "react-i18next";
import ScrollReveal from "../components/ScrollReveal";

export default function PhilosophySection() {
  const { t } = useTranslation();
  return (
    <section
      style={{
        minHeight: "30vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        zIndex: 1,
        padding: "40px 32px",
      }}
    >
      <div style={{ maxWidth: 700, margin: "0 auto", textAlign: "center" }}>
        <ScrollReveal>
          <p
            style={{
              fontSize: "clamp(18px, 2.8vw, 32px)",
              fontWeight: 300,
              lineHeight: 1.5,
              color: "var(--landing-text)",
              letterSpacing: "-0.02em",
              margin: 0,
            }}
          >
            {t("landing.philosophy.tagline")}
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
