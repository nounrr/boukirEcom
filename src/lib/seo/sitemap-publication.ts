import path from 'node:path'
import type { MetadataRoute } from 'next'
import { API_CONFIG } from '@/lib/api-config'
import { catalogSitemap } from '@/lib/catalog/sitemap'
import { getSiteUrl } from './urls'
import { buildSitemap, loadSitemapData } from './sitemap-data'
import { createSnapshotStore } from './sitemap-snapshot'

const xmlEscape = (value: string) => value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;')
const header = '<?xml version="1.0" encoding="UTF-8"?>'
export function serializeSitemap(entries: MetadataRoute.Sitemap, origin: string) {
  const seen = new Set<string>()
  const rows = entries.map(entry => {
    const url = new URL(entry.url)
    if (url.origin !== origin || url.search || seen.has(entry.url)) throw new Error('Invalid or duplicate sitemap URL')
    seen.add(entry.url)
    const lastmod = entry.lastModified ? new Date(entry.lastModified).toISOString() : null
    const alternates = Object.entries(entry.alternates?.languages || {}).map(([locale, href]) => {
      if (typeof href !== 'string' || new URL(href).origin !== origin) throw new Error('Invalid sitemap alternate')
      return `<xhtml:link rel="alternate" hreflang="${xmlEscape(locale)}" href="${xmlEscape(href)}"/>`
    }).join('')
    return `<url><loc>${xmlEscape(entry.url)}</loc>${lastmod ? `<lastmod>${lastmod}</lastmod>` : ''}${alternates}</url>`
  })
  const xml = `${header}<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">${rows.join('')}</urlset>`
  if (entries.length > 50000 || Buffer.byteLength(xml) > 50 * 1024 * 1024) throw new Error('Sitemap partition exceeds protocol limits')
  return xml
}
export function partitionSitemap(entries: MetadataRoute.Sitemap, origin: string) {
  const groups: Record<string, MetadataRoute.Sitemap> = {}
  const seen = new Set<string>()
  for (const entry of entries) {
    if (seen.has(entry.url)) throw new Error('Duplicate across sitemap partitions')
    seen.add(entry.url)
    const [, locale, kind] = new URL(entry.url).pathname.split('/')
    if (!['fr', 'ar', 'en', 'zh'].includes(locale)) throw new Error('Invalid sitemap language')
    const group = kind === 'product' ? `products-${locale}` : kind === 'categories' ? 'categories' : kind === 'marques' ? 'brands' : 'pages'
    ;(groups[group] ||= []).push(entry)
  }
  const files: Record<string, string> = {}
  for (const [group, rows] of Object.entries(groups)) {
    // 5,000 URLs keeps multilingual XML comfortably below the byte limit.
    for (let offset = 0; offset < rows.length; offset += 5000) {
      const suffix = rows.length > 5000 ? `-${Math.floor(offset / 5000) + 1}` : ''
      files[`${group}${suffix}.xml`] = serializeSitemap(rows.slice(offset, offset + 5000), origin)
    }
  }
  files['index.xml'] = `${header}<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${Object.keys(files).sort().map(name => `<sitemap><loc>${xmlEscape(`${origin}/sitemap-${name}`)}</loc></sitemap>`).join('')}</sitemapindex>`
  return files
}
const site = getSiteUrl()
const store = createSnapshotStore(process.env.SITEMAP_CACHE_DIR || path.join(process.cwd(), '.cache', 'sitemaps'), site.origin, async () => {
  const [data, catalog] = await Promise.all([loadSitemapData(API_CONFIG.BASE_URL), catalogSitemap()])
  return partitionSitemap([...buildSitemap(data, site), ...catalog], site.origin)
})
export const refreshSitemaps = () => store.get(true)
export async function sitemapResponse(file: string) {
  if (!/^(index|products-(fr|ar|en|zh)(-\d+)?|categories(-\d+)?|brands(-\d+)?|pages(-\d+)?)\.xml$/.test(file)) return new Response('Not found', { status: 404 })
  try {
    const { snapshot, stale } = await store.get()
    const xml = snapshot.files[file]
    if (!xml) return new Response('Not found', { status: 404 })
    return new Response(xml, { headers: { 'Content-Type': 'application/xml; charset=utf-8', 'Cache-Control': 'public, max-age=300', 'X-Sitemap-Cache': stale ? 'stale' : 'fresh', 'X-Sitemap-Generated-At': new Date(snapshot.generatedAt).toISOString() } })
  } catch (error) {
    console.error('Sitemap unavailable:', error instanceof Error ? error.message : 'unknown error')
    return new Response('Sitemap temporarily unavailable', { status: 503, headers: { 'Retry-After': '300', 'Cache-Control': 'no-store' } })
  }
}
