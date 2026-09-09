import type { Metadata } from "next"
import { constructionCopy } from "./construction-copy"

import { normalizeLocale, type AppLocale } from "@/i18n/locale"
import { getSiteUrl, localizedUrl, seoImageUrl } from "./urls"

export { getSiteUrl, localePrefix, localizedPath, localizedUrl, seoImageUrl } from "./urls"

const SITE_NAME: Record<AppLocale, string> = {
  fr: "Boukir Diamond",
  ar: "بوكِير دايموند",
  en: "Boukir Diamond",
  zh: "Boukir Diamond",
}

const OG_LOCALE: Record<AppLocale, string> = {
  fr: "fr_MA",
  ar: "ar_MA",
  en: "en_US",
  zh: "zh_CN",
}

export function buildPageMetadata(input: {
  locale?: string | null
  title?: string
  description?: string
  keywords?: string[]
  path: string
  indexable?: boolean
  imageUrl?: string | null
  openGraphType?: "website" | "article" | "product" | string
  twitterCard?: "summary" | "summary_large_image"
}): Metadata {
  const locale = normalizeLocale(input.locale)
  const siteName = SITE_NAME[locale]

  const titleText = input.title ? `${input.title} | ${siteName}` : siteName
  const description = input.description ?? constructionCopy[locale].description

  const canonical = localizedUrl(locale, input.path)

  const indexable = input.indexable ?? true
  const keywords = (input.keywords && input.keywords.length > 0)
    ? input.keywords
    : constructionCopy[locale].keywords

  const imageUrl = seoImageUrl(input.imageUrl) ?? new URL("/logo.png", getSiteUrl()).toString()
  const images = [{ url: imageUrl }]

  const OPEN_GRAPH_TYPES = [
    "article",
    "website",
    "book",
    "profile",
    "music.song",
    "music.album",
    "music.playlist",
    "music.radio_station",
    "video.movie",
    "video.episode",
    "video.tv_show",
    "video.other",
  ] as const

  type OpenGraphType = (typeof OPEN_GRAPH_TYPES)[number]

  const openGraphType: OpenGraphType = (() => {
    const raw = input.openGraphType
    if (!raw) return "website"
    if (raw === "product") return "website"
    return (OPEN_GRAPH_TYPES as readonly string[]).includes(raw) ? (raw as OpenGraphType) : "website"
  })()

  return {
    metadataBase: getSiteUrl(),
    title: titleText,
    description,
    keywords,
    alternates: {
      canonical,
      languages: {
        fr: localizedUrl("fr", input.path),
        ar: localizedUrl("ar", input.path),
        en: localizedUrl("en", input.path),
        zh: localizedUrl("zh", input.path),
      },
    },
    openGraph: {
      url: canonical,
      title: titleText,
      description,
      type: openGraphType,
      locale: OG_LOCALE[locale],
      siteName,
      images,
    },
    twitter: {
      card: input.twitterCard ?? (input.imageUrl ? "summary_large_image" : "summary"),
      title: titleText,
      description,
      images: images.map((img) => img.url),
    },
    robots: indexable
      ? {
          index: true,
          follow: true,
        }
      : {
          index: false,
          follow: true,
        },
  }
}
