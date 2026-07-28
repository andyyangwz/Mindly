import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react"
import { theme } from "../../theme"

const SlashCommandList = forwardRef(function SlashCommandList({ items, command, editor }, ref) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [, forceRender] = useState(0)
  const scrollContainerRef = useRef(null)
  const itemsRef = useRef(items)
  const commandRef = useRef(command)

  commandRef.current = command

  useImperativeHandle(ref, () => ({
    updateProps: (props) => {
      itemsRef.current = props.items
      commandRef.current = props.command
      forceRender((n) => n + 1)
    },
    forceUpdate: () => {
      forceRender((n) => n + 1)
    },
    onKeyDown: ({ event }) => {
      if (event.key === "ArrowUp") {
        setSelectedIndex((i) => (i + itemsRef.current.length - 1) % itemsRef.current.length)
        return true
      }
      if (event.key === "ArrowDown") {
        setSelectedIndex((i) => (i + 1) % itemsRef.current.length)
        return true
      }
      if (event.key === "Enter" || event.key === "Tab") {
        const item = itemsRef.current[selectedIndex]
        if (item) commandRef.current(item)
        return true
      }
      return false
    },
  }))

  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return
    const active = container.querySelector(`[data-index="${selectedIndex}"]`)
    if (active) {
      active.scrollIntoView({ block: "nearest" })
    }
  }, [selectedIndex])

  const displayItems = itemsRef.current

  if (!displayItems.length) {
    return (
      <div
        ref={scrollContainerRef}
        style={{
          background: "var(--color-card, white)",
          borderRadius: 12,
          border: `1px solid ${theme.border}`,
          boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
          padding: "8px 4px",
          minWidth: 180,
          maxHeight: 260,
          overflowY: "auto",
        }}
      >
        <div style={{ padding: "8px 12px", fontSize: 12, color: theme.muted }}>
          No commands found.
        </div>
      </div>
    )
  }

  return (
    <div
      ref={scrollContainerRef}
      style={{
        background: "var(--color-card, white)",
        borderRadius: 12,
        border: `1px solid ${theme.border}`,
        boxShadow: "0 8px 32px rgba(0,0,0,0.12)",
        padding: "6px 4px",
        minWidth: 180,
        maxHeight: 260,
        overflowY: "auto",
      }}
    >
      {displayItems.map((item, i) => {
        const Icon = item.icon
        const isSelected = i === selectedIndex
        return (
          <button
            key={item.label}
            data-index={i}
            onClick={() => commandRef.current(item)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 10,
              width: "100%",
              padding: "8px 12px",
              borderRadius: 8,
              border: "none",
              background: isSelected
                ? `color-mix(in srgb, ${theme.primary} 10%, transparent)`
                : "transparent",
              cursor: "pointer",
              textAlign: "left",
              fontSize: 13,
              fontWeight: isSelected ? 500 : 400,
              color: isSelected ? theme.primary : theme.dark,
              transition: "background 0.08s",
            }}
            onMouseEnter={() => setSelectedIndex(i)}
          >
            <div
              style={{
                width: 28,
                height: 28,
                borderRadius: 7,
                background: isSelected
                  ? `color-mix(in srgb, ${theme.primary} 12%, transparent)`
                  : "var(--color-hover)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Icon size={14} color={isSelected ? theme.primary : theme.muted} />
            </div>
            {item.label}
          </button>
        )
      })}
    </div>
  )
})

export default SlashCommandList
