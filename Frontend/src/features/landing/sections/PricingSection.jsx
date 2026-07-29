import { Check, X, ChevronRight, Star, Sparkles, ShieldCheck, CreditCard, Clock, Zap } from "lucide-react";
import { useTranslation } from "react-i18next";
import ScrollReveal from "../components/ScrollReveal";

const TRUST_ICONS = [<ShieldCheck size={13} />, <CreditCard size={13} />, <Zap size={13} />, <Clock size={13} />];

export default function PricingSection() {
  const { t } = useTranslation();
  const p = t("landing.pricing.plans", { returnObjects: true });
  const features = t("landing.pricing.features", { returnObjects: true });
  const trustItems = t("landing.pricing.trustItems", { returnObjects: true });
  const fv = t("landing.pricing.freeValues", { returnObjects: true });
  const pv = t("landing.pricing.premiumValues", { returnObjects: true });

  const FEATURE_VALUES = [
    { premium: true, free: <X size={14} color="#EF4444" />, monthly: <Check size={14} color="#10B981" />, yearly: <Check size={14} color="#10B981" /> },
    { premium: true, free: <X size={14} color="#EF4444" />, monthly: <Check size={14} color="#10B981" />, yearly: <Check size={14} color="#10B981" /> },
    { premium: true, free: <X size={14} color="#EF4444" />, monthly: <Check size={14} color="#10B981" />, yearly: <Check size={14} color="#10B981" /> },
    {
      premium: true,
      free: <span className="fv-text">{fv.voiceTranscription}</span>,
      monthly: <span className="fv-text--strong">{pv.unlimited}</span>,
      yearly: <span className="fv-text--strong">{pv.unlimited}</span>,
    },
    { premium: true, free: <X size={14} color="#EF4444" />, monthly: <Check size={14} color="#10B981" />, yearly: <Check size={14} color="#10B981" /> },
    {
      premium: true,
      free: <span className="fv-text">{fv.empathicListener}</span>,
      monthly: (
        <div className="flex-col-center gap-2">
          {pv.aiPersonalities.map((name) => (
            <span key={name} className="flex-center gap-4">
              <Check size={12} color="#10B981" /> {name}
            </span>
          ))}
        </div>
      ),
      yearly: (
        <div className="flex-col-center gap-2">
          {pv.aiPersonalities.map((name) => (
            <span key={name} className="flex-center gap-4">
              <Check size={12} color="#10B981" /> {name}
            </span>
          ))}
        </div>
      ),
    },
  ];
  return (
    <section id="pricing" className="landing-section landing-section--pricing">
      <div
        className="ambient-glow"
        style={{
          top: "30%",
          left: "50%",
          width: "60vw",
          maxWidth: 800,
          height: "60vw",
          maxHeight: 800,
          filter: "blur(120px)",
          transform: "translate(-50%, -50%)",
          opacity: 0.5,
        }}
      />

      <div className="section-container">
        <ScrollReveal>
          <div className="section-header">
            <h2 className="section-title--big">{t("landing.pricing.title")}</h2>
            <p className="section-subtitle">{t("landing.pricing.subtitle")}</p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.08}>
          <div className="value-banner">
            <h3 className="value-banner-title">{t("landing.pricing.valueTitle")}</h3>
            <p className="value-banner-desc">{t("landing.pricing.valueDesc")}</p>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.15}>
          <div className="pricing-table-wrap card card--inset">
            <div className="overflow-x-auto">
              <table className="pricing-table">
                <thead>
                  <tr>
                    <th className="pricing-th--feature">
                      <span className="pricing-cta-label">{t("landing.pricing.featureCol")}</span>
                    </th>

                    <th className="pricing-th pricing-th--free" data-plan="free">
                      <div className="pricing-label pricing-label--muted">{p.freeLabel}</div>
                      <div className="pricing-price">{p.freePrice}</div>
                      <div className="pricing-sub">{p.freeSub}</div>
                    </th>

                    <th className="pricing-th pricing-th--monthly" data-plan="monthly">
                      <div className="pricing-label pricing-label--accent">{p.monthlyLabel}</div>
                      <div className="pricing-price--high">{p.monthlyPrice}</div>
                      <div className="pricing-sub--green">{p.monthlySub}</div>
                      <div className="pricing-renewal">{p.monthlyRenewal}</div>
                    </th>

                    <th className="pricing-th pricing-th--yearly" data-plan="yearly">
                      <div className="pricing-badge">
                        <span className="pricing-badge-sparkle">
                          <Sparkles size={10} />
                          {p.yearlyBadge}
                        </span>
                        <span className="pricing-badge-save">{p.yearlySave}</span>
                      </div>

                      <div className="pricing-label pricing-label--accent">{p.yearlyLabel}</div>
                      <div className="pricing-price--high">{p.yearlyPrice}</div>
                      <div className="pricing-sub" />
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {features.map((row, i) => {
                    const vals = FEATURE_VALUES[i] || {};
                    const isLast = i === features.length - 1;
                    const borderStyle = isLast ? "none" : `1px solid var(--landing-border)`;

                    return (
                      <tr key={row.feature || i}>
                        <td className="pricing-td--feature" style={{ borderBottom: borderStyle }}>
                          <div className="pricing-feature-row">
                            {vals.premium && (
                              <Star size={11} color="var(--landing-accent)" fill="var(--landing-accent)" className="pricing-star" />
                            )}
                            <span>{row.feature}</span>
                          </div>
                          <div className="pricing-feature-desc">{row.desc}</div>
                        </td>

                        <td className="plan-col-free pricing-td" data-plan="free" style={{ borderBottom: borderStyle }}>
                          <div className="pricing-cell-center">{vals.free}</div>
                        </td>

                        <td className="plan-col-monthly pricing-td pricing-td--monthly" data-plan="monthly" style={{ borderBottom: borderStyle }}>
                          <div className="pricing-cell-center">{vals.monthly}</div>
                        </td>

                        <td className="plan-col-yearly pricing-td pricing-td--yearly" data-plan="yearly" style={{ borderBottom: borderStyle }}>
                          <div className="pricing-cell-center">{vals.yearly}</div>
                        </td>
                      </tr>
                    );
                  })}

                  <tr>
                    <td className="pricing-cta-td">
                      <span className="pricing-cta-label">{t("landing.pricing.cta.getStarted")}</span>
                    </td>

                    <td className="pricing-cta-td--free" data-plan="free">
                      <a href="/auth" className="pricing-cta-free">
                        {t("landing.pricing.cta.getFree")}
                      </a>
                    </td>

                    <td className="pricing-cta-td--monthly" data-plan="monthly">
                      <a href="/auth" className="pricing-cta-monthly">
                        {t("landing.pricing.cta.startMonthly")} <ChevronRight size={13} />
                      </a>
                    </td>

                    <td className="pricing-cta-td--yearly" data-plan="yearly">
                      <a href="/auth" className="pricing-cta-yearly">
                        {t("landing.pricing.cta.startYearly")} <ChevronRight size={14} />
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </ScrollReveal>

        <ScrollReveal delay={0.25}>
          <div className="trust-row">
            {trustItems.map((label, idx) => (
              <div key={label} className="trust-item">
                <span className="trust-icon">{TRUST_ICONS[idx]}</span>
                {label}
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
