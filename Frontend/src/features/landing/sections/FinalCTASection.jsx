import { useTranslation } from "react-i18next";
import { ArrowRight } from "lucide-react";
import ScrollReveal from "../components/ScrollReveal";

export default function FinalCTASection() {
  const { t } = useTranslation();
  return (
    <section
      style={{
        minHeight: "80vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        zIndex: 1,
        padding: "120px 32px",
        textAlign: "center",
      }}
    >
      {/* Ambient glow */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          width: "50vw",
          height: "50vw",
          maxWidth: 700,
          maxHeight: 700,
          borderRadius: "50%",
          background: "var(--landing-hero-glow)",
          filter: "blur(120px)",
          transform: "translate(-50%, -50%)",
          opacity: 0.4,
          pointerEvents: "none",
        }}
      />

      <div style={{ maxWidth: 700, position: "relative" }}>
        <ScrollReveal>
          <h2
            style={{
              fontSize: "clamp(32px, 5vw, 60px)",
              fontWeight: 300,
              color: "var(--landing-text)",
              margin: "0 0 24px",
              letterSpacing: "-0.03em",
              lineHeight: 1.15,
            }}
          >
            {t("landing.finalCta.title")}
          </h2>
        </ScrollReveal>

        <ScrollReveal delay={0.2}>
          <p
            style={{
              fontSize: "clamp(16px, 1.8vw, 20px)",
              color: "var(--landing-text-secondary)",
              lineHeight: 1.7,
              margin: "0 0 48px",
              fontWeight: 350,
              maxWidth: 500,
              marginLeft: "auto",
              marginRight: "auto",
            }}
          >
            {t("landing.finalCta.desc")}
          </p>
        </ScrollReveal>

        <ScrollReveal delay={0.4}>
          <div style={{ display: "flex", gap: 16, justifyContent: "center", flexWrap: "wrap" }}>
            <a
              href="/auth"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 10,
                padding: "16px 36px",
                borderRadius: 16,
                border: "none",
                background: "linear-gradient(135deg, var(--landing-accent), var(--landing-accent-soft))",
                color: "white",
                fontSize: 15,
                fontWeight: 600,
                cursor: "pointer",
                textDecoration: "none",
                transition: "all 0.3s",
                boxShadow: "0 4px 24px color-mix(in srgb, var(--landing-accent) 30%, transparent)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = "translateY(-2px)";
                e.currentTarget.style.boxShadow = "0 8px 32px color-mix(in srgb, var(--landing-accent) 40%, transparent)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = "translateY(0)";
                e.currentTarget.style.boxShadow = "0 4px 24px color-mix(in srgb, var(--landing-accent) 30%, transparent)";
              }}
            >
              {t("landing.finalCta.button")}
              <ArrowRight size={16} />
            </a>

          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.6}>
          <p
            style={{
              marginTop: 80,
              fontSize: 11,
              color: "var(--landing-text-muted)",
              letterSpacing: "0.1em",
              fontWeight: 500,
            }}
          >
            {t("landing.finalCta.tagline")}
          </p>
        </ScrollReveal>
      </div>
    </section>
  );
}
