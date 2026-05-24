import { useState, useMemo, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { theme } from "../../../theme";
import { resolveIcon } from "./IconPicker";

const circ = 2 * Math.PI * 12;

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

  useEffect(() => {
    if (open) {
      setSelectedId(null);
      setPendingOps({});
      setInputValue("1");
      setUpdating(false);
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
    }
  };

  if (!open) return null;

  const selected = selectedRelic;
  const pendingCount = Object.keys(pendingOps).length;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        background: "rgba(0,0,0,0.5)",
        backdropFilter: "blur(6px)",
        zIndex: theme.z.modalOverlay,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        animation: "fadeIn 0.2s ease",
      }}
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        style={{
          background: "var(--color-card)",
          borderRadius: 16,
          padding: "20px",
          width: 480,
          maxWidth: "92vw",
          height: "75vh",
          display: "flex",
          flexDirection: "column",
          boxShadow: "0 20px 60px rgba(0,0,0,0.2)",
          zIndex: theme.z.modal,
          animation: "slideUp 0.25s ease",
          overflow: "hidden",
        }}
      >
        <style>{`
          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          @keyframes slideUp { from { opacity: 0; transform: translateY(20px); } to { opacity: 1; transform: translateY(0); } }
          @keyframes pulse-glow {
            0%, 100% { box-shadow: 0 0 0 0 rgba(139,92,246,0.3); }
            50% { box-shadow: 0 0 0 4px rgba(139,92,246,0.15); }
          }
        `}</style>

        <div style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
          flexShrink: 0,
        }}>
          <div>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: theme.dark, margin: 0 }}>
              {t("home.updateProgress.title")}
            </h2>
            <p style={{ fontSize: 11, color: theme.muted, margin: "1px 0 0" }}>
              {t("home.updateProgress.selectRelic")}
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: theme.border,
              border: "none",
              borderRadius: 8,
              width: 30,
              height: 30,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              cursor: "pointer",
              fontSize: 15,
              color: theme.muted,
              flexShrink: 0,
            }}
          >
            ✕
          </button>
        </div>

        <div style={{
          flex: 1,
          minHeight: 0,
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}>
          <div style={{
            flex: 1,
            minHeight: 0,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 10,
              flexShrink: 0,
            }}>
              <div style={{ width: 7, height: 7, borderRadius: "50%", background: theme.primary }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: theme.dark }}>
                {t("home.updateProgress.allRelics")}
              </span>
              <span style={{ fontSize: 10, color: theme.muted, fontWeight: 500 }}>
                {t("home.updateProgress.total", { count: relicList.length })}
              </span>
              {pendingCount > 0 && (
                <span style={{
                  fontSize: 10,
                  color: theme.primary,
                  fontWeight: 600,
                  marginLeft: "auto",
                }}>
                  {t("home.updateProgress.pending", { count: pendingCount })}
                </span>
              )}
            </div>

            <div style={{
              flex: 1,
              overflow: "hidden",
              position: "relative",
            }}>
              <div style={{
                position: "absolute",
                inset: 0,
                overflowY: "auto",
                display: "flex",
                flexDirection: "column",
                gap: 8,
                paddingRight: 4,
              }}>
                {relicList.map((goal) => {
                  const isSelected = goal.id === selectedId;
                  const pendingOp = pendingOps[goal.id];
                  const status = getStatus(t, goal.current_progress, goal.target);
                  const Icon = resolveIcon(goal.icon);
                  const pct = goal.target > 0
                    ? Math.min(Math.round((goal.current_progress / goal.target) * 100), 100)
                    : 0;
                  const offset = circ * (1 - pct / 100);

                  return (
                    <div
                      key={goal.id}
                      onClick={() => selectRelic(goal.id)}
                      style={{
                        background: isSelected ? `color-mix(in srgb, ${theme.primary} 8%, transparent)` : "var(--color-card)",
                        borderRadius: 10,
                        border: isSelected
                          ? `1.5px solid ${theme.primary}`
                          : `1px solid ${theme.border}`,
                        padding: "10px 12px",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        cursor: "pointer",
                        transition: "all 0.15s",
                        animation: isSelected ? "pulse-glow 2s ease-in-out infinite" : "none",
                        boxShadow: isSelected
                          ? `0 0 20px color-mix(in srgb, ${theme.primary} 20%, transparent)`
                          : "none",
                      }}
                    >
                      <div style={{ position: "relative", width: 34, height: 34, flexShrink: 0 }}>
                        <svg width={34} height={34} style={{ transform: "rotate(-90deg)", position: "absolute" }}>
                          <circle cx={17} cy={17} r={12} stroke={theme.border} strokeWidth="3" fill="none" />
                          <circle cx={17} cy={17} r={12} stroke={theme.primary} strokeWidth="3" fill="none" strokeLinecap="round"
                            strokeDasharray={`${circ}`} strokeDashoffset={offset} style={{ transition: "stroke-dashoffset 0.6s" }} />
                        </svg>
                        <div style={{
                          position: "absolute",
                          inset: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}>
                          <Icon size={13} color={theme.primary} />
                        </div>
                      </div>

                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          <span style={{
                            fontSize: 13,
                            fontWeight: 600,
                            color: theme.dark,
                            whiteSpace: "nowrap",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                          }}>
                            {goal.title}
                          </span>
                          {pendingOp && (
                            <span style={{
                              fontSize: 9,
                              fontWeight: 600,
                              padding: "1px 6px",
                              borderRadius: 4,
                              background: pendingOp.type === "reset" ? "#FEE2E2" : `color-mix(in srgb, ${theme.primary} 20%, transparent)`,
                              color: pendingOp.type === "reset" ? "#DC2626" : theme.primary,
                              whiteSpace: "nowrap",
                              flexShrink: 0,
                            }}>
                              {pendingOp.type === "reset" ? t("home.updateProgress.reset") : `${pendingOp.value > 0 ? "+" : ""}${pendingOp.value}`}
                            </span>
                          )}
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
                          <span style={{ fontSize: 11, fontWeight: 600, color: theme.muted }}>
                            {goal.current_progress}/{goal.target}
                          </span>
                          <span style={{
                            fontSize: 9,
                            padding: "1px 5px",
                            borderRadius: 4,
                            background: status.bg,
                            color: status.color,
                            fontWeight: 500,
                          }}>
                            {status.label}
                          </span>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {relicList.length === 0 && (
                  <div style={{
                    textAlign: "center",
                    padding: "32px 0",
                    fontSize: 12,
                    color: theme.muted,
                  }}>
                    {t("home.updateProgress.noRelicsYet")}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div style={{
            flexShrink: 0,
            background: selected ? `color-mix(in srgb, ${theme.primary} 8%, transparent)` : "var(--color-card)",
            borderRadius: 10,
            padding: "12px",
            border: selected ? `1px solid color-mix(in srgb, ${theme.primary} 30%, transparent)` : `1px solid ${theme.border}`,
            transition: "all 0.2s",
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 10,
            }}>
              <div style={{ width: 6, height: 6, borderRadius: "50%", background: selected ? theme.primary : theme.border }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: selected ? theme.dark : theme.muted }}>
                {selected ? t("home.updateProgress.actions", { title: selected.title }) : t("home.updateProgress.selectRelicToModify")}
              </span>
            </div>

            <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
              <button
                onClick={handleReset}
                disabled={!selected || updating}
                style={{
                  padding: "8px 16px",
                  borderRadius: 8,
                  border: selected ? "1px solid #FCA5A5" : `1px solid ${theme.border}`,
                  background: selected ? "#FEF2F2" : "var(--color-card)",
                  color: selected ? "#DC2626" : theme.muted,
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: selected && !updating ? "pointer" : "not-allowed",
                  transition: "all 0.15s",
                  whiteSpace: "nowrap",
                  flexShrink: 0,
                }}
              >
                {t("home.updateProgress.reset")}
              </button>

              <div style={{ display: "flex", alignItems: "center", gap: 6, flex: 1 }}>
                <span style={{ fontSize: 11, color: selected ? theme.muted : theme.border, fontWeight: 500, whiteSpace: "nowrap" }}>
                  {t("home.updateProgress.amount")}
                </span>
                  <input
                    type="number"
                    value={inputValue}
                  onChange={handleInputChange}
                  disabled={!selected || updating}
                  placeholder="1"
                  style={{
                    width: 70,
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: selected ? `1px solid color-mix(in srgb, ${theme.primary} 50%, transparent)` : `1px solid ${theme.border}`,
                    background: selected ? "var(--color-card)" : "var(--color-bg)",
                    color: selected ? theme.dark : theme.border,
                    fontSize: 14,
                    fontWeight: 600,
                    textAlign: "center",
                    outline: "none",
                    transition: "all 0.15s",
                    MozAppearance: "textfield",
                  }}
                />
                {selected && inputValue !== "" && !isNaN(parseInt(inputValue, 10)) && (
                  <span style={{
                    fontSize: 10,
                    color: theme.primary,
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}>
                    {t("home.updateProgress.totalPreview", { count: (selected.current_progress || 0) + parseInt(inputValue, 10) })}
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
              padding: "12px",
              borderRadius: 10,
              border: "none",
              background: pendingCount > 0 && !updating
                ? `linear-gradient(135deg, ${theme.primary}, ${theme.primary}dd)`
                : theme.border,
              color: pendingCount > 0 && !updating ? "#FFFFFF" : theme.muted,
              fontSize: 14,
              fontWeight: 700,
              cursor: pendingCount > 0 && !updating ? "pointer" : "not-allowed",
              transition: "all 0.2s",
              flexShrink: 0,
              letterSpacing: 0.3,
            }}
          >
            {updating
              ? t("home.updateProgress.updating")
              : pendingCount > 0
                ? t("home.updateProgress.update", { count: pendingCount })
                : t("home.updateProgress.selectRelicAndMakeChanges")}
          </button>
        </div>
      </div>
    </div>
  );
}
