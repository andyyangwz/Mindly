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
      className="toggle-btn toggle-btn--lang"
    >
      {currentLang === "en" ? "EN" : "ID"}
    </button>
  );
}
