import { useState, useCallback, useEffect, useRef } from "react"
import { useTranslation } from "react-i18next"
import { Outlet, useLocation, useNavigate } from "react-router-dom"
import { Menu, X } from "lucide-react"
import Sidebar from "./Sidebar"
import SpotlightOverlay from "./tutorial/SpotlightOverlay"
import { useChat } from "../hooks/shared/useChat"
import "../styles/shared/index.css"

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
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

  const section = location.pathname.split("/")[2] || "dashboard"
  const pageTitle = {
    dashboard: t("nav.dashboard"),
    journals: t("nav.journals"),
    scheduling: t("nav.scheduling"),
    "ai-planning": t("nav.aiPlanningAssistant"),
    insight: t("nav.insight"),
    spill: "Spill AI",
  }[section] || "Mindly"

  const contentArea = (
    <div className="content-area">
      <Outlet context={{ addSession, fetchSessions }} />
      <SpotlightOverlay />
    </div>
  )

  return (
    <>
      {isMobile ? (
        <div className="layout-mobile">
          <div className="top-bar">
            <button
              onClick={() => setMobileOpen(v => !v)}
              aria-label={mobileOpen ? "Close menu" : "Open menu"}
              className="hamburger-btn"
            >
              {mobileOpen ? <X size={18} /> : <Menu size={18} />}
            </button>
            <span className="page-title">
              {pageTitle}
            </span>
          </div>

          {contentArea}
        </div>
      ) : (
        <div className="layout-desktop">
          <Sidebar
            sessions={sessions}
            newSessionId={newSessionId}
            onNewChat={handleNewChat}
            onRenameChat={handleRenameChat}
            onDeleteChat={handleDeleteChat}
            onNavClick={closeMobile}
          />

          {contentArea}
        </div>
      )}

      {isMobile && (
        <>
          <div
            onClick={closeMobile}
            className="mobile-backdrop"
            style={{
              opacity: mobileOpen ? 1 : 0,
              pointerEvents: mobileOpen ? "auto" : "none",
            }}
          />
          <div
            onClick={(e) => e.stopPropagation()}
            className="mobile-drawer"
            style={{
              transform: mobileOpen ? "translateX(0)" : "translateX(-100%)",
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
