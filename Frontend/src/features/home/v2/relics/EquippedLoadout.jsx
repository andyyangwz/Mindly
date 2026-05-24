import { motion } from "framer-motion";
import RelicCard from "./RelicCard";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
  },
};

const item = {
  hidden: { opacity: 0, y: 16, scale: 0.95 },
  show: {
    opacity: 1, y: 0, scale: 1,
    transition: { type: "spring", stiffness: 280, damping: 22 },
  },
};

export default function EquippedLoadout({
  equipped,
  dragOverSlot,
  animating,
  onSlotDragEnter,
  onSlotDragLeave,
  onSlotDrop,
  onCardDragStart,
  onCardDragEnd,
  onCardClick,
}) {
  return (
    <div
      style={{
        borderRadius: 16,
        background: `
          radial-gradient(ellipse at 50% 0%, color-mix(in srgb, var(--relic-accent) 4%, transparent) 0%, transparent 70%),
          color-mix(in srgb, var(--relic-accent) 2%, transparent)
        `,
        border: "1px solid color-mix(in srgb, var(--relic-accent) 8%, transparent)",
        padding: "16px",
        position: "relative",
        overflow: "hidden",
        boxShadow: "0 0 30px color-mix(in srgb, var(--relic-glow) 30%, transparent)",
      }}
    >
      {/* Section header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 16,
          position: "relative",
        }}
      >
        {/* Animated indicator */}
        <motion.div
          animate={{
            boxShadow: [
              "0 0 6px color-mix(in srgb, var(--relic-accent) 30%, transparent)",
              "0 0 14px color-mix(in srgb, var(--relic-accent) 50%, transparent)",
              "0 0 6px color-mix(in srgb, var(--relic-accent) 30%, transparent)",
            ],
          }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          style={{
            width: 7,
            height: 7,
            borderRadius: "50%",
            background: "var(--relic-accent)",
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            color: "var(--relic-text-primary)",
            letterSpacing: "0.03em",
            textTransform: "uppercase",
          }}
        >
          Equipped Loadout
        </span>
        <span
          style={{
            fontSize: 10,
            color: "var(--relic-text-muted)",
            fontWeight: 600,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {equipped.length}/3
        </span>

        {/* Right glow accent */}
        <div
          style={{
            marginLeft: "auto",
            height: 1,
            flex: 1,
            maxWidth: 80,
            background: "linear-gradient(90deg, color-mix(in srgb, var(--relic-accent) 10%, transparent), transparent)",
          }}
        />
      </div>

      {/* Slots */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 10,
        }}
      >
        {Array.from({ length: 3 }).map((_, i) => (
          <motion.div key={i} variants={item}>
            {i < equipped.length ? (
              <RelicCard
                goal={equipped[i]}
                dragOver={dragOverSlot === i}
                animating={animating}
                onDragEnter={() => onSlotDragEnter(i)}
                onDragLeave={onSlotDragLeave}
                onDrop={(e) => onSlotDrop(e, i)}
                onDragStart={(e) => onCardDragStart(e, equipped[i].id)}
                onDragEnd={onCardDragEnd}
                onClick={() => onCardClick(equipped[i])}
              />
            ) : (
              <RelicCard
                empty
                emptyLabel="Empty Slot"
                dragOver={dragOverSlot === i}
                onDragEnter={() => onSlotDragEnter(i)}
                onDragLeave={onSlotDragLeave}
                onDrop={(e) => onSlotDrop(e, i)}
              />
            )}
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
