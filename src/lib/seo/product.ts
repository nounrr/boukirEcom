import { cache } from "react"

import { API_CONFIG } from "@/lib/api-config"
import { getLocalizedCategoryName, getLocalizedProductName } from "@/lib/localized-fields"
import type { ProductDetail } from "@/types/api/products"

function isNumericId(value: string | undefined | null): value is string {
  return typeof value === "string" && /^\d+$/.test(value)
}

function stripHtmlToText(input: string): string {
  return input
    .replace(/<[^>]*>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
}

function clampDescription(input: string, maxLen = 160): string {
  const trimmed = input.trim()
  if (trimmed.length <= maxLen) return trimmed
  const clipped = trimmed.slice(0, maxLen + 1)
  const lastSpace = clipped.lastIndexOf(" ")
  return (lastSpace > 80 ? clipped.slice(0, lastSpace) : clipped.slice(0, maxLen)).trim()
}

export const getProductForSeo = cache(async (id: string | undefined | null): Promise<ProductDetail | null> => {
  if (!isNumericId(id)) return null

  const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PRODUCTS}/${id}`

  try {
    const res = await fetch(url, {
      // Product pages should be crawlable; keep metadata relatively fresh without hammering the API.
      next: { revalidate: 300 },
      headers: {
        "Content-Type": "application/json",
        Platform: "web",
      },
    })

    if (!res.ok) return null

    const data = (await res.json()) as ProductDetail
    if (!data || typeof (data as any).id !== "number") return null

    return data
  } catch {
    return null
  }
})

export function getLocalizedProductDescription(product: ProductDetail, locale: string): string {
  const raw =
    locale === "ar"
      ? product.description_ar
      : locale === "en"
        ? product.description_en
        : locale === "zh"
          ? product.description_zh
          : product.description

  return (raw ?? "").toString()
}

export function buildProductSeoText(input: {
  product: ProductDetail
  locale: string
}): {
  productName: string
  categoryName: string
  brandName: string
  metaTitle: string
  metaDescription: string
  metaKeywords: string[]
  imageUrl: string | null
  price: number | null
  currency: "MAD"
  inStock: boolean
} {
  const { product, locale } = input

  const productName = getLocalizedProductName(product, locale).trim() || product.designation
  const categoryName = getLocalizedCategoryName(product.categorie, locale).trim()
  const brandName = (product.brand?.nom ?? "").toString().trim()

  const baseTitle = categoryName ? `${productName} — ${categoryName}` : productName

  const rawDescription = getLocalizedProductDescription(product, locale)
  const cleanDescription = stripHtmlToText(rawDescription)

  const fallbackDescription =
    locale === "ar"
      ? `اشترِ ${productName}${categoryName ? ` من قسم ${categoryName}` : ""} مع توصيل داخل المغرب.`
      : locale === "en"
        ? `Buy ${productName}${categoryName ? ` in ${categoryName}` : ""} with delivery in Morocco.`
        : locale === "zh"
          ? `购买${productName}${categoryName ? `（${categoryName}）` : ""}，支持摩洛哥配送。`
          : `Achetez ${productName}${categoryName ? ` dans ${categoryName}` : ""} avec livraison au Maroc.`

  const metaDescription = clampDescription(cleanDescription || fallbackDescription, 160)

  const imageUrl = product.image_url ? product.image_url.toString() : null

  const price =
    product.has_promo && product.prix_promo != null
      ? Number(product.prix_promo)
      : product.prix_vente != null
        ? Number(product.prix_vente)
        : null

  const inStock = Boolean(product.in_stock) || Number(product.quantite_disponible) > 0

  const metaKeywords = [
    productName,
    categoryName,
    brandName,
    "droguerie",
    "outillage",
    "maison",
    "Maroc",
    "Boukir Diamond",
  ].filter((x): x is string => typeof x === "string" && x.trim().length > 0)

  return {
    productName,
    categoryName,
    brandName,
    metaTitle: baseTitle,
    metaDescription,
    metaKeywords,
    imageUrl,
    price: Number.isFinite(price as any) ? (price as number) : null,
    currency: "MAD",
    inStock,
  }
}
