"use client"

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react"

export type ThemePreference = "light" | "dark" | "system"
export type ResolvedTheme = "light" | "dark"

import { THEME_STORAGE_KEY } from "@/lib/init-scripts"

export { THEME_STORAGE_KEY }


type ThemeContextValue = {
  preference: ThemePreference
  resolved: ResolvedTheme
  setPreference: (next: ThemePreference, origin?: ThemeOrigin) => void
  /** `origin`: screen point the new theme grows from (the button that was clicked) */
  toggle: (origin?: ThemeOrigin) => void
}

/** Screen point (px) where the theme animation starts. */
export type ThemeOrigin = { x: number; y: number }

type ViewTransitionDocument = Document & { startViewTransition?: (update: () => void) => { finished: Promise<void> } }

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

function paintTheme(theme: ResolvedTheme) {
  const root = document.documentElement
  root.classList.toggle("dark", theme === "dark")
  root.style.colorScheme = theme
  root.dataset.theme = theme
}

/**
 * Applies the theme. Animated switch: a circle of the new theme grows from `origin`
 * (View Transitions API), or a slow cross-fade of the colors where it is missing.
 * No animation when reduced motion is asked.
 */
function applyTheme(theme: ResolvedTheme, animate: boolean, origin?: ThemeOrigin) {
  const root = document.documentElement
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
  if (!animate || reduce || root.dataset.theme === theme) {
    paintTheme(theme)
    return
  }
  const doc = document as ViewTransitionDocument
  if (typeof doc.startViewTransition === "function") {
    const x = origin?.x ?? window.innerWidth / 2
    const y = origin?.y ?? 0
    // Radius reaching the farthest corner from the origin.
    const r = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))
    root.style.setProperty("--theme-x", `${x}px`)
    root.style.setProperty("--theme-y", `${y}px`)
    root.style.setProperty("--theme-r", `${Math.ceil(r)}px`)
    root.classList.add("theme-vt")
    try {
      const transition = doc.startViewTransition(() => paintTheme(theme))
      void transition.finished.finally(() => root.classList.remove("theme-vt"))
      return
    } catch {
      root.classList.remove("theme-vt")
    }
  }
  root.classList.add("theme-switching")
  paintTheme(theme)
  window.setTimeout(() => root.classList.remove("theme-switching"), 850)
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

  const setPreference = useCallback((next: ThemePreference, origin?: ThemeOrigin) => {
    setPreferenceState(next)
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, next)
    } catch {
      /* ignore */
    }
    const theme = next === "system" ? systemTheme() : next
    setResolved(theme)
    applyTheme(theme, true, origin)
  }, [])

  const toggle = useCallback(
    (origin?: ThemeOrigin) => {
      setPreference(resolved === "dark" ? "light" : "dark", origin)
    },
    [resolved, setPreference]
  )

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
