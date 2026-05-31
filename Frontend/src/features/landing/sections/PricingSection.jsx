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
      free: <span style={{ fontSize: 11, color: "var(--landing-text-secondary)" }}>{fv.voiceTranscription}</span>,
      monthly: <span style={{ fontSize: 11, fontWeight: 600, color: "var(--landing-text)" }}>{pv.unlimited}</span>,
      yearly: <span style={{ fontSize: 11, fontWeight: 600, color: "var(--landing-text)" }}>{pv.unlimited}</span>,
    },
    { premium: true, free: <X size={14} color="#EF4444" />, monthly: <Check size={14} color="#10B981" />, yearly: <Check size={14} color="#10B981" /> },
    {
      premium: true,
      free: <span style={{ fontSize: 11, color: "var(--landing-text-secondary)" }}>{fv.empathicListener}</span>,
      monthly: (
        <div style={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "center" }}>
          {pv.aiPersonalities.map((name) => (
            <span key={name} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Check size={12} color="#10B981" /> {name}
            </span>
          ))}
        </div>
      ),
      yearly: (
        <div style={{ display: "flex", flexDirection: "column", gap: 2, alignItems: "center" }}>
          {pv.aiPersonalities.map((name) => (
            <span key={name} style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <Check size={12} color="#10B981" /> {name}
            </span>
          ))}
        </div>
      ),
    },
  ];
  return (
    <section
      id="pricing"
      style={{
        position: "relative",
        zIndex: 1,
        padding: "100px 24px 80px",
      }}
    >
      {/* Background glow */}
      <div
        style={{
          position: "absolute",
          top: "30%",
          left: "50%",
          width: "60vw",
          maxWidth: 800,
          height: "60vw",
          maxHeight: 800,
          borderRadius: "50%",
          background: "var(--landing-hero-glow)",
          filter: "blur(120px)",
          transform: "translate(-50%, -50%)",
          opacity: 0.5,
          pointerEvents: "none",
        }}
      />

      <div
        style={{
          maxWidth: 1000,
          margin: "0 auto",
          position: "relative",
        }}
      >
        {/* ===== Section Header ===== */}
        <ScrollReveal>
          <div style={{ textAlign: "center", marginBottom: 48 }}>
            <h2
              style={{
                fontSize: "clamp(28px, 4vw, 44px)",
                fontWeight: 300,
                color: "var(--landing-text)",
                margin: "0 0 16px",
                letterSpacing: "-0.03em",
                lineHeight: 1.15,
              }}
            >
              {t("landing.pricing.title")}
            </h2>
            <p
              style={{
                fontSize: "clamp(14px, 1.6vw, 18px)",
                color: "var(--landing-text-secondary)",
                lineHeight: 1.6,
                margin: 0,
                fontWeight: 350,
                maxWidth: 520,
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
              {t("landing.pricing.subtitle")}
            </p>
          </div>
        </ScrollReveal>

        {/* ===== Value Framing ===== */}
        <ScrollReveal delay={0.08}>
          <div
            style={{
              textAlign: "center",
              marginBottom: 40,
              padding: "28px 32px",
              borderRadius: 16,
              background: `color-mix(in srgb, var(--landing-accent) 4%, transparent)`,
              border: `1px solid color-mix(in srgb, var(--landing-accent) 10%, transparent)`,
            }}
          >
            <h3
              style={{
                fontSize: "clamp(18px, 2.2vw, 24px)",
                fontWeight: 400,
                color: "var(--landing-text)",
                margin: "0 0 8px",
                letterSpacing: "-0.02em",
              }}
            >
              {t("landing.pricing.valueTitle")}
            </h3>
            <p
              style={{
                fontSize: "clamp(13px, 1.3vw, 15px)",
                color: "var(--landing-text-secondary)",
                margin: 0,
                fontWeight: 350,
                lineHeight: 1.6,
                maxWidth: 580,
                marginLeft: "auto",
                marginRight: "auto",
              }}
            >
              {t("landing.pricing.valueDesc")}
            </p>
          </div>
        </ScrollReveal>

        {/* ===== Pricing Table ===== */}
        <ScrollReveal delay={0.15}>
          <div
            className="pricing-table-wrap"
            style={{
              borderRadius: 20,
              border: `1px solid var(--landing-border)`,
              background: "var(--landing-card-bg)",
              backdropFilter: "blur(8px)",
              position: "relative",
            }}
          >
            <div style={{ overflowX: "auto" }}>
              <table
                className="pricing-table"
                style={{
                  width: "100%",
                  borderCollapse: "separate",
                  borderSpacing: 0,
                  fontSize: 13,
                  minWidth: 700,
                }}
              >
                <thead>
                  <tr>
                    {/* Feature column header */}
                    <th
                      className="plan-col-feature"
                      style={{
                        textAlign: "left",
                        padding: "28px 20px 24px",
                        borderBottom: `1px solid var(--landing-border)`,
                        background: "var(--landing-bg-alt)",
                        verticalAlign: "top",
                        position: "sticky",
                        top: 0,
                        zIndex: 2,
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: "var(--landing-text-muted)",
                          letterSpacing: "0.04em",
                          textTransform: "uppercase",
                        }}
                      >
                        {t("landing.pricing.featureCol")}
                      </span>
                    </th>

                    {/* Free column header */}
                    <th
                      className="plan-col-free"
                      data-plan="free"
                      style={{
                        textAlign: "center",
                        padding: "28px 16px 24px",
                        borderBottom: `1px solid var(--landing-border)`,
                        background: "var(--landing-bg-alt)",
                        verticalAlign: "top",
                        width: "24%",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          color: "var(--landing-text-muted)",
                          letterSpacing: "0.04em",
                          textTransform: "uppercase",
                          marginBottom: 8,
                        }}
                      >
                        {p.freeLabel}
                      </div>
                      <div
                        style={{
                          fontSize: "clamp(24px, 3vw, 30px)",
                          fontWeight: 300,
                          color: "var(--landing-text)",
                          letterSpacing: "-0.02em",
                          lineHeight: 1.1,
                        }}
                      >
                        {p.freePrice}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: "var(--landing-text-muted)",
                          marginTop: 4,
                          fontWeight: 400,
                        }}
                      >
                        {p.freeSub}
                      </div>
                    </th>

                    {/* Monthly column header */}
                    <th
                      className="plan-col-monthly"
                      data-plan="monthly"
                      style={{
                        textAlign: "center",
                        padding: "28px 16px 24px",
                        borderBottom: `1px solid var(--landing-border)`,
                        background: `color-mix(in srgb, var(--landing-accent) 6%, var(--landing-bg-alt))`,
                        verticalAlign: "top",
                        width: "24%",
                        position: "relative",
                      }}
                    >
                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          color: "var(--landing-accent)",
                          letterSpacing: "0.04em",
                          textTransform: "uppercase",
                          marginBottom: 6,
                        }}
                      >
                        {p.monthlyLabel}
                      </div>
                      <div
                        style={{
                          fontSize: "clamp(28px, 3.5vw, 36px)",
                          fontWeight: 600,
                          color: "var(--landing-text)",
                          letterSpacing: "-0.03em",
                          lineHeight: 1.1,
                        }}
                      >
                        {p.monthlyPrice}
                      </div>
                      <div
                        style={{
                          fontSize: 10,
                          color: "#10B981",
                          marginTop: 6,
                          fontWeight: 600,
                        }}
                      >
                        {p.monthlySub}
                      </div>
                      <div
                        style={{
                          fontSize: 9,
                          color: "var(--landing-text-muted)",
                          marginTop: 1,
                          fontWeight: 400,
                        }}
                      >
                        {p.monthlyRenewal}
                      </div>
                    </th>

                    {/* Yearly column header */}
                    <th
                      className="plan-col-yearly"
                      data-plan="yearly"
                      style={{
                        textAlign: "center",
                        padding: "28px 16px 24px",
                        borderBottom: `1px solid var(--landing-border)`,
                        background: `color-mix(in srgb, var(--landing-accent) 10%, var(--landing-bg-alt))`,
                        verticalAlign: "top",
                        width: "24%",
                        position: "relative",
                        boxShadow: `inset 0 1px 0 color-mix(in srgb, var(--landing-accent) 25%, transparent)`,
                      }}
                    >
                      {/* Badge row */}
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 6,
                          marginBottom: 10,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 700,
                            color: "white",
                            background: `linear-gradient(135deg, var(--landing-accent), var(--landing-accent-soft))`,
                            padding: "3px 12px",
                            borderRadius: 20,
                            letterSpacing: "0.03em",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: 4,
                            boxShadow: `0 2px 8px color-mix(in srgb, var(--landing-accent) 25%, transparent)`,
                          }}
                        >
                          <Sparkles size={10} />
                          {p.yearlyBadge}
                        </span>
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 700,
                            color: "#10B981",
                            background: "rgba(16,185,129,0.1)",
                            padding: "3px 10px",
                            borderRadius: 20,
                          }}
                        >
                          {p.yearlySave}
                        </span>
                      </div>

                      <div
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          color: "var(--landing-accent)",
                          letterSpacing: "0.04em",
                          textTransform: "uppercase",
                          marginBottom: 6,
                        }}
                      >
                        {p.yearlyLabel}
                      </div>
                      <div
                        style={{
                          fontSize: "clamp(28px, 3.5vw, 36px)",
                          fontWeight: 600,
                          color: "var(--landing-text)",
                          letterSpacing: "-0.03em",
                          lineHeight: 1.1,
                        }}
                      >
                        {p.yearlyPrice}
                      </div>
                      <div style={{ height: 16 }} />
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {features.map((row, i) => {
                    const vals = FEATURE_VALUES[i] || {};
                    const isLast = i === features.length - 1;
                    const borderStyle = isLast
                      ? "none"
                      : `1px solid var(--landing-border)`;

                    return (
                      <tr
                        key={row.feature || i}
                        style={{
                          transition: "background 0.15s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = `color-mix(in srgb, var(--landing-accent) 3%, transparent)`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                        }}
                      >
                        {/* Feature name + desc */}
                        <td
                          style={{
                            padding: "14px 20px",
                            borderBottom: borderStyle,
                            color: "var(--landing-text)",
                            fontWeight: 500,
                            fontSize: 13,
                            verticalAlign: "top",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: 6,
                              lineHeight: 1.3,
                            }}
                          >
                            {vals.premium && (
                              <Star
                                size={11}
                                color="var(--landing-accent)"
                                fill="var(--landing-accent)"
                                style={{ flexShrink: 0, opacity: 0.6 }}
                              />
                            )}
                            <span>{row.feature}</span>
                          </div>
                          <div
                            style={{
                              fontSize: 11,
                              color: "var(--landing-text-muted)",
                              fontWeight: 400,
                              marginTop: 2,
                              lineHeight: 1.4,
                            }}
                          >
                            {row.desc}
                          </div>
                        </td>

                        {/* Free */}
                        <td
                          className="plan-col-free"
                          data-plan="free"
                          style={{
                            padding: "14px 16px",
                            borderBottom: borderStyle,
                            textAlign: "center",
                            verticalAlign: "middle",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              minHeight: 22,
                            }}
                          >
                            {vals.free}
                          </div>
                        </td>

                        {/* Monthly */}
                        <td
                          className="plan-col-monthly"
                          data-plan="monthly"
                          style={{
                            padding: "14px 16px",
                            borderBottom: borderStyle,
                            textAlign: "center",
                            verticalAlign: "middle",
                            background: `color-mix(in srgb, var(--landing-accent) 3%, transparent)`,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              minHeight: 22,
                            }}
                          >
                            {vals.monthly}
                          </div>
                        </td>

                        {/* Yearly */}
                        <td
                          className="plan-col-yearly"
                          data-plan="yearly"
                          style={{
                            padding: "14px 16px",
                            borderBottom: borderStyle,
                            textAlign: "center",
                            verticalAlign: "middle",
                            background: `color-mix(in srgb, var(--landing-accent) 5%, transparent)`,
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              minHeight: 22,
                            }}
                          >
                            {vals.yearly}
                          </div>
                        </td>
                      </tr>
                    );
                  })}

                  {/* CTA row */}
                  <tr>
                    <td
                      className="plan-col-feature"
                      style={{
                        padding: "20px 20px",
                        borderTop: `1px solid var(--landing-border)`,
                        background: "var(--landing-bg-alt)",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: "var(--landing-text-muted)",
                          letterSpacing: "0.04em",
                          textTransform: "uppercase",
                        }}
                      >
                        {t("landing.pricing.cta.getStarted")}
                      </span>
                    </td>

                    {/* Free CTA */}
                    <td
                      className="plan-col-free"
                      data-plan="free"
                      style={{
                        padding: "20px 16px",
                        borderTop: `1px solid var(--landing-border)`,
                        textAlign: "center",
                        background: "var(--landing-bg-alt)",
                      }}
                    >
                      <a
                        href="/auth"
                        className="pricing-cta-free"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 4,
                          padding: "9px 20px",
                          borderRadius: 10,
                          border: `1px solid var(--landing-border)`,
                          background: "transparent",
                          color: "var(--landing-text)",
                          fontSize: 12,
                          fontWeight: 500,
                          cursor: "pointer",
                          textDecoration: "none",
                          transition: "all 0.2s",
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.background = "var(--landing-accent)";
                          e.currentTarget.style.color = "white";
                          e.currentTarget.style.borderColor = "var(--landing-accent)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.background = "transparent";
                          e.currentTarget.style.color = "var(--landing-text)";
                          e.currentTarget.style.borderColor = "var(--landing-border)";
                        }}
                      >
                        {t("landing.pricing.cta.getFree")}
                      </a>
                    </td>

                    {/* Monthly CTA */}
                    <td
                      className="plan-col-monthly"
                      data-plan="monthly"
                      style={{
                        padding: "20px 16px",
                        borderTop: `1px solid var(--landing-border)`,
                        textAlign: "center",
                        background: `color-mix(in srgb, var(--landing-accent) 6%, var(--landing-bg-alt))`,
                      }}
                    >
                      <a
                        href="/auth"
                        className="pricing-cta-monthly"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          padding: "9px 20px",
                          borderRadius: 10,
                          border: "none",
                          background: `linear-gradient(135deg, var(--landing-accent), var(--landing-accent-soft))`,
                          color: "white",
                          fontSize: 12,
                          fontWeight: 600,
                          cursor: "pointer",
                          textDecoration: "none",
                          transition: "all 0.25s",
                          boxShadow: `0 2px 12px color-mix(in srgb, var(--landing-accent) 25%, transparent)`,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-1px)";
                          e.currentTarget.style.boxShadow = `0 4px 20px color-mix(in srgb, var(--landing-accent) 35%, transparent)`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = `0 2px 12px color-mix(in srgb, var(--landing-accent) 25%, transparent)`;
                        }}
                      >
                        {t("landing.pricing.cta.startMonthly")} <ChevronRight size={13} />
                      </a>
                    </td>

                    {/* Yearly CTA */}
                    <td
                      className="plan-col-yearly"
                      data-plan="yearly"
                      style={{
                        padding: "20px 16px",
                        borderTop: `1px solid var(--landing-border)`,
                        textAlign: "center",
                        background: `color-mix(in srgb, var(--landing-accent) 8%, var(--landing-bg-alt))`,
                      }}
                    >
                      <a
                        href="/auth"
                        className="pricing-cta-yearly"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: 5,
                          padding: "10px 24px",
                          borderRadius: 10,
                          border: "none",
                          background: `linear-gradient(135deg, var(--landing-accent), #6D28D9)`,
                          color: "white",
                          fontSize: 13,
                          fontWeight: 700,
                          cursor: "pointer",
                          textDecoration: "none",
                          transition: "all 0.25s",
                          boxShadow: `0 4px 16px color-mix(in srgb, var(--landing-accent) 35%, transparent)`,
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.transform = "translateY(-2px)";
                          e.currentTarget.style.boxShadow = `0 8px 28px color-mix(in srgb, var(--landing-accent) 45%, transparent)`;
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.transform = "translateY(0)";
                          e.currentTarget.style.boxShadow = `0 4px 16px color-mix(in srgb, var(--landing-accent) 35%, transparent)`;
                        }}
                      >
                        {t("landing.pricing.cta.startYearly")} <ChevronRight size={14} />
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </ScrollReveal>

        {/* ===== Trust Indicators ===== */}
        <ScrollReveal delay={0.25}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 32,
              marginTop: 28,
              flexWrap: "wrap",
              rowGap: 12,
            }}
          >
            {trustItems.map((label, idx) => (
              <div
                key={label}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  fontSize: 12,
                  color: "var(--landing-text-muted)",
                  fontWeight: 450,
                }}
              >
                <span style={{ opacity: 0.5 }}>{TRUST_ICONS[idx]}</span>
                {label}
              </div>
            ))}
          </div>
        </ScrollReveal>
      </div>
    </section>
  );
}
