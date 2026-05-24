import { useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Search, X, Plus, Star, Pin } from "lucide-react"
import { theme } from "../../theme"
import { formatDate } from "../../utils/formatters"
import FilterBar from "./FilterBar"

export default function JournalList({
  journals,
  search,
  setSearch,
  loading,
  filter,
  onFilterChange,
  onViewDetail,
  onStartCreate,
  toggleFavorite,
  togglePinned,
}) {
  const { t } = useTranslation()

  const counts = useMemo(() => {
    const all = journals.length
    const pinned = journals.filter((j) => j.isPinned).length
    const favorites = journals.filter((j) => j.isFavorite).length
    return { all, pinned, favorites }
  }, [journals])

  const filtered = useMemo(() => {
    let result = [...journals]

    if (filter === "pinned") {
      result = result.filter((j) => j.isPinned)
    } else if (filter === "favorites") {
      result = result.filter((j) => j.isFavorite)
    }

    if (search) {
      const q = search.toLowerCase()
      result = result.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.content.toLowerCase().includes(q)
      )
    }

    result.sort((a, b) => new Date(b.date) - new Date(a.date))

    return result
  }, [journals, filter, search])

  return (
    <div style={{ padding: "28px 32px", maxWidth: 900, margin: "0 auto" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 20,
          flexWrap: "wrap",
          gap: 12,
        }}
      >
        <h1 style={{ fontSize: 22, fontWeight: 600, color: theme.dark }}>
          {t("journal.list.title")}
        </h1>
        <button
          onClick={onStartCreate}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 6,
            background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
            color: "white",
            border: "none",
            borderRadius: 24,
            padding: "9px 18px",
            cursor: "pointer",
            fontSize: 13,
            fontWeight: 500,
            boxShadow: `0 4px 12px color-mix(in srgb, ${theme.primary} 44%, transparent)`,
          }}
        >
          <Plus size={16} strokeWidth={2.5} /> {t("journal.list.addJournal")}
        </button>
      </div>

      <div
        style={{
          background: "var(--color-card, white)",
          borderRadius: 14,
          border: `1px solid ${theme.border}`,
          padding: "12px 16px",
          marginBottom: 12,
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <Search size={16} color={theme.muted} />
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder={t("journal.list.search")}
          style={{
            flex: 1,
            border: "none",
            outline: "none",
            fontSize: 14,
            color: theme.dark,
            background: "transparent",
          }}
        />
        {search && (
          <button
            onClick={() => setSearch("")}
            style={{ background: "none", border: "none", cursor: "pointer", display: "flex" }}
          >
            <X size={14} color={theme.muted} />
          </button>
        )}
      </div>

      <FilterBar
        activeFilter={filter}
        onChange={onFilterChange}
        counts={counts}
      />

      <p style={{ fontSize: 13, color: theme.muted, marginBottom: 14 }}>
        {loading
          ? t("common.loading")
          : t("journal.list.showing", { count: filtered.length })}
      </p>

      {!loading && filtered.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            padding: "48px 24px",
            background: "var(--color-card, white)",
            borderRadius: 16,
            border: `1px solid ${theme.border}`,
          }}
        >
          <p style={{ fontSize: 40, marginBottom: 12, opacity: 0.4 }}>
            {search ? "🔍" : "📝"}
          </p>
          <p style={{ fontSize: 14, fontWeight: 600, color: theme.dark, marginBottom: 4 }}>
            {search
              ? t("journal.list.noMatch")
              : filter !== "all"
                ? t("journal.list.noFilter", { filter })
                : t("journal.list.noJournals")}
          </p>
          <p style={{ fontSize: 12, color: theme.muted, marginBottom: 16 }}>
            {search
              ? t("journal.list.emptySearch")
              : filter !== "all"
                ? t("journal.list.emptyPinned")
                : t("journal.list.emptyCTA")}
          </p>
          {!search && filter === "all" && (
            <button
              onClick={onStartCreate}
              style={{
                padding: "9px 20px",
                borderRadius: 24,
                border: "none",
                background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                color: "white",
                fontSize: 13,
                fontWeight: 500,
                cursor: "pointer",
              }}
            >
              {t("journal.list.createFirst")}
            </button>
          )}
        </div>
      ) : (
        <div style={{ display: "grid", gap: 12 }}>
          {filtered.map((j) => (
            <div
              key={j.id}
              style={{
                background: "var(--color-card, white)",
                borderRadius: 14,
                border: `1px solid ${theme.border}`,
                padding: "18px 20px",
                cursor: "pointer",
                transition: "all 0.15s",
                boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
              }}
              onClick={() => onViewDetail(j.id)}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  justifyContent: "space-between",
                  gap: 12,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: 6,
                      marginBottom: 10,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        background: theme.bg,
                        color: theme.primaryText,
                        borderRadius: 20,
                        padding: "3px 10px",
                        fontWeight: 500,
                      }}
                    >
                      📅 {formatDate(j.date)}
                    </span>
                    {j.isPinned && (
                      <span
                        style={{
                          fontSize: 11,
                          background: "rgba(59,130,246,0.15)",
                          color: "#60A5FA",
                          borderRadius: 20,
                          padding: "3px 10px",
                          fontWeight: 500,
                        }}
                      >
                        📌 {t("journal.detail.pinned")}
                      </span>
                    )}
                    {j.isFavorite && (
                      <span
                        style={{
                          fontSize: 11,
                          background: "rgba(245,158,11,0.15)",
                          color: "#FBBF24",
                          borderRadius: 20,
                          padding: "3px 10px",
                          fontWeight: 500,
                        }}
                      >
                        ⭐ {t("journal.detail.favorite")}
                      </span>
                    )}
                  </div>
                  <h3
                    style={{
                      fontSize: 15,
                      fontWeight: 600,
                      color: theme.dark,
                      marginBottom: 6,
                    }}
                  >
                    {j.title}
                  </h3>
                  <p
                    style={{
                      fontSize: 13,
                      color: theme.muted,
                      lineHeight: 1.5,
                      marginBottom: 10,
                    }}
                  >
                    {j.preview}
                  </p>
                  <div style={{ display: "flex", gap: 8 }}>
                    {j.emojis.map(
                      (e, i) =>
                        e && (
                          <span key={i} style={{ fontSize: 22 }}>
                            {e}
                          </span>
                        )
                    )}
                  </div>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
                  <button
                    onClick={(ev) => {
                      ev.stopPropagation()
                      togglePinned?.(j.id)
                    }}
                    style={{
                      background: j.isPinned ? "#EEF2FF" : theme.bg,
                      border: "none",
                      borderRadius: 10,
                      padding: 8,
                      cursor: "pointer",
                      display: "flex",
                      transition: "all 0.15s",
                    }}
                  >
                    <Pin
                      size={16}
                      color={j.isPinned ? theme.primary : "#9CA3AF"}
                      fill={j.isPinned ? theme.primary : "none"}
                    />
                  </button>
                  <button
                    onClick={(ev) => {
                      ev.stopPropagation()
                      toggleFavorite(j.id)
                    }}
                    style={{
                      background: j.isFavorite ? "#FFFBEB" : theme.bg,
                      border: "none",
                      borderRadius: 10,
                      padding: 8,
                      cursor: "pointer",
                      display: "flex",
                      transition: "all 0.15s",
                    }}
                  >
                    <Star
                      size={16}
                      color={j.isFavorite ? "#F59E0B" : "#9CA3AF"}
                      fill={j.isFavorite ? "#F59E0B" : "none"}
                    />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
