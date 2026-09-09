import type { MetadataRoute } from 'next'
import { API_CONFIG } from '@/lib/api-config'
import { localizedUrl } from '@/lib/seo/metadata'
import { categories, brands } from './registry'
import { CATALOG_LOCALES } from './i18n'

export async function catalogSitemap(): Promise<MetadataRoute.Sitemap> {
  const response = await fetch(`${API_CONFIG.BASE_URL}/api/ecommerce/products/catalog-pages`, { cache: 'no-store', signal: AbortSignal.timeout(15000) })
  if (!response.ok) throw new Error(`Sitemap: catalog pages HTTP ${response.status}`)
  const counts = await response.json()
  for (const key of ['categories', 'brands']) {
    if (!Array.isArray(counts[key]) || counts[key].some((x: { id: number; total: number }) => !Number.isSafeInteger(x.id) || !Number.isSafeInteger(x.total) || x.total < 0)) throw new Error('Sitemap: invalid catalog counts')
  }
  const entries: MetadataRoute.Sitemap = []
  function add(path: string) {
    const languages = Object.fromEntries(CATALOG_LOCALES.map(locale => [locale, localizedUrl(locale, path)]))
    // No timestamp invented for editorial text or membership changes.
    for (const url of Object.values(languages)) entries.push({ url, alternates: { languages } })
  }
  for (const category of categories) {
    if (!counts.categories.some((c: { id: number; total: number }) => c.id === category.id && c.total > 0)) continue
    if (category.search) {
      const query = new URLSearchParams({ category_id: String(category.id), search: category.search, per_page: '1' })
      const result = await fetch(`${API_CONFIG.BASE_URL}/api/ecommerce/products?${query}`, { cache: 'no-store', signal: AbortSignal.timeout(15000) })
      if (!result.ok) throw new Error('Sitemap: focused category unavailable')
      const data = await result.json()
      if (!Number.isSafeInteger(data.pagination?.total_items)) throw new Error('Sitemap: invalid focused category count')
      if (data.pagination.total_items === 0) continue
    }
    add(`/categories/${category.slug}`)
  }
  for (const brand of brands) if (counts.brands.some((b: { id: number; total: number }) => b.id === brand.id && b.total > 0)) add(`/marques/${brand.slug}`)
  return entries
}
