import { useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { resolveIcon } from "../../components/IconPicker";

const circ = 2 * Math.PI * 18;

export default function RelicCard({
  goal,
  compact,
  dragOver,
  onDrop,
  onDragStart,
  onDragEnd,
  onDragEnter,
  onDragLeave,
  onClick,
  empty,
  emptyLabel,
  animating,
  dragging,
}) {
  const rootRef = useRef(null);

  useEffect(() => {
    const el = rootRef.current;
    if (!el || empty) return;
    const handler = (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
    };
    el.addEventListener("dragover", handler, { passive: false });
    return () => el.removeEventListener("dragover", handler);
  }, [empty]);

  if (empty) {
    return (
      <motion.div
        ref={rootRef}
        onDragEnter={onDragEnter}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        whileHover={dragOver ? {} : { scale: 1.01 }}
        style={{
          borderRadius: 14,
          border: dragOver
            ? "1.5px solid color-mix(in srgb, var(--relic-accent) 50%, transparent)"
            : "1.5px dashed var(--relic-border)",
          padding: compact ? "10px" : "14px",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          minHeight: compact ? 80 : 120,
          background: dragOver
            ? "color-mix(in srgb, var(--relic-accent) 6%, transparent)"
            : "var(--relic-card-bg)",
          transition: "all 0.3s",
          cursor: "default",
          position: "relative",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: compact ? 28 : 36,
            height: compact ? 28 : 36,
            borderRadius: "50%",
            background: dragOver
              ? "color-mix(in srgb, var(--relic-accent) 12%, transparent)"
              : "var(--relic-progress-bg)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: compact ? 12 : 14,
            color: dragOver
              ? "color-mix(in srgb, var(--relic-accent) 60%, transparent)"
              : "var(--relic-text-muted)",
            transition: "all 0.3s",
            pointerEvents: "none",
          }}
        >
          +
        </div>
        <span
          style={{
            fontSize: compact ? 9 : 10,
            color: dragOver
              ? "color-mix(in srgb, var(--relic-accent) 60%, transparent)"
              : "var(--relic-text-muted)",
            fontWeight: 500,
            transition: "color 0.3s",
            pointerEvents: "none",
            textAlign: "center",
            letterSpacing: "0.02em",
          }}
        >
          {dragOver ? "Drop here" : emptyLabel || "Empty Slot"}
        </span>
      </motion.div>
    );
  }

  const pct = goal.target > 0
    ? Math.min(Math.round((goal.current_progress / goal.target) * 100), 100)
    : 0;
  const offset = circ * (1 - pct / 100);
  const Icon = resolveIcon(goal.icon);
  const isComplete = goal.target > 0 && goal.current_progress >= goal.target;

  return (
    <motion.div
      ref={rootRef}
      draggable
      onClick={onClick}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: dragging ? 1.04 : 1,
      }}
      exit={{ opacity: 0, scale: 0.9 }}
      whileHover={compact ? {
        scale: 1.03,
        y: -2,
        transition: { type: "spring", stiffness: 300, damping: 20 },
      } : {
        scale: 1.03,
        y: -3,
        transition: { type: "spring", stiffness: 300, damping: 20 },
      }}
      whileTap={compact ? {} : { scale: 0.97 }}
      transition={{ type: "spring", stiffness: 300, damping: 24 }}
      style={{
        borderRadius: 14,
        border: dragOver
          ? "1.5px solid color-mix(in srgb, var(--relic-accent) 50%, transparent)"
          : "1px solid var(--relic-border)",
        padding: compact ? "10px" : "14px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: compact ? 4 : 8,
        cursor: "grab",
        background: isComplete
          ? `
            radial-gradient(ellipse at 50% 0%, color-mix(in srgb, var(--relic-complete) 6%, transparent) 0%, transparent 70%),
            color-mix(in srgb, var(--relic-card-bg) 80%, transparent)
          `
          : dragOver
          ? `
            radial-gradient(ellipse at 50% 0%, color-mix(in srgb, var(--relic-accent) 8%, transparent) 0%, transparent 70%),
            color-mix(in srgb, var(--relic-accent) 4%, transparent)
          `
          : `
            radial-gradient(ellipse at 50% 0%, color-mix(in srgb, var(--relic-accent) 3%, transparent) 0%, transparent 70%),
            var(--relic-card-bg)
          `,
        transition: "border-color 0.3s, background 0.3s",
        position: "relative",
        overflow: "hidden",
        userSelect: "none",
        boxShadow: dragOver
          ? `0 0 20px color-mix(in srgb, var(--relic-accent) 8%, transparent), 0 0 0 1px color-mix(in srgb, var(--relic-accent) 8%, transparent) inset`
          : compact
          ? "none"
          : "0 1px 3px rgba(0,0,0,0.03)",
      }}
    >
      {/* Glow overlay on hover */}
      {!compact && !dragOver && (
        <motion.div
          initial={{ opacity: 0 }}
          whileHover={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          style={{
            position: "absolute", inset: 0, borderRadius: 14,
            background: "radial-gradient(ellipse at 50% 0%, color-mix(in srgb, var(--relic-accent) 6%, transparent) 0%, transparent 60%)",
            pointerEvents: "none",
          }}
        />
      )}

      {/* Top accent bar */}
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: dragOver ? 3 : 2,
          background: isComplete
            ? "linear-gradient(90deg, var(--relic-complete), color-mix(in srgb, var(--relic-complete) 60%, transparent))"
            : dragOver
            ? "linear-gradient(90deg, var(--relic-accent), color-mix(in srgb, var(--relic-accent) 60%, transparent))"
            : "linear-gradient(90deg, color-mix(in srgb, var(--relic-accent) 25%, transparent), transparent)",
          transition: "height 0.2s, background 0.3s",
          zIndex: 1,
        }}
      />

      {/* Progress ring + icon */}
      <div style={{
        position: "relative",
        width: compact ? 36 : 48,
        height: compact ? 36 : 48,
        flexShrink: 0,
        zIndex: 1,
      }}>
        {/* Glow behind ring */}
        <div style={{
          position: "absolute",
          inset: -4,
          borderRadius: "50%",
          background: `radial-gradient(circle, color-mix(in srgb, ${isComplete ? "var(--relic-complete)" : "var(--relic-accent)"} 10%, transparent), transparent 70%)`,
          opacity: dragOver ? 0.6 : 0.3,
          transition: "opacity 0.3s",
        }} />
        <svg width={compact ? 36 : 48} height={compact ? 36 : 48} style={{ transform: "rotate(-90deg)", position: "absolute" }}>
          <circle
            cx={compact ? 18 : 24}
            cy={compact ? 18 : 24}
            r={compact ? 13 : 18}
            stroke="var(--relic-progress-bg)"
            strokeWidth="3"
            fill="none"
          />
          <circle
            cx={compact ? 18 : 24}
            cy={compact ? 18 : 24}
            r={compact ? 13 : 18}
            stroke={isComplete ? "var(--relic-complete)" : "var(--relic-accent)"}
            strokeWidth="3"
            fill="none"
            strokeLinecap="round"
            strokeDasharray={`${compact ? 2 * Math.PI * 13 : circ}`}
            strokeDashoffset={compact ? (2 * Math.PI * 13) * (1 - pct / 100) : offset}
            style={{ transition: "stroke-dashoffset 0.8s ease, stroke 0.4s" }}
          />
        </svg>
        <motion.div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          animate={!compact ? {
            scale: [1, 1.04, 1],
          } : {}}
          transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
        >
          <Icon
            size={compact ? 12 : 16}
            color={isComplete ? "var(--relic-complete)" : "var(--relic-accent)"}
          />
        </motion.div>
      </div>

      {/* Title */}
      <span
        style={{
          fontSize: compact ? 10 : 12,
          fontWeight: 600,
          color: "var(--relic-text-primary)",
          textAlign: "center",
          lineHeight: 1.2,
          overflow: "hidden",
          textOverflow: "ellipsis",
          maxWidth: "100%",
          position: "relative",
          zIndex: 1,
        }}
      >
        {goal.title}
      </span>

      {/* Status badge */}
      {!compact && (
        <div
          style={{
            padding: "2px 8px",
            borderRadius: 6,
            background: isComplete
              ? "color-mix(in srgb, var(--relic-complete) 10%, transparent)"
              : "color-mix(in srgb, var(--relic-accent) 8%, transparent)",
            fontSize: 9,
            fontWeight: 600,
            color: isComplete ? "var(--relic-complete)" : "var(--relic-text-secondary)",
            whiteSpace: "nowrap",
            letterSpacing: "0.02em",
            position: "relative",
            zIndex: 1,
          }}
        >
          {isComplete ? "Achieved" : "In Progress"}
        </div>
      )}

      {/* Progress */}
      <div
        style={{
          fontSize: compact ? 9 : 11,
          fontWeight: 600,
          color: "var(--relic-text-muted)",
          fontVariantNumeric: "tabular-nums",
          position: "relative",
          zIndex: 1,
        }}
      >
        {goal.current_progress}/{goal.target}
      </div>
    </motion.div>
  );
}
