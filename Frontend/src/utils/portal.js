import { useEffect, useState } from "react"
import { createPortal } from "react-dom"

export function Portal({ children, container = document.body }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  if (!mounted) return null
  return createPortal(children, container)
}
