import { useState, useEffect, useCallback, useRef } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useLocation } from "react-router-dom"
import { Loader, FolderOpen, X } from "lucide-react"
import { useJournals } from "../../hooks/useJournals"
import { theme } from "../../theme"
import JournalList from "./JournalList"
import JournalDetail from "./JournalDetail"
import JournalForm from "./JournalForm"
import FolderExplorer from "./FolderExplorer"

const SPILL_PERSONALITY_KEY = "mindly_spill_personality"

function useJournalRoutes() {
  const location = useLocation()
  const parts = location.pathname.replace(/^.*\/journals\/?/, "").split("/").filter(Boolean)

  if (parts.length === 0) return { view: "list" }
  if (parts[0] === "new") return { view: "create" }
  if (parts[0] === "add") return { view: "create" }
  if (parts[1] === "edit") return { view: "edit", id: parts[0] }
  return { view: "detail", id: parts[0] }
}

export default function JournalsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const route = useJournalRoutes()

  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [editId, setEditId] = useState(null)
  const [form, setForm] = useState({
    title: "",
    content: "",
    emojis: ["", "", ""],
  })
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

  useEffect(() => {
    if (route.view === "create") {
      setForm({ title: "", content: "", emojis: ["", "", ""] })
      setEditId(null)
    } else if (route.view === "edit" && route.id) {
      const j = journals.find(x => x.id === route.id)
      if (j && editId !== route.id) {
        setEditId(route.id)
        setForm({
          title: j.title,
          content: j.content,
          emojis:
            j.emojis.length >= 3
              ? [...j.emojis]
              : [...j.emojis, ...Array(3 - j.emojis.length).fill("")],
        })
      }
    }
  }, [route.view, route.id, journals, editId])

  const handleBack = () => navigate("/app/journals")

  const handleStartCreate = () => navigate("/app/journals/new")

  const handleViewDetail = (id) => navigate(`/app/journals/${id}`)

  const handleStartEdit = (id) => navigate(`/app/journals/${id}/edit`)

  const handleSave = async (data) => {
    const { folderIds, ...journalData } = data
    if (editId) {
      await updateJournal(editId, journalData)
      if (folderIds !== undefined) {
        await assignJournalFolders(editId, folderIds)
      }
      setEditId(null)
      setForm({ title: "", content: "", emojis: ["", "", ""] })
      navigate(`/app/journals/${editId}`)
    } else {
      const created = await createJournal(journalData)
      if (folderIds && folderIds.length > 0) {
        await assignJournalFolders(created.id, folderIds)
      }
      setForm({ title: "", content: "", emojis: ["", "", ""] })
      navigate("/app/journals")
    }
  }

  const handleDelete = async (id) => {
    setDeleting(true)
    try {
      await deleteJournal(id)
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

      const personality =
        localStorage.getItem(SPILL_PERSONALITY_KEY) || "empathetic"

      navigate("/app/spill", {
        state: {
          forwardedJournal: {
            id: j.id,
            title: j.title,
            content: j.content,
          },
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
    [openFolder]
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

  if (loading && journals.length === 0 && route.view !== "create") {
    return (
      <div
        style={{
          padding: "60px 32px",
          textAlign: "center",
          color: theme.muted,
          fontSize: 14,
        }}
      >
        {t("journal.loadingJournals")}
      </div>
    )
  }

  if (error && journals.length === 0 && route.view !== "create") {
    return (
      <div
        style={{
          padding: "60px 32px",
          textAlign: "center",
          color: "#EF4444",
          fontSize: 14,
        }}
      >
        {t("common.errors.loadJournal", { error })}
      </div>
    )
  }

  if (route.view === "create") {
    return (
      <JournalForm
        form={form}
        setForm={setForm}
        editId={null}
        onSave={handleSave}
        onBack={handleBack}
        folders={folders}
        selectedFolderIds={[]}
      />
    )
  }

  if (route.view === "edit") {
    const journal = journals.find((x) => x.id === route.id)
    return (
      <JournalForm
        form={form}
        setForm={setForm}
        editId={editId}
        onSave={handleSave}
        onBack={handleBack}
        folders={folders}
        selectedFolderIds={journal?.folderIds || []}
      />
    )
  }

  if (route.view === "detail") {
    const journal = journals.find((x) => x.id === route.id)
    if (!journal) {
      if (loading) {
        return (
          <div
            style={{
              padding: "60px 32px",
              textAlign: "center",
              color: theme.muted,
              fontSize: 14,
            }}
          >
            {t("journal.detail.loadingJournal")}
          </div>
        )
      }
      return (
        <div
          style={{
            padding: "60px 32px",
            textAlign: "center",
            color: theme.muted,
            fontSize: 14,
          }}
        >
          {t("journal.detail.notFound")}
        </div>
      )
    }
    return (
      <>
        <JournalDetail
          journal={journal}
          folders={folders}
          onBack={handleBack}
          onEdit={handleStartEdit}
          onDelete={handleDelete}
          toggleFavorite={handleToggleFavorite}
          togglePinned={handleTogglePinned}
          toggleAllowAI={handleToggleAllowAI}
          onChatAboutIt={() => handleChatAboutIt(journal.id)}
          chatAboutItLoading={chatAboutItLoading}
          deleting={deleting}
          onAssignFolders={assignJournalFolders}
        />
        {chatAboutItLoading && (
          <div
            style={{
              position: "fixed",
              inset: 0,
              zIndex: 9999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "rgba(0,0,0,0.25)",
              backdropFilter: "blur(3px)",
              animation: "fadeIn 0.15s ease",
            }}
          >
            <div
              style={{
                background: "var(--color-card, white)",
                borderRadius: 16,
                padding: "28px 36px",
                textAlign: "center",
                boxShadow: "0 8px 40px rgba(0,0,0,0.15)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
              }}
            >
              <Loader size={22} color={theme.primary} className="spin" />
              <p style={{ fontSize: 14, color: theme.dark, fontWeight: 500, margin: 0 }}>
                Preparing reflection session...
              </p>
            </div>
          </div>
        )}
      </>
    )
  }

  return (
    <>
      {activeFolder && (
        <div
          style={{
            padding: "14px 32px",
            background: `color-mix(in srgb, ${theme.primary} 8%, transparent)`,
            borderBottom: `1px solid color-mix(in srgb, ${theme.primary} 15%, transparent)`,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 12,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <span style={{ fontSize: 24 }}>{activeFolder.emoji}</span>
            <div>
              <p style={{ fontSize: 14, fontWeight: 600, color: theme.dark, margin: 0 }}>
                {activeFolder.name}
              </p>
              <p style={{ fontSize: 12, color: theme.muted, margin: "2px 0 0" }}>
                {journals.length} {journals.length === 1 ? "journal" : "journals"}
              </p>
            </div>
          </div>
          <button
            onClick={handleCloseFolder}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              padding: "7px 14px",
              borderRadius: 10,
              border: "none",
              background: "var(--color-card, white)",
              color: theme.dark,
              fontSize: 12,
              fontWeight: 500,
              cursor: "pointer",
              transition: "all 0.15s",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = theme.bg
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "var(--color-card, white)"
            }}
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
