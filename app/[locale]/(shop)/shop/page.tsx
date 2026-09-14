import { cache } from 'react'
import type { Metadata } from 'next'
import { notFound, permanentRedirect } from 'next/navigation'
import { normalizeLocale } from '@/i18n/locale'
import { API_CONFIG } from '@/lib/api-config'
import { catalogHref } from '@/lib/catalog/registry'
import { constructionCopy } from '@/lib/seo/construction-copy'
import { buildPageMetadata, localizedUrl } from '@/lib/seo/metadata'
import { normalizeShopParams, shopApiRequest, shopFilterState, type ShopSearchParams } from '@/lib/seo/shop-url'
import type { ProductsListResponse } from '@/types/api/products'
import { publicProductsResponse } from '@/lib/catalog/public-products'
import ShopPageClient from './shop-page-client'

type Props = { params: Promise<{ locale?: string }>; searchParams: Promise<ShopSearchParams> }
const TRACKING = /^(utm_[a-z0-9_]+|gclid|fbclid|msclkid)$/i
function withQuery(path: string, query: URLSearchParams) { return `${path}${query.size ? `?${query}` : ''}` }
function appendTracking(target: URLSearchParams, source: ShopSearchParams) {
  for (const [key, raw] of Object.entries(source)) if (TRACKING.test(key)) for (const value of Array.isArray(raw) ? raw : [raw]) if (value) target.append(key, value)
}
function editorialTarget(locale: string, normalized: ReturnType<typeof normalizeShopParams>, source: ShopSearchParams) {
  const active = Object.entries(normalized.normalized).filter(([, value]) => Boolean(value)).map(([key]) => key)
  let path: string | null = null
  if (active.length === 1 && active[0] === 'category_id' && normalized.categoryIds.length === 1) path = catalogHref(locale, 'categories', normalized.categoryIds[0])
  if (active.length === 1 && active[0] === 'brand_id' && normalized.brandIds.length === 1) path = catalogHref(locale, 'marques', normalized.brandIds[0])
  if (!path || path.includes('/shop?')) return null
  const query = new URLSearchParams()
  if (normalized.page > 1) query.set('page', String(normalized.page))
  appendTracking(query, source)
  return withQuery(path, query)
}
function apiUrl(request: ReturnType<typeof shopApiRequest>) {
  const query = new URLSearchParams()
  for (const [key, value] of Object.entries(request)) if (value !== undefined) query.set(key, Array.isArray(value) ? value.join(',') : String(value))
  return `${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PRODUCTS}?${query}`
}
const resolveShop = cache(async (props: Props) => {
  const [{ locale: rawLocale }, source] = await Promise.all([props.params, props.searchParams])
  const locale = normalizeLocale(rawLocale)
  const normalized = normalizeShopParams(source)
  const editorial = editorialTarget(locale, normalized, source)
  if (editorial) permanentRedirect(editorial)
  if (normalized.changed) permanentRedirect(withQuery(`/${locale}/shop`, normalized.navigation))
  const response = await fetch(apiUrl(shopApiRequest(normalized)), { next: { revalidate: 120 }, headers: { Platform: 'web' }, signal: AbortSignal.timeout(15000) })
  if (!response.ok) throw new Error(`Catalogue products API HTTP ${response.status}`)
  const data = await response.json() as ProductsListResponse
  if (!Array.isArray(data.products) || !data.pagination || !Number.isSafeInteger(data.pagination.total_pages)) throw new Error('Catalogue products API response is invalid')
  if (normalized.page > 1 && (data.pagination.total_pages === 0 || normalized.page > data.pagination.total_pages)) notFound()
  return { locale, normalized, data: publicProductsResponse(data) }
})
export async function generateMetadata(props: Props): Promise<Metadata> {
  const { locale, normalized, data } = await resolveShop(props)
  const copy = constructionCopy[locale]
  const path = withQuery('/shop', normalized.canonical)
  const pageWord = { fr: 'page', ar: 'صفحة', en: 'page', zh: '第' }[locale]
  const pageSuffix = normalized.page > 1 ? ` — ${pageWord} ${normalized.page}` : ''
  const metadata = buildPageMetadata({ locale, path, title: `${copy.shopTitle}${pageSuffix}`, description: copy.description, keywords: copy.keywords, indexable: !normalized.hasFilters && data.pagination.total_items > 0 })
  const equivalentAcrossLanguages = !normalized.normalized.search && !normalized.normalized.colors && !normalized.normalized.units && !normalized.normalized.utility_type
  metadata.alternates = { canonical: localizedUrl(locale, path), ...(equivalentAcrossLanguages ? { languages: Object.fromEntries((['fr', 'ar', 'en', 'zh'] as const).map(language => [language, localizedUrl(language, path)])) } : {}) }
  return metadata
}
export default async function ShopPage(props: Props) {
  const { locale, normalized, data } = await resolveShop(props)
  const copy = constructionCopy[locale]
  return <ShopPageClient initialData={data} initialFilters={shopFilterState(normalized)} heading={copy.shopTitle} description={copy.description} />
}
