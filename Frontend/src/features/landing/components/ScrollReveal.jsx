import { motion } from "framer-motion";

export default function ScrollReveal({ children, direction = "up", delay = 0, duration = 0.7, distance = 40, once = true, className, style }) {
  const variants = {
    hidden: {
      opacity: 0,
      y: direction === "up" ? distance : direction === "down" ? -distance : 0,
      x: direction === "left" ? distance : direction === "right" ? -distance : 0,
    },
    visible: {
      opacity: 1,
      y: 0,
      x: 0,
      transition: { duration, ease: [0.25, 0.46, 0.45, 0.94], delay },
    },
  };

  return (
    <motion.div
      initial="hidden"
      whileInView="visible"
      viewport={{ once, margin: "-80px" }}
      variants={variants}
      className={className}
      style={style}
    >
      {children}
    </motion.div>
  );
}
