/**
 * Site-wide structured data (Organization, store, WebSite) built only from the
 * verified business details in src/lib/contact.ts — nothing is invented:
 * a value that cannot be derived from those details is simply omitted.
 */
import type { AppLocale } from "@/i18n/locale"
import { CONTACT, toWhatsappDigits } from "@/lib/contact"
import { getSiteUrl, localizedUrl } from "./urls"

type JsonLd = Record<string, unknown>

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"] as const
const FR_DAYS = ["lun", "mar", "mer", "jeu", "ven", "sam", "dim"] as const

/** "Lun – Sam · 08h00 – 19h00" → one OpeningHoursSpecification; anything else → none. */
function openingHours(raw: string): JsonLd[] | undefined {
  const match = raw.toLowerCase().match(/^(lun|mar|mer|jeu|ven|sam|dim)\w*\.?\s*[–-]\s*(lun|mar|mer|jeu|ven|sam|dim)\w*\.?\s*·\s*(\d{1,2})h(\d{2})\s*[–-]\s*(\d{1,2})h(\d{2})$/)
  if (!match) return undefined
  const from = FR_DAYS.indexOf(match[1] as (typeof FR_DAYS)[number])
  const to = FR_DAYS.indexOf(match[2] as (typeof FR_DAYS)[number])
  if (from < 0 || to < from) return undefined
  const pad = (h: string) => h.padStart(2, "0")
  return [{
    "@type": "OpeningHoursSpecification",
    dayOfWeek: DAYS.slice(from, to + 1).map((day) => `https://schema.org/${day}`),
    opens: `${pad(match[3])}:${match[4]}`,
    closes: `${pad(match[5])}:${match[6]}`,
  }]
}

/** Coordinates of the store pin, read from the Google Maps link ("@lat,lng"). */
function geo(mapUrl: string): JsonLd | undefined {
  const match = mapUrl.match(/@(-?\d{1,2}\.\d+),(-?\d{1,3}\.\d+)/)
  return match ? { "@type": "GeoCoordinates", latitude: Number(match[1]), longitude: Number(match[2]) } : undefined
}

/** "STREET - CITY" → street only (the city is given separately). */
function street(address: string): string {
  const parts = address.split(/\s+-\s+/)
  return parts.length > 1 && parts.at(-1)?.toLowerCase() === CONTACT.city.toLowerCase() ? parts.slice(0, -1).join(" - ") : address
}

export function siteJsonLd(locale: AppLocale): JsonLd {
  const site = getSiteUrl()
  const origin = site.origin
  const home = localizedUrl(locale, "/")
  const logo = new URL("/logo.png", site).toString()
  const digits = toWhatsappDigits(CONTACT.phoneDisplay)
  const telephone = digits ? `+${digits}` : undefined
  const sameAs = CONTACT.socials.map((link) => link.href).filter(Boolean)

  const organization: JsonLd = {
    "@type": "Organization",
    "@id": `${origin}/#organization`,
    name: CONTACT.name,
    legalName: CONTACT.legalName,
    alternateName: "Boukir Construction",
    url: origin,
    logo,
    email: CONTACT.email || undefined,
    telephone,
    sameAs: sameAs.length > 0 ? sameAs : undefined,
  }

  const store: JsonLd = {
    "@type": "HardwareStore",
    "@id": `${origin}/#store`,
    name: CONTACT.legalName,
    url: home,
    image: logo,
    email: CONTACT.email || undefined,
    telephone,
    address: CONTACT.address ? {
      "@type": "PostalAddress",
      streetAddress: street(CONTACT.address),
      addressLocality: CONTACT.city,
      addressCountry: "MA",
    } : undefined,
    geo: geo(CONTACT.mapUrl),
    hasMap: CONTACT.mapUrl || undefined,
    openingHoursSpecification: openingHours(CONTACT.hours),
    parentOrganization: { "@id": `${origin}/#organization` },
  }

  const website: JsonLd = {
    "@type": "WebSite",
    "@id": `${origin}/#website`,
    url: origin,
    name: CONTACT.name,
    inLanguage: ["fr", "ar", "en", "zh"],
    publisher: { "@id": `${origin}/#organization` },
  }

  return { "@context": "https://schema.org", "@graph": [organization, store, website] }
}

/** BreadcrumbList for a top-level page: Home → page. */
export function breadcrumbJsonLd(locale: AppLocale, items: { name: string; path: string }[]): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: localizedUrl(locale, item.path),
    })),
  }
}

/** Serialises JSON-LD safely for an inline <script> (no "</script>" breakout). */
export function jsonLdScript(data: JsonLd): string {
  return JSON.stringify(data).replace(/</g, "\\u003c")
}
