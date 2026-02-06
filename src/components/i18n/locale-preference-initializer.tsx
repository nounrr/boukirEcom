"use client"

import { useEffect } from "react"
import { useLocale } from "next-intl"
import { usePathname, useRouter, useSearchParams } from "next/navigation"

const STORAGE_KEY = "boukir_locale"

const SUPPORTED_LOCALES = ["fr", "ar", "en", "zh"] as const
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

function isSupportedLocale(value: unknown): value is SupportedLocale {
  return typeof value === "string" && (SUPPORTED_LOCALES as readonly string[]).includes(value)
}

function stripLocalePrefix(pathname: string): string {
  const parts = pathname.split("/").filter(Boolean)
  if (parts.length > 0 && isSupportedLocale(parts[0])) {
    parts.shift()
  }
  return `/${parts.join("/")}`.replace(/\/$/, "") || "/"
}

function buildLocalizedHref(nextLocale: SupportedLocale, basePath: string, queryString: string) {
  const prefix = `/${nextLocale}`
  const path = basePath === "/" ? prefix : `${prefix}${basePath}`
  return queryString ? `${path}?${queryString}` : path
}

export function LocalePreferenceInitializer() {
  const locale = useLocale()
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  useEffect(() => {
    // Avoid errors in environments where localStorage is not available
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY)
      if (!isSupportedLocale(raw)) return
      if (raw === locale) return

      const basePath = stripLocalePrefix(pathname)
      const queryString = searchParams?.toString?.() ?? ""
      const href = buildLocalizedHref(raw, basePath, queryString)

      router.replace(href)
      router.refresh()
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return null
}

export function setPreferredLocale(nextLocale: SupportedLocale) {
  try {
    window.localStorage.setItem(STORAGE_KEY, nextLocale)
  } catch {
    // ignore
  }
}

export function getSupportedLocales() {
  return SUPPORTED_LOCALES
}

export type { SupportedLocale }
