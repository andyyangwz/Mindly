import { useEffect, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { Outlet, useLocation, useNavigate } from "react-router-dom"
import { theme } from "../theme"
import Sidebar from "./Sidebar"
import SpotlightOverlay from "./tutorial/SpotlightOverlay"
import { useChat } from "../hooks/useChat"

export default function AppLayout() {
  const { t } = useTranslation()
  const location = useLocation()
  const navigate = useNavigate()
  const { sessions, fetchSessions, renameSession, deleteSession } = useChat()

  useEffect(() => {
    fetchSessions()
  }, [fetchSessions, location.pathname])

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

  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        background: theme.bg,
        overflow: "hidden",
      }}
    >
      <Sidebar
        sessions={sessions}
        onNewChat={handleNewChat}
        onRenameChat={handleRenameChat}
        onDeleteChat={handleDeleteChat}
      />
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          background: theme.bg,
        }}
      >
        <Outlet />
        <SpotlightOverlay />
      </div>
    </div>
  )
}
