import { useState, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Plus, Minus, RotateCcw, ArrowUp, Zap } from "lucide-react";
import { resolveIcon } from "./IconPicker";

const circ = 2 * Math.PI * 22;

function RelicSelector({ relics, selectedId, onSelect, pendingOps }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, overflow: "hidden", flex: 1 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6, flexShrink: 0 }}>
        <div style={{ width: 6, height: 6, borderRadius: "50%", background: "#6C47FF", boxShadow: "0 0 6px rgba(108,71,255,0.3)" }} />
        <span style={{ fontSize: 11, fontWeight: 600, color: "rgba(154,148,184,0.6)", letterSpacing: "0.02em" }}>All Relics</span>
        <span style={{ fontSize: 9, color: "rgba(154,148,184,0.35)", fontWeight: 500 }}>{relics.length} total</span>
        {Object.keys(pendingOps).length > 0 && (
          <span style={{ fontSize: 9, color: "#6C47FF", fontWeight: 600, marginLeft: "auto" }}>
            {Object.keys(pendingOps).length} pending
          </span>
        )}
      </div>

      <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: 6 }}>
        {relics.map((goal) => {
          const isSelected = goal.id === selectedId;
          const pendingOp = pendingOps[goal.id];
          const Icon = resolveIcon(goal.icon);
          const pct = goal.target > 0 ? Math.min(Math.round((goal.current_progress / goal.target) * 100), 100) : 0;

          return (
            <motion.div
              key={goal.id}
              layout
              onClick={() => onSelect(goal.id)}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              style={{
                borderRadius: 12,
                border: isSelected ? "1.5px solid rgba(108,71,255,0.3)" : "1px solid rgba(255,255,255,0.04)",
                background: isSelected ? "rgba(108,71,255,0.06)" : "rgba(255,255,255,0.03)",
                padding: "10px 12px",
                display: "flex",
                alignItems: "center",
                gap: 10,
                cursor: "pointer",
                transition: "all 0.2s",
              }}
            >
              <div style={{ position: "relative", width: 32, height: 32, flexShrink: 0 }}>
                <svg width={32} height={32} style={{ transform: "rotate(-90deg)", position: "absolute" }}>
                  <circle cx={16} cy={16} r={12} stroke="rgba(255,255,255,0.04)" strokeWidth="3" fill="none" />
                  <circle cx={16} cy={16} r={12} stroke="#6C47FF" strokeWidth="3" fill="none" strokeLinecap="round"
                    strokeDasharray={`${2 * Math.PI * 12}`} strokeDashoffset={2 * Math.PI * 12 * (1 - pct / 100)}
                    style={{ transition: "stroke-dashoffset 0.6s" }} />
                </svg>
                <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Icon size={11} color={goal.is_equipped ? "#6C47FF" : "rgba(154,148,184,0.35)"} />
                </div>
              </div>

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: "rgba(232,230,240,0.85)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {goal.title}
                  </span>
                  {goal.is_equipped && (
                    <span style={{ fontSize: 8, fontWeight: 600, padding: "1px 5px", borderRadius: 4, background: "rgba(108,71,255,0.1)", color: "rgba(108,71,255,0.6)", whiteSpace: "nowrap", flexShrink: 0 }}>
                      Equipped
                    </span>
                  )}
                  {pendingOp && (
                    <span style={{ fontSize: 8, fontWeight: 600, padding: "1px 5px", borderRadius: 4, background: pendingOp.type === "reset" ? "rgba(239,68,68,0.1)" : "rgba(108,71,255,0.1)", color: pendingOp.type === "reset" ? "#EF4444" : "#6C47FF", whiteSpace: "nowrap", flexShrink: 0 }}>
                      {pendingOp.type === "reset" ? "Reset" : `+${pendingOp.value}`}
                    </span>
                  )}
                </div>
                <div style={{ fontSize: 10, color: "rgba(154,148,184,0.35)", marginTop: 1 }}>
                  {goal.current_progress}/{goal.target}
                </div>
              </div>
            </motion.div>
          );
        })}
        {relics.length === 0 && (
          <div style={{ textAlign: "center", padding: "24px 0", fontSize: 11, color: "rgba(154,148,184,0.35)" }}>
            No relics yet
          </div>
        )}
      </div>
    </div>
  );
}

function UpgradePanel({ relic, inputValue, onInputChange, onReset, pendingOp }) {
  const Icon = resolveIcon(relic.icon);
  const pct = relic.target > 0
    ? Math.min(Math.round((relic.current_progress / relic.target) * 100), 100)
    : 0;
  const offset = circ * (1 - pct / 100);

  const newProgress = pendingOp
    ? pendingOp.type === "reset" ? 0 : Math.max(0, relic.current_progress + pendingOp.value)
    : relic.current_progress;

  const newPct = relic.target > 0
    ? Math.min(Math.round((newProgress / relic.target) * 100), 100)
    : 0;

  const hasChanges = pendingOp && (pendingOp.type === "reset" || pendingOp.value !== 0);

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      transition={{ duration: 0.25 }}
      style={{
        borderRadius: 14,
        background: "rgba(108,71,255,0.04)",
        border: "1px solid rgba(108,71,255,0.08)",
        padding: "16px",
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
        <div style={{ position: "relative", width: 56, height: 56, flexShrink: 0 }}>
          <svg width={56} height={56} style={{ transform: "rotate(-90deg)", position: "absolute" }}>
            <circle cx={28} cy={28} r={22} stroke="rgba(255,255,255,0.04)" strokeWidth="3.5" fill="none" />
            <circle cx={28} cy={28} r={22} stroke={hasChanges ? "#10B981" : "#6C47FF"} strokeWidth="3.5" fill="none" strokeLinecap="round"
              strokeDasharray={`${circ}`} strokeDashoffset={hasChanges ? circ * (1 - newPct / 100) : offset}
              style={{ transition: "stroke-dashoffset 0.6s, stroke 0.4s" }} />
          </svg>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Icon size={18} color={hasChanges ? "#10B981" : "#6C47FF"} />
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 13, fontWeight: 600, color: "rgba(232,230,240,0.85)", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {relic.title}
          </span>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginTop: 2 }}>
            <span style={{ fontSize: 12, fontWeight: 600, color: hasChanges ? "#10B981" : "rgba(232,230,240,0.85)" }}>
              {newProgress}
            </span>
            <span style={{ fontSize: 11, color: "rgba(154,148,184,0.35)" }}>/ {relic.target}</span>
            {hasChanges && (
              <span style={{ fontSize: 9, padding: "1px 6px", borderRadius: 4, background: "rgba(16,185,129,0.1)", color: "#10B981", fontWeight: 600 }}>
                {newPct}%
              </span>
            )}
          </div>
        </div>
      </div>

      <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
        <motion.button
          onClick={onReset}
          whileHover={{ scale: 1.03 }}
          whileTap={{ scale: 0.97 }}
          style={{
            padding: "10px 14px", borderRadius: 10,
            border: pendingOp?.type === "reset" ? "1.5px solid rgba(239,68,68,0.4)" : "1px solid rgba(255,255,255,0.04)",
            background: pendingOp?.type === "reset" ? "rgba(239,68,68,0.08)" : "rgba(255,255,255,0.03)",
            color: pendingOp?.type === "reset" ? "#EF4444" : "rgba(154,148,184,0.35)",
            cursor: "pointer", display: "flex", alignItems: "center", gap: 5,
            fontSize: 11, fontWeight: 600, whiteSpace: "nowrap", transition: "all 0.2s",
          }}
        >
          <RotateCcw size={12} />
          Reset
        </motion.button>

        <div style={{ display: "flex", alignItems: "center", gap: 0, flex: 1 }}>
          <button
            onClick={() => handleIncrement(-1)}
            style={{
              width: 34, height: 34,
              border: "1px solid rgba(255,255,255,0.04)", borderRight: "none",
              borderRadius: "8px 0 0 8px",
              background: "rgba(255,255,255,0.03)",
              color: "rgba(154,148,184,0.35)", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <Minus size={12} />
          </button>
          <input
            type="text"
            inputMode="numeric"
            value={inputValue}
            onChange={onInputChange}
            style={{
              width: 56, padding: "8px 4px",
              border: "1px solid rgba(255,255,255,0.04)",
              background: "rgba(255,255,255,0.03)",
              color: "rgba(232,230,240,0.85)", fontSize: 14, fontWeight: 600,
              textAlign: "center", outline: "none", MozAppearance: "textfield",
            }}
          />
          <button
            onClick={() => handleIncrement(1)}
            style={{
              width: 34, height: 34,
              border: "1px solid rgba(255,255,255,0.04)", borderLeft: "none",
              borderRadius: "0 8px 8px 0",
              background: "rgba(255,255,255,0.03)",
              color: "rgba(154,148,184,0.35)", cursor: "pointer",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}
          >
            <Plus size={12} />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

function handleIncrement(delta) {
  // placeholder — wired below
}

export default function UpdateProgressModal({ open, onClose, relics, onUpdate }) {
  const [selectedId, setSelectedId] = useState(null);
  const [pendingOps, setPendingOps] = useState({});
  const [inputValue, setInputValue] = useState("1");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    if (open) {
      setSelectedId(null); setPendingOps({}); setInputValue("1"); setUpdating(false);
    }
  }, [open]);

  const relicList = useMemo(() => {
    return [...relics].sort((a, b) => {
      if (a.is_equipped && !b.is_equipped) return -1;
      if (!a.is_equipped && b.is_equipped) return 1;
      return (a.equipped_order ?? 99) - (b.equipped_order ?? 99);
    });
  }, [relics]);

  const selectedRelic = useMemo(() => relicList.find((g) => g.id === selectedId) || null, [relicList, selectedId]);

  const selectRelic = (id) => {
    setSelectedId(id);
    setInputValue(pendingOps[id] ? String(pendingOps[id].value) : "1");
  };

  const handleReset = () => {
    if (!selectedId) return;
    setPendingOps((prev) => ({ ...prev, [selectedId]: { type: "reset" } }));
  };

  const handleInputChange = (e) => {
    const raw = e.target.value;
    if (raw === "") { setInputValue(""); return; }
    const num = parseInt(raw, 10);
    if (isNaN(num)) return;
    setInputValue(String(num));
    if (selectedId) {
      setPendingOps((prev) => {
        const next = { ...prev };
        if (num === 0) delete next[selectedId];
        else next[selectedId] = { type: "add", value: num };
        return next;
      });
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
        const newProgress = op.type === "reset" ? 0 : Math.max(0, (relic.current_progress || 0) + op.value);
        await onUpdate(relicId, { current_progress: newProgress });
      }
      setPendingOps({}); setSelectedId(null); setInputValue("1");
    } catch {} finally { setUpdating(false); }
  };

  const pendingCount = Object.keys(pendingOps).length;

  if (!open) return null;

  return (
    <div
      style={{
        position: "fixed", inset: 0,
        background: "rgba(0,0,0,0.6)", backdropFilter: "blur(8px)",
        zIndex: 900, display: "flex", alignItems: "center", justifyContent: "center",
      }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        onClick={(e) => e.stopPropagation()}
        role="dialog" aria-modal="true"
        style={{
          background: "rgba(18,14,30,0.95)", borderRadius: 18,
          border: "1px solid rgba(255,255,255,0.04)",
          padding: "24px", width: 540, maxWidth: "92vw", height: "75vh",
          display: "flex", flexDirection: "column",
          boxShadow: "0 24px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.02) inset",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16, flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: "linear-gradient(135deg, rgba(108,71,255,0.25), rgba(108,71,255,0.05))",
              border: "1px solid rgba(108,71,255,0.1)",
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              <Zap size={14} color="rgba(200,190,240,0.7)" />
            </div>
            <div>
              <h2 style={{ fontSize: 14, fontWeight: 700, color: "rgba(232,230,240,0.9)", margin: 0 }}>Upgrade Relics</h2>
              <p style={{ fontSize: 11, color: "rgba(154,148,184,0.5)", margin: "1px 0 0" }}>Select a relic to modify its progress</p>
            </div>
          </div>
          <button onClick={onClose} style={{
            width: 28, height: 28, borderRadius: 8, border: "none", cursor: "pointer",
            background: "rgba(255,255,255,0.03)", color: "rgba(154,148,184,0.5)",
            display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
          }}>
            <X size={14} />
          </button>
        </div>

        {/* Body */}
        <div style={{ display: "flex", flexDirection: "column", gap: 12, overflow: "hidden", flex: 1 }}>
          <RelicSelector relics={relicList} selectedId={selectedId} onSelect={selectRelic} pendingOps={pendingOps} />

          <AnimatePresence mode="wait">
            {selectedRelic ? (
              <motion.div key={selectedRelic.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                <UpgradePanel
                  relic={selectedRelic}
                  inputValue={inputValue}
                  onInputChange={handleInputChange}
                  onReset={handleReset}
                  pendingOp={pendingOps[selectedRelic.id]}
                />
              </motion.div>
            ) : null}
          </AnimatePresence>

          <motion.button
            onClick={handleUpdate}
            disabled={pendingCount === 0 || updating}
            whileHover={pendingCount > 0 && !updating ? { scale: 1.01 } : {}}
            whileTap={pendingCount > 0 && !updating ? { scale: 0.99 } : {}}
            style={{
              width: "100%", padding: "12px", borderRadius: 10, border: "none",
              background: pendingCount > 0 && !updating
                ? "linear-gradient(135deg, rgba(108,71,255,0.85), rgba(74,58,138,0.65))"
                : "rgba(255,255,255,0.03)",
              color: pendingCount > 0 && !updating ? "rgba(232,230,240,0.9)" : "rgba(154,148,184,0.5)",
              fontSize: 13, fontWeight: 600,
              cursor: pendingCount > 0 && !updating ? "pointer" : "not-allowed",
              display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              flexShrink: 0, transition: "all 0.2s",
            }}
          >
            {updating ? "Updating..." : pendingCount > 0 ? (
              <><ArrowUp size={14} /> Apply Changes ({pendingCount})</>
            ) : "Select a relic to begin"}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
