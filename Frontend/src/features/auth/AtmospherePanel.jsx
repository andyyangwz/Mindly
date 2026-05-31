import { useMemo } from "react";
import { motion } from "framer-motion";
import { Brain } from "lucide-react";
import { useTranslation } from "react-i18next";
import TypewriterText from "./TypewriterText";

const DARK_ORBS = [
  { color: "#6C47FF", size: 420, x: "20%", y: "15%", duration: 28 },
  { color: "#4A3A8A", size: 320, x: "65%", y: "25%", duration: 35 },
  { color: "#2D2B55", size: 280, x: "40%", y: "60%", duration: 22 },
  { color: "#6C47FF", size: 200, x: "15%", y: "70%", duration: 30 },
  { color: "#4A3A8A", size: 180, x: "70%", y: "75%", duration: 26 },
];

const LIGHT_ORBS = [
  { color: "#C4B5FD", size: 380, x: "20%", y: "15%", duration: 28 },
  { color: "#A78BFA", size: 300, x: "65%", y: "25%", duration: 35 },
  { color: "#DDD6FE", size: 260, x: "40%", y: "60%", duration: 22 },
  { color: "#C4B5FD", size: 180, x: "15%", y: "70%", duration: 30 },
  { color: "#A78BFA", size: 160, x: "70%", y: "75%", duration: 26 },
];


function Orb({ isLight, color, size, x, y, duration }) {
  return (
    <motion.div
      style={{
        position: "absolute",
        width: size,
        height: size,
        left: x,
        top: y,
        borderRadius: "50%",
        background: isLight
          ? `radial-gradient(circle at 30% 30%, ${color}80 0%, ${color}30 40%, transparent 70%)`
          : `radial-gradient(circle at 30% 30%, ${color}50 0%, ${color}20 40%, transparent 70%)`,
        pointerEvents: "none",
        transform: "translate(-50%, -50%)",
      }}
      animate={{
        y: [0, -30, -15, -40, 0],
        scale: [1, 1.06, 0.96, 1.04, 1],
      }}
      transition={{
        duration,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    />
  );
}

function FloatingParticle({ isLight }) {
  const x = useMemo(() => Math.random() * 100, []);
  const y = useMemo(() => Math.random() * 100, []);
  const size = useMemo(() => 1.5 + Math.random() * 2.5, []);
  const duration = useMemo(() => 12 + Math.random() * 18, []);
  const delay = useMemo(() => Math.random() * 10, []);

  return (
    <motion.div
      style={{
        position: "absolute",
        left: `${x}%`,
        top: `${y}%`,
        width: size,
        height: size,
        borderRadius: "50%",
        background: isLight
          ? "rgba(124,92,252,0.12)"
          : "rgba(255,255,255,0.15)",
        pointerEvents: "none",
      }}
      animate={{
        y: [0, -40, -20, -50, 0],
        opacity: isLight
          ? [0.12, 0.35, 0.18, 0.4, 0.12]
          : [0.15, 0.4, 0.2, 0.5, 0.15],
      }}
      transition={{
        duration,
        repeat: Infinity,
        delay,
        ease: "easeInOut",
      }}
    />
  );
}

export default function AtmospherePanel({ isLight }) {
  const { t } = useTranslation();
  const orbs = isLight ? LIGHT_ORBS : DARK_ORBS;
  const taglines = isLight
    ? t("auth.atmosphere.taglinesLight", { returnObjects: true })
    : t("auth.atmosphere.taglinesDark", { returnObjects: true });

  return (
    <div
      style={{
        position: "relative",
        flex: "1 1 55%",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        overflow: "hidden",
        background: isLight
          ? "radial-gradient(ellipse at 30% 40%, #F4F1F8 0%, #EEEAFA 40%, #E8E2F4 100%)"
          : "radial-gradient(ellipse at 30% 40%, #0F0B1E 0%, #0A0A1A 60%, #080812 100%)",
      }}
    >
      {/* Mesh gradient overlay */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: isLight
            ? `
              radial-gradient(ellipse at 20% 20%, rgba(196,181,253,0.08) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 80%, rgba(167,139,250,0.06) 0%, transparent 50%),
              radial-gradient(ellipse at 50% 50%, rgba(221,214,254,0.05) 0%, transparent 60%)
            `
            : `
              radial-gradient(ellipse at 20% 20%, rgba(108,71,255,0.06) 0%, transparent 50%),
              radial-gradient(ellipse at 80% 80%, rgba(74,58,138,0.04) 0%, transparent 50%),
              radial-gradient(ellipse at 50% 50%, rgba(45,43,85,0.03) 0%, transparent 60%)
            `,
          pointerEvents: "none",
        }}
      />

      {/* Vignette */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background: isLight
            ? "radial-gradient(ellipse at center, transparent 40%, rgba(238,234,250,0.5) 100%)"
            : "radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.4) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Glowing orbs */}
      {orbs.map((orb, i) => (
        <Orb key={i} {...orb} isLight={isLight} />
      ))}

      {/* Floating particles */}
      {Array.from({ length: 30 }).map((_, i) => (
        <FloatingParticle key={i} isLight={isLight} />
      ))}

      {/* Content */}
      <div
        style={{
          position: "relative",
          zIndex: 2,
          padding: "80px 60px",
          maxWidth: 560,
        }}
      >
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 48 }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: 12,
              background: isLight
                ? "linear-gradient(135deg, rgba(124,92,252,0.2), rgba(167,139,250,0.12))"
                : "linear-gradient(135deg, rgba(108,71,255,0.3), rgba(74,58,138,0.2))",
              border: isLight
                ? "1px solid rgba(124,92,252,0.12)"
                : "1px solid rgba(108,71,255,0.15)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            <Brain
              size={20}
              color={isLight ? "rgba(124,92,252,0.8)" : "rgba(200,190,240,0.9)"}
            />
          </div>
          <div>
            <span
              style={{
                fontWeight: 700,
                fontSize: 17,
                color: isLight ? "rgba(45,43,61,0.9)" : "rgba(232,230,240,0.95)",
                letterSpacing: "-0.01em",
              }}
            >
              {t("auth.atmosphere.title")}
            </span>
            <p
              style={{
                margin: 0,
                fontSize: 11,
                color: isLight ? "rgba(45,43,61,0.35)" : "rgba(154,148,184,0.6)",
                fontWeight: 400,
                letterSpacing: "0.04em",
                textTransform: "none",
              }}
            >
              {t("auth.atmosphere.subtitle")}
            </p>
          </div>
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
          style={{
            fontSize: 38,
            fontWeight: 300,
            lineHeight: 1.2,
            color: isLight ? "rgba(45,43,61,0.9)" : "rgba(232,230,240,0.95)",
            letterSpacing: "-0.03em",
            margin: 0,
            marginBottom: 20,
          }}
        >
          {t("auth.atmosphere.headline1")}
          <br />
          <span style={{ fontWeight: 600, color: isLight ? "rgba(124,92,252,0.85)" : "rgba(200,190,240,0.9)" }}>
            {t("auth.atmosphere.headline2")}
          </span>
        </motion.h1>

        {/* Typewriter taglines */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 0.35, ease: "easeOut" }}
        >
          <TypewriterText
            texts={taglines}
            style={{
              fontSize: 14,
              fontWeight: 400,
              lineHeight: 1.6,
              letterSpacing: "0.01em",
              color: isLight
                ? "rgba(45,43,61,0.5)"
                : "rgba(154,148,184,0.6)",
              minHeight: "1.6em",
            }}
          />
        </motion.div>

        {/* Footer */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.7, delay: 1.0, ease: "easeOut" }}
          style={{
            position: "absolute",
            bottom: 40,
            left: 60,
            right: 60,
          }}
        >
          <div
            style={{
              width: 40,
              height: 2,
              background: isLight
                ? "linear-gradient(90deg, rgba(124,92,252,0.3), transparent)"
                : "linear-gradient(90deg, rgba(108,71,255,0.4), transparent)",
              marginBottom: 16,
              borderRadius: 1,
            }}
          />
          <p
            style={{
              margin: 0,
              fontSize: 11,
              color: isLight ? "rgba(45,43,61,0.2)" : "rgba(154,148,184,0.35)",
              fontWeight: 500,
              letterSpacing: "0.04em",
            }}
          >
            {t("auth.atmosphere.footer")}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
