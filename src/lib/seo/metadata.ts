import type { Metadata } from "next"

import { normalizeLocale, type AppLocale } from "@/i18n/locale"
import { getSiteUrl, localizedUrl, seoImageUrl } from "./urls"

export { getSiteUrl, localePrefix, localizedPath, localizedUrl, seoImageUrl } from "./urls"

const SITE_NAME: Record<AppLocale, string> = {
  fr: "Boukir Diamond",
  ar: "بوكِير دايموند",
  en: "Boukir Diamond",
  zh: "Boukir Diamond",
}

const DEFAULT_DESCRIPTION: Record<AppLocale, string> = {
  fr: "Boukir Diamond — e-commerce au Maroc spécialisé en droguerie et produits d’entretien. Découvrez nos produits, nouveautés et promotions avec livraison et paiement sécurisé.",
  ar: "بوكِير دايموند — تجارة إلكترونية بالمغرب متخصصة في الدروجري ومواد التنظيف. اكتشف المنتجات والجديد والعروض مع توصيل ودفع آمن.",
  en: "Boukir Diamond — Morocco e-commerce specializing in droguerie and cleaning products. Discover new arrivals and deals with delivery and secure payment.",
  zh: "Boukir Diamond — 摩洛哥电商平台，主营日用品（droguerie）与清洁用品。发现新品与优惠，支持配送与安全支付。",
}

const DEFAULT_KEYWORDS: Record<AppLocale, string[]> = {
  fr: [
    "Boukir Diamond",
    "droguerie",
    "droguerie Maroc",
    "produits ménagers",
    "produits d'entretien",
    "nettoyage",
    "hygiène",
    "désinfectant",
    "papier hygiénique",
    "lessive",
    "javel",
    "savon",
    "détergent",
    "quincaillerie",
    "bricolage",
    "Maroc",
    "livraison Maroc",
  ],
  ar: [
    "بوكِير دايموند",
    "دروجري",
    "مواد التنظيف",
    "منتجات منزلية",
    "مواد التعقيم",
    "نظافة",
    "صيانة المنزل",
    "منظفات",
    "مسحوق الغسيل",
    "صابون",
    "مُطهر",
    "ورق صحي",
    "المغرب",
    "توصيل بالمغرب",
  ],
  en: [
    "Boukir Diamond",
    "droguerie",
    "droguerie Morocco",
    "household products",
    "cleaning products",
    "home care",
    "hygiene",
    "disinfectant",
    "detergent",
    "laundry detergent",
    "bleach",
    "soap",
    "paper products",
    "hardware",
    "DIY",
    "Morocco",
    "delivery in Morocco",
  ],
  zh: [
    "Boukir Diamond",
    "droguerie",
    "日用品",
    "清洁用品",
    "家居清洁",
    "消毒",
    "卫生用品",
    "洗衣液",
    "洗涤剂",
    "漂白水",
    "肥皂",
    "纸品",
    "摩洛哥",
    "摩洛哥配送",
  ],
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
  const description = input.description ?? DEFAULT_DESCRIPTION[locale]

  const canonical = localizedUrl(locale, input.path)

  const indexable = input.indexable ?? true
  const keywords = (input.keywords && input.keywords.length > 0)
    ? input.keywords
    : DEFAULT_KEYWORDS[locale]

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
