import { useState, useEffect } from "react"
import { useTranslation } from "react-i18next"
import { useNavigate, useLocation } from "react-router-dom"
import { Loader } from "lucide-react"
import { useJournals } from "../../hooks/useJournals"
import { theme } from "../../theme"
import JournalList from "./JournalList"
import JournalDetail from "./JournalDetail"
import JournalForm from "./JournalForm"

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

  const {
    journals,
    loading,
    error,
    fetchJournals,
    createJournal,
    updateJournal,
    deleteJournal,
  } = useJournals()

  useEffect(() => {
    fetchJournals()
  }, [fetchJournals])

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
    if (editId) {
      await updateJournal(editId, data)
      setEditId(null)
      setForm({ title: "", content: "", emojis: ["", "", ""] })
      navigate(`/app/journals/${editId}`)
    } else {
      await createJournal(data)
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
      />
    )
  }

  if (route.view === "edit") {
    return (
      <JournalForm
        form={form}
        setForm={setForm}
        editId={editId}
        onSave={handleSave}
        onBack={handleBack}
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
          onBack={handleBack}
          onEdit={handleStartEdit}
          onDelete={handleDelete}
          toggleFavorite={handleToggleFavorite}
          togglePinned={handleTogglePinned}
          toggleAllowAI={handleToggleAllowAI}
          onChatAboutIt={() => handleChatAboutIt(journal.id)}
          chatAboutItLoading={chatAboutItLoading}
          deleting={deleting}
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
    />
  )
}
