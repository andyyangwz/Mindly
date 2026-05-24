import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowLeftRight } from "lucide-react";
import EquippedLoadout from "./EquippedLoadout";
import InventoryBar from "./InventoryBar";

function Particles() {
  const dots = useMemo(() => Array.from({ length: 6 }, (_, i) => ({
    x: 15 + (i * 17) % 85,
    y: 10 + (i * 23) % 80,
    size: 1.5 + (i % 3) * 0.5,
    delay: i * 0.7,
    duration: 4 + (i % 3) * 2,
  })), []);

  return (
    <div style={{ position: "absolute", inset: 0, pointerEvents: "none", overflow: "hidden", zIndex: 0 }}>
      {dots.map((d, i) => (
        <motion.div
          key={i}
          style={{
            position: "absolute",
            left: `${d.x}%`,
            top: `${d.y}%`,
            width: d.size,
            height: d.size,
            borderRadius: "50%",
            background: "var(--relic-accent)",
            opacity: 0.15,
          }}
          animate={{
            y: [0, -8, 0],
            opacity: [0.1, 0.25, 0.1],
          }}
          transition={{
            duration: d.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: d.delay,
          }}
        />
      ))}
    </div>
  );
}

export default function RelicManagerModal({ open, onClose, relics, onEquip, onUnequip }) {
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
    return () => { if (animTimeout.current) clearTimeout(animTimeout.current); };
  }, []);

  const equipped = useMemo(
    () => relics.filter((g) => g.is_equipped).sort((a, b) => (a.equipped_order ?? 99) - (b.equipped_order ?? 99)),
    [relics]
  );

  const storage = useMemo(() => relics.filter((g) => !g.is_equipped), [relics]);

  const handleDragStart = useCallback((e, relicId) => {
    e.dataTransfer.setData("text/plain", relicId);
    e.dataTransfer.effectAllowed = "move";
    draggedIdRef.current = relicId;
    setDraggedRelicId(relicId);
  }, []);

  const handleDragEnd = useCallback(() => {
    draggedIdRef.current = null;
    setDraggedRelicId(null);
    setDragOverSlot(null);
    setDragOverStorage(false);
  }, []);

  const handleSlotDragEnter = useCallback((slotIndex) => setDragOverSlot(slotIndex), []);
  const handleSlotDragLeave = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX, y = e.clientY;
    if (x <= rect.left || x >= rect.right || y <= rect.top || y >= rect.bottom) setDragOverSlot(null);
  }, []);

  const handleSlotDrop = useCallback(async (e, slotIndex) => {
    e.preventDefault();
    const relicId = draggedIdRef.current;
    if (!relicId) return;
    draggedIdRef.current = null;
    setDragOverSlot(null);
    setDraggedRelicId(null);
    setAnimating(true);
    animTimeout.current = setTimeout(async () => {
      try { await onEquip(relicId, slotIndex); } catch {}
      setAnimating(false);
    }, 300);
  }, [onEquip]);

  const handleStorageDragEnter = useCallback(() => setDragOverStorage(true), []);
  const handleStorageDragLeave = useCallback((e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (e.clientX <= rect.left || e.clientX >= rect.right || e.clientY <= rect.top || e.clientY >= rect.bottom) {
      setDragOverStorage(false);
    }
  }, []);

  const handleStorageDrop = useCallback(async (e) => {
    e.preventDefault();
    const relicId = draggedIdRef.current;
    draggedIdRef.current = null;
    setDragOverStorage(false);
    setDraggedRelicId(null);
    if (!relicId) return;
    if (!equipped.find((g) => g.id === relicId)) return;
    setAnimating(true);
    animTimeout.current = setTimeout(async () => {
      try { await onUnequip(relicId); } catch {}
      setAnimating(false);
    }, 300);
  }, [equipped, onUnequip]);

  const handleCardClick = useCallback(() => {}, []);

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.35, ease: "easeOut" }}
          style={{
            position: "fixed", inset: 0,
            zIndex: 900,
            display: "flex", alignItems: "center", justifyContent: "center",
            background: "var(--relic-overlay)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
          }}
          onClick={onClose}
        >
          {/* Ambient glow */}
          <div style={{
            position: "fixed",
            width: "50%", height: "50%",
            borderRadius: "50%",
            background: "radial-gradient(circle, color-mix(in srgb, var(--relic-accent) 6%, transparent), transparent 70%)",
            top: "20%", left: "10%",
            pointerEvents: "none",
            zIndex: 0,
          }} />

          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 10 }}
            transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
            onClick={(e) => e.stopPropagation()}
            role="dialog" aria-modal="true"
            style={{
              position: "relative",
              zIndex: 1,
              width: 660,
              maxWidth: "94vw",
              maxHeight: "85vh",
              height: "auto",
              minHeight: "50vh",
              display: "flex",
              flexDirection: "column",
              borderRadius: 20,
              background: "var(--relic-modal-bg)",
              border: "1px solid color-mix(in srgb, var(--relic-modal-border) 80%, transparent)",
              boxShadow: `
                0 0 0 1px color-mix(in srgb, var(--relic-accent) 4%, transparent) inset,
                0 32px 100px rgba(0,0,0,0.35),
                0 0 60px color-mix(in srgb, var(--relic-accent) 3%, transparent)
              `,
              overflow: "hidden",
            }}
          >
            <Particles />

            {/* Header */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "20px 24px 0",
              flexShrink: 0,
              position: "relative",
              zIndex: 1,
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 12,
                  background: "linear-gradient(135deg, color-mix(in srgb, var(--relic-accent) 25%, transparent), color-mix(in srgb, var(--relic-accent) 5%, transparent))",
                  border: "1px solid color-mix(in srgb, var(--relic-accent) 12%, transparent)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  boxShadow: "0 0 20px color-mix(in srgb, var(--relic-glow) 40%, transparent)",
                }}>
                  <ArrowLeftRight size={15} color="var(--relic-accent)" />
                </div>
                <div>
                  <h2 style={{
                    fontSize: 15,
                    fontWeight: 700,
                    color: "var(--relic-text-primary)",
                    margin: 0,
                    letterSpacing: "-0.01em",
                  }}>
                    Manage Relics
                  </h2>
                  <p style={{
                    fontSize: 10,
                    color: "var(--relic-text-muted)",
                    margin: "2px 0 0",
                    fontWeight: 500,
                    letterSpacing: "0.04em",
                    textTransform: "uppercase",
                  }}>
                    Drag to equip, drop to store
                  </p>
                </div>
              </div>

              <motion.button
                onClick={onClose}
                whileHover={{ scale: 1.08, rotate: 90 }}
                whileTap={{ scale: 0.92 }}
                transition={{ type: "spring", stiffness: 400, damping: 20 }}
                style={{
                  width: 32, height: 32, borderRadius: "50%", border: "none", cursor: "pointer", flexShrink: 0,
                  background: "color-mix(in srgb, var(--relic-accent) 4%, transparent)",
                  border: "1px solid color-mix(in srgb, var(--relic-border) 60%, transparent)",
                  color: "var(--relic-text-muted)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  position: "relative",
                }}
              >
                <motion.div
                  style={{
                    position: "absolute", inset: -2, borderRadius: "50%",
                    background: "color-mix(in srgb, var(--relic-accent) 8%, transparent)",
                    opacity: 0,
                  }}
                  whileHover={{ opacity: 1 }}
                />
                <X size={14} style={{ position: "relative", zIndex: 1 }} />
              </motion.button>
            </div>

            {/* Body */}
            <div style={{
              display: "flex", flexDirection: "column", gap: 12,
              overflow: "hidden", flex: 1,
              padding: "16px 24px 20px",
              position: "relative",
              zIndex: 1,
            }}>
              {/* Equipped */}
              <div style={{
                flexShrink: 0,
                background: draggedRelicId
                  ? "color-mix(in srgb, var(--relic-accent) 3%, transparent)"
                  : "transparent",
                borderRadius: 14,
                transition: "background 0.3s",
              }}>
                <EquippedLoadout
                  equipped={equipped}
                  dragOverSlot={dragOverSlot}
                  animating={animating}
                  onSlotDragEnter={handleSlotDragEnter}
                  onSlotDragLeave={handleSlotDragLeave}
                  onSlotDrop={handleSlotDrop}
                  onCardDragStart={handleDragStart}
                  onCardDragEnd={handleDragEnd}
                  onCardClick={handleCardClick}
                />
              </div>

              {/* Inventory */}
              <div style={{
                flex: 1, minHeight: 0, overflow: "hidden",
                background: dragOverStorage
                  ? "color-mix(in srgb, var(--relic-accent) 3%, transparent)"
                  : "transparent",
                borderRadius: 12,
                transition: "all 0.3s",
                border: dragOverStorage
                  ? "1.5px solid color-mix(in srgb, var(--relic-accent) 25%, transparent)"
                  : "1.5px solid transparent",
                boxShadow: dragOverStorage
                  ? `0 0 24px color-mix(in srgb, var(--relic-accent) 6%, transparent)`
                  : "none",
              }}>
                <InventoryBar
                  relics={storage}
                  draggingId={draggedRelicId}
                  animating={animating}
                  onCardDragStart={handleDragStart}
                  onCardDragEnd={handleDragEnd}
                  onCardClick={handleCardClick}
                  onStorageDragEnter={handleStorageDragEnter}
                  onStorageDragLeave={handleStorageDragLeave}
                  onStorageDrop={handleStorageDrop}
                  dragOverStorage={dragOverStorage}
                />
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
