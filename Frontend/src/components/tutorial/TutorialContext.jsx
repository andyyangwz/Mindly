import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react"

const STORAGE_HINTS = "mindly_tutorial_hints"
const STORAGE_VIEWED = "mindly_tutorial_viewed"

function loadSet(key) {
  try {
    const raw = localStorage.getItem(key)
    return raw ? new Set(JSON.parse(raw)) : new Set()
  } catch {
    return new Set()
  }
}

function saveSet(key, set) {
  try {
    localStorage.setItem(key, JSON.stringify([...set]))
  } catch { /* storage full */ }
}

const TutorialContext = createContext(null)

export function TutorialProvider({ children }) {
  const [tutorialId, setTutorialId] = useState(null)
  const [tutorialStep, setTutorialStep] = useState(-1)
  const [spotlightRect, setSpotlightRect] = useState(null)
  const [smartHint, setSmartHint] = useState(null)
  const hintTimers = useRef({})

  const dismissedHints = useRef(loadSet(STORAGE_HINTS))
  const viewedTutorials = useRef(loadSet(STORAGE_VIEWED))

  const openTutorial = useCallback((id, config) => {
    const el = document.querySelector(`[data-tutorial-target="${id}"]`)
    if (!el) return

    const rect = el.getBoundingClientRect()
    setSpotlightRect(rect)
    setTutorialId(id)

    viewedTutorials.current.add(id)
    saveSet(STORAGE_VIEWED, viewedTutorials.current)
  }, [])

  const updateSpotlightTarget = useCallback((targetId) => {
    const el = document.querySelector(`[data-tutorial-target="${targetId}"]`)
    if (el) setSpotlightRect(el.getBoundingClientRect())
  }, [])

  const closeTutorial = useCallback(() => {
    setTutorialId(null)
    setSpotlightRect(null)
    setTutorialStep(-1)
  }, [])

  const isHintDismissed = useCallback((id) => {
    return dismissedHints.current.has(id)
  }, [])

  const dismissHint = useCallback((id) => {
    dismissedHints.current.add(id)
    saveSet(STORAGE_HINTS, dismissedHints.current)
    setSmartHint((prev) => (prev && prev.id === id ? null : prev))
  }, [])

  const showHint = useCallback((id, text) => {
    if (dismissedHints.current.has(id)) return
    const el = document.querySelector(`[data-tutorial-target="${id}"]`)
    if (!el) return
    const rect = el.getBoundingClientRect()
    setSmartHint({ id, text, rect })
  }, [])

  const hideHint = useCallback((id) => {
    setSmartHint((prev) => (prev && prev.id === id ? null : prev))
  }, [])

  const hasViewedTutorial = useCallback((id) => {
    return viewedTutorials.current.has(id)
  }, [])

  useEffect(() => {
    const handler = () => {
      if (tutorialId) {
        const el = document.querySelector(`[data-tutorial-target="${tutorialId}"]`)
        if (el) setSpotlightRect(el.getBoundingClientRect())
      }
    }
    window.addEventListener("scroll", handler, true)
    window.addEventListener("resize", handler)
    return () => {
      window.removeEventListener("scroll", handler, true)
      window.removeEventListener("resize", handler)
    }
  }, [tutorialId])

  useEffect(() => {
    if (!tutorialId) return
    const handler = (e) => {
      if (e.key === "Escape") closeTutorial()
    }
    window.addEventListener("keydown", handler)
    return () => window.removeEventListener("keydown", handler)
  }, [tutorialId, closeTutorial])

  return (
    <TutorialContext.Provider
      value={{
        tutorialId,
        tutorialStep,
        spotlightRect,
        smartHint,
        openTutorial,
        closeTutorial,
        updateSpotlightTarget,
        setTutorialStep,
        isHintDismissed,
        dismissHint,
        showHint,
        hideHint,
        hasViewedTutorial,
      }}
    >
      {children}
    </TutorialContext.Provider>
  )
}

export function useTutorial() {
  const ctx = useContext(TutorialContext)
  if (!ctx) throw new Error("useTutorial must be used within TutorialProvider")
  return ctx
}
