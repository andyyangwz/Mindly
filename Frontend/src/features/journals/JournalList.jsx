import { useMemo, useState, useRef, useEffect, useCallback } from "react"
import { useTranslation } from "react-i18next"
import { Search, X, Plus, Star, Pin, CalendarDays, List } from "lucide-react"
import { theme } from "../../theme"
import { formatDate } from "../../utils/formatters"

const FILTERS = [
  { key: "all", icon: List },
  { key: "pinned", icon: Pin },
  { key: "favorites", icon: Star },
]

function formatSingleDate(dateStr) {
  const d = new Date(dateStr + "T00:00:00")
  return d.toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })
}

function formatDateRange(from, to) {
  if (!from && !to) return null

  if (from && to) {
    const fromDate = new Date(from + "T00:00:00")
    const toDate = new Date(to + "T00:00:00")
    const sameYear = fromDate.getFullYear() === toDate.getFullYear()
    const fromStr = fromDate.toLocaleDateString("en-US", {
      day: "numeric", month: "short", ...(sameYear ? {} : { year: "numeric" }),
    })
    const toStr = toDate.toLocaleDateString("en-US", {
      day: "numeric", month: "short", year: "numeric",
    })
    return `${fromStr} - ${toStr}`
  }

  return formatSingleDate(from || to)
}

export default function JournalList({
  journals,
  search,
  setSearch,
  loading,
  filter,
  onFilterChange,
  dateFrom,
  dateTo,
  onDateFromChange,
  onDateToChange,
  onViewDetail,
  onStartCreate,
  toggleFavorite,
  togglePinned,
}) {
  const { t } = useTranslation()
  const [showDatePopover, setShowDatePopover] = useState(false)
  const [draftFrom, setDraftFrom] = useState("")
  const [draftTo, setDraftTo] = useState("")
  const popoverRef = useRef(null)
  const dateBtnRef = useRef(null)

  useEffect(() => {
    if (!showDatePopover) return
    const handleClick = (e) => {
      if (
        popoverRef.current && !popoverRef.current.contains(e.target) &&
        dateBtnRef.current && !dateBtnRef.current.contains(e.target)
      ) {
        setShowDatePopover(false)
      }
    }
    const handleKey = (e) => {
      if (e.key === "Escape") setShowDatePopover(false)
    }
    document.addEventListener("mousedown", handleClick)
    document.addEventListener("keydown", handleKey)
    return () => {
      document.removeEventListener("mousedown", handleClick)
      document.removeEventListener("keydown", handleKey)
    }
  }, [showDatePopover])

  const counts = useMemo(() => {
    const all = journals.length
    const pinned = journals.filter((j) => j.isPinned).length
    const favorites = journals.filter((j) => j.isFavorite).length
    return { all, pinned, favorites }
  }, [journals])

  const dateStatus = useMemo(() => {
    return formatDateRange(dateFrom, dateTo) || "Without Filter"
  }, [dateFrom, dateTo])

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

    if (dateFrom) {
      result = result.filter((j) => j.date >= dateFrom)
    }

    if (dateTo) {
      result = result.filter((j) => j.date <= dateTo)
    }

    result.sort((a, b) => new Date(b.date) - new Date(a.date))

    return result
  }, [journals, filter, search, dateFrom, dateTo])

  const handleOpenDatePopover = useCallback(() => {
    setDraftFrom(dateFrom || new Date().toISOString().slice(0, 10))
    setDraftTo(dateTo || new Date().toISOString().slice(0, 10))
    setShowDatePopover(true)
  }, [dateFrom, dateTo])

  const handleDefault = useCallback(() => {
    onDateFromChange("")
    onDateToChange("")
    setShowDatePopover(false)
  }, [onDateFromChange, onDateToChange])

  const handleCancel = useCallback(() => {
    setShowDatePopover(false)
  }, [])

  const handleProcessFilter = useCallback(() => {
    onDateFromChange(draftFrom)
    onDateToChange(draftTo)
    setShowDatePopover(false)
  }, [draftFrom, draftTo, onDateFromChange, onDateToChange])

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
          marginBottom: 16,
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

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div style={{ display: "flex", gap: 4, background: "var(--color-card, white)", borderRadius: 12, padding: 3, border: `1px solid ${theme.border}` }}>
          {FILTERS.map(({ key, icon: Icon }) => {
            const isActive = filter === key
            const count = counts?.[key] ?? 0
            return (
              <button
                key={key}
                onClick={() => onFilterChange(key)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 5,
                  padding: "6px 13px",
                  borderRadius: 9,
                  border: "none",
                  background: isActive ? theme.primary : "transparent",
                  cursor: "pointer",
                  fontSize: 12,
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? "white" : theme.muted,
                  transition: "all 0.2s",
                  outline: "none",
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = `color-mix(in srgb, ${theme.primary} 8%, transparent)`
                    e.currentTarget.style.color = theme.dark
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.background = "transparent"
                    e.currentTarget.style.color = theme.muted
                  }
                }}
              >
                <Icon size={13} />
                {t(`journal.filter.${key}`)}
                {count > 0 && (
                  <span style={{
                    fontSize: 10,
                    fontWeight: 600,
                    background: isActive ? "rgba(255,255,255,0.25)" : theme.bg,
                    color: isActive ? "white" : theme.muted,
                    borderRadius: 8,
                    padding: "1px 5px",
                    minWidth: 16,
                    textAlign: "center",
                    lineHeight: "15px",
                  }}>
                    {count}
                  </span>
                )}
              </button>
            )
          })}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8, position: "relative" }}>
          <span style={{
            fontSize: 12,
            color: dateFrom || dateTo ? theme.primaryText : theme.muted,
            fontWeight: dateFrom || dateTo ? 500 : 400,
          }}>
            {dateStatus}
          </span>
          <button
            ref={dateBtnRef}
            type="button"
            onClick={handleOpenDatePopover}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "6px 12px",
              borderRadius: 8,
              border: `1px solid ${showDatePopover ? theme.primary : theme.border}`,
              background: showDatePopover ? `color-mix(in srgb, ${theme.primary} 8%, transparent)` : "var(--color-card, white)",
              cursor: "pointer",
              fontSize: 12,
              fontWeight: 500,
              color: showDatePopover ? theme.primary : theme.muted,
              transition: "all 0.2s",
              outline: "none",
            }}
            onMouseEnter={(e) => {
              if (!showDatePopover) {
                e.currentTarget.style.borderColor = theme.primary
                e.currentTarget.style.color = theme.primary
              }
            }}
            onMouseLeave={(e) => {
              if (!showDatePopover) {
                e.currentTarget.style.borderColor = theme.border
                e.currentTarget.style.color = theme.muted
              }
            }}
          >
            <CalendarDays size={13} />
            Date Filter
          </button>

          {showDatePopover && (
            <div
              ref={popoverRef}
              style={{
                position: "absolute",
                top: "calc(100% + 8px)",
                right: 0,
                zIndex: 50,
                background: "var(--color-card, white)",
                borderRadius: 16,
                border: `1px solid ${theme.border}`,
                boxShadow: "0 12px 40px rgba(0,0,0,0.12)",
                padding: "20px 20px 16px",
                minWidth: 280,
                opacity: 0,
                transform: "translateY(-4px) scale(0.97)",
                animation: "popoverIn 0.2s ease forwards",
              }}
            >
              <style>{`
                @keyframes popoverIn {
                  to { opacity: 1; transform: translateY(0) scale(1); }
                }
              `}</style>
              <div style={{ marginBottom: 16 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: theme.muted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6, display: "block" }}>
                  From Date
                </label>
                <input
                  type="date"
                  value={draftFrom}
                  onChange={(e) => setDraftFrom(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: `1px solid ${theme.border}`,
                    background: "var(--color-input)",
                    color: theme.dark,
                    fontSize: 13,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div style={{ marginBottom: 18 }}>
                <label style={{ fontSize: 11, fontWeight: 600, color: theme.muted, textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 6, display: "block" }}>
                  To Date
                </label>
                <input
                  type="date"
                  value={draftTo}
                  onChange={(e) => setDraftTo(e.target.value)}
                  style={{
                    width: "100%",
                    padding: "8px 10px",
                    borderRadius: 8,
                    border: `1px solid ${theme.border}`,
                    background: "var(--color-input)",
                    color: theme.dark,
                    fontSize: 13,
                    outline: "none",
                    boxSizing: "border-box",
                  }}
                />
              </div>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <button
                  type="button"
                  onClick={handleDefault}
                  style={{
                    padding: "7px 14px",
                    borderRadius: 8,
                    border: `1px solid ${theme.border}`,
                    background: "transparent",
                    color: theme.muted,
                    fontSize: 12,
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.borderColor = theme.primary
                    e.currentTarget.style.color = theme.primary
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.borderColor = theme.border
                    e.currentTarget.style.color = theme.muted
                  }}
                >
                  Default
                </button>
                <div style={{ display: "flex", gap: 6 }}>
                  <button
                    type="button"
                    onClick={handleCancel}
                    style={{
                      padding: "7px 14px",
                      borderRadius: 8,
                      border: `1px solid ${theme.border}`,
                      background: "transparent",
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
                      e.currentTarget.style.background = "transparent"
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleProcessFilter}
                    style={{
                      padding: "7px 16px",
                      borderRadius: 8,
                      border: "none",
                      background: `linear-gradient(135deg, ${theme.primary}, ${theme.secondary})`,
                      color: "white",
                      fontSize: 12,
                      fontWeight: 600,
                      cursor: "pointer",
                      transition: "opacity 0.15s",
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.opacity = "0.9"
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.opacity = "1"
                    }}
                  >
                    Process Filter
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

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
                      {formatDate(j.date)}
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
                  <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
                    {j.emojis.map(
                      (e, i) =>
                        e && (
                          <span key={i} style={{ fontSize: 20 }}>
                            {e}
                          </span>
                        )
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
