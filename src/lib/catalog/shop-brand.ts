import { brands, catalogPage } from './registry'
import { normalizeShopParams, type ShopSearchParams } from '../seo/shop-url'

/** Only the unmodified single-brand selection is an editorial, indexable page. */
export function shopBrandPage(normalized: ReturnType<typeof normalizeShopParams>) {
  const active = Object.keys(normalized.normalized).filter(key => Boolean(normalized.normalized[key]))
  if (active.length !== 1 || active[0] !== 'brand_id' || normalized.brandIds.length !== 1) return undefined
  const brand = brands.find(item => item.id === Number(normalized.brandIds[0]))
  return brand ? catalogPage('marques', brand.slug) : undefined
}

export function legacyBrandShopHref(locale: string, brandId: number, query: ShopSearchParams) {
  const normalized = normalizeShopParams({ ...query, brand_id: String(brandId) })
  return `/${locale}/shop?${normalized.navigation}`
}

/** Sitemaps accept only the canonical editorial brand query, never arbitrary facets. */
export function isBrandShopUrl(url: URL) {
  return /^\/(fr|ar|en|zh)\/shop$/.test(url.pathname)
    && [...url.searchParams.keys()].length === 1
    && /^\d+$/.test(url.searchParams.get('brand_id') || '')
    && brands.some(brand => String(brand.id) === url.searchParams.get('brand_id'))
}
