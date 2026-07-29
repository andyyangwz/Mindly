import { useState, useEffect, useRef, useCallback } from "react"

export default function useJournalNavigationGuard({ dirtyRef, isInvalid }) {
  const [showInvalidWarning, setShowInvalidWarning] = useState(false)
  const origPushRef = useRef(null)
  const [confirmDelete, setConfirmDelete] = useState(false)

  const isInvalidRef = useRef(false)
  useEffect(() => {
    isInvalidRef.current = isInvalid
  }, [isInvalid])

  useEffect(() => {
    const handler = (e) => {
      if (isInvalidRef.current || dirtyRef.current) {
        e.preventDefault()
        e.returnValue = ""
      }
    }
    window.addEventListener("beforeunload", handler)
    return () => window.removeEventListener("beforeunload", handler)
  }, [dirtyRef])

  useEffect(() => {
    if (!isInvalid) return

    const origPush = window.history.pushState.bind(window.history)
    origPushRef.current = origPush
    let savedUrl = window.location.href

    window.history.pushState = function (state, title, url) {
      if (url !== undefined) {
        let target
        try { target = new URL(url, window.location.origin).href } catch { target = url }
        if (target !== window.location.href) {
          setShowInvalidWarning(true)
          return
        }
      }
      origPush(state, title, url)
      savedUrl = window.location.href
    }

    const handlePopState = () => {
      window.history.pushState(null, "", savedUrl)
      setShowInvalidWarning(true)
    }
    window.addEventListener("popstate", handlePopState)

    return () => {
      window.history.pushState = origPush
      window.removeEventListener("popstate", handlePopState)
    }
  }, [isInvalid])

  const restoreHistory = useCallback(() => {
    if (origPushRef.current) {
      window.history.pushState = origPushRef.current
    }
  }, [])

  return { showInvalidWarning, setShowInvalidWarning, confirmDelete, setConfirmDelete, restoreHistory }
}
