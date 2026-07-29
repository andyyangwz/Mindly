import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslation } from "react-i18next";
import { resolveIcon } from "./IconPicker";
import "../../../styles/dashboard/index.css"

const EQUIP_RING = 2 * Math.PI * 18;
const ARCHIVE_RING = 2 * Math.PI * 11;

const NODE_POS = [
  { left: "22%", top: "62%" },
  { left: "50%", top: "62%" },
  { left: "78%", top: "62%" },
];

function getStatus(t, cur, tar) {
  if (tar === 0) return { label: t("dashboard.progressTracker.status.noTarget"), color: "var(--color-muted)", bg: "" };
  if (cur > tar) return { label: t("dashboard.progressTracker.status.onFire"), color: "#DC2626", bg: "" };
  if (cur === tar) return { label: t("dashboard.progressTracker.status.achieved"), color: "#059669", bg: "" };
  if (cur / tar >= 0.8) return { label: t("dashboard.progressTracker.status.almostDone"), color: "#D97706", bg: "" };
  return { label: t("dashboard.progressTracker.status.inProgress"), color: "var(--color-muted)", bg: "" };
}

function ParticleField() {
  const p = useMemo(() => Array.from({ length: 18 }, (_, i) => ({
    id: i, x: Math.random() * 100, y: Math.random() * 100,
    s: 1.5 + Math.random() * 2.5, d: 6 + Math.random() * 8, delay: Math.random() * 5,
    a: 0.1 + Math.random() * 0.25,
  })), []);
  return (
    <div className="rc-particle-field">
      {p.map((p) => (
        <motion.div key={p.id} style={{
          position: "absolute", left: `${p.x}%`, top: `${p.y}%`,
          width: p.s, height: p.s, borderRadius: "50%",
          background: "var(--color-primary)", opacity: p.a,
        }}
          animate={{ y: [0, -20, 0], opacity: [p.a, p.a * 0.3, p.a] }}
          transition={{ duration: p.d, repeat: Infinity, delay: p.delay, ease: "easeInOut" }} />
      ))}
    </div>
  );
}

function EnergyCore({ equippedCount, isDragging }) {
  const sz = 72;
  const colors = ["#8B5CF6", "#A78BFA", "#C4B5FD"];
  return (
    <div className="rc-energy-core-wrap">
      {[1, 2, 3].map((i) => (
        <motion.div key={i} className="rc-energy-core-ring" style={{
          width: sz + i * 28, height: sz + i * 28,
          borderColor: `${colors[i % 3]}40`,
        }}
          animate={{ scale: [1, 1.06, 1], opacity: [0.3, 0.15, 0.3], rotate: [0, 8, 0] }}
          transition={{ duration: 3 + i * 0.6, repeat: Infinity, ease: "easeInOut", delay: i * 0.4 }} />
      ))}
      <motion.div className="rc-energy-core" style={{
        width: sz, height: sz,
        background: `radial-gradient(circle at 40% 35%, rgba(196,181,253,0.5), var(--color-primary) 50%, rgba(139,92,246,0.1))`,
        boxShadow: `0 0 ${40 + equippedCount * 12}px color-mix(in srgb, var(--color-primary) ${40 + equippedCount * 15}%, transparent)`,
      }}
        animate={{ scale: isDragging ? [1, 1.08, 1] : [1, 1.04, 1] }}
        transition={{ duration: isDragging ? 1.2 : 3, repeat: Infinity, ease: "easeInOut" }}>
        <span className="rc-energy-core-star">✦</span>
      </motion.div>
      <div className="rc-energy-badge" style={{ background: "var(--color-primary)" }}>
        {equippedCount}
      </div>
    </div>
  );
}

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
      className="rc-orbit-node"
      style={{ left: pos.left, top: pos.top }}
      animate={occupied && !dragOverSlot && !isDragging ? { y: [0, -5, 0] } : undefined}
      transition={occupied && !dragOverSlot && !isDragging
        ? { duration: 4 + slotIndex * 0.7, repeat: Infinity, ease: "easeInOut", delay: slotIndex * 0.5 }
        : undefined}
    >
      <div className="rc-orbit-outer">
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
          className={`rc-orbit-body ${occupied ? "rc-orbit-body-occupied" : ""}`}
          style={{ width: ns, height: ns + 30 }}
        >
          <div className="rc-orbit-aura" style={{
            width: ns + 16, height: ns + 16,
            background: dragOverSlot
              ? `radial-gradient(circle, color-mix(in srgb, var(--color-primary) 30%, transparent) 0%, transparent 70%)`
              : occupied
                ? `radial-gradient(circle, color-mix(in srgb, var(--color-primary) 10%, transparent) 0%, transparent 70%)`
                : "transparent",
          }} />

          <div
            data-drop-target
            onDrop={(e) => {
              e.preventDefault();
              setLocalDragOver(false);
              onDrop(slotIndex);
            }}
            className={`rc-orbit-circle ${occupied ? "rc-orbit-circle-occupied" : "rc-orbit-circle-empty"}`}
            style={{
              width: ns, height: ns,
              background: occupied
                ? `radial-gradient(circle at 35% 30%, color-mix(in srgb, var(--color-primary) 20%, transparent), var(--color-card) 80%)`
                : "transparent",
              boxShadow: dragOverSlot
                ? `0 0 40px color-mix(in srgb, var(--color-primary) 35%, transparent), inset 0 0 20px color-mix(in srgb, var(--color-primary) 15%, transparent)`
                : occupied
                  ? "0 0 20px color-mix(in srgb, var(--color-border) 20%, transparent)"
                  : "none",
            }}
          >
            {occupied ? (
              <>
                <svg width={ns} height={ns} style={{ position: "absolute", transform: "rotate(-90deg)" }}>
                  <circle cx={ns / 2} cy={ns / 2} r={18} stroke="var(--color-border)" strokeWidth="3" fill="none" />
                  <circle cx={ns / 2} cy={ns / 2} r={18}
                    stroke="var(--color-primary)" strokeWidth="3" fill="none" strokeLinecap="round"
                    strokeDasharray={`${EQUIP_RING}`} strokeDashoffset={offset}
                    style={{ transition: "stroke-dashoffset 0.6s" }} />
                </svg>
                <div className="rc-orbit-inner-circle" style={{ width: ns - 20, height: ns - 20 }}>
                  {Icon && <Icon size={22} color="var(--color-primary)" />}
                </div>
                {pct >= 100 && (
                  <motion.div className="rc-orbit-complete-ring"
                    animate={{ scale: [1, 1.08, 1], opacity: [0.6, 0.2, 0.6] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }} />
                )}
              </>
            ) : (
              <div className="rc-orbit-placeholder" style={{ opacity: dragOverSlot ? 0.8 : 0.35 }}>
                <svg width={36} height={36} viewBox="0 0 36 36" style={{ opacity: dragOverSlot ? 0.9 : 0.5 }}>
                  <circle cx={18} cy={18} r={16} fill="none"
                    stroke={dragOverSlot ? "var(--color-primary)" : "var(--color-border)"}
                    strokeWidth="1" strokeDasharray="3 3" />
                  <circle cx={18} cy={18} r={10} fill="none"
                    stroke={dragOverSlot ? "var(--color-primary)" : "var(--color-border)"}
                    strokeWidth="0.8" strokeDasharray="2 3" />
                  <line x1={18} y1={2} x2={18} y2={8}
                    stroke={dragOverSlot ? "var(--color-primary)" : "var(--color-border)"} strokeWidth="0.8" />
                  <line x1={18} y1={28} x2={18} y2={34}
                    stroke={dragOverSlot ? "var(--color-primary)" : "var(--color-border)"} strokeWidth="0.8" />
                </svg>
                <motion.span
                  className="rc-orbit-placeholder-text"
                  style={{ color: dragOverSlot ? "var(--color-primary)" : "var(--color-muted)" }}
                  animate={dragOverSlot ? { opacity: [0.5, 1, 0.5] } : undefined}
                  transition={dragOverSlot ? { duration: 1, repeat: Infinity } : undefined}>
                  {dragOverSlot ? "equip" : "bind"}
                </motion.span>
              </div>
            )}
          </div>

          {occupied && (
            <div className="rc-orbit-label">
              <span className="rc-orbit-label-text">{goal.title}</span>
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
}

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
    <svg className="rc-constellation-svg" viewBox="0 0 100 100">
      {lines.map((l, i) => {
        const hl = hlSet.includes(i);
        return (
          <line key={i}
            x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2}
            stroke={hl ? "var(--color-primary)" : "var(--color-border)"}
            strokeWidth={hl ? "0.6" : "0.3"}
            strokeOpacity={hl ? 0.6 : 0.25}
            strokeLinecap="round"
            strokeDasharray={hl ? "none" : "3 4"}
            style={{ transition: "stroke 0.3s, stroke-width 0.3s, stroke-opacity 0.3s" }} />
        );
      })}
      {NODE_POS.map((d, i) => (
        <circle key={`dot-${i}`} cx={d.left.replace("%", "")} cy={d.top.replace("%", "")} r="0.5"
          fill={hoveredSlot === i ? "var(--color-primary)" : "var(--color-border)"}
          opacity={hoveredSlot === i ? 0.8 : 0.3}
          style={{ transition: "fill 0.3s, opacity 0.3s" }} />
      ))}
    </svg>
  );
}

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
      className={`rc-archive-card ${dragging ? "rc-archive-card-dragging" : ""}`}
      whileHover={!dragging ? {
        scale: 1.02, borderColor: "var(--color-primary)",
        boxShadow: `0 4px 16px color-mix(in srgb, var(--color-primary) 12%, transparent)`,
        transition: { type: "spring", stiffness: 400, damping: 20 },
      } : undefined}
    >
      <div className="rc-archive-ring">
        <svg width={34} height={34} className="rc-archive-ring-svg">
          <circle cx={17} cy={17} r={11} stroke="var(--color-border)" strokeWidth="2.5" fill="none" />
          <circle cx={17} cy={17} r={11} stroke="var(--color-primary)" strokeWidth="2.5" fill="none" strokeLinecap="round"
            strokeDasharray={`${ARCHIVE_RING}`} strokeDashoffset={offset}
            style={{ transition: "stroke-dashoffset 0.6s" }} />
        </svg>
        <div className="rc-archive-ring-icon">
          <Icon size={13} color="var(--color-primary)" />
        </div>
      </div>
      <div className="rc-archive-info">
        <span className="rc-archive-title">{goal.title}</span>
        <div className="rc-archive-meta">
          <span className="rc-archive-status" style={{
            background: `color-mix(in srgb, ${status.color} 12%, transparent)`,
            color: status.color,
          }}>{status.label}</span>
          <span className="rc-archive-progress">{goal.current_progress}/{goal.target}</span>
        </div>
      </div>
      <span className="rc-archive-grip">⠿</span>
    </motion.div>
  );
}

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
      className="rc-hover-panel"
      style={style}>
      <div className="rc-hover-title">{goal.title}</div>
      <div className="rc-hover-bar-wrap">
        <div className="rc-hover-track">
          <div className="rc-hover-fill" style={{
            width: `${pct}%`,
            background: `linear-gradient(90deg, var(--color-primary), color-mix(in srgb, var(--color-primary) 70%, #fff))`,
          }} />
        </div>
        <span className="rc-hover-pct" style={{ color: "var(--color-primary)" }}>{pct}%</span>
      </div>
      <div className="rc-hover-progress">{goal.current_progress} / {goal.target}</div>
      <div className="rc-hover-flavor">{flavor}</div>
    </motion.div>
  );
}

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
    <div className="rc-overlay" style={{ zIndex: 900 }} onClick={onClose}>
      <motion.div
        key="rc-modal"
        data-tutorial-target="relic-manager-modal"
        initial={{ opacity: 0, y: 30, scale: 0.96 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
        onClick={(e) => e.stopPropagation()}
        role="dialog" aria-modal="true"
        className="rc-modal"
      >
        <div className="rc-ambient" style={{
          background: `radial-gradient(ellipse at 65% 50%, color-mix(in srgb, var(--color-primary) 4%, transparent) 0%, transparent 60%), radial-gradient(ellipse at 30% 80%, rgba(59,130,246,0.03) 0%, transparent 50%)`,
        }} />

        <ParticleField />

        <div data-tutorial-target="relic-archive" className="rc-left">
          <div className="rc-left-header">
            <div className="rc-left-header-row">
              <div>
                <div className="rc-left-header-left">
                  <h2 className="rc-left-title">Archive</h2>
                </div>
                <p className="rc-left-subtitle">{unequipped.length} relics in vault</p>
              </div>
              <button onClick={onClose} className="rc-close-btn">✕</button>
            </div>
          </div>

          {unequipped.length > 0 && (
            <div className="rc-search-wrap">
              <div className="rc-search-relative">
                <input ref={searchRef} type="text" value={query}
                  onChange={(e) => setQuery(e.target.value)} placeholder="Search relics..."
                  className="rc-search-input" />
                <span className="rc-search-icon">&#x1F50D;</span>
              </div>
            </div>
          )}

          {unequipped.length > 0 && (
            <div data-tutorial-target="relic-archive-order" className="rc-sort-row">
              <span className="rc-sort-label">Order by:</span>
              {["name", "progress", "creation"].map((key) => {
                const active = sortBy === key;
                return (
                  <button key={key} onClick={() => setSortBy(key)}
                    className={`rc-sort-btn ${active ? "rc-sort-btn-active" : "rc-sort-btn-inactive"}`}>
                    {key === "creation" ? "Created" : key.charAt(0).toUpperCase() + key.slice(1)}
                  </button>
                );
              })}
            </div>
          )}

          <div className="rc-cards-area">
            {unequipped.length === 0 ? (
              <div className="rc-empty-state">
                <div className="rc-empty-icon">⚗</div>
                <p className="rc-empty-text">{t("dashboard.relicManager.noRelicsInventory")}</p>
              </div>
            ) : (
              <div className="rc-scroll rc-scroll-area">
                {filtered.length === 0 ? (
                  <div className="rc-no-match">No relics match filter</div>
                ) : (
                  <AnimatePresence mode="popLayout">
                    {filtered.map((goal) => (
                      <motion.div key={goal.id} layout
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -12 }}
                        transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        className="rc-card-wrap">
                        <ArchiveRelicCard goal={goal} dragging={draggedId === goal.id}
                          onDragStart={handleDragStart} onDragEnd={handleDragEnd} t={t} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            )}
          </div>

          <div
            onDragEnter={() => isDraggingEquipped && setDropOverArchive(true)}
            onDragLeave={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              const { clientX: x, clientY: y } = e;
              if (x <= r.left || x >= r.right || y <= r.top || y >= r.bottom) setDropOverArchive(false);
            }}
            onDragOver={(e) => { if (isDraggingEquipped) e.preventDefault(); }}
            onDrop={handleArchiveDrop}
            className="rc-unequip-zone"
          >
            {isDraggingEquipped ? (
              <div className={`rc-unequip-drop ${dropOverArchive ? "rc-unequip-drop-active" : "rc-unequip-drop-inactive"}`}>
                <motion.span className={`rc-unequip-text ${dropOverArchive ? "rc-unequip-text-active" : "rc-unequip-text-inactive"}`}
                  animate={dropOverArchive ? { opacity: [0.6, 1, 0.6] } : undefined}
                  transition={dropOverArchive ? { duration: 1.2, repeat: Infinity } : undefined}>
                  {dropOverArchive ? "Release to unequip" : "Drag equipped relics here to unequip"}
                </motion.span>
              </div>
            ) : (
              <div className="rc-unequip-hint">Drag to constellation nodes to equip</div>
            )}
          </div>
        </div>

        <div className="rc-right">
          <div className="rc-top-bar">
            <div className="rc-top-left">
              <span className="rc-constellation-label">Constellation</span>
              <span className="rc-mode-label">{mode === "change" ? "Loadout" : "Forge"}</span>
            </div>
            {equippedCount > 0 && (
              <motion.button whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
                onClick={async () => { for (const g of equipped) { try { await onUnequip(g.id); } catch {} } }}
                className="rc-reset-btn">
                <span className="rc-reset-icon">⟳</span>
                Reset
              </motion.button>
            )}
          </div>

          <div className="rc-canvas">
            <ConstellationLines hoveredSlot={hoveredSlot} />

            <div className="rc-core-area">
              <EnergyCore equippedCount={equippedCount} isDragging={!!draggedId} />
              <div className="rc-core-title">{equipped[0]?.title || "Constellation Core"}</div>
            </div>

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
              <motion.div key={`ds-${i}`} className="rc-deco-star" style={{
                position: "absolute", left: s.x, top: s.y,
                width: s.s, height: s.s, background: "var(--color-muted)", opacity: 0.2,
              }}
                animate={{ opacity: [0.1, 0.3, 0.1] }}
                transition={{ duration: 3 + s.d, repeat: Infinity, delay: s.d, ease: "easeInOut" }} />
            ))}

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
