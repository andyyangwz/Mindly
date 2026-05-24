import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { theme } from "../../../theme";
import { resolveIcon } from "./IconPicker";
import InfoButton from "../../../components/tutorial/InfoButton";

const circ = 2 * Math.PI * 42;

function getStatus(t, current, target) {
  if (target === 0) return { label: t("home.habitRelics.status.noTarget"), color: "var(--color-muted)", bg: "color-mix(in srgb, var(--color-muted) 12%, transparent)" };
  if (current > target) return { label: t("home.habitRelics.status.onFire"), color: "#DC2626", bg: "color-mix(in srgb, #DC2626 12%, transparent)" };
  if (current === target) return { label: t("home.habitRelics.status.achieved"), color: "#059669", bg: "color-mix(in srgb, #059669 12%, transparent)" };
  const pct = current / target;
  if (pct >= 0.8) return { label: t("home.habitRelics.status.almostDone"), color: "#D97706", bg: "color-mix(in srgb, #D97706 12%, transparent)" };
  return { label: t("home.habitRelics.status.inProgress"), color: "var(--color-muted)", bg: "color-mix(in srgb, var(--color-muted) 12%, transparent)" };
}

export default function UpdateProgressModal({ open, onClose, relics, onUpdate }) {
  const { t } = useTranslation();
  const [selectedId, setSelectedId] = useState(null);
  const [pendingOps, setPendingOps] = useState({});
  const [inputValue, setInputValue] = useState("1");
  const [updating, setUpdating] = useState(false);
  const [chargeAnim, setChargeAnim] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedId(null);
      setPendingOps({});
      setInputValue("1");
      setUpdating(false);
      setChargeAnim(false);
    }
  }, [open]);

  const relicList = useMemo(() => {
    const sorted = [...relics].sort((a, b) => {
      if (a.is_equipped && !b.is_equipped) return -1;
      if (!a.is_equipped && b.is_equipped) return 1;
      return (a.equipped_order ?? 99) - (b.equipped_order ?? 99);
    });
    return sorted;
  }, [relics]);

  const selectedRelic = useMemo(
    () => relicList.find((g) => g.id === selectedId) || null,
    [relicList, selectedId]
  );

  const selectRelic = (id) => {
    setSelectedId(id);
    const op = pendingOps[id];
    if (op) {
      if (op.type === "add") {
        setInputValue(String(op.value));
      } else {
        setInputValue("");
      }
    } else {
      setInputValue("1");
    }
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

  const handleUpdate = async () => {
    const entries = Object.entries(pendingOps);
    if (entries.length === 0) return;

    setUpdating(true);
    setChargeAnim(true);
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
        // error handled by hook
      } finally {
        setUpdating(false);
        setChargeAnim(false);
      }
    }, 600);
  };

  if (!open) return null;

  const selected = selectedRelic;
  const pendingCount = Object.keys(pendingOps).length;

  const selectedPct = selected && selected.target > 0
    ? Math.min(Math.round((selected.current_progress / selected.target) * 100), 100)
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
        @keyframes energyPulse { 0%, 100% { box-shadow: 0 0 20px rgba(139,92,246,0.15); } 50% { box-shadow: 0 0 50px rgba(139,92,246,0.3); } }
        @keyframes orbFloat { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-5px); } }
        @keyframes chargeBurst { 0% { transform: scale(1); opacity: 1; } 50% { transform: scale(1.15); opacity: 0.8; box-shadow: 0 0 80px rgba(139,92,246,0.5); } 100% { transform: scale(1); opacity: 1; } }
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
                  <InfoButton tutorialId="update-progress" size={12} />
                </div>
                <p style={{ fontSize: 11, color: "var(--color-muted)", margin: "1px 0 0" }}>
                  {relicList.length} relics available
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
              {relicList.map((goal) => {
                const isSelected = goal.id === selectedId;
                const pendingOp = pendingOps[goal.id];
                const status = getStatus(t, goal.current_progress, goal.target);
                const Icon = resolveIcon(goal.icon);
                const pct = goal.target > 0
                  ? Math.min(Math.round((goal.current_progress / goal.target) * 100), 100)
                  : 0;
                const offset = 2 * Math.PI * 14 * (1 - pct / 100);

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
                          style={{ transition: "stroke-dashoffset 0.6s" }} />
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
                            {pendingOp.type === "reset" ? "Reset" : `+${pendingOp.value}`}
                          </span>
                        )}
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5, marginTop: 2 }}>
                        <span style={{ fontSize: 10, fontWeight: 600, color: "var(--color-muted)" }}>
                          {goal.current_progress}/{goal.target}
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
                        Equipped
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
        <div style={{
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
                {[...Array(4)].map((_, i) => (
                  <div key={i} style={{
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
                  animation: chargeAnim ? "chargeBurst 0.6s ease" : "orbFloat 4s ease-in-out infinite",
                }}>
                  {/* Outer glow */}
                  <div style={{
                    position: "absolute", top: -20, left: -20, width: 220, height: 220,
                    borderRadius: "50%",
                    background: "linear-gradient(135deg, rgba(139,92,246,0.06), rgba(59,130,246,0.03))",
                    animation: chargeAnim ? "none" : "energyPulse 3s ease-in-out infinite",
                  }} />

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
                      style={{ transition: "stroke-dashoffset 0.6s ease" }} />
                  </svg>

                  {/* Icon core */}
                  <div style={{
                    position: "absolute",
                    top: 50, left: 50, width: 80, height: 80,
                    borderRadius: "50%",
                    background: "var(--color-card)",
                    boxShadow: "0 0 40px rgba(139,92,246,0.1), inset 0 0 20px rgba(139,92,246,0.04)",
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
                      {selected.current_progress} / {selected.target}
                    </span>
                  </div>
                  <p style={{
                    fontSize: 12, color: "var(--color-muted)", margin: "8px 0 0",
                    fontStyle: "italic",
                  }}>
                    {selectedPct === 100
                      ? "Fully attuned. The relic resonates with your journey."
                      : selectedPct > 50
                        ? "More than halfway attuned. Your dedication is shaping this relic."
                        : "Each step attunes the relic to your path. Progress is harmony."}
                  </p>
                </div>
              </div>

              {/* Controls */}
              <div style={{
                padding: "16px 20px 20px",
                borderTop: "1px solid var(--color-border, rgba(0,0,0,0.06))",
                flexShrink: 0,
              }}>
                <div style={{
                  background: `color-mix(in srgb, ${theme.primary} 6%, transparent)`,
                  borderRadius: 14,
                  padding: "14px 16px",
                  border: `1px solid color-mix(in srgb, ${theme.primary} 15%, transparent)`,
                }}>
                  <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
                    <button
                      onClick={handleReset}
                      disabled={!selected || updating}
                      style={{
                        padding: "9px 16px", borderRadius: 9,
                        border: selected ? "1px solid rgba(239,68,68,0.3)" : "1px solid var(--color-border)",
                        background: selected ? "rgba(239,68,68,0.08)" : "transparent",
                        color: selected ? "#DC2626" : "var(--color-muted)",
                        fontSize: 11, fontWeight: 600,
                        cursor: selected && !updating ? "pointer" : "not-allowed",
                        transition: "all 0.15s",
                        whiteSpace: "nowrap",
                        fontFamily: "inherit",
                      }}
                    >
                      Reset
                    </button>

                    <div style={{ display: "flex", alignItems: "center", gap: 8, flex: 1 }}>
                      <span style={{ fontSize: 11, color: "var(--color-muted)", fontWeight: 500, whiteSpace: "nowrap" }}>
                        Add
                      </span>
                      <input
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
                      ? `linear-gradient(135deg, ${theme.primary}, ${theme.primary}dd)`
                      : "var(--color-border)",
                    color: pendingCount > 0 && !updating ? "#fff" : "var(--color-muted)",
                    fontSize: 13, fontWeight: 700,
                    cursor: pendingCount > 0 && !updating ? "pointer" : "not-allowed",
                    transition: "all 0.2s",
                    fontFamily: "inherit",
                    boxShadow: pendingCount > 0 && !updating ? `0 4px 16px rgba(139,92,246,0.25)` : "none",
                    position: "relative", overflow: "hidden",
                  }}
                >
                  {updating
                    ? "Channeling..."
                    : pendingCount > 0
                      ? `Channel Energy (${pendingCount})`
                      : "Select a relic to channel"}
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
                Select a relic from the roster to channel progress energy into it.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
