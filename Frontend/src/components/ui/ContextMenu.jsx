import { useEffect, useRef } from "react"
import { theme } from "../../theme"
import { Portal } from "../../utils/portal"

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
          style={{
            position: "fixed",
            left: adjustedX,
            top: adjustedY,
            width: menuWidth,
            background: "var(--color-card, white)",
            borderRadius: 12,
            boxShadow: "0 8px 32px rgba(0,0,0,0.15), 0 2px 8px rgba(0,0,0,0.06)",
            border: `1px solid ${theme.border}`,
            padding: "4px",
            zIndex: theme.z.contextMenu,
          }}
        >
          {items.map((item, index) => (
            <button
              key={index}
              role="menuitem"
              onClick={() => { item.onClick(); onClose() }}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: "8px 12px", borderRadius: 8, border: "none",
                background: "transparent", cursor: "pointer", fontSize: 13,
                fontWeight: 500, color: item.danger ? "#EF4444" : theme.dark,
                transition: "background 0.1s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.background = theme.bg }}
              onMouseLeave={(e) => { e.currentTarget.style.background = "transparent" }}
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
