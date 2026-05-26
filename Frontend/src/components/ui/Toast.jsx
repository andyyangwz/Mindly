import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, CheckCircle } from "lucide-react"
import { Portal } from "../../utils/portal"
import { theme } from "../../theme"

export function useToast() {
  const show = useCallback((message, { duration = 2500 } = {}) => {
    const event = new CustomEvent("app-toast", {
      detail: { message, duration },
    })
    window.dispatchEvent(event)
  }, [])

  return { show }
}

export default function ToastContainer() {
  const items = useToastState()

  return (
    <Portal>
      <div
        style={{
          position: "fixed",
          bottom: 32,
          left: "50%",
          transform: "translateX(-50%)",
          zIndex: theme.z.toast,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: 8,
          pointerEvents: "none",
        }}
      >
        <AnimatePresence mode="popLayout">
          {items.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              style={{
                background: "var(--color-card, white)",
                borderRadius: 12,
                border: `1px solid ${theme.border}`,
                boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
                padding: "10px 18px",
                display: "flex",
                alignItems: "center",
                gap: 8,
                pointerEvents: "auto",
                fontSize: 13,
                color: theme.dark,
                fontWeight: 500,
              }}
            >
              <CheckCircle size={15} color={theme.primary} />
              <span>{item.message}</span>
              <button
                onClick={() => item.dismiss()}
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 2,
                  display: "flex",
                  color: theme.muted,
                  marginLeft: 4,
                }}
              >
                <X size={13} />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </Portal>
  )
}

function useToastState() {
  const [items, setItems] = useState([])

  useEffect(() => {
    const handler = (e) => {
      const { message, duration } = e.detail
      const id = Date.now() + Math.random()
      const dismiss = () => {
        setItems((prev) => prev.filter((i) => i.id !== id))
      }
      setItems((prev) => [...prev, { id, message, dismiss }])
      if (duration > 0) {
        setTimeout(dismiss, duration)
      }
    }
    window.addEventListener("app-toast", handler)
    return () => window.removeEventListener("app-toast", handler)
  }, [])

  return items
}
