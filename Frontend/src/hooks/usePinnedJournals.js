import { useState, useEffect } from "react"
import { journalService } from "../services/journalService"

let _pinnedJournals = []
let _listeners = new Set()

export function usePinnedJournals() {
  const [pinnedJournals, setPinnedJournals] = useState(_pinnedJournals)

  useEffect(() => {
    _listeners.add(setPinnedJournals)
    return () => { _listeners.delete(setPinnedJournals) }
  }, [])

  return pinnedJournals
}

export async function refreshPinnedJournals() {
  try {
    const result = await journalService.getAll({ pinned: true })
    _pinnedJournals = result.journals || []
    _listeners.forEach(listener => listener(_pinnedJournals))
  } catch (e) {
    console.error("Failed to refresh pinned journals", e)
  }
}
