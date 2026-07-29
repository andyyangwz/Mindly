import { useState, useCallback } from "react"
import { config } from "../../config"
import { textToHtml } from "../../utils/editor"

const API = config.API_BASE_URL

export default function useJournalAI({ editorRef, saveNow, setContent }) {
  const [aiPhase, setAiPhase] = useState("idle")
  const [aiError, setAiError] = useState(null)

  const isProcessing = aiPhase !== "idle"

  const callTransform = useCallback(async (endpoint, label) => {
    const editor = editorRef?.current?.getEditor
      ? editorRef.current.getEditor()
      : editorRef?.current
    if (!editor || !editor.state || editor.state.selection.empty) {
      setAiError("Select text in the editor to transform.")
      return
    }
    const preserveStructure = endpoint === "smoothen" || endpoint === "restructure"
    const selectedHTML = editorRef.current?.getSelectedHTML?.() || ""
    const selectedTextContent = editorRef.current?.getSelectedText?.() || ""
    const input = preserveStructure ? { html: selectedHTML } : { text: selectedTextContent }
    const raw = preserveStructure ? selectedHTML : selectedTextContent
    if (!raw.trim()) {
      setAiError("Selected text is empty. Nothing to transform.")
      return
    }
    setAiPhase(endpoint)
    setAiError(null)
    try {
      const token = localStorage.getItem("mindly-token")
      const res = await fetch(`${API}/journals/voice/${endpoint}`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify(input),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || `${label} failed`)
      const result = data.html || textToHtml(data.text)
      editorRef.current?.replaceSelection?.(result)
      if (setContent) {
        const html = editorRef.current?.getEditor?.()?.getHTML?.() || ""
        setContent(html)
      }
      if (saveNow) saveNow()
      setAiPhase("idle")
    } catch (err) {
      setAiError(err.message)
      setAiPhase("idle")
    }
  }, [editorRef, saveNow, setContent])

  return { aiPhase, isProcessing, aiError, setAiError, callTransform }
}
