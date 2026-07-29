import { useState, useEffect, useRef } from "react"
import QUOTES from "../../features/dashboard/data/quotes"
import { getRandomItem } from "../../features/dashboard/utils/randomizer"

export function useRandomDashboardContent() {
  const lastQuoteIndex = useRef(null)
  const [quote, setQuote] = useState(null)

  useEffect(() => {
    const result = getRandomItem(QUOTES, lastQuoteIndex.current)
    lastQuoteIndex.current = result.index
    setQuote(result.item)
  }, [])

  return { quote }
}
