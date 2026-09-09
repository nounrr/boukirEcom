import type { MetadataRoute } from 'next'

export type SitemapRecord = { id: number; updated_at: string | null }
export type SitemapData = { products: SitemapRecord[]; services: SitemapRecord[]; maalems: SitemapRecord[] }
const LOCALES = ['fr', 'ar', 'en', 'zh'] as const
const STATIC_PATHS = ['/', '/shop', '/services', '/maalems', '/contact']

function records(value: unknown, name: string): SitemapRecord[] {
  if (!Array.isArray(value)) throw new Error(`Sitemap: missing ${name} array`)
  const ids = new Set<number>()
  return value.map(row => {
    if (!row || !Number.isSafeInteger(row.id) || row.id <= 0 || ids.has(row.id)) {
      throw new Error(`Sitemap: invalid or duplicate ${name} ID`)
    }
    ids.add(row.id)
    if (row.updated_at != null && (typeof row.updated_at !== 'string' || !Number.isFinite(Date.parse(row.updated_at)))) {
      throw new Error(`Sitemap: invalid ${name} modification date`)
    }
    return { id: row.id, updated_at: row.updated_at ?? null }
  })
}

export async function loadSitemapData(baseUrl: string, fetcher: typeof fetch = fetch): Promise<SitemapData> {
  async function read(path: string, key: keyof SitemapData) {
    const response = await fetcher(`${baseUrl.replace(/\/+$/, '')}${path}`, {
      cache: 'no-store', headers: { Platform: 'web' }, signal: AbortSignal.timeout(15000),
    })
    if (!response.ok) throw new Error(`Sitemap: ${key} API HTTP ${response.status}`)
    const payload = await response.json()
    const entries = records(payload[key], key)
    if (key === 'products' && (!Number.isSafeInteger(payload.total_items) || payload.total_items !== entries.length)) {
      throw new Error('Sitemap: incomplete product export')
    }
    if (key === 'products' && entries.length === 0) throw new Error('Sitemap: empty product export')
    return entries
  }
  const [products, services, maalems] = await Promise.all([
    read('/api/ecommerce/products/sitemap', 'products'),
    read('/api/services/sitemap', 'services'),
    read('/api/maalems/sitemap', 'maalems'),
  ])
  return { products, services, maalems }
}

export function buildSitemap(data: SitemapData, site: URL): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = []
  function add(path: string, modified?: string | null) {
    const languages = Object.fromEntries(LOCALES.map(locale => [locale, new URL(`/${locale}${path === '/' ? '' : path}`, site).toString()]))
    for (const locale of LOCALES) entries.push({
      url: languages[locale],
      ...(modified ? { lastModified: new Date(modified).toISOString() } : {}),
      alternates: { languages },
    })
  }
  // No fabricated lastmod without a reliable content timestamp.
  for (const path of STATIC_PATHS) add(path)
  for (const [key, segment] of [['products', 'product'], ['services', 'services'], ['maalems', 'maalems']] as const) {
    for (const row of records(data[key], key)) add(`/${segment}/${row.id}`, row.updated_at)
  }
  if (entries.length > 50000) throw new Error('Sitemap exceeds 50,000 URLs: split before publishing')
  // Conservative byte budget including XML markup/escaping.
  if (Buffer.byteLength(JSON.stringify(entries), 'utf8') * 2 > 50 * 1024 * 1024) {
    throw new Error('Sitemap size requires splitting before publishing')
  }
  return entries
}
