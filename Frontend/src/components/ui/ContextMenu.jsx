import { useEffect, useRef } from "react"
import { Portal } from "../../utils/portal"
import "../../styles/shared/index.css"

export default function ContextMenu({ open, x, y, items, onClose, children }) {
  const menuRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        onClose()
      }
    }
    const keyHandler = (e) => {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("mousedown", handler)
    document.addEventListener("keydown", keyHandler)
    return () => {
      document.removeEventListener("mousedown", handler)
      document.removeEventListener("keydown", keyHandler)
    }
  }, [open, onClose])

  if (!open) return null

  const menuWidth = 180
  const adjustedX = Math.min(x, window.innerWidth - menuWidth - 16)
  const adjustedY = Math.min(y, window.innerHeight - items.length * 40 - 16)

  return (
    <>
      {children}
      <Portal>
        <div
          ref={menuRef}
          role="menu"
          className="ctx-menu"
          style={{ left: adjustedX, top: adjustedY, width: menuWidth }}
        >
          {items.map((item, index) => (
            <button
              key={index}
              role="menuitem"
              onClick={() => { item.onClick(); onClose() }}
              className={`ctx-menu-item${item.danger ? " ctx-menu-item--danger" : ""}`}
            >
              {item.icon && <item.icon size={15} />}
              {item.label}
            </button>
          ))}
        </div>
      </Portal>
    </>
  )
}
