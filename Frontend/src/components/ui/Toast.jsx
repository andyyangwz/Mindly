import { useState, useEffect, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { X, CheckCircle } from "lucide-react"
import { Portal } from "../../utils/portal"
import "../../styles/shared/index.css"

// eslint-disable-next-line react-refresh/only-export-components
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
      <div className="toast-container">
        <AnimatePresence mode="popLayout">
          {items.map((item) => (
            <motion.div
              key={item.id}
              layout
              initial={{ opacity: 0, y: 16, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="toast-item"
            >
              <CheckCircle size={15} color="var(--color-primary)" />
              <span>{item.message}</span>
              <button onClick={() => item.dismiss()} className="toast-dismiss-btn">
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
