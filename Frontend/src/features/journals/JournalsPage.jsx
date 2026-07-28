import { useState, useEffect, useCallback, useRef } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useLocation } from "react-router-dom"
import { Loader, X } from "lucide-react"
import { useJournals } from "../../hooks/useJournals"
import { refreshPinnedJournals } from "../../hooks/usePinnedJournals"
import { journalService } from "../../services/journalService"
import { theme } from "../../theme"
import JournalList from "./components/JournalList"
import JournalEditor from "./components/JournalEditor"
import FolderExplorer from "./folders/FolderExplorer"

const SPILL_PERSONALITY_KEY = "mindly_spill_personality"

function getUniqueTitle(baseTitle, existingJournals, excludeId = null) {
  const existingTitles = new Set(
    existingJournals
      .filter((j) => j.id !== excludeId)
      .map((j) => j.title)
  )
  if (!existingTitles.has(baseTitle)) return baseTitle
  let num = 2
  while (existingTitles.has(`${baseTitle} #${num}`)) num++
  return `${baseTitle} #${num}`
}

function useJournalRoutes() {
  const location = useLocation()
  const parts = location.pathname.replace(/^.*\/journals\/?/, "").split("/").filter(Boolean)
  if (parts.length === 0) return { view: "list" }
  if (parts[0] === "new") return { view: "editor", isNew: true }
  return { view: "editor", id: parts[0] }
}

export default function JournalsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const route = useJournalRoutes()

  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [deleting, setDeleting] = useState(false)
  const [chatAboutItLoading, setChatAboutItLoading] = useState(false)
  const [showFolderExplorer, setShowFolderExplorer] = useState(false)
  const [activeFolder, setActiveFolder] = useState(null)
  const folderFetchRef = useRef(false)

  const {
    journals,
    loading,
    error,
    folders,
    foldersLoading,
    activeFolderId,
    fetchJournals,
    createJournal,
    updateJournal,
    deleteJournal,
    fetchFolders,
    createFolder,
    updateFolder,
    deleteFolder,
    openFolder,
    closeFolder,
    assignJournalFolders,
  } = useJournals()

  useEffect(() => {
    fetchJournals()
    if (!folderFetchRef.current) {
      folderFetchRef.current = true
      fetchFolders()
    }
  }, [fetchJournals, fetchFolders])

  useEffect(() => {
    if (activeFolderId) {
      fetchJournals({ folder_id: activeFolderId })
    } else if (activeFolderId === null && folderFetchRef.current) {
      fetchJournals()
    }
  }, [activeFolderId, fetchJournals])

  useEffect(() => {
    setActiveFolder(folders.find((f) => f.id === activeFolderId) || null)
  }, [activeFolderId, folders])

  useEffect(() => {
    if (!route.view || route.view === "list") {
      if (!activeFolderId) {
        fetchJournals()
      }
    }
  }, [route.view, activeFolderId, fetchJournals])

  const handleBack = () => navigate("/app/journals")

  const handleStartCreate = async () => {
    try {
      const title = getUniqueTitle("Untitled", journals)
      const journal = await journalService.create({
        title,
        content: "<p></p>",
        emojis: ["📝", "", ""],
        folderIds: [],
      })
      refreshPinnedJournals()
      navigate(`/app/journals/${journal.id}`)
    } catch {
    }
  }

  const handleViewDetail = (id) => navigate(`/app/journals/${id}`)

  const handleDelete = async (id) => {
    setDeleting(true)
    try {
      await deleteJournal(id)
      refreshPinnedJournals()
      navigate("/app/journals")
    } catch {
    } finally {
      setDeleting(false)
    }
  }

  const handleToggleFavorite = async (id) => {
    const j = journals.find((x) => x.id === id)
    if (!j) return
    await updateJournal(id, { isFavorite: !j.isFavorite })
  }

  const handleTogglePinned = async (id) => {
    const j = journals.find((x) => x.id === id)
    if (!j) return
    await updateJournal(id, { isPinned: !j.isPinned })
    refreshPinnedJournals()
  }

  const handleToggleAllowAI = async (id) => {
    const j = journals.find((x) => x.id === id)
    if (!j) return
    await updateJournal(id, { allowAI: !j.allowAI })
  }

  const handleChatAboutIt = async (id) => {
    setChatAboutItLoading(true)
    try {
      const j = journals.find((x) => x.id === id)
      if (!j) return
      if (!j.allowAI) {
        await updateJournal(id, { allowAI: true })
      }
      const personality = localStorage.getItem(SPILL_PERSONALITY_KEY) || "empathetic"
      navigate("/app/spill", {
        state: {
          forwardedJournal: { id: j.id, title: j.title, content: j.content },
          personality,
        },
      })
    } catch (err) {
      console.error("Failed to start reflection session:", err)
      setChatAboutItLoading(false)
    }
  }

  const handleOpenFolderExplorer = useCallback(() => {
    setShowFolderExplorer(true)
  }, [])

  const handleCloseFolderExplorer = useCallback(() => {
    setShowFolderExplorer(false)
  }, [])

  const handleSelectFolder = useCallback(
    (folderId) => {
      openFolder(folderId)
      setShowFolderExplorer(false)
    },
    [openFolder],
  )

  const handleCloseFolder = useCallback(() => {
    closeFolder()
    setSearch("")
    setFilter("all")
    setDateFrom("")
    setDateTo("")
  }, [closeFolder])

  useEffect(() => {
    const handleDrop = (e) => {
      const { journalId, folderId } = e.detail
      const journal = journals.find((j) => j.id === journalId)
      if (!journal) return
      const currentIds = journal.folderIds || []
      if (!currentIds.includes(folderId)) {
        assignJournalFolders(journalId, [...currentIds, folderId])
      }
    }
    window.addEventListener("journal-drop-folder", handleDrop)
    return () => window.removeEventListener("journal-drop-folder", handleDrop)
  }, [journals, assignJournalFolders])

  if (route.view === "editor") {
    return (
      <JournalEditor
        journalId={route.id || null}
        isNew={!!route.isNew}
        onBack={handleBack}
        onDelete={handleDelete}
        toggleFavorite={handleToggleFavorite}
        togglePinned={handleTogglePinned}
        toggleAllowAI={handleToggleAllowAI}
        onChatAboutIt={handleChatAboutIt}
        chatAboutItLoading={chatAboutItLoading}
        deleting={deleting}
        onAssignFolders={assignJournalFolders}
        folders={folders}
        journals={journals}
        updateJournal={updateJournal}
      />
    )
  }

  if (loading && journals.length === 0) {
    return (
      <div style={{ padding: "60px 32px", textAlign: "center", color: theme.muted, fontSize: 14 }}>
        {t("journal.loadingJournals")}
      </div>
    )
  }

  if (error && journals.length === 0) {
    return (
      <div style={{ padding: "60px 32px", textAlign: "center", color: "#EF4444", fontSize: 14 }}>
        {t("common.errors.loadJournal", { error })}
      </div>
    )
  }

  return (
    <>
      {activeFolder && (
        <div style={{
          padding: "14px 32px",
          background: `color-mix(in srgb, ${theme.primary} 8%, transparent)`,
          borderBottom: `1px solid color-mix(in srgb, ${theme.primary} 15%, transparent)`,
          display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12,
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 24 }}>{activeFolder.emoji}</span>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: theme.dark, margin: 0 }}>{activeFolder.name}</p>
              <p style={{ fontSize: 12, color: theme.muted, margin: "2px 0 0" }}>
                {journals.length} {journals.length === 1 ? "journal" : "journals"}
              </p>
            </div>
          </div>
          <button
            onClick={handleCloseFolder}
            style={{
              display: "flex", alignItems: "center", gap: 6, padding: "7px 14px",
              borderRadius: 10, border: "none", background: "var(--color-card, white)",
              color: theme.dark, fontSize: 12, fontWeight: 500, cursor: "pointer", transition: "all 0.15s",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = theme.bg }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "var(--color-card, white)" }}
          >
            <X size={14} /> Back to All Journals
          </button>
        </div>
      )}

      <JournalList
        journals={journals}
        search={search}
        setSearch={setSearch}
        loading={loading}
        filter={filter}
        onFilterChange={setFilter}
        dateFrom={dateFrom}
        dateTo={dateTo}
        onDateFromChange={setDateFrom}
        onDateToChange={setDateTo}
        onViewDetail={handleViewDetail}
        onStartCreate={handleStartCreate}
        toggleFavorite={handleToggleFavorite}
        togglePinned={handleTogglePinned}
        folders={folders}
        activeFolderId={activeFolderId}
        onOpenFolderExplorer={handleOpenFolderExplorer}
        onAssignFolders={assignJournalFolders}
      />

      <FolderExplorer
        open={showFolderExplorer}
        onClose={handleCloseFolderExplorer}
        folders={folders}
        foldersLoading={foldersLoading}
        activeFolderId={activeFolderId}
        onSelectFolder={handleSelectFolder}
        onCreateFolder={createFolder}
        onUpdateFolder={updateFolder}
        onDeleteFolder={deleteFolder}
      />
    </>
  )
}
