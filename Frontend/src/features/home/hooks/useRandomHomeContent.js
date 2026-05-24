import { useMemo, useRef } from "react"
import QUOTES from "../data/quotes"
import AI_INSIGHTS from "../data/aiInsights"
import { getRandomItem } from "../utils/randomizer"

export function useRandomHomeContent() {
  const lastQuoteIndex = useRef(null)
  const lastInsightIndex = useRef(null)

  const quote = useMemo(() => {
    const result = getRandomItem(QUOTES, lastQuoteIndex.current)
    lastQuoteIndex.current = result.index
    return result.item
  }, [])

  const insight = useMemo(() => {
    const result = getRandomItem(AI_INSIGHTS, lastInsightIndex.current)
    lastInsightIndex.current = result.index
    return result.item
  }, [])

  return { quote, insight }
}
