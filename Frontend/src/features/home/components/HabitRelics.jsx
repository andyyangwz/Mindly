import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Target, Ribbon, Plus, Settings, ArrowUp } from "lucide-react";
import { theme } from "../../../theme";
import { useHabitRelics } from "../hooks/useHabitRelics";
import { resolveIcon } from "../components/IconPicker";
import CreateHabitRelicModal from "../components/CreateHabitRelicModal";
import EditHabitRelicModal from "../components/EditHabitRelicModal";
import RelicManagerModal from "../components/RelicManagerModal";
import UpdateProgressModal from "../components/UpdateProgressModal";
import InfoButton from "../../../components/tutorial/InfoButton";
import { useTutorial } from "../../../components/tutorial/TutorialContext";

const circ = 2 * Math.PI * 16;

function getStatus(t, current, target) {
  if (target === 0) return { label: t("home.habitRelics.status.noTarget"), color: "var(--color-muted)", bg: "color-mix(in srgb, var(--color-muted) 12%, transparent)" };
  if (current > target) return { label: t("home.habitRelics.status.onFire"), color: "#DC2626", bg: "color-mix(in srgb, #DC2626 12%, transparent)" };
  if (current === target) return { label: t("home.habitRelics.status.achieved"), color: "#059669", bg: "color-mix(in srgb, #059669 12%, transparent)" };
  const pct = current / target;
  if (pct >= 0.8) return { label: t("home.habitRelics.status.almostDone"), color: "#D97706", bg: "color-mix(in srgb, #D97706 12%, transparent)" };
  return { label: t("home.habitRelics.status.inProgress"), color: "var(--color-muted)", bg: "color-mix(in srgb, var(--color-muted) 12%, transparent)" };
}

export default function HabitRelics() {
  const { t } = useTranslation();
  const { relics, loading, error, createRelic, updateRelic, deleteRelic, equipRelic, unequipRelic } = useHabitRelics();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRelic, setEditingGoal] = useState(null);
  const [relicManagerMode, setRelicManagerMode] = useState(null);
  const [updateProgressOpen, setUpdateProgressOpen] = useState(false);

  const { tutorialId, tutorialStep } = useTutorial();

  const isTutorial = tutorialId === "habit-relics-onboarding";

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
      return [tutorialRelic, ...relics.filter(r => r.id !== "tutorial-relic")];
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
    if (tutorialId !== "habit-relics-onboarding") {
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
      data-tutorial-target="habit-relics"
      className="habit-relics-container"
      style={{
        background: "var(--color-card)",
        borderRadius: 18,
        padding: "20px",
        boxShadow: "0 2px 12px rgba(0,0,0,0.04)",
        display: "flex",
        flexDirection: "column",
        boxSizing: "border-box",
        userSelect: "none",
      }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 34,
              height: 34,
              borderRadius: 10,
              background: "linear-gradient(135deg, #8B5CF6, #6D28D9)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}>
              <Target size={15} color="white" />
            </div>
            <div>
              <h2 style={{ fontSize: 14, fontWeight: 600, color: theme.dark, margin: 0, display: "inline-flex", alignItems: "center", gap: 6 }}>
                {t("home.habitRelics.title")}
                <InfoButton tutorialId="habit-relics-onboarding" />
              </h2>
              <p style={{ fontSize: 11, color: theme.muted, margin: "1px 0 0 0" }}>{t("home.habitRelics.subtitle")}</p>
            </div>
          </div>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            padding: "4px 10px",
            borderRadius: 20,
            background: `color-mix(in srgb, ${theme.primary} 10%, transparent)`,
          }}>
            <Ribbon size={11} color={theme.primary} />
            <span style={{ fontSize: 10, color: theme.primary, fontStyle: "italic", fontWeight: 500 }}>
              {t("home.habitRelics.beAMaster")}
            </span>
          </div>
        </div>

        <div data-tutorial-target="habit-relics-equipped" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "24px 0", fontSize: 13, color: theme.muted }}>
            {t("home.habitRelics.loading")}
          </div>
        ) : error ? (
          <div style={{ textAlign: "center", padding: "24px 0", fontSize: 13, color: "#EF4444" }}>
            {error}
          </div>
        ) : relics.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px 0", fontSize: 13, color: theme.muted }}>
            {t("home.habitRelics.noRelics")}
          </div>
        ) : equipped.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px 0", fontSize: 13, color: theme.muted }}>
            {t("home.habitRelics.noEquipped")}
          </div>
        ) : (
          equipped.map((goal) => {
            const pct = goal.target > 0
              ? Math.min(Math.round((goal.current_progress / goal.target) * 100), 100)
              : 0;
            const offset = circ * (1 - pct / 100);
            const status = getStatus(t, goal.current_progress, goal.target);
            const Icon = resolveIcon(goal.icon);

            return (
              <div key={goal.id} onDoubleClick={() => setEditingGoal(goal)} style={{
                background: "var(--color-card)",
                borderRadius: 14,
                border: `1px solid ${theme.border}`,
                padding: "14px",
                display: "flex",
                gap: 12,
                cursor: "pointer",
              }}>
                <div style={{ position: "relative", width: 44, height: 44, flexShrink: 0 }}>
                  <svg width={44} height={44} style={{ transform: "rotate(-90deg)", position: "absolute" }}>
                    <circle cx={22} cy={22} r={16} stroke={theme.border} strokeWidth="4" fill="none" />
                    <circle cx={22} cy={22} r={16} stroke={theme.primary} strokeWidth="4" fill="none" strokeLinecap="round"
                      strokeDasharray={`${circ}`} strokeDashoffset={offset} style={{ transition: "stroke-dashoffset 0.6s" }} />
                  </svg>
                  <div style={{
                    position: "absolute",
                    inset: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}>
                    <Icon size={16} color={theme.primary} />
                  </div>
                </div>
                <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                    <span style={{ fontSize: 13, fontWeight: 600, color: theme.dark }}>{goal.title}</span>
                    <div style={{
                      padding: "2px 8px",
                      borderRadius: 8,
                      background: status.bg,
                      fontSize: 10,
                      fontWeight: 500,
                      color: status.color,
                      whiteSpace: "nowrap",
                    }}>
                      {status.label}
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <div style={{ flex: 1, height: 4, background: theme.border, borderRadius: 3, position: "relative", overflow: "hidden" }}>
                      <div style={{
                        width: `${pct}%`,
                        height: "100%",
                        background: theme.primary,
                        borderRadius: 3,
                        position: "relative",
                        overflow: "hidden",
                        transition: "width 0.4s",
                      }}>
                        <div style={{
                          position: "absolute",
                          inset: 0,
                          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.5), transparent)",
                          animation: "shimmer 2s ease-in-out infinite",
                        }} />
                      </div>
                    </div>
                    <span style={{ fontSize: 11, fontWeight: 600, color: theme.muted, whiteSpace: "nowrap" }}>
                      {goal.current_progress}/{goal.target}
                    </span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      <div data-tutorial-target="habit-relics-actions" style={{ display: "flex", justifyContent: "center", alignItems: "center", marginTop: 12, flexShrink: 0, gap: 10 }}>
            <button
              onClick={() => setRelicManagerMode("change")}
              style={{
                padding: "8px 16px",
                borderRadius: 10,
                border: `1px solid ${theme.border}`,
                background: "transparent",
                color: theme.dark,
              fontSize: 12,
              fontWeight: 600,
              cursor: "pointer",
              transition: "all 0.2s",
              whiteSpace: "nowrap",
              display: "inline-flex",
              alignItems: "center",
              gap: 6,
            }}
          >
            <Settings size={14} />
            {t("home.habitRelics.changeRelics")}
          </button>
        <button
          onClick={() => setModalOpen(true)}
          style={{
            width: 36,
            height: 36,
            borderRadius: "50%",
            border: `2px dashed ${theme.border}`,
            background: "transparent",
            color: theme.primary,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            fontSize: 18,
            transition: "all 0.2s",
            flexShrink: 0,
          }}
        >
          <Plus size={18} />
        </button>
          <button
            onClick={() => setUpdateProgressOpen(true)}
            style={{
              padding: "8px 16px",
              borderRadius: 10,
              border: `1px solid ${theme.border}`,
              background: "transparent",
              color: theme.dark,
            fontSize: 12,
            fontWeight: 600,
            cursor: "pointer",
            transition: "all 0.2s",
            whiteSpace: "nowrap",
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
          }}
        >
          <ArrowUp size={14} />
          {t("home.habitRelics.updateProgress")}
        </button>
      </div>

      <CreateHabitRelicModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onCreated={handleCreated}
      />

      <EditHabitRelicModal
        relic={editingRelic}
        onClose={() => setEditingRelic(null)}
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
