import { useTranslation } from "react-i18next";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../../../theme/ThemeProvider";

export default function ThemeToggle() {
  const { t } = useTranslation();
  const { resolvedTheme, toggleTheme } = useTheme();
  const isLight = resolvedTheme === "light";

  return (
    <button
      onClick={toggleTheme}
      aria-label={isLight ? t("landing.themeToggle.darkMode") : t("landing.themeToggle.lightMode")}
      className="toggle-btn toggle-btn--theme"
    >
      {isLight ? <Moon size={16} /> : <Sun size={16} />}
    </button>
  );
}
