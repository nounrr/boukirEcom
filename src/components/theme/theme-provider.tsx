"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

export type ThemePreference = "light" | "dark" | "system"
export type ResolvedTheme = "light" | "dark"

import { THEME_STORAGE_KEY } from "@/lib/init-scripts"

export { THEME_STORAGE_KEY }


type ThemeContextValue = {
  preference: ThemePreference
  resolved: ResolvedTheme
  setPreference: (next: ThemePreference) => void
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

function readPreference(): ThemePreference {
  try {
    const value = window.localStorage.getItem(THEME_STORAGE_KEY)
    if (value === "light" || value === "dark" || value === "system") return value
  } catch {
    /* storage unavailable */
  }
  return "system"
}

function systemTheme(): ResolvedTheme {
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"
}

function applyTheme(theme: ResolvedTheme, animate: boolean) {
  const root = document.documentElement
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  if (animate && !reduce) {
    root.classList.add("theme-switching")
    window.setTimeout(() => root.classList.remove("theme-switching"), 480)
  }
  root.classList.toggle("dark", theme === "dark")
  root.style.colorScheme = theme
  root.dataset.theme = theme
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>("system")
  const [resolved, setResolved] = useState<ResolvedTheme>("light")

  // Sync React state with what the init script already applied.
  useEffect(() => {
    const pref = readPreference()
    setPreferenceState(pref)
    setResolved(document.documentElement.classList.contains("dark") ? "dark" : "light")
  }, [])

  // Follow the OS while the preference is "system".
  useEffect(() => {
    if (preference !== "system") return
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    const onChange = () => {
      const next = systemTheme()
      setResolved(next)
      applyTheme(next, true)
    }
    media.addEventListener("change", onChange)
    return () => media.removeEventListener("change", onChange)
  }, [preference])

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next)
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {
      /* ignore */
    }
    const theme = next === "system" ? systemTheme() : next
    setResolved(theme)
    applyTheme(theme, true)
  }, [])

  const toggle = useCallback(() => {
    setPreference(resolved === "dark" ? "light" : "dark")
  }, [resolved, setPreference])

  const value = useMemo(() => ({ preference, resolved, setPreference, toggle }), [preference, resolved, setPreference, toggle])

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    return { preference: "system", resolved: "light", setPreference: () => {}, toggle: () => {} }
  }
  return ctx
}
