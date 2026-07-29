import { useState, useEffect } from "react"
import { journalService } from "../../services/journalService"

let _pinnedJournals = []
let _navbarJournals = []
let _listeners = new Map()

export function usePinnedJournals() {
  const [pinnedJournals, setPinnedJournals] = useState(_pinnedJournals)

  useEffect(() => {
    const id = Symbol()
    _listeners.set(id, { type: "pinned", set: setPinnedJournals })
    return () => { _listeners.delete(id) }
  }, [])

  return pinnedJournals
}

export function useNavbarJournals() {
  const [navbarJournals, setNavbarJournals] = useState(_navbarJournals)

  useEffect(() => {
    const id = Symbol()
    _listeners.set(id, { type: "navbar", set: setNavbarJournals })
    return () => { _listeners.delete(id) }
  }, [])

  return navbarJournals
}

export async function refreshPinnedJournals() {
  try {
    const result = await journalService.getAll({ pinned: true, per_page: 100 })
    _pinnedJournals = result.journals || []
    _navbarJournals = _pinnedJournals
      .filter(j => j.navbarOrder != null)
      .sort((a, b) => a.navbarOrder - b.navbarOrder)
    _listeners.forEach(({ type, set }) => {
      set(type === "pinned" ? _pinnedJournals : _navbarJournals)
    })
  } catch (e) {
    console.error("Failed to refresh pinned journals", e)
  }
}
