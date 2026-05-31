import { useTranslation } from "react-i18next";

export default function LanguageToggle() {
  const { i18n } = useTranslation();
  const currentLang = i18n.language?.startsWith("id") ? "id" : "en";

  function toggle() {
    const next = currentLang === "en" ? "id" : "en";
    i18n.changeLanguage(next);
  }

  return (
    <button
      onClick={toggle}
      aria-label={`Switch to ${currentLang === "en" ? "Indonesian" : "English"}`}
      style={{
        position: "fixed",
        top: 24,
        right: 76,
        zIndex: 100,
        width: 44,
        height: 44,
        borderRadius: "50%",
        border: "1px solid var(--landing-border)",
        background: "var(--landing-surface)",
        color: "var(--landing-text-secondary)",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        backdropFilter: "blur(12px)",
        WebkitBackdropFilter: "blur(12px)",
        transition: "all 0.3s ease",
        boxShadow: "var(--landing-shadow-sm)",
        fontSize: 14,
        fontWeight: 600,
        letterSpacing: "0.02em",
        fontFamily: "'Inter', system-ui, sans-serif",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--landing-accent)";
        e.currentTarget.style.color = "var(--landing-accent)";
        e.currentTarget.style.transform = "scale(1.05)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "var(--landing-border)";
        e.currentTarget.style.color = "var(--landing-text-secondary)";
        e.currentTarget.style.transform = "scale(1)";
      }}
    >
      {currentLang === "en" ? "EN" : "ID"}
    </button>
  );
}
