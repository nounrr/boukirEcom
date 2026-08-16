import type { MetadataRoute } from "next"

import { getSiteUrl, localizedPath } from "@/lib/seo/metadata"
import { getPublicMaalemSitemapEntries, getPublicServiceSitemapEntries } from "@/lib/service-requests"

type StaticEntry = {
  path: string
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]
  priority: number
}

const STATIC_PAGES: StaticEntry[] = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/shop", changeFrequency: "daily", priority: 0.9 },
  { path: "/services", changeFrequency: "daily", priority: 0.85 },
  { path: "/maalems", changeFrequency: "daily", priority: 0.85 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.6 },
]

function toUrl(origin: string, path: string) {
  return `${origin}${path}`
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl()
  const origin = siteUrl.origin
  const now = new Date()

  const entries: MetadataRoute.Sitemap = []

  for (const page of STATIC_PAGES) {
    const alternates = {
      fr: toUrl(origin, localizedPath("fr", page.path)),
      ar: toUrl(origin, localizedPath("ar", page.path)),
      en: toUrl(origin, localizedPath("en", page.path)),
      zh: toUrl(origin, localizedPath("zh", page.path)),
    }

    const localeEntries: Array<{ locale: keyof typeof alternates; path: string; priority: number }> = [
      { locale: "fr", path: localizedPath("fr", page.path), priority: page.priority },
      { locale: "ar", path: localizedPath("ar", page.path), priority: Math.max(0.1, page.priority - 0.05) },
      { locale: "en", path: localizedPath("en", page.path), priority: Math.max(0.1, page.priority - 0.05) },
      { locale: "zh", path: localizedPath("zh", page.path), priority: Math.max(0.1, page.priority - 0.05) },
    ]

    for (const e of localeEntries) {
      entries.push({
        url: toUrl(origin, e.path),
        lastModified: now,
        changeFrequency: page.changeFrequency,
        priority: e.priority,
        alternates: {
          languages: alternates,
        },
      })
    }
  }

  const services = await getPublicServiceSitemapEntries()
  for (const service of services) {
    const path = `/services/${service.id}`
    const alternates = { fr: toUrl(origin, localizedPath("fr", path)), ar: toUrl(origin, localizedPath("ar", path)), en: toUrl(origin, localizedPath("en", path)), zh: toUrl(origin, localizedPath("zh", path)) }
    for (const locale of ["fr", "ar", "en", "zh"] as const) entries.push({ url: alternates[locale], lastModified: service.updated_at ? new Date(service.updated_at) : now, changeFrequency: "weekly", priority: 0.75, alternates: { languages: alternates } })
  }

  const maalems = await getPublicMaalemSitemapEntries()
  for (const maalem of maalems) {
    const path = `/maalems/${maalem.id}`
    const alternates = { fr: toUrl(origin, localizedPath("fr", path)), ar: toUrl(origin, localizedPath("ar", path)), en: toUrl(origin, localizedPath("en", path)), zh: toUrl(origin, localizedPath("zh", path)) }
    for (const locale of ["fr", "ar", "en", "zh"] as const) entries.push({ url: alternates[locale], lastModified: maalem.updated_at ? new Date(maalem.updated_at) : now, changeFrequency: "weekly", priority: 0.7, alternates: { languages: alternates } })
  }

  return entries
}
