import { useEffect, useRef } from "react"
import { X } from "lucide-react"
import { theme } from "../../../theme"

export default function RightDrawer({ open, onClose, header, children }) {
  const drawerRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const handleClick = (e) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) {
        onClose()
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open, onClose])

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 900,
          background: "rgba(0,0,0,0.18)",
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
          transition: "opacity 280ms ease",
        }}
      />

      {/* Drawer panel */}
      <div
        ref={drawerRef}
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: 420,
          maxWidth: "90vw",
          zIndex: 901,
          background: "var(--color-card, white)",
          borderLeft: `1px solid ${theme.border}`,
          boxShadow: open ? "-8px 0 32px rgba(0,0,0,0.10)" : "none",
          transform: open ? "translateX(0)" : "translateX(100%)",
          opacity: open ? 1 : 0,
          transition: "transform 280ms cubic-bezier(0.4, 0, 0.2, 1), opacity 280ms ease, box-shadow 280ms ease",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            width: 32,
            height: 32,
            borderRadius: 8,
            border: `1px solid ${theme.border}`,
            background: "var(--color-card, white)",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: theme.muted,
            zIndex: 1,
            transition: "all 0.15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = theme.accent; e.currentTarget.style.color = theme.dark }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.color = theme.muted }}
        >
          <X size={15} />
        </button>

        {/* Fixed header */}
        {header && (
          <div style={{ flexShrink: 0, padding: "24px 24px 0 24px" }}>
            {header}
          </div>
        )}

        {/* Scrollable content */}
        <div style={{ flex: 1, minHeight: 0, overflowY: "auto", padding: header ? "16px 24px 24px 24px" : "24px" }}>
          {children}
        </div>
      </div>
    </>
  )
}
