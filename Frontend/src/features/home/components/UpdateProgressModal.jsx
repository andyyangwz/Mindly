import { useState, useMemo, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Trash2 } from "lucide-react";
import { theme } from "../../../theme";
import { resolveIcon } from "./IconPicker";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import { useTutorial } from "../../../components/tutorial/TutorialContext";

const circ = 2 * Math.PI * 72;

function getStatus(t, current, target) {
  if (target === 0) return { label: t("home.habitRelics.status.noTarget"), color: "var(--color-muted)", bg: "color-mix(in srgb, var(--color-muted) 12%, transparent)" };
  if (current > target) return { label: t("home.habitRelics.status.onFire"), color: "#DC2626", bg: "color-mix(in srgb, #DC2626 12%, transparent)" };
  if (current === target) return { label: t("home.habitRelics.status.achieved"), color: "#059669", bg: "color-mix(in srgb, #059669 12%, transparent)" };
  const pct = current / target;
  if (pct >= 0.8) return { label: t("home.habitRelics.status.almostDone"), color: "#D97706", bg: "color-mix(in srgb, #D97706 12%, transparent)" };
  return { label: t("home.habitRelics.status.inProgress"), color: "var(--color-muted)", bg: "color-mix(in srgb, var(--color-muted) 12%, transparent)" };
}

export default function UpdateProgressModal({ open, onClose, relics, onUpdate, onDeleted }) {
  const { t } = useTranslation();
  const { tutorialId } = useTutorial();
  const [selectedId, setSelectedId] = useState(null);
  const [pendingOps, setPendingOps] = useState({});
  const [inputValue, setInputValue] = useState("1");
  const [updating, setUpdating] = useState(false);
  const [animTargets, setAnimTargets] = useState({});
  const [animPhase, setAnimPhase] = useState(null);
  const [animStage, setAnimStage] = useState(null);
  const [animParticles, setAnimParticles] = useState([]);
  const [animProgress, setAnimProgress] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [tutorialRelic, setTutorialRelic] = useState(null);
  const inputRef = useRef(null);
  const countFrameRef = useRef(null);
  const rightPanelRef = useRef(null);
  const orbWrapRef = useRef(null);
  const travelAnimRef = useRef(null);

  useEffect(() => {
    if (open) {
      setSelectedId(null);
      setPendingOps({});
      setInputValue("1");
      setUpdating(false);
      setAnimTargets({});
      setAnimPhase(null);
      setAnimStage(null);
      setAnimParticles([]);
      setAnimProgress(null);
    }
  }, [open]);

  useEffect(() => {
    return () => {
      if (countFrameRef.current) cancelAnimationFrame(countFrameRef.current);
      if (travelAnimRef.current) cancelAnimationFrame(travelAnimRef.current);
    };
  }, []);

  useEffect(() => {
    if (tutorialId === "update-progress" || tutorialId === "habit-relics-onboarding") {
      const relic = {
        id: "tutorial-relic",
        title: "Channel Practice",
        icon: "star",
        current_progress: 0,
        target: 10,
        is_equipped: true,
        equipped_order: -1,
      };
      setTutorialRelic(relic);
      if (open) {
        setSelectedId("tutorial-relic");
        setInputValue("1");
        setPendingOps({
          "tutorial-relic": { type: "add", value: 1 },
        });
        setTimeout(() => inputRef.current?.focus(), 50);
      }
    } else {
      setTutorialRelic(null);
    }
  }, [tutorialId, open]);

  const relicList = useMemo(() => {
    const sorted = [...relics].sort((a, b) => {
      if (a.is_equipped && !b.is_equipped) return -1;
      if (!a.is_equipped && b.is_equipped) return 1;
      return (a.equipped_order ?? 99) - (b.equipped_order ?? 99);
    });
    return sorted;
  }, [relics]);

  const displayList = useMemo(() => {
    if (tutorialRelic) {
      return [tutorialRelic, ...relicList];
    }
    return relicList;
  }, [relicList, tutorialRelic]);

  const selectedRelic = useMemo(
    () => displayList.find((g) => g.id === selectedId) || null,
    [displayList, selectedId]
  );

  const selectRelic = (id) => {
    setSelectedId(id);
    setInputValue("1");
    setPendingOps({
      [id]: { type: "add", value: 1 },
    });
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleReset = () => {
    if (!selectedId) return;
    setPendingOps((prev) => ({
      ...prev,
      [selectedId]: { type: "reset" },
    }));
    setInputValue("1");
  };

  const handleInputChange = (e) => {
    const raw = e.target.value;
    if (raw === "") {
      setInputValue("");
      if (selectedId) {
        setPendingOps((prev) => {
          const next = { ...prev };
          delete next[selectedId];
          return next;
        });
      }
      return;
    }
    if (raw === "-") {
      setInputValue(raw);
      return;
    }
    const num = parseInt(raw, 10);
    if (isNaN(num)) return;
    setInputValue(String(num));
    if (selectedId) {
      if (num === 0) {
        setPendingOps((prev) => {
          const next = { ...prev };
          delete next[selectedId];
          return next;
        });
      } else {
        setPendingOps((prev) => ({
          ...prev,
          [selectedId]: { type: "add", value: num },
        }));
      }
    }
  };

  function startCountUp(from, to, relicId) {
    if (countFrameRef.current) cancelAnimationFrame(countFrameRef.current);
    const duration = 700;
    const startTime = performance.now();
    function frame(now) {
      const elapsed = now - startTime;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const value = Math.round(from + (to - from) * eased);
      setAnimProgress({ relicId, value });
      if (t < 1) {
        countFrameRef.current = requestAnimationFrame(frame);
      }
    }
    countFrameRef.current = requestAnimationFrame(frame);
  }

  function spawnParticles(phase) {
    let particles;
    if (phase === "channel") {
      particles = Array.from({ length: 6 }, (_, i) => ({
        id: `p-${Date.now()}-${i}`, delay: 0.06 + i * 0.06, duration: 0.7 + Math.random() * 0.3,
        size: 3 + Math.random() * 3, opacity: 0.5 + Math.random() * 0.3,
        left: (Math.random() - 0.5) * 50,
      }));
    } else if (phase === "remove") {
      particles = Array.from({ length: 4 }, (_, i) => ({
        id: `p-${Date.now()}-${i}`, delay: 0.1 + i * 0.08, duration: 0.6 + Math.random() * 0.3,
        size: 3 + Math.random() * 3, opacity: 0.4 + Math.random() * 0.3,
        x: (Math.random() - 0.5) * 60,
      }));
    } else {
      particles = Array.from({ length: 8 }, (_, i) => {
        const angle = (i / 8) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
        const dist = 40 + Math.random() * 40;
        return {
          id: `p-${Date.now()}-${i}`, delay: 0.05 * i, duration: 0.5 + Math.random() * 0.3,
          size: 2 + Math.random() * 3, opacity: 0.5 + Math.random() * 0.3,
          x: Math.cos(angle) * dist, y: Math.sin(angle) * dist,
        };
      });
    }
    setAnimParticles(particles);
  }

  const handleUpdate = async () => {
    const entries = Object.entries(pendingOps);
    if (entries.length === 0) return;

    const targets = {};
    for (const [relicId, op] of entries) {
      const relic = relicList.find((g) => g.id === relicId);
      if (!relic) continue;
      targets[relicId] = op.type === "reset"
        ? 0
        : Math.max(0, (relic.current_progress || 0) + op.value);
    }
    setAnimTargets(targets);

    setUpdating(true);
    const op = entries[0][1];
    const phase = op.type === "reset" ? "reset" : op.value > 0 ? "channel" : "remove";
    setAnimPhase(phase);
    spawnParticles(phase);

    const firstRelic = relicList.find(g => g.id === entries[0][0]);
    if (firstRelic) {
      startCountUp(firstRelic.current_progress || 0, targets[entries[0][0]], entries[0][0]);
    }

    setTimeout(async () => {
      try {
        for (const [relicId, op] of entries) {
          const relic = relicList.find((g) => g.id === relicId);
          if (!relic) continue;
          let newProgress;
          if (op.type === "reset") {
            newProgress = 0;
          } else {
            newProgress = Math.max(0, (relic.current_progress || 0) + op.value);
          }
          await onUpdate(relicId, { current_progress: newProgress });
        }
        setPendingOps({});
        setSelectedId(null);
        setInputValue("1");
      } catch {
      } finally {
        setUpdating(false);
        setAnimPhase(null);
        setAnimParticles([]);
        setAnimProgress(null);
        setAnimTargets({});
      }
    }, 800);
  };

  if (!open) return null;

  const selected = selectedRelic;
  const pendingCount = Object.keys(pendingOps).length;
  const primaryOp = Object.entries(pendingOps)[0]?.[1];

  const animVal = animProgress != null && animProgress.relicId === selected?.id ? animProgress.value : null;
  const selectedDisplayProgress = animVal !== null
    ? animVal
    : (animTargets.hasOwnProperty(selected?.id) ? animTargets[selected.id] : selected?.current_progress || 0);
  const selectedPct = selected && selected.target > 0
    ? Math.min(Math.round((selectedDisplayProgress / selected.target) * 100), 100)
    : 0;
  const selectedOffset = circ * (1 - selectedPct / 100);
  const selectedStatus = selected ? getStatus(t, selected.current_progress, selected.target) : null;

  return (
    <div
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.55)",
        backdropFilter: "blur(8px)",
        zIndex: theme.z.modalOverlay,
        display: "flex", alignItems: "center", justifyContent: "center",
        animation: "upFadeIn 0.3s ease",
      }}
      onClick={onClose}
    >
      <style>{`
        @keyframes upFadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes upSlideUp { from { opacity: 0; transform: translateY(30px) scale(0.96); } to { opacity: 1; transform: translateY(0) scale(1); } }
        @keyframes energyPulse { 0%, 100% { filter: drop-shadow(0 0 20px rgba(139,92,246,0.15)); } 50% { filter: drop-shadow(0 0 50px rgba(139,92,246,0.3)); } }
        @keyframes orbFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        @keyframes chargeBurst { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.15); opacity: 0.8; box-shadow: 0 0 80px rgba(139,92,246,0.5); } 100% { transform: scale(1); opacity: 1; } }
        @keyframes particleChannel { 0% { transform: translate(0, 0) scale(0.2); opacity: 0; } 15% { opacity: 1; } 100% { transform: translate(0, -35px) scale(0.1); opacity: 0; } }
        @keyframes particleRemove { 0% { transform: translate(0, 0) scale(0.8); opacity: 0.7; } 100% { transform: translate(var(--x), 50px) scale(0.05); opacity: 0; } }
        @keyframes particleReset { 0% { transform: translate(0, 0) scale(1); opacity: 0.8; } 100% { transform: translate(var(--x), var(--y)) scale(0.05); opacity: 0; } }
        @keyframes rippleReset { 0% { transform: scale(0.8); opacity: 0.5; } 100% { transform: scale(2.5); opacity: 0; } }
        @keyframes iconPulseChannel { 0% { transform: scale(1); } 30% { transform: scale(1.06); } 60% { transform: scale(1.02); } 100% { transform: scale(1); } }
        @keyframes iconPulseRemove { 0% { transform: scale(1); } 30% { transform: scale(0.95); } 60% { transform: scale(0.98); } 100% { transform: scale(1); } }
        @keyframes glowChannel { 0% { transform: scale(1); opacity: 0.3; } 50% { transform: scale(1.08); opacity: 0.7; } 100% { transform: scale(1); opacity: 0.3; } }
        @keyframes glowRemove { 0% { transform: scale(1); opacity: 0.3; } 50% { transform: scale(0.9); opacity: 0.08; } 100% { transform: scale(1); opacity: 0.3; } }
        @keyframes coreGlow { 0% { transform: scale(0.4); opacity: 0; } 30% { opacity: 0.8; } 100% { transform: scale(1.5); opacity: 0; } }
        @keyframes coreDrain { 0% { transform: scale(1); opacity: 0.5; } 100% { transform: scale(0.2); opacity: 0; } }
      `}</style>

      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        data-tutorial-target="update-progress"
        style={{
          background: "var(--color-card)",
          borderRadius: 20,
          width: 780,
          maxWidth: "92vw",
          height: "78vh",
          maxHeight: "90vh",
          display: "flex",
          overflow: "hidden",
          boxShadow: "0 24px 80px rgba(0,0,0,0.2), 0 0 0 1px rgba(139,92,246,0.06)",
          animation: "upSlideUp 0.35s ease",
          position: "relative",
        }}
      >
        {/* Ambient gradient */}
        <div style={{
          position: "absolute", inset: 0,
          background: "linear-gradient(135deg, rgba(139,92,246,0.03), transparent 50%, rgba(59,130,246,0.02))",
          pointerEvents: "none", borderRadius: 20, zIndex: 0,
        }} />

        {/* ===== LEFT — Relic Roster ===== */}
        <div data-tutorial-target="upgrade-roster" style={{
          width: 300, minWidth: 300,
          display: "flex", flexDirection: "column",
          borderRight: "1px solid var(--color-border, rgba(0,0,0,0.06))",
          zIndex: 1, position: "relative",
        }}>
          {/* Header */}
          <div style={{
            padding: "20px 20px 14px",
            borderBottom: "1px solid var(--color-border, rgba(0,0,0,0.06))",
            flexShrink: 0,
          }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <h2 style={{ fontSize: 14, fontWeight: 700, color: "var(--color-dark)", margin: 0 }}>
                    {t("home.updateProgress.title")}
                  </h2>
                </div>
                <p style={{ fontSize: 11, color: "var(--color-muted)", margin: "1px 0 0" }}>
                  {t("home.updateProgress.relicsAvailable", { count: relicList.length })}
                </p>
              </div>
              <button onClick={onClose} style={{
                width: 28, height: 28, borderRadius: 7,
                border: "none", cursor: "pointer",
                background: "var(--color-input)",
                color: "var(--color-muted)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 13, transition: "all 0.15s",
              }}>
                ✕
              </button>
            </div>
          </div>

          {/* Scrollable relic list */}
          <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
            <div style={{
              position: "absolute", inset: 0, overflowY: "auto",
              padding: "10px 10px 10px 14px",
              display: "flex", flexDirection: "column", gap: 8,
            }}>
              {displayList.map((goal) => {
                  const isSelected = goal.id === selectedId;
                  const pendingOp = pendingOps[goal.id];
                  const Icon = resolveIcon(goal.icon);
                  const useAnim = animProgress != null && animProgress.relicId === goal.id;
                  const displayProgress = useAnim
                    ? animProgress.value
                    : (animTargets.hasOwnProperty(goal.id) ? animTargets[goal.id] : goal.current_progress);
                  const pct = goal.target > 0 ? Math.min(Math.round((displayProgress / goal.target) * 100), 100) : 0;
                  const offset = 2 * Math.PI * 14 * (1 - pct / 100);
                  const status = getStatus(t, goal.current_progress, goal.target);

                  return (
                  <div
                    key={goal.id}
                    onClick={() => selectRelic(goal.id)}
                    style={{
                      background: isSelected ? `color-mix(in srgb, ${theme.primary} 8%, transparent)` : "transparent",
                      borderRadius: 12,
                      border: isSelected ? `1.5px solid ${theme.primary}` : "1px solid transparent",
                      padding: "10px 12px",
                      display: "flex", alignItems: "center", gap: 10,
                      cursor: "pointer",
                      transition: "all 0.2s",
                      boxShadow: isSelected ? `0 0 20px color-mix(in srgb, ${theme.primary} 15%, transparent)` : "none",
                    }}
                    onMouseEnter={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = "var(--color-hover, rgba(0,0,0,0.02))";
                        e.currentTarget.style.borderColor = "var(--color-border)";
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSelected) {
                        e.currentTarget.style.background = "transparent";
                        e.currentTarget.style.borderColor = "transparent";
                      }
                    }}
                  >
                    <div style={{ position: "relative", width: 34, height: 34, flexShrink: 0 }}>
                      <svg width={34} height={34} style={{ transform: "rotate(-90deg)", position: "absolute" }}>
                        <circle cx={17} cy={17} r={14} stroke="var(--color-border)" strokeWidth="3" fill="none" />
                        <circle cx={17} cy={17} r={14} stroke={theme.primary} strokeWidth="3" fill="none" strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 14}`} strokeDashoffset={offset}
                          style={{ transition: useAnim ? "none" : "stroke-dashoffset 0.6s" }} />
                      </svg>
                      <div style={{
                        position: "absolute", inset: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                      }}>
                        <Icon size={12} color={theme.primary} />
                      </div>
                    </div>

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        <span style={{
                          fontSize: 12, fontWeight: 600, color: "var(--color-dark)",
                          whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                        }}>
                          {goal.title}
                        </span>
                        {pendingOp && (
                          <span style={{
                            fontSize: 9, fontWeight: 600,
                            padding: "1px 5px", borderRadius: 4,
                            background: pendingOp.type === "reset" ? "#FEE2E2" : `color-mix(in srgb, ${theme.primary} 20%, transparent)`,
                            color: pendingOp.type === "reset" ? "#DC2626" : theme.primary,
                            whiteSpace: "nowrap", flexShrink: 0,
                          }}>
                            {pendingOp.type === "reset" ? t("home.updateProgress.reset") : `+${pendingOp.value}`}
                          </span>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                        <span style={{ fontSize: 10, fontWeight: 600, color: "var(--color-muted)" }}>
                          {displayProgress}/{goal.target}
                        </span>
                        <span style={{
                          fontSize: 8, padding: "1px 4px", borderRadius: 3,
                          background: status.bg, color: status.color, fontWeight: 500,
                        }}>
                          {status.label}
                        </span>
                      </div>
                    </div>

                    {goal.is_equipped && (
                      <span style={{
                        fontSize: 7, fontWeight: 700,
                        padding: "1px 4px", borderRadius: 3,
                        background: `color-mix(in srgb, ${theme.primary} 15%, transparent)`,
                        color: theme.primary,
                        letterSpacing: "0.08em", textTransform: "uppercase",
                      }}>
                        {t("home.updateProgress.equipped")}
                      </span>
                    )}
                  </div>
                );
              })}
              {relicList.length === 0 && (
                <div style={{ textAlign: "center", padding: "32px 0", fontSize: 12, color: "var(--color-muted)" }}>
                  {t("home.updateProgress.noRelicsYet")}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ===== RIGHT — Enhancement Panel ===== */}
        <div data-tutorial-target="update-progress-controls" style={{
          flex: 1,
          display: "flex", flexDirection: "column",
          zIndex: 1, position: "relative",
          overflow: "hidden",
        }}>
          {selected ? (
            <>
              {/* Relic showcase */}
              <div style={{
                flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                padding: "24px",
                position: "relative",
                overflow: "hidden",
              }}>
                {/* Ambient particles */}
                {!animPhase && [...Array(4)].map((_, i) => (
                  <div key={`ambient-${i}`} style={{
                    position: "absolute",
                    width: 3 + Math.random() * 4, height: 3 + Math.random() * 4,
                    borderRadius: "50%",
                    background: `rgba(139,92,246,${0.1 + Math.random() * 0.15})`,
                    left: `${15 + Math.random() * 70}%`,
                    top: `${10 + Math.random() * 80}%`,
                    animation: `upFadeIn ${3 + Math.random() * 3}s ease-in-out ${Math.random() * 2}s infinite`,
                    pointerEvents: "none",
                  }} />
                ))}

                {/* Large relic orb */}
                <div style={{
                  position: "relative", width: 180, height: 180,
                  animation: animPhase === "channel"
                    ? "iconPulseChannel 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)"
                    : animPhase === "remove"
                      ? "iconPulseRemove 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)"
                      : "orbFloat 4s ease-in-out infinite",
                }}>
                  {/* Outer glow */}
                  <div style={{
                    position: "absolute", top: -20, left: -20, width: 220, height: 220,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, rgba(139,92,246,0.06), rgba(59,130,246,0.03))",
                    animation: animPhase === "channel"
                      ? "glowChannel 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)"
                      : animPhase === "remove"
                        ? "glowRemove 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)"
                        : "energyPulse 3s ease-in-out infinite",
                  }} />

                  {/* Reset ripple */}
                  {animPhase === "reset" && (
                    <div style={{
                      position: "absolute", top: 0, left: 0, width: 180, height: 180,
                      borderRadius: "50%",
                      border: "1.5px solid rgba(139,92,246,0.25)",
                      animation: "rippleReset 0.7s cubic-bezier(0.2, 0, 0.2, 1) forwards",
                      pointerEvents: "none",
                    }} />
                  )}

                  {/* Energy absorption/drain glow */}
                  {animPhase === "channel" && (
                    <div style={{
                      position: "absolute", top: 40, left: 40, width: 100, height: 100,
                      borderRadius: "50%",
                      background: "radial-gradient(circle, rgba(139,92,246,0.35), transparent 70%)",
                      animation: "coreGlow 0.8s ease-out forwards",
                      pointerEvents: "none",
                    }} />
                  )}
                  {animPhase === "remove" && (
                    <div style={{
                      position: "absolute", top: 40, left: 40, width: 100, height: 100,
                      borderRadius: "50%",
                      background: "radial-gradient(circle, rgba(139,92,246,0.25), transparent 70%)",
                      animation: "coreDrain 0.7s ease-out forwards",
                      pointerEvents: "none",
                    }} />
                  )}

                  {/* Action particles */}
                  {(animParticles || []).map((p) => {
                    const pStyle = {
                      position: "absolute",
                      borderRadius: "50%",
                      background: `rgba(139,92,246,${p.opacity})`,
                      boxShadow: `0 0 ${p.size * 2}px rgba(139,92,246,0.3)`,
                      pointerEvents: "none",
                      width: p.size, height: p.size,
                    };
                    if (animPhase === "channel") {
                      pStyle.animation = `particleChannel ${p.duration}s cubic-bezier(0.4, 0, 1, 1) ${p.delay}s forwards`;
                      pStyle.left = `calc(50% + ${p.left || 0}px)`;
                      pStyle.top = "calc(50% + 35px)";
                    } else if (animPhase === "remove") {
                      pStyle.animation = `particleRemove ${p.duration}s cubic-bezier(0, 0, 0.2, 1) ${p.delay}s forwards`;
                      pStyle.left = "50%";
                      pStyle.top = "50%";
                      pStyle["--x"] = `${p.x}px`;
                    } else if (animPhase === "reset") {
                      pStyle.animation = `particleReset ${p.duration}s cubic-bezier(0.2, 0, 0.2, 1) ${p.delay}s forwards`;
                      pStyle.left = "50%";
                      pStyle.top = "50%";
                      pStyle["--x"] = `${p.x}px`;
                      pStyle["--y"] = `${p.y}px`;
                    }
                    return <div key={p.id} style={pStyle} />;
                  })}

                  {/* Energy ring */}
                  <svg width={180} height={180} style={{ position: "absolute", animation: "relicEnergy 8s linear infinite" }}>
                    <defs>
                      <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.4" />
                        <stop offset="50%" stopColor="#A78BFA" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.4" />
                      </linearGradient>
                    </defs>
                    <circle cx={90} cy={90} r={85} fill="none" stroke="url(#ringGrad)" strokeWidth="1.5" strokeDasharray="6 5" />
                  </svg>

                  {/* Progress ring */}
                  <svg width={180} height={180} style={{ position: "absolute", transform: "rotate(-90deg)" }}>
                    <circle cx={90} cy={90} r={72} fill="none" stroke="var(--color-border)" strokeWidth="3.5" />
                    <circle cx={90} cy={90} r={72} fill="none" stroke={theme.primary} strokeWidth="3.5"
                      strokeLinecap="round" strokeDasharray={`${circ}`} strokeDashoffset={selectedOffset}
                      style={{ transition: animProgress ? "none" : "stroke-dashoffset 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)" }} />
                  </svg>

                  {/* Icon core */}
                  <div style={{
                    position: "absolute",
                    top: 50, left: 50, width: 80, height: 80,
                    borderRadius: "50%",
                    background: "var(--color-card)",
                    boxShadow: "inset 0 0 20px rgba(139,92,246,0.04)",
                    filter: "drop-shadow(0 0 40px rgba(139,92,246,0.1))",
                    display: "flex", alignItems: "center", justifyContent: "center",
                  }}>
                    {(() => {
                      const Icon = resolveIcon(selected.icon);
                      return Icon ? <Icon size={34} color={theme.primary} /> : <span style={{ fontSize: 28, color: theme.primary }}>✦</span>;
                    })()}
                  </div>
                </div>

                {/* Title + Status */}
                <div style={{ textAlign: "center", marginTop: 16 }}>
                  <h3 style={{
                    fontSize: 17, fontWeight: 700, color: "var(--color-dark)",
                    margin: 0, lineHeight: 1.3,
                  }}>
                    {selected.title}
                  </h3>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, marginTop: 6 }}>
                    <span style={{
                      fontSize: 11, fontWeight: 600, color: selectedStatus.color,
                      padding: "2px 10px", borderRadius: 6,
                      background: selectedStatus.bg,
                    }}>
                      {selectedStatus.label}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "var(--color-muted)" }}>
                      {selectedDisplayProgress} / {selected.target}
                    </span>
                  </div>
                  <p style={{
                    fontSize: 12, color: "var(--color-muted)", margin: "8px 0 0",
                    fontStyle: "italic",
                  }}>
                    {selectedPct === 100
                      ? t("home.updateProgress.fullyAttuned")
                      : selectedPct > 50
                        ? t("home.updateProgress.halfwayAttuned")
                        : t("home.updateProgress.progressHarmony")}
                  </p>
                </div>
              </div>

              {/* Controls */}
              <div style={{
                padding: "16px 20px 20px",
                borderTop: "1px solid var(--color-border, rgba(0,0,0,0.06))",
                flexShrink: 0,
                position: "relative",
              }}>
                <div style={{
                  background: `color-mix(in srgb, ${theme.primary} 6%, transparent)`,
                  borderRadius: 14,
                  padding: "14px 16px",
                  border: `1px solid color-mix(in srgb, ${theme.primary} 15%, transparent)`,
                }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <button
                      onClick={() => setDeleteConfirm(true)}
                      disabled={!selected || updating}
                      style={{
                        padding: "9px 12px", borderRadius: 9,
                        border: selected ? "1px solid rgba(239,68,68,0.25)" : "1px solid var(--color-border)",
                        background: selected ? "rgba(239,68,68,0.06)" : "transparent",
                        color: selected ? "#DC2626" : "var(--color-dark)",
                        fontSize: 11, fontWeight: 600,
                        cursor: selected && !updating ? "pointer" : "not-allowed",
                        transition: "all 0.15s",
                        whiteSpace: "nowrap",
                        fontFamily: "inherit",
                        display: "flex",
                        alignItems: "center",
                        gap: 5,
                      }}
                    >
                      <Trash2 size={12} />
                      {t("home.updateProgress.delete")}
                    </button>
                    <button
                      onClick={handleReset}
                      disabled={!selected || updating}
                      style={{
                        padding: "9px 16px", borderRadius: 9,
                        border: selected ? "1px solid rgba(239,68,68,0.3)" : "1px solid var(--color-border)",
                        background: selected ? "rgba(239,68,68,0.08)" : "transparent",
                        color: selected ? "#DC2626" : "var(--color-dark)",
                        fontSize: 11, fontWeight: 600,
                        cursor: selected && !updating ? "pointer" : "not-allowed",
                        transition: "all 0.15s",
                        whiteSpace: "nowrap",
                        fontFamily: "inherit",
                      }}
                    >
                      {t("home.updateProgress.reset")}
                    </button>

                    <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                      <span style={{ fontSize: 11, color: "var(--color-muted)", fontWeight: 500, whiteSpace: "nowrap" }}>
                        {t("home.updateProgress.add")}
                      </span>
                      <input
                        ref={inputRef}
                        type="number"
                        value={inputValue}
                        onChange={handleInputChange}
                        disabled={!selected || updating}
                        placeholder="1"
                        style={{
                          width: 60,
                          padding: "8px 10px", borderRadius: 9,
                          border: `1px solid color-mix(in srgb, ${theme.primary} 35%, transparent)`,
                          background: "var(--color-card)",
                          color: "var(--color-dark)",
                          fontSize: 14, fontWeight: 600, textAlign: "center",
                          outline: "none", transition: "all 0.15s",
                          MozAppearance: "textfield",
                          fontFamily: "inherit",
                        }}
                      />
                      {inputValue !== "" && !isNaN(parseInt(inputValue, 10)) && (
                        <span style={{
                          fontSize: 10, color: theme.primary, fontWeight: 600, whiteSpace: "nowrap",
                        }}>
                          → {Math.max(0, (selected.current_progress || 0) + parseInt(inputValue, 10))}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleUpdate}
                  disabled={pendingCount === 0 || updating}
                  style={{
                    width: "100%",
                    padding: "11px",
                    borderRadius: 10,
                    border: "none",
                    marginTop: 10,
                    background: pendingCount > 0 && !updating
                      ? `linear-gradient(135deg, var(--color-primary), rgba(124, 58, 237, 0.87))`
                      : "var(--color-border)",
                    color: pendingCount > 0 && !updating ? "#FFFFFF" : "var(--color-dark)",
                    fontSize: 13, fontWeight: 700,
                    cursor: pendingCount > 0 && !updating ? "pointer" : "not-allowed",
                    transition: "all 0.2s",
                    fontFamily: "inherit",
                    boxShadow: pendingCount > 0 && !updating ? `0 4px 16px rgba(139,92,246,0.25)` : "none",
                    position: "relative", overflow: "hidden",
                  }}
                >
                  {updating
                    ? t("home.updateProgress.channeling")
                    : pendingCount > 0 && primaryOp
                      ? primaryOp.type === "reset"
                        ? t("home.updateProgress.resetProgress")
                        : primaryOp.value > 0
                          ? t("home.updateProgress.channelEnergy", { count: primaryOp.value })
                          : t("home.updateProgress.removeEnergy", { count: Math.abs(primaryOp.value) })
                      : t("home.updateProgress.selectToChannel")}
                  {updating && (
                    <span style={{
                      position: "absolute", inset: 0,
                      background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent)",
                      backgroundSize: "200% 100%",
                      animation: "shimmer 1s ease-in-out infinite",
                    }} />
                  )}
                </button>
              </div>
            </>
          ) : (
            /* Empty state — no relic selected */
            <div style={{
              flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
              flexDirection: "column", gap: 12,
              padding: 24, textAlign: "center",
            }}>
              <div style={{
                width: 80, height: 80, borderRadius: "50%",
                background: `color-mix(in srgb, ${theme.primary} 8%, transparent)`,
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 32, color: theme.primary, opacity: 0.5,
              }}>
                ✦
              </div>
              <p style={{ fontSize: 13, color: "var(--color-muted)", margin: 0, lineHeight: 1.5 }}>
                {t("home.updateProgress.selectToChannelHint")}
              </p>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={deleteConfirm}
        title={t("home.updateProgress.deleteTitle")}
        message={t("home.updateProgress.deleteMessage")}
        confirmLabel={t("home.updateProgress.deleteConfirm")}
        cancelLabel={t("common.cancel")}
        onConfirm={async () => {
          if (!selectedId) return;
          setDeleting(true);
          try {
            await onDeleted(selectedId);
            setDeleteConfirm(false);
            setSelectedId(null);
          } catch {
            setDeleteConfirm(false);
          } finally {
            setDeleting(false);
          }
        }}
        onCancel={() => setDeleteConfirm(false)}
        loading={deleting}
        variant="danger"
      />
    </div>
  );
}
