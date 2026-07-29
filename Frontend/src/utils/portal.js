import { useState } from "react"
import { createPortal } from "react-dom"

export function Portal({ children, container = document.body }) {
  const [mounted] = useState(() => true)

  if (!mounted) return null
  return createPortal(children, container)
}
