import { useTranslation } from "react-i18next";
import { theme } from "../../theme";
import HabitRelics from "../home/components/HabitRelics";

export default function HabitRelicsPage() {
  const { t } = useTranslation();

  return (
    <div style={{
      padding: "36px 48px 80px",
      margin: "0 auto",
      background: theme.bg,
      minHeight: "100vh",
      overflowY: "auto",
      maxWidth: 640,
    }}>
      <h1 style={{ fontSize: 22, fontWeight: 650, color: theme.dark, marginBottom: 32 }}>
        {t("nav.habitRelics") || "Habit Relics"}
      </h1>
      <HabitRelics />
    </div>
  );
}
