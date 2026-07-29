import { useTranslation } from "react-i18next";
import ProgressTrackers from "../dashboard/components/ProgressTrackers";
import "../../styles/progressTracker/index.css";

export default function ProgressTrackerPage() {
  const { t } = useTranslation();

  return (
    <div className="hr-page">
      <h1 className="hr-title">
        {t("nav.progressTracker") || "Progress Tracker"}
      </h1>
      <ProgressTrackers />
    </div>
  );
}
