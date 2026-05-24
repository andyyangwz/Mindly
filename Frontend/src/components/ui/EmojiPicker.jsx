import { useState, useRef, useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Search, X } from "lucide-react"
import { theme } from "../../theme"
import { EMOJI_CATEGORIES, getAllEmojis } from "../../data/emojis"

export default function EmojiPicker({ value, onChange, placeholder = "＋", disabled = false, size = 56 }) {
  const { t } = useTranslation()
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState("")
  const containerRef = useRef(null)
  const searchRef = useRef(null)

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
        setSearch("")
      }
    }
    document.addEventListener("mousedown", handler)
    return () => document.removeEventListener("mousedown", handler)
  }, [open])

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (e.key === "Escape") {
        setOpen(false)
        setSearch("")
      }
    }
    document.addEventListener("keydown", handler)
    return () => document.removeEventListener("keydown", handler)
  }, [open])

  useEffect(() => {
    if (open && searchRef.current) {
      searchRef.current.focus()
    }
  }, [open])

  const handleToggle = () => {
    if (!disabled) {
      setOpen((o) => !o)
      if (open) setSearch("")
    }
  }

  const handleSelect = (emoji) => {
    onChange(value === emoji ? "" : emoji)
    setOpen(false)
    setSearch("")
  }

  const handleClear = (e) => {
    e.stopPropagation()
    onChange("")
    setOpen(false)
    setSearch("")
  }

  const q = search.toLowerCase().trim()

  const filteredCategories = useMemo(() => {
    if (!q) return EMOJI_CATEGORIES
    return EMOJI_CATEGORIES.filter((cat) => {
      if (cat.name.toLowerCase().includes(q)) return true
      if (cat.keywords.some((kw) => kw.includes(q))) return true
      return cat.emojis.some((e) => e.includes(q))
    }).filter((cat) => cat.emojis.length > 0)
  }, [q])

  const flatResults = useMemo(() => {
    if (!q) return null
    return getAllEmojis().filter((e) => e.includes(q))
  }, [q])

  return (
    <div ref={containerRef} style={{ position: "relative", display: "inline-block" }}>
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        aria-label={value ? `Emoji: ${value}` : "Select emoji"}
        aria-expanded={open}
        style={{
          width: size,
          height: size,
          fontSize: size * 0.5,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: value && open ? `color-mix(in srgb, ${theme.primary} 15%, transparent)` : value ? "var(--color-card, white)" : theme.bg,
          border: value ? `2px solid ${theme.primary}` : `2px dashed ${theme.border}`,
          borderRadius: 12,
          cursor: disabled ? "not-allowed" : "pointer",
          transition: "all 0.15s",
          position: "relative",
          opacity: disabled ? 0.5 : 1,
          color: value ? undefined : theme.muted,
        }}
      >
        {value || placeholder}
      </button>
      {value && !open && (
        <button
          type="button"
          onClick={handleClear}
          aria-label="Clear emoji"
          style={{
            position: "absolute",
            top: -5,
            right: -5,
            width: 20,
            height: 20,
            borderRadius: "50%",
            background: "#9CA3AF",
            border: "none",
            color: "white",
            fontSize: 10,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 0,
            lineHeight: 1,
          }}
        >
          <X size={10} />
        </button>
      )}

      {open && (
        <div
          role="dialog"
          aria-label="Emoji picker"
          style={{
            position: "absolute",
            top: "100%",
            left: "50%",
            transform: "translateX(-50%)",
            marginTop: 8,
            zIndex: 1000,
          background: "var(--color-card, white)",
          borderRadius: 16,
          border: `1px solid ${theme.border}`,
          boxShadow: "0 12px 48px rgba(0,0,0,0.12)",
            width: 300,
            maxHeight: 340,
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              padding: "8px 12px",
              borderBottom: `1px solid ${theme.border}`,
              display: "flex",
              alignItems: "center",
              gap: 8,
              flexShrink: 0,
            }}
          >
            <Search size={14} color={theme.muted} />
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("common.searchEmojis")}
              role="searchbox"
              style={{
                flex: 1,
                border: "none",
                outline: "none",
                fontSize: 13,
                color: theme.dark,
                background: "transparent",
                fontFamily: "inherit",
              }}
            />
            {search && (
              <button
                type="button"
                onClick={() => setSearch("")}
                aria-label="Clear search"
                style={{ background: "none", border: "none", cursor: "pointer", display: "flex", padding: 0 }}
              >
                <X size={12} color={theme.muted} />
              </button>
            )}
          </div>

          <div style={{ overflowY: "auto", flex: 1, padding: "8px 10px 10px" }}>
            {q && !flatResults.length && (
              <p style={{ fontSize: 13, color: theme.muted, textAlign: "center", padding: "12px 0" }}>
                {t("common.noEmojisFound")}
              </p>
            )}
            {q && flatResults.length > 0 && (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 4 }}>
                {flatResults.map((e, i) => (
                  <EmojiButton key={i} emoji={e} onClick={handleSelect} selected={e === value} />
                ))}
              </div>
            )}
            {!q &&
              filteredCategories.map((cat) => (
                <div key={cat.name} style={{ marginBottom: 6 }}>
                  <p
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: theme.muted,
                      marginBottom: 4,
                      textTransform: "uppercase",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {cat.name}
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: 4 }}>
                    {cat.emojis.map((e, i) => (
                      <EmojiButton key={i} emoji={e} onClick={handleSelect} selected={e === value} />
                    ))}
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
  )
}

function EmojiButton({ emoji, onClick, selected }) {
  return (
    <button
      type="button"
      onClick={() => onClick(emoji)}
      aria-label={emoji}
      style={{
        background: selected ? theme.bg : "none",
        border: selected ? `1px solid color-mix(in srgb, ${theme.primary} 40%, transparent)` : "none",
        borderRadius: 8,
        fontSize: 22,
        width: 32,
        height: 32,
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        transition: "background 0.1s",
        lineHeight: 1,
        padding: 0,
        outline: "none",
      }}
      onMouseEnter={(e) => {
        if (!selected) e.currentTarget.style.background = theme.bg
      }}
      onMouseLeave={(e) => {
        if (!selected) e.currentTarget.style.background = "none"
      }}
    >
      {emoji}
    </button>
  )
}
