import { useState, useCallback } from "react"

export default function useJournalHighlights() {
  const [highlights, setHighlights] = useState([])
  const [selectedText, setSelectedText] = useState("")
  const [hasSelection, setHasSelection] = useState(false)

  const handleMouseUp = useCallback(() => {
    const sel = window.getSelection()
    const text = sel?.toString().trim()
    if (text && text.length > 2) setSelectedText(text)
    else setSelectedText("")
  }, [])

  const saveHighlight = useCallback(() => {
    if (!selectedText || highlights.includes(selectedText)) return
    setHighlights((h) => [...h, selectedText])
    setSelectedText("")
    window.getSelection()?.removeAllRanges()
  }, [selectedText, highlights])

  return { highlights, setHighlights, selectedText, setSelectedText, hasSelection, setHasSelection, handleMouseUp, saveHighlight }
}
