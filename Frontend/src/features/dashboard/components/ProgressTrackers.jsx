import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Target, Ribbon, Plus, Settings, ArrowUp } from "lucide-react";
import { useProgressTrackers } from "../hooks/useProgressTrackers";
import { resolveIcon } from "../components/IconPicker";
import CreateProgressTrackerModal from "../components/CreateProgressTrackerModal";
import EditProgressTrackerModal from "../components/EditProgressTrackerModal";
import RelicManagerModal from "../components/RelicManagerModal";
import UpdateProgressModal from "../components/UpdateProgressModal";
import InfoButton from "../../../components/tutorial/InfoButton";
import { useTutorial } from "../../../components/tutorial/TutorialContext";
import "../../../styles/dashboard/index.css"

const circ = 2 * Math.PI * 16;

function getStatus(t, current, target) {
  if (target === 0) return { label: t("dashboard.progressTracker.status.noTarget"), color: "var(--color-muted)", bg: "color-mix(in srgb, var(--color-muted) 12%, transparent)" };
  if (current > target) return { label: t("dashboard.progressTracker.status.onFire"), color: "#DC2626", bg: "color-mix(in srgb, #DC2626 12%, transparent)" };
  if (current === target) return { label: t("dashboard.progressTracker.status.achieved"), color: "#059669", bg: "color-mix(in srgb, #059669 12%, transparent)" };
  const pct = current / target;
  if (pct >= 0.8) return { label: t("dashboard.progressTracker.status.almostDone"), color: "#D97706", bg: "color-mix(in srgb, #D97706 12%, transparent)" };
  return { label: t("dashboard.progressTracker.status.inProgress"), color: "var(--color-muted)", bg: "color-mix(in srgb, var(--color-muted) 12%, transparent)" };
}

export default function ProgressTrackers() {
  const { t } = useTranslation();
  const { relics, loading, error, createRelic, updateRelic, deleteRelic, equipRelic, unequipRelic } = useProgressTrackers();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRelic, setEditingGoal] = useState(null);
  const [relicManagerMode, setRelicManagerMode] = useState(null);
  const [updateProgressOpen, setUpdateProgressOpen] = useState(false);

  const { tutorialId, tutorialStep } = useTutorial();

  const isTutorial = tutorialId === "progress-tracker-onboarding";

  const tutorialRelic = useMemo(() => isTutorial ? {
    id: "tutorial-relic",
    title: "Mindfulness",
    icon: "FaStar",
    current_progress: 4,
    target: 10,
    is_equipped: true,
    equipped_order: 0,
  } : null, [isTutorial]);

  const displayRelics = useMemo(() => {
    if (isTutorial && tutorialRelic) {
      return [
        tutorialRelic,
        ...relics
          .filter(r => r.id !== "tutorial-relic")
          .map(r => ({ ...r, is_equipped: false, equipped_order: null })),
      ];
    }
    return relics;
  }, [isTutorial, tutorialRelic, relics]);

  const equipped = useMemo(
    () => displayRelics
      .filter((g) => g.is_equipped)
      .sort((a, b) => (a.equipped_order ?? 99) - (b.equipped_order ?? 99)),
    [displayRelics]
  );

  const inventory = useMemo(() => displayRelics.filter((g) => !g.is_equipped), [displayRelics]);

  // Auto-open/close modals during tutorial
  useEffect(() => {
    if (tutorialId !== "progress-tracker-onboarding") {
      setRelicManagerMode(null);
      setUpdateProgressOpen(false);
      return;
    }
    setRelicManagerMode(tutorialStep >= 3 && tutorialStep <= 4 ? "change" : null);
    setUpdateProgressOpen(tutorialStep >= 5);
  }, [tutorialId, tutorialStep]);

  const handleCreated = async (data) => {
    await createRelic(data);
    setModalOpen(false);
    setRelicManagerMode("change");
  };

  return (
    <div
      data-tutorial-target="progress-tracker"
      className="progress-tracker-container"
      style={{ display: "flex", flexDirection: "column", userSelect: "none" }}>
      <div className="hr-header">
        <div className="hr-header-left">
          <div className="hr-header-icon">
            <Target size={13} color="white" />
          </div>
          <h2 className="hd-title">
            {t("dashboard.progressTracker.title")}
            <InfoButton tutorialId="progress-tracker-onboarding" />
          </h2>
        </div>
        <div className="hr-mastery-badge">
          <Ribbon size={11} color="var(--color-primary)" />
          <span className="hr-mastery-text">
            {t("dashboard.progressTracker.beAMaster")}
          </span>
        </div>
      </div>

      <div data-tutorial-target="progress-tracker-equipped" className="hr-equipped-list">
        {loading ? (
          <div className="hr-empty-state">{t("dashboard.progressTracker.loading")}</div>
        ) : error ? (
          <div className="hr-error-state">{error}</div>
        ) : relics.length === 0 ? (
          <div className="hr-empty-state">{t("dashboard.progressTracker.noRelics")}</div>
        ) : equipped.length === 0 ? (
          <div className="hr-empty-state">{t("dashboard.progressTracker.noEquipped")}</div>
        ) : (
          equipped.map((goal) => {
            const pct = goal.target > 0
              ? Math.min(Math.round((goal.current_progress / goal.target) * 100), 100)
              : 0;
            const offset = circ * (1 - pct / 100);
            const status = getStatus(t, goal.current_progress, goal.target);
            const Icon = resolveIcon(goal.icon);

            return (
              <div key={goal.id} onDoubleClick={() => setEditingGoal(goal)} className="hr-relic-card">
                <div className="hr-ring-container">
                  <svg width={44} height={44} className="hr-ring-svg">
                    <circle cx={22} cy={22} r={16} stroke="var(--color-border)" strokeWidth="4" fill="none" />
                    <circle cx={22} cy={22} r={16} stroke="var(--color-primary)" strokeWidth="4" fill="none" strokeLinecap="round"
                      strokeDasharray={`${circ}`} strokeDashoffset={offset} style={{ transition: "stroke-dashoffset 0.6s" }} />
                  </svg>
                  <div className="hr-ring-icon">
                    <Icon size={16} color="var(--color-primary)" />
                  </div>
                </div>
                <div className="hr-card-content">
                  <div className="hr-card-title-row">
                    <span className="hr-card-title">{goal.title}</span>
                    <div className="hr-status-badge" style={{ background: status.bg, color: status.color }}>
                      {status.label}
                    </div>
                  </div>
                  <div className="hr-progress-row">
                    <div className="hr-progress-track">
                      <div className="hr-progress-fill" style={{ width: `${pct}%` }}>
                        <div className="hr-progress-shimmer" />
                      </div>
                    </div>
                    <span className="hr-progress-label">{goal.current_progress}/{goal.target}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div data-tutorial-target="progress-tracker-actions" className="hr-actions">
        <button onClick={() => setRelicManagerMode("change")} className="hr-secondary-btn">
          <Settings size={13} />
          {t("dashboard.progressTracker.changeRelics")}
        </button>
        <button onClick={() => setModalOpen(true)} className="hr-add-btn">
          <Plus size={16} />
        </button>
        <button onClick={() => setUpdateProgressOpen(true)} className="hr-secondary-btn">
          <ArrowUp size={13} />
          {t("dashboard.progressTracker.updateProgress")}
        </button>
      </div>

      <CreateProgressTrackerModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleCreated}
      />

      <EditProgressTrackerModal
        relic={editingRelic}
        onClose={() => setEditingGoal(null)}
        onUpdated={updateRelic}
        onDeleted={deleteRelic}
      />

      <RelicManagerModal
        open={!!relicManagerMode}
        onClose={() => setRelicManagerMode(null)}
        relics={displayRelics}
        mode={relicManagerMode}
        onEquip={equipRelic}
        onUnequip={unequipRelic}
      />

      <UpdateProgressModal
        open={updateProgressOpen}
        onClose={() => setUpdateProgressOpen(false)}
        relics={relics}
        onUpdate={updateRelic}
        onDeleted={deleteRelic}
      />
    </div>
  );
}
