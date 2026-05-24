import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { useTranslation } from "react-i18next";
import { theme } from "../../../theme";
import { resolveIcon } from "./IconPicker";

const equippedCirc = 2 * Math.PI * 14;
const storageCirc = 2 * Math.PI * 10;

function getStatus(t, current, target) {
  if (target === 0) return { label: t("home.habitRelics.status.noTarget"), color: "var(--color-muted)", bg: "color-mix(in srgb, var(--color-muted) 12%, transparent)" };
  if (current > target) return { label: t("home.habitRelics.status.onFire"), color: "#DC2626", bg: "color-mix(in srgb, #DC2626 12%, transparent)" };
  if (current === target) return { label: t("home.habitRelics.status.achieved"), color: "#059669", bg: "color-mix(in srgb, #059669 12%, transparent)" };
  const pct = current / target;
  if (pct >= 0.8) return { label: t("home.habitRelics.status.almostDone"), color: "#D97706", bg: "color-mix(in srgb, #D97706 12%, transparent)" };
  return { label: t("home.habitRelics.status.inProgress"), color: "var(--color-muted)", bg: "color-mix(in srgb, var(--color-muted) 12%, transparent)" };
}

function EquippedRelicCard({ goal, dragOver, animating, onDrop, onDragEnter, onDragLeave, onDragStart, onDragEnd, t }) {
  const pct = goal.target > 0
    ? Math.min(Math.round((goal.current_progress / goal.target) * 100), 100)
    : 0;
  const offset = equippedCirc * (1 - pct / 100);
  const status = getStatus(t, goal.current_progress, goal.target);
  const Icon = resolveIcon(goal.icon);
  const rootRef = useRef(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const handler = (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    };
    el.addEventListener("dragover", handler, false);
    return () => el.removeEventListener("dragover", handler);
  }, []);

  return (
    <div
      ref={rootRef}
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      style={{
        background: dragOver ? `color-mix(in srgb, ${theme.primary} 8%, transparent)` : "var(--color-card)",
        borderRadius: 12,
        border: dragOver
          ? `2px solid ${theme.primary}`
          : `1.5px solid color-mix(in srgb, ${theme.primary} 30%, transparent)`,
        padding: "10px 10px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 6,
        cursor: "grab",
        transition: "all 0.2s",
        boxShadow: dragOver
          ? "0 0 24px rgba(139,92,246,0.25), 0 0 0 1px rgba(139,92,246,0.1)"
          : "0 2px 12px rgba(139,92,246,0.08), 0 0 0 1px rgba(139,92,246,0.04)",
        position: "relative",
        overflow: "hidden",
        transform: dragOver ? "scale(1.03)" : "scale(1)",
      }}
    >
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: dragOver ? 4 : 3,
        background: dragOver
          ? "linear-gradient(90deg, #7C3AED, #A78BFA)"
          : `linear-gradient(90deg, ${theme.primary}, color-mix(in srgb, ${theme.primary} 80%, transparent))`,
        transition: "height 0.2s",
      }} />

      <div style={{ position: "relative", width: 44, height: 44, flexShrink: 0 }}>
        <svg width={44} height={44} style={{ transform: "rotate(-90deg)", position: "absolute" }}>
          <circle cx={22} cy={22} r={14} stroke={theme.border} strokeWidth="3.5" fill="none" />
          <circle cx={22} cy={22} r={14} stroke={theme.primary} strokeWidth="3.5" fill="none" strokeLinecap="round"
            strokeDasharray={`${equippedCirc}`} strokeDashoffset={offset} style={{ transition: "stroke-dashoffset 0.6s" }} />
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

      <span style={{ fontSize: 12, fontWeight: 600, color: theme.dark, textAlign: "center", lineHeight: 1.2 }}>
        {goal.title}
      </span>

      <div style={{
        padding: "2px 8px",
        borderRadius: 6,
        background: status.bg,
        fontSize: 10,
        fontWeight: 500,
        color: status.color,
        whiteSpace: "nowrap",
      }}>
        {status.label}
      </div>

      <div style={{ fontSize: 10, fontWeight: 600, color: theme.dark }}>
        {goal.current_progress}/{goal.target}
      </div>
    </div>
  );
}

function StorageRelicCard({ goal, dragging, onDragStart, onDragEnd, t }) {
  const pct = goal.target > 0
    ? Math.min(Math.round((goal.current_progress / goal.target) * 100), 100)
    : 0;
  const offset = storageCirc * (1 - pct / 100);
  const status = getStatus(t, goal.current_progress, goal.target);
  const Icon = resolveIcon(goal.icon);

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      style={{
        background: "var(--color-card)",
        borderRadius: 10,
        border: `1px solid ${theme.border}`,
        padding: "8px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: 4,
        cursor: "grab",
        transition: "all 0.2s",
        position: "relative",
        opacity: dragging ? 0.4 : 1,
        boxShadow: dragging ? "0 4px 16px rgba(139,92,246,0.15)" : "none",
        transform: dragging ? "scale(0.95)" : "scale(1)",
      }}
    >
      <div style={{ position: "relative", width: 28, height: 28, flexShrink: 0 }}>
        <svg width={28} height={28} style={{ transform: "rotate(-90deg)", position: "absolute" }}>
          <circle cx={14} cy={14} r={10} stroke={theme.border} strokeWidth="3" fill="none" />
          <circle cx={14} cy={14} r={10} stroke={theme.primary} strokeWidth="3" fill="none" strokeLinecap="round"
            strokeDasharray={`${storageCirc}`} strokeDashoffset={offset} style={{ transition: "stroke-dashoffset 0.6s" }} />
        </svg>
        <div style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}>
          <Icon size={10} color={theme.primary} />
        </div>
      </div>

      <span style={{ fontSize: 10, fontWeight: 600, color: theme.dark, textAlign: "center", lineHeight: 1.15 }}>
        {goal.title}
      </span>

      <div style={{
        padding: "1px 5px",
        borderRadius: 5,
        background: status.bg,
        fontSize: 8,
        fontWeight: 500,
        color: status.color,
        whiteSpace: "nowrap",
      }}>
        {status.label}
      </div>

      <div style={{ fontSize: 9, fontWeight: 600, color: theme.muted }}>
        {goal.current_progress}/{goal.target}
      </div>
    </div>
  );
}

function EmptyEquippedSlot({ dragOver, onDrop, onDragEnter, onDragLeave, t }) {
  const rootRef = useRef(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const handler = (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    };
    el.addEventListener("dragover", handler, false);
    return () => el.removeEventListener("dragover", handler);
  }, []);

  return (
    <div
      ref={rootRef}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      style={{
        borderRadius: 12,
        border: dragOver
          ? `2px solid ${theme.primary}`
          : "1.5px dashed var(--color-border)",
        padding: "10px 10px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
        minHeight: 100,
        background: dragOver ? `color-mix(in srgb, ${theme.primary} 8%, transparent)` : "var(--color-card)",
        cursor: "default",
        transition: "all 0.2s",
        boxShadow: dragOver ? `0 0 20px color-mix(in srgb, ${theme.primary} 22%, transparent)` : "none",
      }}
    >
      <div style={{
        width: 44,
        height: 44,
        borderRadius: "50%",
        background: dragOver ? `color-mix(in srgb, ${theme.primary} 15%, transparent)` : theme.border,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 18,
        color: dragOver ? theme.primary : theme.muted,
        transition: "all 0.2s",
        pointerEvents: "none",
      }}>
        ?
      </div>
      <span style={{ fontSize: 11, color: dragOver ? theme.primary : theme.muted, fontWeight: 500, transition: "color 0.2s", pointerEvents: "none" }}>
        {dragOver ? t("home.relicManager.dropHere") : t("home.relicManager.emptySlot")}
      </span>
    </div>
  );
}

export default function RelicManagerModal({ open, onClose, relics, mode, onEquip, onUnequip }) {
  const { t } = useTranslation();
  const [draggedRelicId, setDraggedRelicId] = useState(null);
  const [dragOverSlot, setDragOverSlot] = useState(null);
  const [dragOverStorage, setDragOverStorage] = useState(false);
  const [animating, setAnimating] = useState(false);
  const animTimeout = useRef(null);
  const draggedIdRef = useRef(null);

  useEffect(() => {
    if (open) {
      setDraggedRelicId(null);
      setDragOverSlot(null);
      setDragOverStorage(false);
      setAnimating(false);
      draggedIdRef.current = null;
    }
  }, [open]);

  useEffect(() => {
    return () => {
      if (animTimeout.current) clearTimeout(animTimeout.current);
    };
  }, []);

  const equipped = useMemo(
    () => relics
      .filter((g) => g.is_equipped)
      .sort((a, b) => (a.equipped_order ?? 99) - (b.equipped_order ?? 99)),
    [relics]
  );

  const storage = useMemo(() => relics.filter((g) => !g.is_equipped), [relics]);

  const isDraggingEquipped = draggedRelicId && equipped.some((g) => g.id === draggedRelicId);

  const handleDragStart = (e, relicId) => {
    e.dataTransfer.setData("text/plain", relicId);
    e.dataTransfer.effectAllowed = "move";
    draggedIdRef.current = relicId;
    setDraggedRelicId(relicId);
  };

  const handleDragEnter = (slotIndex) => {
    setDragOverSlot(slotIndex);
  };

  const handleDragLeave = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x <= rect.left || x >= rect.right || y <= rect.top || y >= rect.bottom) {
      setDragOverSlot(null);
    }
  };

  const handleDrop = async (e, slotIndex) => {
    e.preventDefault();

    const relicId = draggedIdRef.current;
    if (!relicId) return;

    draggedIdRef.current = null;
    setDragOverSlot(null);
    setDraggedRelicId(null);
    setAnimating(true);

    animTimeout.current = setTimeout(async () => {
      try {
        await onEquip(relicId, slotIndex);
      } catch {
        // error handled by hook
      }
      setAnimating(false);
    }, 300);
  };

  const handleStorageDragEnter = () => setDragOverStorage(true);

  const handleStorageDragLeave = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    if (x <= rect.left || x >= rect.right || y <= rect.top || y >= rect.bottom) {
      setDragOverStorage(false);
    }
  };

  const handleStorageDrop = async (e) => {
    e.preventDefault();

    const relicId = draggedIdRef.current;
    if (!relicId) {
      draggedIdRef.current = null;
      setDraggedRelicId(null);
      setDragOverStorage(false);
      return;
    }

    const equippedGoal = equipped.find((g) => g.id === relicId);
    if (!equippedGoal) {
      draggedIdRef.current = null;
      setDraggedRelicId(null);
      setDragOverStorage(false);
      return;
    }

    draggedIdRef.current = null;
    setDragOverStorage(false);
    setDraggedRelicId(null);
    setAnimating(true);

    animTimeout.current = setTimeout(async () => {
      try {
        await onUnequip(relicId);
      } catch {
        // error handled by hook
      }
      setAnimating(false);
    }, 300);
  };

  const handleDragEnd = useCallback(() => {
    draggedIdRef.current = null;
    setDraggedRelicId(null);
    setDragOverSlot(null);
    setDragOverStorage(false);
  }, []);

  if (!open) return null;

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
          width: 580,
          maxWidth: "92vw",
          maxHeight: "85vh",
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
          @keyframes relicSwap {
            0% { transform: scale(1); opacity: 1; }
            40% { transform: scale(0.88); opacity: 0.5; }
            60% { transform: scale(0.88); opacity: 0.5; }
            100% { transform: scale(1); opacity: 1; }
          }
          .relic-swapping {
            animation: relicSwap 0.3s ease;
          }
          .relic-inventory-scroll {
            overflow-x: auto;
            overflow-y: hidden;
            scrollbar-width: thin;
            scrollbar-color: var(--color-border) var(--color-card);
          }
          .relic-inventory-scroll::-webkit-scrollbar {
            height: 6px;
          }
          .relic-inventory-scroll::-webkit-scrollbar-track {
            background: var(--color-card);
            border-radius: 3px;
          }
          .relic-inventory-scroll::-webkit-scrollbar-thumb {
            background: var(--color-border);
            border-radius: 3px;
            transition: background 0.2s;
          }
          .relic-inventory-scroll::-webkit-scrollbar-thumb:hover {
            background: var(--color-muted);
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
              {mode === "change" ? t("home.relicManager.changeRelicsTitle") : t("home.relicManager.upgradeRelicsTitle")}
            </h2>
            <p style={{ fontSize: 11, color: theme.muted, margin: "1px 0 0" }}>
              {mode === "change" ? t("home.relicManager.changeRelicsDesc") : t("home.relicManager.upgradeRelicsDesc")}
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
          display: "flex",
          flexDirection: "column",
          gap: 16,
          overflow: "hidden",
          flex: 1,
        }}>
          <div style={{
            flexShrink: 0,
            background: draggedRelicId ? `color-mix(in srgb, ${theme.primary} 8%, transparent)` : "var(--color-card)",
            borderRadius: 12,
            padding: "12px",
            border: draggedRelicId
              ? `1.5px solid color-mix(in srgb, ${theme.primary} 40%, transparent)`
              : `1px solid ${theme.border}`,
            transition: "all 0.25s",
          }}>
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 10,
            }}>
              <div style={{
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: theme.primary,
              }} />
              <span style={{ fontSize: 13, fontWeight: 600, color: theme.dark }}>
                {t("home.relicManager.equippedLoadout")}
              </span>
              <span style={{ fontSize: 10, color: theme.muted, fontWeight: 500 }}>
                — {equipped.filter(Boolean).length}/3
              </span>
            </div>

            <div style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 10,
            }}>
              {Array.from({ length: 3 }).map((_, i) =>
                i < equipped.length ? (
                  <div
                    key={equipped[i].id}
                    className={animating ? "relic-swapping" : ""}
                  >
                    <EquippedRelicCard
                        goal={equipped[i]}
                        dragOver={dragOverSlot === i}
                        animating={animating}
                        onDragEnter={() => handleDragEnter(i)}
                        onDragLeave={handleDragLeave}
                        onDrop={(e) => handleDrop(e, i)}
                        onDragStart={(e) => handleDragStart(e, equipped[i].id)}
                        onDragEnd={handleDragEnd}
                        t={t}
                      />
                  </div>
                ) : (
                  <EmptyEquippedSlot
                    key={`empty-${i}`}
                    dragOver={dragOverSlot === i}
                    onDragEnter={() => handleDragEnter(i)}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, i)}
                    t={t}
                  />
                )
              )}
            </div>
          </div>

          <div
            style={{
              flex: 1,
              minHeight: 0,
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
              background: dragOverStorage ? `color-mix(in srgb, ${theme.primary} 8%, transparent)` : "transparent",
              borderRadius: 10,
              padding: dragOverStorage ? 8 : 0,
              margin: dragOverStorage ? -8 : 0,
              transition: "all 0.25s",
              border: dragOverStorage
                ? `1.5px solid color-mix(in srgb, ${theme.primary} 40%, transparent)`
                : "1.5px solid transparent",
            }}
            onDragEnter={handleStorageDragEnter}
            onDragLeave={handleStorageDragLeave}
            onDragOver={(e) => { e.preventDefault(); }}
            onDrop={handleStorageDrop}
          >
            <div style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 10,
              flexShrink: 0,
            }}>
              <div style={{
                width: 7,
                height: 7,
                borderRadius: "50%",
                background: theme.border,
              }} />
              <span style={{ fontSize: 12, fontWeight: 600, color: theme.dark }}>
                {t("home.relicManager.relicInventory")}
              </span>
              <span style={{ fontSize: 10, color: theme.muted, fontWeight: 500 }}>
                {t("home.relicManager.owned", { count: storage.length })}
              </span>
              {dragOverStorage && (
                <span style={{
                  fontSize: 10,
                  color: theme.primary,
                  fontWeight: 600,
                  marginLeft: "auto",
                  animation: "fadeIn 0.15s ease",
                }}>
                  {t("home.relicManager.dropToUnequip")}
                </span>
              )}
            </div>

            <div style={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              minHeight: 0,
            }}>
              {storage.length === 0 && !dragOverStorage ? (
                <div style={{
                  textAlign: "center",
                  padding: "32px 0",
                  fontSize: 12,
                  color: theme.muted,
                }}>
                  {t("home.relicManager.noRelicsInventory")}
                </div>
              ) : (
                <div className="relic-inventory-scroll" style={{
                  flex: 1,
                  display: "flex",
                  minHeight: dragOverStorage && storage.length === 0 ? 80 : 0,
                  alignItems: dragOverStorage && storage.length === 0 ? "center" : "stretch",
                  justifyContent: dragOverStorage && storage.length === 0 ? "center" : "flex-start",
                  background: dragOverStorage && storage.length === 0 ? "#FAF9FF" : "transparent",
                  borderRadius: 8,
                  transition: "all 0.25s",
                }}>
                  {storage.length === 0 ? (
                    <span style={{
                      fontSize: 12,
                      color: theme.primary,
                      fontWeight: 500,
                      whiteSpace: "nowrap",
                    }}>
                      {t("home.relicManager.dropHereToStore")}
                    </span>
                  ) : (
                    <div style={{
                      display: "flex",
                      gap: 12,
                      alignItems: "start",
                      paddingBottom: 10,
                    }}>
                      {storage.map((goal) => (
                        <div
                          key={goal.id}
                          style={{ flexShrink: 0, width: 130 }}
                          className={animating ? "relic-swapping" : ""}
                        >
                          <StorageRelicCard
                            goal={goal}
                            dragging={draggedRelicId === goal.id}
                            onDragStart={(e) => handleDragStart(e, goal.id)}
                            onDragEnd={handleDragEnd}
                            t={t}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
