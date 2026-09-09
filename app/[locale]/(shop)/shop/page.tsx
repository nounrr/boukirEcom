import type { Metadata } from "next"
import { normalizeLocale } from "@/i18n/locale"
import { constructionCopy } from "@/lib/seo/construction-copy"

import { buildPageMetadata } from "@/lib/seo/metadata"

import ShopPageClient from "./shop-page-client"

type SearchParamValue = string | string[] | undefined

function isMeaningfulShopParam(key: string, value: SearchParamValue): boolean {
  if (value == null) return false
  const trimmed = Array.isArray(value) ? value.join(",").trim() : value.trim()
  if (!trimmed) return false

  const lowerKey = key.toLowerCase()
  if (lowerKey === "page" || lowerKey === "per_page") return true

  // Ignore marketing/tracking query params.
  if (lowerKey.startsWith("utm_")) return false
  if (lowerKey === "gclid" || lowerKey === "fbclid" || lowerKey === "msclkid") return false

  // Any other param is considered a filter/sort/search and should not be indexed.
  return true
}

export async function generateMetadata({
  params,
  searchParams,
}: {
  params: Promise<{ locale?: string }>
  searchParams?: Promise<Record<string, SearchParamValue>>
}): Promise<Metadata> {
  const resolvedParams = await params
  const locale = normalizeLocale(resolvedParams?.locale)
  const copy = constructionCopy[locale]

  const resolvedSearchParams = (await searchParams) ?? {}
  const shouldNoIndex = Object.entries(resolvedSearchParams).some(([key, value]) =>
    isMeaningfulShopParam(key, value),
  )

  return buildPageMetadata({
    locale,
    path: "/shop",
    title: copy.shopTitle,
    description: copy.description,
    keywords: copy.keywords,
    indexable: !shouldNoIndex,
  })
}

export default function ShopPage() {
  return <ShopPageClient />
}
