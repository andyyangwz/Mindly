import { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react"
import "../../styles/shared/index.css"

const SlashCommandList = forwardRef(function SlashCommandList({ items, command }, ref) {
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
      <div ref={scrollContainerRef} className="sc-list sc-list--empty">
        <div className="sc-empty-text">No commands found.</div>
      </div>
    )
  }

  return (
    <div ref={scrollContainerRef} className="sc-list">
      {displayItems.map((item, i) => {
        const Icon = item.icon
        const isSelected = i === selectedIndex
        return (
          <button
            key={item.label}
            data-index={i}
            data-selected={isSelected}
            onClick={() => commandRef.current(item)}
            className="sc-item"
            onMouseEnter={() => setSelectedIndex(i)}
          >
            <div data-selected={isSelected} className="sc-item-icon">
              <Icon size={14} />
            </div>
            {item.label}
          </button>
        )
      })}
    </div>
  )
})

export default SlashCommandList
