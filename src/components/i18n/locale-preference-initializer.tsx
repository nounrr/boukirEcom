"use client"

import { useEffect } from "react"
import { useLocale } from "next-intl"

const STORAGE_KEY = "boukir_locale"

const SUPPORTED_LOCALES = ["fr", "ar", "en", "zh"] as const
type SupportedLocale = (typeof SUPPORTED_LOCALES)[number]

function isSupportedLocale(value: unknown): value is SupportedLocale {
  return typeof value === "string" && (SUPPORTED_LOCALES as readonly string[]).includes(value)
}

export function LocalePreferenceInitializer() {
  const locale = useLocale()

  useEffect(() => {
    // An explicit /fr, /ar, /en or /zh URL is authoritative. Remember it for
    // the language selector, but never rewrite it from an older preference.
    try {
      if (isSupportedLocale(locale)) window.localStorage.setItem(STORAGE_KEY, locale)
    } catch {
      // ignore
    }
  }, [locale])

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
