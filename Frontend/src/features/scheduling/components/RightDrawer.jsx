import { useEffect, useRef } from "react"
import { X } from "lucide-react"
import "../../../styles/scheduling/index.css"

const PANEL_WIDTH = 320

export default function RightDrawer({ open, onClose, header, children, isModalOpen, variant = "overlay" }) {
  const drawerRef = useRef(null)
  const isInline = variant === "inline"

  useEffect(() => {
    if (!open || isModalOpen || isInline) return
    const handleClick = (e) => {
      if (drawerRef.current && !drawerRef.current.contains(e.target)) {
        onClose()
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [open, onClose, isModalOpen, isInline])

  const closeBtn = !isInline && (
    <button
      onClick={onClose}
      className="rd-close-btn"
    >
      <X size={15} />
    </button>
  )

  const innerContent = (
    <>
      {closeBtn}
      {header && (
        <div className="rd-header-area">{header}</div>
      )}
      <div className={`rd-content-area ${header ? "rd-content-area-with-header" : "rd-content-area-alone"}`}>
        {children}
      </div>
    </>
  )

  if (isInline) {
    return (
      <div
        ref={drawerRef}
        className="rd-drawer-inline"
        style={{
          width: open ? PANEL_WIDTH : 0,
          transition: "width 280ms cubic-bezier(0.4, 0, 0.2, 1)",
          borderLeft: open ? "1px solid var(--color-border)" : "none",
        }}
      >
        <div className="rd-drawer-inner" style={{ width: PANEL_WIDTH }}>
          {innerContent}
        </div>
        {isModalOpen && (
          <div className="rd-modal-overlay" />
        )}
      </div>
    )
  }

  return (
    <>
      <div
        onClick={onClose}
        className="rd-backdrop"
        style={{
          opacity: open ? 1 : 0,
          pointerEvents: open ? "auto" : "none",
        }}
      />

      <div
        ref={drawerRef}
        className="rd-drawer"
        style={{
          width: PANEL_WIDTH,
          boxShadow: open ? "-8px 0 32px rgba(0,0,0,0.10)" : "none",
          transform: open ? "translateX(0)" : "translateX(100%)",
          opacity: open ? 1 : 0,
          transition: "transform 280ms cubic-bezier(0.4, 0, 0.2, 1), opacity 280ms ease, box-shadow 280ms ease",
        }}
      >
        {innerContent}
      </div>

      {isModalOpen && (
        <div className="rd-modal-overlay" />
      )}
    </>
  )
}