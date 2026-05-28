import { useMemo, useRef } from "react"
import QUOTES from "../data/quotes"
import { getRandomItem } from "../utils/randomizer"

export function useRandomHomeContent() {
  const lastQuoteIndex = useRef(null)

  const quote = useMemo(() => {
    const result = getRandomItem(QUOTES, lastQuoteIndex.current)
    lastQuoteIndex.current = result.index
    return result.item
  }, [])

  return { quote }
}
