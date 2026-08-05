import type { MetadataRoute } from "next"

import { getSiteUrl, localizedPath } from "@/lib/seo/metadata"

type StaticEntry = {
  path: string
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]
  priority: number
}

const STATIC_PAGES: StaticEntry[] = [
  { path: "/", changeFrequency: "daily", priority: 1 },
  { path: "/shop", changeFrequency: "daily", priority: 0.9 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.6 },
]

function toUrl(origin: string, path: string) {
  return `${origin}${path}`
}

export default function sitemap(): MetadataRoute.Sitemap {
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

  return entries
}
