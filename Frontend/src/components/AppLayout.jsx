import { useState, useCallback, useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { Outlet, useLocation, useNavigate } from "react-router-dom"
import { Menu, X } from "lucide-react"
import { theme } from "../theme"
import Sidebar from "./Sidebar"
import SpotlightOverlay from "./tutorial/SpotlightOverlay"
import { useChat } from "../hooks/useChat"

const TOP_BAR_HEIGHT = 56

export default function AppLayout() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const { sessions, newSessionId, fetchSessions, renameSession, deleteSession, addSession } = useChat()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const mqlRef = useRef(null)

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions, location.pathname])

  useEffect(() => {
    const mql = window.matchMedia("(max-width: 1024px)")
    mqlRef.current = mql
    setIsMobile(mql.matches)
    const handler = (e) => setIsMobile(e.matches)
    mql.addEventListener("change", handler)
    return () => mql.removeEventListener("change", handler)
  }, [])

  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden"
    } else {
      document.body.style.overflow = ""
    }
    return () => { document.body.style.overflow = "" }
  }, [mobileOpen])

  useEffect(() => {
    if (!mobileOpen) return
    const handler = (e) => {
      if (e.key === "Escape") setMobileOpen(false)
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [mobileOpen])

  const handleNewChat = useCallback(async () => {
    navigate("/app/spill")
  }, [navigate])

  const handleRenameChat = useCallback(async (id, title) => {
    try {
      await renameSession(id, title)
    } catch {
      throw new Error(t("common.errors.renameChat"))
    }
  }, [renameSession, t])

  const handleDeleteChat = useCallback(async (id) => {
    try {
      await deleteSession(id)
      if (location.pathname.startsWith(`/app/spill/${id}`)) {
        navigate("/app/spill", { replace: true })
      }
    } catch {
      throw new Error(t("common.errors.deleteChat"))
    }
  }, [deleteSession, location.pathname, navigate, t])

  const closeMobile = useCallback(() => setMobileOpen(false), [])

  const section = location.pathname.split("/")[2] || "home"
  const pageTitle = {
    home: t("nav.home"),
    journals: t("nav.journals"),
    productivity: t("nav.productivity"),
    insight: t("nav.insight"),
    spill: "Spill AI",
  }[section] || "Mindly"

  return (
    <>
      {isMobile ? (
        <div style={{ display: "flex", flexDirection: "column", height: "100vh", background: theme.bg }}>
          <div
            style={{
              height: TOP_BAR_HEIGHT,
              display: "flex",
              alignItems: "center",
              gap: 12,
              padding: "0 12px",
              background: "var(--color-card)",
              borderBottom: `1px solid ${theme.border}`,
              position: "relative",
              zIndex: theme.z.modalOverlay + 10,
              flexShrink: 0,
            }}
          >
            <button
              onClick={() => setMobileOpen(v => !v)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                border: `1px solid ${theme.border}`,
                background: "transparent",
                color: theme.dark,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "all 0.15s",
              }}
              onMouseEnter={(e) => { e.currentTarget.style.borderColor = theme.primary; e.currentTarget.style.color = theme.primary }}
              onMouseLeave={(e) => { e.currentTarget.style.borderColor = theme.border; e.currentTarget.style.color = theme.dark }}
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <span style={{ fontSize: 15, fontWeight: 600, color: theme.dark, userSelect: "none" }}>
              {pageTitle}
            </span>
          </div>

          <div style={{ flex: 1, overflowY: "auto", background: theme.bg }}>
            <Outlet context={{ addSession, fetchSessions }} />
            <SpotlightOverlay />
          </div>
        </div>
      ) : (
        <div
          style={{
            display: "flex",
            height: "100vh",
            background: theme.bg,
            overflow: "hidden",
          }}
        >
          <div style={{ display: isMobile ? "none" : "block" }}>
            <Sidebar
              sessions={sessions}
              newSessionId={newSessionId}
              onNewChat={handleNewChat}
              onRenameChat={handleRenameChat}
              onDeleteChat={handleDeleteChat}
              onNavClick={closeMobile}
            />
          </div>

          <div
            style={{
              flex: 1,
              overflowY: "auto",
              background: theme.bg,
            }}
          >
            <Outlet context={{ addSession, fetchSessions }} />
            <SpotlightOverlay />
          </div>
        </div>
      )}

      {isMobile && (
        <>
          <div
            onClick={closeMobile}
            style={{
              position: "fixed",
              inset: 0,
              zIndex: theme.z.modalOverlay,
              background: "rgba(0,0,0,0.4)",
              opacity: mobileOpen ? 1 : 0,
              pointerEvents: mobileOpen ? "auto" : "none",
              transition: "opacity 0.25s ease",
            }}
          />
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              bottom: 0,
              zIndex: theme.z.modalOverlay + 1,
              transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
              transition: "transform 0.25s ease",
            }}
          >
            <Sidebar
              sessions={sessions}
              newSessionId={newSessionId}
              onNewChat={() => { handleNewChat(); closeMobile() }}
              onRenameChat={handleRenameChat}
              onDeleteChat={handleDeleteChat}
              onNavClick={closeMobile}
            />
          </div>
        </>
      )}
    </>
  )
}
