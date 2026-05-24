import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";

const DISPLAY_DURATION = 2800;
const FADE_DURATION = 0.55;

const variants = {
  enter: { opacity: 0, y: 10 },
  center: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export default function TypewriterText({ texts, style }) {
  const [page, setPage] = useState(0);

  const advance = useCallback(() => {
    setPage((p) => (p + 1) % texts.length);
  }, [texts.length]);

  useEffect(() => {
    const id = setTimeout(advance, DISPLAY_DURATION);
    return () => clearTimeout(id);
  }, [page, advance]);

  return (
    <div style={{ position: "relative", ...style }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={page}
          variants={variants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: FADE_DURATION, ease: "easeInOut" }}
        >
          {texts[page]}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
