import type { MetadataRoute } from 'next'
import { API_CONFIG } from '@/lib/api-config'
import { buildSitemap, loadSitemapData } from '@/lib/seo/sitemap-data'
import { getSiteUrl } from '@/lib/seo/metadata'
import { catalogSitemap } from '@/lib/catalog/sitemap'

// Fail closed: unavailable/incomplete API produces HTTP 500, not a static-only 200.
// No persistent filesystem is assumed on the host.
export const dynamic = 'force-dynamic'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [data, catalog] = await Promise.all([loadSitemapData(API_CONFIG.BASE_URL), catalogSitemap()])
  const entries = [...buildSitemap(data, getSiteUrl()), ...catalog]
  if (entries.length > 50000 || Buffer.byteLength(JSON.stringify(entries)) * 2 > 50 * 1024 * 1024) throw new Error('Sitemap: split required')
  return entries
}
