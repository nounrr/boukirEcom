import type { Metadata } from "next"

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
  const locale = resolvedParams?.locale

  const resolvedSearchParams = (await searchParams) ?? {}
  const shouldNoIndex = Object.entries(resolvedSearchParams).some(([key, value]) =>
    isMeaningfulShopParam(key, value),
  )

  return buildPageMetadata({
    locale,
    path: "/shop",
    title: locale === "ar" ? "المنتجات" : "Produits",
    description:
      locale === "ar"
        ? "تصفح كتالوج Boukir Diamond للدروجري ومواد التنظيف: فلترة حسب الفئة والعلامة التجارية والسعر. توصيل داخل المغرب ودفع آمن."
        : "Parcourez le catalogue Boukir Diamond (droguerie, entretien, hygiène) : filtres par catégorie, marque et prix. Livraison au Maroc et paiement sécurisé.",
    keywords:
      locale === "ar"
        ? ["دروجري", "مواد التنظيف", "منتجات منزلية", "منظفات", "المغرب", "Boukir Diamond"]
        : ["droguerie", "produits d'entretien", "hygiène", "nettoyage", "Maroc", "Boukir Diamond"],
    indexable: !shouldNoIndex,
  })
}

export default function ShopPage() {
  return <ShopPageClient />
}