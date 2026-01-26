import { routing } from './routing'

export type AppLocale = (typeof routing.locales)[number]

export function normalizeLocale(locale?: string | null): AppLocale {
  if (locale && (routing.locales as readonly string[]).includes(locale)) {
    return locale as AppLocale
  }
  return routing.defaultLocale as AppLocale
}
