import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { theme } from "../../../theme";
import { resolveIcon } from "./IconPicker";

/* ─── Constants ─────── */
const EQUIP_RING = 2 * Math.PI * 18;
const ARCHIVE_RING = 2 * Math.PI * 11;

const NODE_POS = [
  { left: "22%", top: "62%" },
  { left: "50%", top: "62%" },
  { left: "78%", top: "62%" },
];



/* ─── Helpers ─────── */
function getStatus(t, cur, tar) {
  if (tar === 0) return { label: t("home.habitRelics.status.noTarget"), color: "var(--color-muted)", bg: "" };
  if (cur > tar) return { label: t("home.habitRelics.status.onFire"), color: "#DC2626", bg: "" };
  if (cur === tar) return { label: t("home.habitRelics.status.achieved"), color: "#059669", bg: "" };
  if (cur / tar >= 0.8) return { label: t("home.habitRelics.status.almostDone"), color: "#D97706", bg: "" };
  return { label: t("home.habitRelics.status.inProgress"), color: "var(--color-muted)", bg: "" };
}

/* ─── Particle Field ─────── */
function ParticleField() {
  const p = useMemo(() => Array.from({ length: 18 }, (_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100,
    s: 1.5 + Math.random() * 2.5, d: 6 + Math.random() * 8, delay: Math.random() * 5,
    a: 0.1 + Math.random() * 0.25,
  })), []);
  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", borderRadius: 20 }}>
      {p.map((p) => (
        <motion.div key={p.id} style={{
          position: "absolute", left: `${p.x}%`, top: `${p.y}%`,
          width: p.s, height: p.s, borderRadius: "50%",
          background: theme.primary, opacity: p.a,
        }}
          animate={{ y: [0, -20, 0], opacity: [p.a, p.a * 0.3, p.a] }}
          transition={{ duration: p.d, repeat: Infinity, delay: p.delay, ease: "easeInOut" }} />
      ))}
    </div>
  );
}

/* ─── Energy Core ─────── */
function EnergyCore({ equippedCount, isDragging }) {
  const sz = 72;
  const colors = ["#8B5CF6", "#A78BFA", "#C4B5FD"];
  return (
    <div style={{ position: "relative", zIndex: 5 }}>
      {[1, 2, 3].map((i) => (
        <motion.div key={i} style={{
          position: "absolute", top: "50%", left: "50%",
          width: sz + i * 28, height: sz + i * 28, borderRadius: "50%",
          border: `1px solid ${colors[i % 3]}40`,
          transform: "translate(-50%,-50%)", pointerEvents: "none",
        }}
          animate={{ scale: [1, 1.06, 1], opacity: [0.3, 0.15, 0.3], rotate: [0, 8, 0] }}
          transition={{ duration: 3 + i * 0.6, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }} />
      ))}
      <motion.div style={{
        width: sz, height: sz, borderRadius: "50%",
        background: `radial-gradient(circle at 40% 35%, rgba(196,181,253,0.5), ${theme.primary} 50%, rgba(139,92,246,0.1))`,
        boxShadow: `0 0 ${40 + equippedCount * 12}px color-mix(in srgb, ${theme.primary} ${40 + equippedCount * 15}%, transparent)`,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
        animate={{ scale: isDragging ? [1, 1.08, 1] : [1, 1.04, 1] }}
        transition={{ duration: isDragging ? 1.2 : 3, repeat: Infinity, ease: "easeInOut" }}>
        <span style={{ fontSize: 26, color: "#fff", opacity: 0.85, fontWeight: 300 }}>✦</span>
      </motion.div>
      <div style={{
        position: "absolute", bottom: -6, right: -6,
        background: theme.primary, color: "#fff", fontSize: 10, fontWeight: 700,
        width: 22, height: 22, borderRadius: "50%",
        display: "flex", alignItems: "center", justifyContent: "center",
        boxShadow: "0 0 12px rgba(139,92,246,0.5)",
      }}>
        {equippedCount}
      </div>
    </div>
  );
}

/* ─── Orbital Node ─────── */
function OrbitalNode({
  slotIndex, goal, dragOver, isDragging,
  onDrop, onDragStart, onDragEnd, onHover, onLeave, t,
}) {
  const pct = goal?.target > 0 ? Math.min(Math.round((goal.current_progress / goal.target) * 100), 100) : 0;
  const offset = EQUIP_RING * (1 - pct / 100);
  const Icon = goal ? resolveIcon(goal.icon) : null;
  const pos = NODE_POS[slotIndex];
  const occupied = !!goal;
  const ns = occupied ? 88 : 80;
  const nodeRef = useRef(null);

  /* ── drag-over event listeners (for drop target) ── */
  const [localDragOver, setLocalDragOver] = useState(false);
  const dragOverSlot = dragOver || localDragOver;

  useEffect(() => {
    const el = nodeRef.current?.querySelector?.("[data-drop-target]");
    if (!el) return;
    const onOver = (e) => { e.preventDefault(); setLocalDragOver(true); };
    const onEnter = (e) => { e.preventDefault(); setLocalDragOver(true); };
    const onLeave = () => setLocalDragOver(false);
    el.addEventListener("dragover", onOver, false);
    el.addEventListener("dragenter", onEnter, false);
    el.addEventListener("dragleave", onLeave, false);
    const onGlobalEnd = () => setLocalDragOver(false);
    document.addEventListener("dragend", onGlobalEnd, false);
    return () => {
      el.removeEventListener("dragover", onOver);
      el.removeEventListener("dragenter", onEnter);
      el.removeEventListener("dragleave", onLeave);
      document.removeEventListener("dragend", onGlobalEnd);
    };
  }, []);

  return (
    <motion.div
      style={{
        position: "absolute",
        left: pos.left, top: pos.top,
        zIndex: 10,
      }}
      animate={occupied && !dragOverSlot && !isDragging ? { y: [0, -5, 0] } : undefined}
      transition={occupied && !dragOverSlot && !isDragging
        ? { duration: 4 + slotIndex * 0.7, repeat: Infinity, ease: "easeInOut", delay: slotIndex * 0.5 }
        : undefined}
    >
      <div style={{ transform: "translateX(-50%)" }}>
        <div
          ref={nodeRef}
          draggable={!!occupied}
          onDragStart={occupied ? (e) => {
            e.dataTransfer.setData("text/plain", goal.id);
            e.dataTransfer.effectAllowed = "move";
            onDragStart(e, goal.id);
          } : undefined}
          onDragEnd={occupied ? onDragEnd : undefined}
          onMouseEnter={() => { if (occupied) onHover(slotIndex); }}
          onMouseLeave={() => onLeave()}
          style={{
            width: ns, height: ns + 30,
            display: "flex", flexDirection: "column", alignItems: "center", gap: 5,
            cursor: occupied ? "grab" : "default",
            position: "relative", userSelect: "none",
          }}
        >
          {/* glow aura */}
          <div style={{
            position: "absolute", top: -8, left: -8, width: ns + 16, height: ns + 16,
            borderRadius: "50%",
            background: dragOverSlot
              ? `radial-gradient(circle, color-mix(in srgb, ${theme.primary} 30%, transparent) 0%, transparent 70%)`
              : occupied
                ? `radial-gradient(circle, color-mix(in srgb, ${theme.primary} 10%, transparent) 0%, transparent 70%)`
                : "transparent",
            transition: "all 0.3s", pointerEvents: "none",
          }} />

          {/* node circle */}
          <div
            data-drop-target
            onDrop={(e) => {
              e.preventDefault();
              setLocalDragOver(false);
              onDrop(slotIndex);
            }}
            style={{
              width: ns, height: ns, borderRadius: "50%",
              background: occupied
                ? `radial-gradient(circle at 35% 30%, color-mix(in srgb, ${theme.primary} 20%, transparent), var(--color-card) 80%)`
                : "transparent",
              border: occupied
                ? `1.5px solid color-mix(in srgb, ${theme.primary} 35%, transparent)`
                : `1.5px solid color-mix(in srgb, var(--color-border) 60%, transparent)`,
              display: "flex", alignItems: "center", justifyContent: "center",
              position: "relative",
              boxShadow: dragOverSlot
                ? `0 0 40px color-mix(in srgb, ${theme.primary} 35%, transparent), inset 0 0 20px color-mix(in srgb, ${theme.primary} 15%, transparent)`
                : occupied
                  ? "0 0 20px color-mix(in srgb, var(--color-border) 20%, transparent)"
                  : "none",
              transition: "border-color 0.3s, box-shadow 0.3s",
            }}
          >
            {occupied ? (
              <>
                <svg width={ns} height={ns} style={{ position: "absolute", transform: "rotate(-90deg)" }}>
                  <circle cx={ns / 2} cy={ns / 2} r={18} stroke="var(--color-border)" strokeWidth="3" fill="none" />
                  <circle cx={ns / 2} cy={ns / 2} r={18}
                    stroke={theme.primary} strokeWidth="3" fill="none" strokeLinecap="round"
                    strokeDasharray={`${EQUIP_RING}`} strokeDashoffset={offset}
                    style={{ transition: "stroke-dashoffset 0.6s" }} />
                </svg>
                <div style={{
                  width: ns - 20, height: ns - 20, borderRadius: "50%",
                  background: "var(--color-card)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  zIndex: 1,
                }}>
                  {Icon && <Icon size={22} color={theme.primary} />}
                </div>
                {pct >= 100 && (
                  <motion.div style={{
                    position: "absolute", inset: -4, borderRadius: "50%",
                    border: "2px solid rgba(5,150,105,0.3)", pointerEvents: "none",
                  }}
                    animate={{ scale: [1, 1.08, 1], opacity: [0.6, 0.2, 0.6] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }} />
                )}
              </>
            ) : (
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center", gap: 2,
                opacity: dragOverSlot ? 0.8 : 0.35,
              }}>
                <svg width={36} height={36} viewBox="0 0 36 36" style={{ opacity: dragOverSlot ? 0.9 : 0.5 }}>
                  <circle cx={18} cy={18} r={16} fill="none"
                    stroke={dragOverSlot ? theme.primary : "var(--color-border)"}
                    strokeWidth="1" strokeDasharray="3 3" />
                  <circle cx={18} cy={18} r={10} fill="none"
                    stroke={dragOverSlot ? theme.primary : "var(--color-border)"}
                    strokeWidth="0.8" strokeDasharray="2 3" />
                  <line x1={18} y1={2} x2={18} y2={8}
                    stroke={dragOverSlot ? theme.primary : "var(--color-border)"} strokeWidth="0.8" />
                  <line x1={18} y1={28} x2={18} y2={34}
                    stroke={dragOverSlot ? theme.primary : "var(--color-border)"} strokeWidth="0.8" />
                </svg>
                <motion.span
                  style={{
                    fontSize: 8, fontWeight: 600, letterSpacing: "0.1em",
                    color: dragOverSlot ? theme.primary : "var(--color-muted)",
                    textTransform: "uppercase",
                  }}
                  animate={dragOverSlot ? { opacity: [0.5, 1, 0.5] } : undefined}
                  transition={dragOverSlot ? { duration: 1, repeat: Infinity } : undefined}>
                  {dragOverSlot ? "equip" : "bind"}
                </motion.span>
              </div>
            )}
          </div>

          {/* label below */}
          {occupied && (
            <div style={{
              textAlign: "center", width: 100,
              pointerEvents: "none",
            }}>
              <span style={{
                fontSize: 11, fontWeight: 700, color: "var(--color-dark)",
                display: "block", lineHeight: 1.15,
                overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
              }}>
                {goal.title}
              </span>
            </div>
          )}
        </div>
      </div>

    </motion.div>
  );
}

/* ─── Constellation Lines ─────── */
function ConstellationLines({ hoveredSlot }) {
  const lines = [
    { x1: "50", y1: "34", x2: "22", y2: "62" },
    { x1: "50", y1: "34", x2: "50", y2: "62" },
    { x1: "50", y1: "34", x2: "78", y2: "62" },
    { x1: "22", y1: "62", x2: "50", y2: "62" },
    { x1: "50", y1: "62", x2: "78", y2: "62" },
  ];
  const hlSet = hoveredSlot !== null ? { 0: [0], 1: [1], 2: [2] }[hoveredSlot] || [] : [];

  return (
    <svg viewBox="0 0 100 100" style={{
      position: "absolute", inset: 0, width: "100%", height: "100%",
      pointerEvents: "none", zIndex: 2,
    }}>
      {lines.map((l, i) => {
        const hl = hlSet.includes(i);
        return (
          <line key={i}
            x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
            stroke={hl ? theme.primary : "var(--color-border)"}
            strokeWidth={hl ? "0.6" : "0.3"}
            strokeOpacity={hl ? 0.6 : 0.25}
            strokeLinecap="round"
            strokeDasharray={hl ? "none" : "3 4"}
            style={{ transition: "stroke 0.3s, stroke-width 0.3s, stroke-opacity 0.3s" }} />
        );
      })}
      {NODE_POS.map((d, i) => (
        <circle key={`dot-${i}`} cx={d.left.replace("%", "")} cy={d.top.replace("%", "")} r="0.5"
          fill={hoveredSlot === i ? theme.primary : "var(--color-border)"}
          opacity={hoveredSlot === i ? 0.8 : 0.3}
          style={{ transition: "fill 0.3s, opacity 0.3s" }} />
      ))}
    </svg>
  );
}

/* ─── Archive Relic Card ─────── */
function ArchiveRelicCard({ goal, dragging, onDragStart, onDragEnd, t }) {
  const pct = goal.target > 0 ? Math.min(Math.round((goal.current_progress / goal.target) * 100), 100) : 0;
  const offset = ARCHIVE_RING * (1 - pct / 100);
  const status = getStatus(t, goal.current_progress, goal.target);
  const Icon = resolveIcon(goal.icon);

  return (
    <motion.div
      draggable
      onDragStart={(e) => {
        e.dataTransfer.setData("text/plain", goal.id);
        e.dataTransfer.effectAllowed = "move";
        onDragStart(e, goal.id);
      }}
      onDragEnd={onDragEnd}
      style={{
        background: "var(--color-card)", borderRadius: 10,
        border: "1px solid var(--color-border)",
        padding: "12px 14px", display: "flex", alignItems: "center", gap: 10,
        cursor: "grab", opacity: dragging ? 0.35 : 1,
        position: "relative", userSelect: "none",
      }}
      whileHover={!dragging ? {
        scale: 1.02, borderColor: theme.primary,
        boxShadow: `0 4px 16px color-mix(in srgb, ${theme.primary} 12%, transparent)`,
        transition: { type: "spring", stiffness: 400, damping: 20 },
      } : undefined}
    >
      <div style={{ position: "relative", width: 34, height: 34, flexShrink: 0 }}>
        <svg width={34} height={34} style={{ transform: "rotate(-90deg)", position: "absolute" }}>
          <circle cx={17} cy={17} r={11} stroke="var(--color-border)" strokeWidth="2.5" fill="none" />
          <circle cx={17} cy={17} r={11} stroke={theme.primary} strokeWidth="2.5" fill="none" strokeLinecap="round"
            strokeDasharray={`${ARCHIVE_RING}`} strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.6s" }} />
        </svg>
        <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={13} color={theme.primary} />
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <span style={{
          fontSize: 13, fontWeight: 600, color: "var(--color-dark)",
          display: "block", lineHeight: 1.2,
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>{goal.title}</span>
        <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 3 }}>
          <span style={{
            fontSize: 10, fontWeight: 600, padding: "1px 6px", borderRadius: 4,
            background: `color-mix(in srgb, ${status.color} 12%, transparent)`,
            color: status.color,
          }}>{status.label}</span>
          <span style={{ fontSize: 10, fontWeight: 600, color: "var(--color-muted)" }}>
            {goal.current_progress}/{goal.target}
          </span>
        </div>
      </div>
      <span style={{ fontSize: 9, color: "var(--color-muted)", opacity: 0.35, flexShrink: 0 }}>⠿</span>
    </motion.div>
  );
}

/* ─── Detail Hover Panel ─────── */
function DetailHoverPanel({ goal, style }) {
  if (!goal) return null;
  const pct = goal.target > 0 ? Math.min(Math.round((goal.current_progress / goal.target) * 100), 100) : 0;
  const flavors = [
    "The relic resonates with your discipline.",
    "Each step etches deeper attunement.",
    "Your consistency shapes the relic's form.",
    "The constellation recognizes your dedication.",
  ];
  const flavor = flavors[goal.id ? goal.id.toString().charCodeAt(0) % flavors.length : 0];
  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.92 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 4, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 500, damping: 28 }}
      style={{
        position: "absolute", zIndex: 50, pointerEvents: "none",
        background: "var(--color-card)", borderRadius: 10,
        padding: "10px 13px", minWidth: 155, maxWidth: 200,
        boxShadow: "0 8px 32px rgba(0,0,0,0.12), 0 0 0 1px rgba(139,92,246,0.08)",
        ...style,
      }}>
      <div style={{ fontSize: 12, fontWeight: 700, color: "var(--color-dark)", marginBottom: 2 }}>{goal.title}</div>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        <div style={{ flex: 1, height: 3, borderRadius: 2, background: "var(--color-border)", overflow: "hidden" }}>
          <div style={{
            width: `${pct}%`, height: "100%",
            background: `linear-gradient(90deg, ${theme.primary}, color-mix(in srgb, ${theme.primary} 70%, #fff))`,
            borderRadius: 2, transition: "width 0.4s",
          }} />
        </div>
        <span style={{ fontSize: 9, fontWeight: 700, color: theme.primary, whiteSpace: "nowrap" }}>{pct}%</span>
      </div>
      <div style={{ fontSize: 9, color: "var(--color-muted)" }}>{goal.current_progress} / {goal.target}</div>
      <div style={{
        marginTop: 5, paddingTop: 5, borderTop: "1px solid var(--color-border)",
        fontSize: 9, color: "var(--color-muted)", fontStyle: "italic", lineHeight: 1.3,
      }}>
        {flavor}
      </div>
    </motion.div>
  );
}

/* ─── Main ─────── */
export default function RelicManagerModal({ open, onClose, relics, mode, onEquip, onUnequip }) {
  const { t } = useTranslation();

  const [draggedId, setDraggedId] = useState(null);
  const [dragOverSlot, setDragOverSlot] = useState(null);
  const [dropOverArchive, setDropOverArchive] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [hoveredSlot, setHoveredSlot] = useState(null);
  const [sortBy, setSortBy] = useState("name");
  const [query, setQuery] = useState("");
  const animTimer = useRef(null);
  const idRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    if (open) {
      setDraggedId(null); setDragOverSlot(null);
      setDropOverArchive(false); setAnimating(false);
      setHoveredSlot(null); setSortBy("name"); setQuery("");
      idRef.current = null;
    }
  }, [open]);

  useEffect(() => {
    if (open && searchRef.current) setTimeout(() => searchRef.current?.focus(), 350);
  }, [open]);

  useEffect(() => {
    return () => { if (animTimer.current) clearTimeout(animTimer.current); };
  }, []);

  const equipped = useMemo(
    () => relics.filter((g) => g.is_equipped).sort((a, b) => (a.equipped_order ?? 99) - (b.equipped_order ?? 99)),
    [relics],
  );

  const unequipped = useMemo(() => relics.filter((g) => !g.is_equipped), [relics]);

  const filtered = useMemo(() => {
    let r = unequipped;
    if (query.trim()) { const q = query.toLowerCase(); r = r.filter((g) => g.title.toLowerCase().includes(q)); }
    r = [...r].sort((a, b) => {
      if (sortBy === "name") return a.title.localeCompare(b.title);
      if (sortBy === "progress") {
        const pa = a.target > 0 ? a.current_progress / a.target : 0;
        const pb = b.target > 0 ? b.current_progress / b.target : 0;
        return pb - pa;
      }
      return (a.created_at || "").localeCompare(b.created_at || "");
    });
    return r;
  }, [unequipped, sortBy, query]);

  const isDraggingEquipped = draggedId && equipped.some((g) => g.id === draggedId);

  const handleDragStart = useCallback((e, id) => {
    idRef.current = id;
    setDraggedId(id);
  }, []);

  const handleDragEnd = useCallback(() => {
    idRef.current = null; setDraggedId(null); setDragOverSlot(null); setDropOverArchive(false);
  }, []);

  const handleSlotDrop = useCallback(async (slotIndex) => {
    const id = idRef.current;
    if (!id) return;
    idRef.current = null; setDraggedId(null); setDragOverSlot(null);
    setAnimating(true);
    animTimer.current = setTimeout(async () => {
      try { await onEquip(id, slotIndex); } catch {}
      setAnimating(false);
    }, 350);
  }, [onEquip]);

  const handleArchiveDrop = useCallback(async (e) => {
    e.preventDefault();
    const id = idRef.current;
    if (!id || !equipped.some((g) => g.id === id)) {
      idRef.current = null; setDraggedId(null); setDropOverArchive(false);
      return;
    }
    idRef.current = null; setDropOverArchive(false); setDraggedId(null);
    setAnimating(true);
    animTimer.current = setTimeout(async () => {
      try { await onUnequip(id); } catch {}
      setAnimating(false);
    }, 350);
  }, [onUnequip, equipped]);

  if (!open) return null;

  const equippedCount = equipped.length;
  const hoveredGoal = hoveredSlot !== null && hoveredSlot < equipped.length ? equipped[hoveredSlot] : null;

  return (
    <div
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.6)",
        backdropFilter: "blur(10px)",
        zIndex: theme.z.modalOverlay,
        display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={onClose}
    >
      <style>{`
        @keyframes rcRipple { 0% { box-shadow: 0 0 0 0 rgba(139,92,246,0.4); } 100% { box-shadow: 0 0 0 30px rgba(139,92,246,0); } }
        .rc-scroll { scrollbar-width: thin; scrollbar-color: var(--color-border) transparent; }
        .rc-scroll::-webkit-scrollbar { width: 4px; }
        .rc-scroll::-webkit-scrollbar-track { background: transparent; }
        .rc-scroll::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 2px; }
      `}</style>

      <motion.div
        key="rc-modal"
        data-tutorial-target="relic-manager-modal"
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        role="dialog" aria-modal="true"
        style={{
          width: 880, maxWidth: "94vw", height: "82vh", maxHeight: "90vh",
          borderRadius: 20,
          background: "var(--color-card)",
          boxShadow: "0 32px 100px rgba(0,0,0,0.25), 0 0 0 1px rgba(139,92,246,0.06)",
          display: "flex", overflow: "hidden", position: "relative",
        }}
      >
        {/* ambient bg */}
        <div style={{
          position: "absolute", inset: 0,
          background: `radial-gradient(ellipse at 65% 50%, color-mix(in srgb, ${theme.primary} 4%, transparent) 0%, transparent 60%), radial-gradient(ellipse at 30% 80%, rgba(59,130,246,0.03) 0%, transparent 50%)`,
          pointerEvents: "none", zIndex: 0,
        }} />

        <ParticleField />

        {/* ═══ LEFT: ARCHIVE STREAM ═══ */}
        <div data-tutorial-target="relic-archive" style={{
          width: 320, minWidth: 320,
          display: "flex", flexDirection: "column",
          borderRight: "1px solid var(--color-border)",
          zIndex: 3, position: "relative",
        }}>
          <div style={{ padding: "18px 16px 10px", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <h2 style={{
                    fontSize: 15, fontWeight: 700, color: "var(--color-dark)",
                    margin: 0,
                  }}>
                    Archive
                  </h2>
                </div>
                <p style={{ fontSize: 12, color: "var(--color-muted)", margin: "2px 0 0" }}>
                  {unequipped.length} relics in vault
                </p>
              </div>
              <button onClick={onClose} style={{
                width: 26, height: 26, borderRadius: 7,
                border: "none", cursor: "pointer",
                background: "var(--color-input)", color: "var(--color-muted)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 12, flexShrink: 0,
              }}>
                ✕
              </button>
            </div>
          </div>

          {/* search */}
          {unequipped.length > 0 && (
            <div style={{ padding: "0 12px 8px", flexShrink: 0 }}>
              <div style={{ position: "relative" }}>
                <input ref={searchRef} type="text" value={query}
                  onChange={(e) => setQuery(e.target.value)} placeholder="Search relics..."
                  style={{
                    width: "100%", padding: "8px 10px 8px 30px", fontSize: 13,
                    borderRadius: 8, border: "1px solid var(--color-border)",
                    background: "var(--color-input)", color: "var(--color-dark)",
                    outline: "none", fontFamily: "inherit", boxSizing: "border-box",
                  }} />
                <span style={{
                  position: "absolute", left: 10, top: "50%", transform: "translateY(-50%)",
                  fontSize: 12, color: "var(--color-muted)", pointerEvents: "none",
                }}>
                  &#x1F50D;
                </span>
              </div>
            </div>
          )}

          {/* sort */}
          {unequipped.length > 0 && (
            <div data-tutorial-target="relic-archive-order" style={{ display: "flex", alignItems: "center", gap: 6, padding: "0 12px 8px", flexShrink: 0 }}>
              <span style={{ fontSize: 11, color: "var(--color-muted)", fontWeight: 500, whiteSpace: "nowrap" }}>
                Order by:
              </span>
              {["name", "progress", "creation"].map((key) => {
                const active = sortBy === key;
                return (
                  <button key={key} onClick={() => setSortBy(key)} style={{
                    padding: "4px 10px", borderRadius: 5,
                    border: active ? `1px solid ${theme.primary}` : "1px solid var(--color-border)",
                    background: active ? `color-mix(in srgb, ${theme.primary} 10%, transparent)` : "transparent",
                    color: active ? theme.primary : "var(--color-muted)",
                    fontSize: 11, fontWeight: active ? 700 : 500,
                    cursor: "pointer", fontFamily: "inherit",
                    transition: "all 0.12s",
                  }}>
                    {key === "creation" ? "Created" : key.charAt(0).toUpperCase() + key.slice(1)}
                  </button>
                );
              })}
            </div>
          )}

          {/* cards */}
          <div style={{ flex: 1, minHeight: 0, position: "relative", padding: "0 10px" }}>
            {unequipped.length === 0 ? (
              <div style={{
                display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                gap: 8, height: "100%", textAlign: "center", padding: "0 12px",
              }}>
                <div style={{
                  width: 36, height: 36, borderRadius: "50%",
                  background: "var(--color-border)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: 14, color: "var(--color-muted)",
                }}>
                  ⚗
                </div>
                <p style={{ fontSize: 11, color: "var(--color-muted)", margin: 0, lineHeight: 1.4 }}>
                  {t("home.relicManager.noRelicsInventory")}
                </p>
              </div>
            ) : (
              <div className="rc-scroll" style={{
                position: "absolute", inset: 0, overflowY: "auto",
                padding: "2px 2px 10px 0",
                display: "flex", flexDirection: "column", gap: 6,
              }}>
                {filtered.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "20px 0", fontSize: 11, color: "var(--color-muted)" }}>
                    No relics match filter
                  </div>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {filtered.map((goal) => (
                      <motion.div key={goal.id} layout
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -12 }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        style={{ padding: "0 12px" }}>
                        <ArchiveRelicCard goal={goal} dragging={draggedId === goal.id}
                          onDragStart={handleDragStart} onDragEnd={handleDragEnd} t={t} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            )}
          </div>

          {/* unequip drop zone */}
          <div
            onDragEnter={() => isDraggingEquipped && setDropOverArchive(true)}
            onDragLeave={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              const { clientX: x, clientY: y } = e;
              if (x <= r.left || x >= r.right || y <= r.top || y >= r.bottom) setDropOverArchive(false);
            }}
            onDragOver={(e) => { if (isDraggingEquipped) e.preventDefault(); }}
            onDrop={handleArchiveDrop}
            style={{ flexShrink: 0, padding: "8px 12px 12px", transition: "all 0.3s" }}
          >
            {isDraggingEquipped ? (
              <div style={{
                borderRadius: 10,
                border: dropOverArchive ? `1.5px solid ${theme.primary}` : "1.5px dashed var(--color-border)",
                background: dropOverArchive ? `color-mix(in srgb, ${theme.primary} 10%, transparent)` : "transparent",
                padding: "14px 8px", textAlign: "center", transition: "all 0.2s",
              }}>
                <motion.span style={{
                  fontSize: 10, color: dropOverArchive ? theme.primary : "var(--color-muted)", fontWeight: 600,
                }}
                  animate={dropOverArchive ? { opacity: [0.6, 1, 0.6] } : undefined}
                  transition={dropOverArchive ? { duration: 1.2, repeat: Infinity } : undefined}>
                  {dropOverArchive ? "Release to unequip" : "Drag equipped relics here to unequip"}
                </motion.span>
              </div>
            ) : (
              <div style={{
                textAlign: "center", fontSize: 9, color: "var(--color-muted)", opacity: 0.5,
                padding: "4px 0", borderTop: "1px solid var(--color-border)",
              }}>
                Drag to constellation nodes to equip
              </div>
            )}
          </div>
        </div>

        {/* ═══ RIGHT: CONSTELLATION CORE ═══ */}
        <div style={{
          flex: 1, position: "relative", zIndex: 3, overflow: "hidden",
          display: "flex", flexDirection: "column",
        }}>
          {/* top bar */}
          <div style={{
            position: "absolute", top: 0, left: 0, right: 0,
            padding: "16px 20px 0", display: "flex",
            alignItems: "center", justifyContent: "space-between", zIndex: 20,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span style={{
                fontSize: 10, fontWeight: 700, color: "var(--color-muted)",
                letterSpacing: "0.08em", textTransform: "uppercase",
              }}>
                Constellation
              </span>
              <span style={{ fontSize: 8, fontWeight: 600, color: "var(--color-muted)", opacity: 0.6 }}>
                {mode === "change" ? "Loadout" : "Forge"}
              </span>
            </div>
            {equippedCount > 0 && (
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                onClick={async () => { for (const g of equipped) { try { await onUnequip(g.id); } catch {} } }}
                style={{
                  background: "transparent", border: "none",
                  color: "var(--color-muted)", fontSize: 9, fontWeight: 600,
                  cursor: "pointer", fontFamily: "inherit", letterSpacing: "0.04em",
                  padding: "3px 8px", borderRadius: 6,
                  display: "flex", alignItems: "center", gap: 4,
                }}>
                <span style={{ fontSize: 10 }}>⟳</span>
                Reset
              </motion.button>
            )}
          </div>

          {/* constellation canvas — fills available space */}
          <div style={{ flex: 1, position: "relative", width: "100%" }}>
            <ConstellationLines hoveredSlot={hoveredSlot} />

            {/* Core at top */}
            <div style={{
              position: "absolute", top: "34%", left: "50%",
              transform: "translate(-50%,-50%)", zIndex: 5,
              display: "flex", flexDirection: "column", alignItems: "center", gap: 12,
            }}>
              <EnergyCore equippedCount={equippedCount} isDragging={!!draggedId} />
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: "var(--color-dark)" }}>
                  {equipped[0]?.title || "Constellation Core"}
                </div>

              </div>
            </div>

            {/* 3 orbital nodes at bottom */}
            {Array.from({ length: 3 }).map((_, i) => {
              const goal = i < equipped.length ? equipped[i] : null;
              return (
                <OrbitalNode key={goal?.id || `empty-${i}`}
                  slotIndex={i} goal={goal}
                  dragOver={dragOverSlot === i}
                  isDragging={isDraggingEquipped}
                  onDrop={handleSlotDrop}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onHover={setHoveredSlot}
                  onLeave={() => setHoveredSlot(null)}
                  t={t} />
              );
            })}

            {/* decorative stars */}
            {[
              { x: "15%", y: "40%", s: 2, d: 0 },
              { x: "85%", y: "38%", s: 1.5, d: 1 },
              { x: "10%", y: "56%", s: 2.5, d: 2 },
              { x: "90%", y: "54%", s: 1.8, d: 0.5 },
              { x: "45%", y: "28%", s: 1.2, d: 1.5 },
              { x: "55%", y: "70%", s: 2, d: 3 },
              { x: "78%", y: "44%", s: 1.5, d: 2.5 },
              { x: "22%", y: "48%", s: 1.8, d: 0.8 },
            ].map((s, i) => (
              <motion.div key={`ds-${i}`} style={{
                position: "absolute", left: s.x, top: s.y,
                width: s.s, height: s.s, borderRadius: "50%",
                background: "var(--color-muted)", opacity: 0.2, pointerEvents: "none",
              }}
                animate={{ opacity: [0.1, 0.3, 0.1] }}
                transition={{ duration: 3 + s.d, repeat: Infinity, delay: s.d, ease: "easeInOut" }} />
            ))}

            {/* detail hover panel – below the hovered node */}
            <AnimatePresence>
              {hoveredGoal && hoveredSlot !== null && (
                <DetailHoverPanel
                  goal={hoveredGoal}
                  style={hoveredSlot === 2 ? {
                    right: "5%",
                    bottom: "6%",
                    maxWidth: 170,
                    zIndex: 60,
                    maxHeight: "28%",
                    overflow: "auto",
                  } : {
                    left: NODE_POS[hoveredSlot].left,
                    bottom: "6%",
                    transform: "translateX(-50%)",
                    maxWidth: 170,
                    zIndex: 60,
                    maxHeight: "28%",
                    overflow: "auto",
                  }}
                />
              )}
            </AnimatePresence>
          </div>
        </div>
        </motion.div>
    </div>
  );
}
