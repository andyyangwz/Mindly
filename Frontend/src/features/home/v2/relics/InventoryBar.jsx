import { useRef, useEffect, useState } from "react";
import { motion } from "framer-motion";
import RelicCard from "./RelicCard";

export default function InventoryBar({
  relics,
  draggingId,
  animating,
  onCardDragStart,
  onCardDragEnd,
  onCardClick,
  onStorageDragEnter,
  onStorageDragLeave,
  onStorageDrop,
  dragOverStorage,
}) {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [hoveredIndex, setHoveredIndex] = useState(null);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const check = () => {
      setCanScrollLeft(el.scrollLeft > 4);
      setCanScrollRight(el.scrollLeft < el.scrollWidth - el.clientWidth - 4);
    };
    check();
    el.addEventListener("scroll", check, { passive: true });
    return () => el.removeEventListener("scroll", check);
  }, [relics]);

  return (
    <div
      style={{
        flex: 1,
        minHeight: 0,
        display: "flex",
        flexDirection: "column",
      }}
      onDragEnter={onStorageDragEnter}
      onDragLeave={onStorageDragLeave}
      onDragOver={(e) => e.preventDefault()}
      onDrop={onStorageDrop}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          marginBottom: 10,
          flexShrink: 0,
          padding: "16px 12px 0",
        }}
      >
        <div
          style={{
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "var(--relic-text-muted)",
            opacity: 0.6,
          }}
        />
        <span
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: "var(--relic-text-secondary)",
            letterSpacing: "0.04em",
            textTransform: "uppercase",
          }}
        >
          Relic Archive
        </span>
        <span
          style={{
            fontSize: 9,
            color: "var(--relic-text-muted)",
            fontWeight: 600,
            fontVariantNumeric: "tabular-nums",
          }}
        >
          {relics.length}
        </span>
        {dragOverStorage && (
          <motion.span
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            style={{
              fontSize: 9,
              color: "var(--relic-accent)",
              fontWeight: 600,
              marginLeft: "auto",
              letterSpacing: "0.02em",
            }}
          >
            Release to unequip
          </motion.span>
        )}
      </div>

      {/* Scroll area */}
      <div
        style={{
          flex: 1,
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Left fade */}
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            bottom: 0,
            width: 28,
            background: canScrollLeft
              ? "linear-gradient(90deg, var(--relic-modal-bg), transparent)"
              : "transparent",
            zIndex: 2,
            pointerEvents: "none",
            transition: "background 0.25s",
          }}
        />

        {/* Right fade */}
        <div
          style={{
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            width: 28,
            background: canScrollRight
              ? "linear-gradient(-90deg, var(--relic-modal-bg), transparent)"
              : "transparent",
            zIndex: 2,
            pointerEvents: "none",
            transition: "background 0.25s",
          }}
        />

        {/* Scroll container */}
        <div
          ref={scrollRef}
          style={{
            overflowX: "auto",
            overflowY: "hidden",
            height: "100%",
            scrollbarWidth: "thin",
            scrollbarColor: "var(--relic-border) transparent",
            padding: "0 12px",
          }}
        >
          <div
            style={{
              display: "flex",
              gap: 8,
              alignItems: "stretch",
              paddingBottom: 10,
              minHeight: "100%",
            }}
          >
            {relics.length === 0 ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  minWidth: "100%",
                  fontSize: 11,
                  color: "var(--relic-text-muted)",
                  fontWeight: 500,
                  fontStyle: "italic",
                  letterSpacing: "0.02em",
                }}
              >
                No relics in archive
              </div>
            ) : (
              relics.map((goal, idx) => (
                <motion.div
                  key={goal.id}
                  layout
                  onMouseEnter={() => setHoveredIndex(idx)}
                  onMouseLeave={() => setHoveredIndex(null)}
                  style={{
                    flexShrink: 0,
                    width: 110,
                    transition: "transform 0.2s ease, opacity 0.2s ease",
                    transform: hoveredIndex !== null && hoveredIndex !== idx ? "scale(0.96)" : "scale(1)",
                    opacity: hoveredIndex !== null && hoveredIndex !== idx ? 0.7 : 1,
                  }}
                >
                  <RelicCard
                    goal={goal}
                    compact
                    animating={animating}
                    dragging={draggingId === goal.id}
                    onDragStart={(e) => onCardDragStart(e, goal.id)}
                    onDragEnd={onCardDragEnd}
                    onClick={() => onCardClick(goal)}
                  />
                </motion.div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
