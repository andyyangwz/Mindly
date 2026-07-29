import { useState, useMemo, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { Trash2 } from "lucide-react";
import { resolveIcon } from "./IconPicker";
import ConfirmDialog from "../../../components/ui/ConfirmDialog";
import { useTutorial } from "../../../components/tutorial/TutorialContext";
import "../../../styles/dashboard/index.css"

const circ = 2 * Math.PI * 72;

function getStatus(t, current, target) {
  if (target === 0) return { label: t("dashboard.progressTracker.status.noTarget"), color: "var(--color-muted)", bg: "color-mix(in srgb, var(--color-muted) 12%, transparent)" };
  if (current > target) return { label: t("dashboard.progressTracker.status.onFire"), color: "#DC2626", bg: "color-mix(in srgb, #DC2626 12%, transparent)" };
  if (current === target) return { label: t("dashboard.progressTracker.status.achieved"), color: "#059669", bg: "color-mix(in srgb, #059669 12%, transparent)" };
  const pct = current / target;
  if (pct >= 0.8) return { label: t("dashboard.progressTracker.status.almostDone"), color: "#D97706", bg: "color-mix(in srgb, #D97706 12%, transparent)" };
  return { label: t("dashboard.progressTracker.status.inProgress"), color: "var(--color-muted)", bg: "color-mix(in srgb, var(--color-muted) 12%, transparent)" };
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
  const [, setAnimStage] = useState(null);
  const [animParticles, setAnimParticles] = useState([]);
  const [animProgress, setAnimProgress] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [tutorialRelic, setTutorialRelic] = useState(null);
  const inputRef = useRef(null);
  const countFrameRef = useRef(null);

  const travelAnimRef = useRef(null);

  useEffect(() => {
    if (open) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
    if (tutorialId === "update-progress" || tutorialId === "progress-tracker-onboarding") {
      const relic = {
        id: "tutorial-relic",
        title: "Channel Practice",
        icon: "star",
        current_progress: 0,
        target: 10,
        is_equipped: true,
        equipped_order: -1,
      };
      // eslint-disable-next-line react-hooks/set-state-in-effect
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
      } catch { /* ignore */
      } finally {
        setUpdating(false);
        setAnimPhase(null);
        setAnimParticles([]);
        setAnimProgress(null);
        setAnimTargets({});
      }
    }, 800);
  };

  const [ambientParticles] = useState(() => Array.from({ length: 4 }, (_, i) => {
    const w = 3 + Math.random() * 4;
    const h = 3 + Math.random() * 4;
    const bg = `rgba(139,92,246,${0.1 + Math.random() * 0.15})`;
    const l = `${15 + Math.random() * 70}%`;
    const t = `${10 + Math.random() * 80}%`;
    const anim = `upFadeIn ${3 + Math.random() * 3}s ease-in-out ${Math.random() * 2}s infinite`;
    return { key: `ambient-${i}`, w, h, bg, l, t, anim };
  }));

  if (!open) return null;

  const selected = selectedRelic;
  const pendingCount = Object.keys(pendingOps).length;
  const primaryOp = Object.entries(pendingOps)[0]?.[1];

  const animVal = animProgress != null && animProgress.relicId === selected?.id ? animProgress.value : null;
  const selectedDisplayProgress = animVal !== null
    ? animVal
    : (Object.hasOwn(animTargets, selected?.id) ? animTargets[selected.id] : selected?.current_progress || 0);
  const selectedPct = selected && selected.target > 0
    ? Math.min(Math.round((selectedDisplayProgress / selected.target) * 100), 100)
    : 0;
  const selectedOffset = circ * (1 - selectedPct / 100);
  const selectedStatus = selected ? getStatus(t, selected.current_progress, selected.target) : null;

  return (
    <div className="up-overlay" style={{ zIndex: 900 }} onClick={onClose}>
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        data-tutorial-target="update-progress"
        className="up-modal"
      >
        <div className="up-ambient" />

        <div data-tutorial-target="upgrade-roster" className="up-left">
          <div className="up-left-header">
            <div className="up-left-header-row">
              <div>
                <div className="up-left-header-left">
                  <h2 className="up-left-title">{t("dashboard.updateProgress.title")}</h2>
                </div>
                <p className="up-left-subtitle">{t("dashboard.updateProgress.relicsAvailable", { count: relicList.length })}</p>
              </div>
              <button onClick={onClose} className="up-close-btn">✕</button>
            </div>
          </div>

          <div className="up-list-wrap">
            <div className="up-list">
              {displayList.map((goal) => {
                  const isSelected = goal.id === selectedId;
                  const pendingOp = pendingOps[goal.id];
                  const Icon = resolveIcon(goal.icon);
                  const useAnim = animProgress != null && animProgress.relicId === goal.id;
                  const displayProgress = useAnim
                    ? animProgress.value
                    : (Object.hasOwn(animTargets, goal.id) ? animTargets[goal.id] : goal.current_progress);
                  const pct = goal.target > 0 ? Math.min(Math.round((displayProgress / goal.target) * 100), 100) : 0;
                  const offset = 2 * Math.PI * 14 * (1 - pct / 100);
                  const status = getStatus(t, goal.current_progress, goal.target);

                  return (
                  <div
                    key={goal.id}
                    onClick={() => selectRelic(goal.id)}
                    className={`up-list-item ${isSelected ? "up-list-item-selected" : "up-list-item-default"}`}
                  >
                    <div className="up-list-item-ring">
                      <svg width={34} height={34} className="up-list-item-ring-svg">
                        <circle cx={17} cy={17} r={14} stroke="var(--color-border)" strokeWidth="3" fill="none" />
                        <circle cx={17} cy={17} r={14} stroke="var(--color-primary)" strokeWidth="3" fill="none" strokeLinecap="round"
                          strokeDasharray={`${2 * Math.PI * 14}`} strokeDashoffset={offset}
                          style={{ transition: useAnim ? "none" : "stroke-dashoffset 0.6s" }} />
                      </svg>
                      <div className="up-list-item-ring-icon">
                        <Icon size={12} color="var(--color-primary)" />
                      </div>
                    </div>

                    <div className="up-list-item-info">
                      <div className="up-list-item-title-row">
                        <span className="up-list-item-title">{goal.title}</span>
                        {pendingOp && (
                          <span className="up-list-item-badge" style={{
                            background: pendingOp.type === "reset" ? "#FEE2E2" : "color-mix(in srgb, var(--color-primary) 20%, transparent)",
                            color: pendingOp.type === "reset" ? "#DC2626" : "var(--color-primary)",
                          }}>
                            {pendingOp.type === "reset" ? t("dashboard.updateProgress.reset") : `+${pendingOp.value}`}
                          </span>
                        )}
                      </div>
                      <div className="up-list-item-meta">
                        <span className="up-list-item-progress">{displayProgress}/{goal.target}</span>
                        <span className="up-list-item-status" style={{ background: status.bg, color: status.color }}>
                          {status.label}
                        </span>
                      </div>
                    </div>

                    {goal.is_equipped && (
                      <span className="up-list-item-equip">{t("dashboard.updateProgress.equipped")}</span>
                    )}
                  </div>
                );
              })}
              {relicList.length === 0 && (
                <div className="up-empty-state">{t("dashboard.updateProgress.noRelicsYet")}</div>
              )}
            </div>
          </div>
        </div>

        <div data-tutorial-target="update-progress-controls" className="up-right">
          {selected ? (
            <>
              <div className="up-showcase">
                {!animPhase && ambientParticles.map(p => (
                  <div key={p.key} className="up-ambient-particle" style={{
                    width: p.w, height: p.h,
                    background: p.bg,
                    left: p.l, top: p.t,
                    animation: p.anim,
                  }} />
                ))}

                <div className="up-orb-wrap" style={{
                  animation: animPhase === "channel"
                    ? "iconPulseChannel 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)"
                    : animPhase === "remove"
                      ? "iconPulseRemove 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)"
                      : "orbFloat 4s ease-in-out infinite",
                }}>
                  <div className="up-orb-glow" style={{
                    animation: animPhase === "channel"
                      ? "glowChannel 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)"
                      : animPhase === "remove"
                        ? "glowRemove 0.7s cubic-bezier(0.34, 1.56, 0.64, 1)"
                        : "energyPulse 3s ease-in-out infinite",
                  }} />

                  {animPhase === "reset" && (
                    <div className="up-orb-reset-ripple" />
                  )}

                  {animPhase === "channel" && (
                    <div className="up-orb-energy" style={{
                      background: "radial-gradient(circle, rgba(139,92,246,0.35), transparent 70%)",
                      animation: "coreGlow 0.8s ease-out forwards",
                    }} />
                  )}
                  {animPhase === "remove" && (
                    <div className="up-orb-energy" style={{
                      background: "radial-gradient(circle, rgba(139,92,246,0.25), transparent 70%)",
                      animation: "coreDrain 0.7s ease-out forwards",
                    }} />
                  )}

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

                  <svg width={180} height={180} className="up-orb-energy-ring" style={{ animation: "relicEnergy 8s linear infinite" }}>
                    <defs>
                      <linearGradient id="ringGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#8B5CF6" stopOpacity="0.4" />
                        <stop offset="50%" stopColor="#A78BFA" stopOpacity="0.15" />
                        <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0.4" />
                      </linearGradient>
                    </defs>
                    <circle cx={90} cy={90} r={85} fill="none" stroke="url(#ringGrad)" strokeWidth="1.5" strokeDasharray="6 5" />
                  </svg>

                  <svg width={180} height={180} className="up-orb-progress-ring">
                    <circle cx={90} cy={90} r={72} fill="none" stroke="var(--color-border)" strokeWidth="3.5" />
                    <circle cx={90} cy={90} r={72} fill="none" stroke="var(--color-primary)" strokeWidth="3.5"
                      strokeLinecap="round" strokeDasharray={`${circ}`} strokeDashoffset={selectedOffset}
                      style={{ transition: animProgress ? "none" : "stroke-dashoffset 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)" }} />
                  </svg>

                  <div className="up-orb-icon-core">
                    {(() => {
                      const Icon = resolveIcon(selected.icon);
                      return Icon ? <Icon size={34} color="var(--color-primary)" /> : <span style={{ fontSize: 28, color: "var(--color-primary)" }}>✦</span>;
                    })()}
                  </div>
                </div>

                <div className="up-orb-title-area">
                  <h3 className="up-orb-title">{selected.title}</h3>
                  <div className="up-orb-status-row">
                    <span className="up-orb-status-badge" style={{
                      color: selectedStatus.color,
                      background: selectedStatus.bg,
                    }}>
                      {selectedStatus.label}
                    </span>
                    <span className="up-orb-progress-text">{selectedDisplayProgress} / {selected.target}</span>
                  </div>
                  <p className="up-orb-flavor">
                    {selectedPct === 100
                      ? t("dashboard.updateProgress.fullyAttuned")
                      : selectedPct > 50
                        ? t("dashboard.updateProgress.halfwayAttuned")
                        : t("dashboard.updateProgress.progressHarmony")}
                  </p>
                </div>
              </div>

              <div className="up-controls">
                <div className="up-controls-inner" style={{
                  background: `color-mix(in srgb, var(--color-primary) 6%, transparent)`,
                  border: `1px solid color-mix(in srgb, var(--color-primary) 15%, transparent)`,
                }}>
                  <div className="up-controls-row">
                    <button
                      onClick={() => setDeleteConfirm(true)}
                      disabled={!selected || updating}
                      className={`up-btn ${selected ? "up-btn-danger" : "up-btn-danger-inactive"}`}
                    >
                      <Trash2 size={12} />
                      {t("dashboard.updateProgress.delete")}
                    </button>
                    <button
                      onClick={handleReset}
                      disabled={!selected || updating}
                      className={`up-btn-reset ${selected ? "up-btn-reset-active" : "up-btn-reset-inactive"}`}
                    >
                      {t("dashboard.updateProgress.reset")}
                    </button>

                    <div className="up-controls-right">
                      <span className="up-add-label">{t("dashboard.updateProgress.add")}</span>
                      <input
                        ref={inputRef}
                        type="number"
                        value={inputValue}
                        onChange={handleInputChange}
                        disabled={!selected || updating}
                        placeholder="1"
                        className="up-add-input"
                        style={{
                          border: `1px solid color-mix(in srgb, var(--color-primary) 35%, transparent)`,
                          MozAppearance: "textfield",
                        }}
                      />
                      {inputValue !== "" && !isNaN(parseInt(inputValue, 10)) && (
                        <span className="up-add-preview" style={{ color: "var(--color-primary)" }}>
                          → {Math.max(0, (selected.current_progress || 0) + parseInt(inputValue, 10))}
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleUpdate}
                  disabled={pendingCount === 0 || updating}
                  className={`up-submit-btn ${pendingCount > 0 && !updating ? "up-submit-btn-active" : "up-submit-btn-inactive"}`}
                >
                  {updating
                    ? t("dashboard.updateProgress.channeling")
                    : pendingCount > 0 && primaryOp
                      ? primaryOp.type === "reset"
                        ? t("dashboard.updateProgress.resetProgress")
                        : primaryOp.value > 0
                          ? t("dashboard.updateProgress.channelEnergy", { count: primaryOp.value })
                          : t("dashboard.updateProgress.removeEnergy", { count: Math.abs(primaryOp.value) })
                      : t("dashboard.updateProgress.selectToChannel")}
                  {updating && <span className="up-submit-shimmer" />}
                </button>
              </div>
            </>
          ) : (
            <div className="up-empty-panel">
              <div className="up-empty-icon-wrap">
                ✦
              </div>
              <p className="up-empty-text">{t("dashboard.updateProgress.selectToChannelHint")}</p>
            </div>
          )}
        </div>
      </div>

      <ConfirmDialog
        open={deleteConfirm}
        title={t("dashboard.updateProgress.deleteTitle")}
        message={t("dashboard.updateProgress.deleteMessage")}
        confirmLabel={t("dashboard.updateProgress.deleteConfirm")}
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
