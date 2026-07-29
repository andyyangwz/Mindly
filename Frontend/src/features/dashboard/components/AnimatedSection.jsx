import { motion } from "framer-motion"
import { useRef } from "react"

export default function AnimatedSection({ children, delay = 0, className, ...props }) {
  const ref = useRef(null)
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.35, delay, ease: "easeOut" }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  )
}
