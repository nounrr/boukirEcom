import { cache } from "react"
import { productIdFromSegment } from './product-url'

import { API_CONFIG } from "@/lib/api-config"
import { getLocalizedCategoryName, getLocalizedProductName } from "@/lib/localized-fields"
import type { ProductDetail } from "@/types/api/products"
import { publicProductDetail } from '@/lib/catalog/public-products'
import { isOutOfStockLike } from '@/lib/stock'
import { resolveProductOfferPrice } from '@/lib/product-price'

export const PRODUCT_CACHE_SECONDS = 300

export function productCacheTag(id: string | number): string {
  return `product:${id}`
}

function isNumericId(value: string | undefined | null): value is string {
  return typeof value === "string" && /^\d+$/.test(value)
}

export type ProductLookup =
  | { status: 'invalid'; product: null }
  | { status: 'missing'; product: null }
  | { status: 'found'; product: ProductDetail }

export class ProductBackendUnavailableError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options)
    this.name = 'ProductBackendUnavailableError'
  }
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

export const getPublicProduct = cache(async (segment: string | undefined | null): Promise<ProductLookup> => {
  const id = productIdFromSegment(segment)
  if (!isNumericId(id)) return { status: 'invalid', product: null }

  const url = `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PRODUCTS}/${id}`

  try {
    const res = await fetch(url, {
      // Product pages should be crawlable; keep metadata relatively fresh without hammering the API.
      next: { revalidate: PRODUCT_CACHE_SECONDS, tags: [productCacheTag(id)] },
      headers: {
        "Content-Type": "application/json",
        Platform: "web",
      },
    })

    if (res.status === 404) return { status: 'missing', product: null }
    if (!res.ok) throw new ProductBackendUnavailableError(`Product API HTTP ${res.status}`)

    const data = (await res.json()) as ProductDetail
    if (!data || typeof (data as any).id !== "number" || data.id !== Number(id)) {
      throw new ProductBackendUnavailableError('Invalid product API response')
    }

    return { status: 'found', product: publicProductDetail(data) }
  } catch (error) {
    // A temporary API outage must not turn an existing indexed product into a 404.
    if (error instanceof ProductBackendUnavailableError) throw error
    throw new ProductBackendUnavailableError('Product API is temporarily unavailable', { cause: error })
  }
})

export async function getProductForSeo(id: string | undefined | null): Promise<ProductDetail | null> {
  const result = await getPublicProduct(id)
  return result.product
}

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

  const price = resolveProductOfferPrice(product).price

  const inStock = !isOutOfStockLike(product)

  const metaKeywords = [
    productName,
    categoryName,
    brandName,
    "droguerie",
    "outillage",
    ...(product.variants || []).map(variant => variant.variant_name),
    locale === 'ar' ? 'طنجة' : locale === 'zh' ? '丹吉尔' : locale === 'en' ? 'Tangier' : 'Tanger',
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
    // A missing/zero database price is not a valid purchasable Offer.
    price,
    currency: "MAD",
    inStock,
  }
}
