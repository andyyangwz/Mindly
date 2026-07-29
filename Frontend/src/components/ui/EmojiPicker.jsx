import { useState, useRef, useEffect, useMemo } from "react"
import { useTranslation } from "react-i18next"
import { Search, X } from "lucide-react"
import { EMOJI_CATEGORIES, getAllEmojis } from "../../data/emojis"
import "../../styles/shared/index.css"

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
    <div ref={containerRef} className="ep-wrapper">
      <button
        type="button"
        onClick={handleToggle}
        disabled={disabled}
        aria-label={value ? `Emoji: ${value}` : "Select emoji"}
        aria-expanded={open}
        data-has-value={!!value}
        data-open={open}
        className="ep-btn"
        style={{ width: size, height: size, fontSize: size * 0.5 }}
      >
        {value || placeholder}
      </button>
      {value && !open && (
        <button type="button" onClick={handleClear} aria-label="Clear emoji" className="ep-clear-btn">
          <X size={10} />
        </button>
      )}

      {open && (
        <div role="dialog" aria-label="Emoji picker" className="ep-dropdown">
          <div className="ep-search">
            <Search size={14} color="var(--color-muted)" />
            <input
              ref={searchRef}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={t("common.searchEmojis")}
              role="searchbox"
              className="ep-search-input"
            />
            {search && (
              <button type="button" onClick={() => setSearch("")} aria-label="Clear search" className="ep-search-clear">
                <X size={12} color="var(--color-muted)" />
              </button>
            )}
          </div>

          <div className="ep-scroll">
            {q && !flatResults.length && (
              <p className="ep-empty">{t("common.noEmojisFound")}</p>
            )}
            {q && flatResults.length > 0 && (
              <div className="ep-grid">
                {flatResults.map((e, i) => (
                  <EmojiButton key={i} emoji={e} onClick={handleSelect} selected={e === value} />
                ))}
              </div>
            )}
            {!q &&
              filteredCategories.map((cat) => (
                <div key={cat.name} className="ep-category">
                  <p className="ep-category-label">{cat.name}</p>
                  <div className="ep-grid">
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
      className={`ep-emoji-btn${selected ? " ep-emoji-btn--selected" : ""}`}
    >
      {emoji}
    </button>
  )
}
