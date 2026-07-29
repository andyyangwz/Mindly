import { useTranslation } from "react-i18next"
import { ArrowRight } from "lucide-react"
import ScrollReveal from "../components/ScrollReveal"
import productiveSpilli from "../../../assets/mascot_images/productive_spilli.png"
import unproductiveSpilli from "../../../assets/mascot_images/unproductive_spilli.jpg"

function SpilliImg({ src, alt, accent }) {
  return (
    <div className="spilli-img-wrap" style={{ border: `1px solid ${accent}` }}>
      <img src={src} alt={alt} />
    </div>
  )
}

export default function TransformationSection() {
  const { t } = useTranslation();
  const beforeTraits = t("landing.transformation.beforeTraits", { returnObjects: true });
  const afterTraits = t("landing.transformation.afterTraits", { returnObjects: true });
  return (
    <section className="landing-section">
      <div className="section-container">
        <ScrollReveal>
          <p className="section-label text-center">{t("landing.transformation.label")}</p>
        </ScrollReveal>

        <ScrollReveal delay={0.1}>
          <h2 className="section-title section-title--center">{t("landing.transformation.title")}</h2>
        </ScrollReveal>

        <div className="flex-row items-center gap-24">
          <ScrollReveal delay={0.2} className="flex-1">
            <div className="transformation-card">
              <p className="transformation-label transformation-label--muted">{t("landing.transformation.before")}</p>

              <SpilliImg src={unproductiveSpilli} alt={t("landing.transformation.beforeAlt")} accent="var(--landing-border)" />

              <div className="flex-col gap-10">
                {beforeTraits.map((item) => (
                  <div key={item} className="transformation-trait">
                    <span className="transformation-trait-dot transformation-trait-dot--muted" />
                    <span className="transformation-trait-text transformation-trait-text--muted">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.3}>
            <div className="transformation-arrow">
              <div className="transformation-arrow-circle transformation-arrow-circle--dim">
                <ArrowRight size={18} color="var(--landing-accent)" />
              </div>
              <div className="transformation-arrow-line" />
              <span className="transformation-arrow-text">{t("landing.transformation.label_transformation")}</span>
              <div className="transformation-arrow-line" />
              <div className="transformation-arrow-circle transformation-arrow-circle--mid">
                <ArrowRight size={18} color="var(--landing-accent)" />
              </div>
            </div>
          </ScrollReveal>

          <ScrollReveal delay={0.4} className="flex-1">
            <div className="transformation-card">
              <p className="transformation-label transformation-label--accent">{t("landing.transformation.after")}</p>

              <SpilliImg src={productiveSpilli} alt={t("landing.transformation.afterAlt")} accent="var(--landing-accent)" />

              <div className="flex-col gap-10">
                {afterTraits.map((item) => (
                  <div key={item} className="transformation-trait">
                    <span className="transformation-trait-dot transformation-trait-dot--accent" />
                    <span className="transformation-trait-text transformation-trait-text--accent">{item}</span>
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
