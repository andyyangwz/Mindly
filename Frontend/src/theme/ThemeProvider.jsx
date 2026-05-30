import { createContext, useContext, useEffect, useState, useCallback } from "react"

const ThemeContext = createContext(null)

const STORAGE_KEY = "mindly-theme"

function getInitialTheme() {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === "light" || stored === "dark" || stored === "system") return stored
  } catch {}
  return "system"
}

function getSystemPref() {
  if (typeof window === "undefined") return "light"
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

export function ThemeProvider({ children }) {
  const [preference, setPreference] = useState(getInitialTheme)
  const [systemPref, setSystemPref] = useState(getSystemPref)

  useEffect(() => {
    const mq = window.matchMedia("(prefers-color-scheme: dark)")
    const handler = (e) => setSystemPref(e.matches ? "dark" : "light")
    mq.addEventListener("change", handler)
    return () => mq.removeEventListener("change", handler)
  }, [])

  const resolved = preference === "system" ? systemPref : preference

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", resolved)
  }, [resolved])

  const setTheme = useCallback((t) => {
    setPreference(t)
    try {
      localStorage.setItem(STORAGE_KEY, t)
    } catch {}
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(resolved === "light" ? "dark" : "light")
  }, [resolved, setTheme])

  const value = { theme: preference, resolvedTheme: resolved, setTheme, toggleTheme }

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider")
  return ctx
}
