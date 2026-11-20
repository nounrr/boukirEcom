import { notFound, permanentRedirect, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { CatalogLanding } from '@/components/shop/catalog-landing'
import { buildPageMetadata, localizedUrl } from '@/lib/seo/metadata'
import { loadCatalogPage, catalogPageNumber, resolveCategory, MIN_INDEXABLE_PRODUCTS } from './data'
import { catalogPage, type CatalogKind } from './registry'
import { CATALOG_LOCALES, isCatalogLocale, catalogText, catalogCopy } from './i18n'
import { legacyBrandShopHref } from './shop-brand'

export type CatalogProps = { params: Promise<{ locale: string; slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }
async function resolve(kind: CatalogKind, props: CatalogProps) {
  const { locale, slug: rawSlug } = await props.params
  if (!isCatalogLocale(locale)) notFound()
  let slug = rawSlug
  try { slug = decodeURIComponent(rawSlug) } catch { notFound() }
  const query = await props.searchParams
  let known = kind === 'marques' ? catalogPage(kind, slug) : undefined
  if (kind === 'categories') {
    // Every back-office category has a page; an id-only or outdated slug moves to the canonical one.
    const resolved = await resolveCategory(slug)
    if (!resolved) notFound()
    if (resolved.slug !== slug) {
      const keep = new URLSearchParams()
      for (const [key, value] of Object.entries(query)) if (value !== undefined) keep.set(key, Array.isArray(value) ? value.join(',') : value)
      permanentRedirect(`/${locale}/categories/${resolved.slug}${keep.size ? `?${keep}` : ''}`)
    }
    known = resolved.page
  }
  if (!known) notFound()
  if (kind === 'marques') permanentRedirect(legacyBrandShopHref(locale, known.id, query))
  if (query.page === '1') {
    const normalized = new URLSearchParams()
    for (const [key, value] of Object.entries(query)) if (key !== 'page' && value !== undefined) normalized.set(key, Array.isArray(value) ? value.join(',') : value)
    permanentRedirect(`/${locale}/${kind}/${slug}${normalized.size ? `?${normalized}` : ''}`)
  }
  const filterKeys = Object.keys(query).filter(key => key !== 'page' && !key.startsWith('utm_') && !['gclid', 'fbclid', 'msclkid'].includes(key))
  if (filterKeys.length) {
    const filter = new URLSearchParams()
    for (const [key, value] of Object.entries(query)) if (value !== undefined) filter.set(key, Array.isArray(value) ? value.join(',') : value)
    filter.set(kind === 'categories' ? 'category_id' : 'brand_id', String(known.id))
    if (known.search) filter.set('search', known.search)
    redirect(`/${locale}/shop?${filter}`)
  }
  const pageNumber = catalogPageNumber(query.page)
  if (!pageNumber) notFound()
  const result = await loadCatalogPage(kind, slug, pageNumber)
  if (!result || (pageNumber > 1 && pageNumber > result.data.pagination.total_pages)) notFound()
  return { ...result, locale, slug, pageNumber, query } as const
}
export async function catalogMetadata(kind: CatalogKind, props: CatalogProps): Promise<Metadata> {
  const { page, data, locale, slug, pageNumber, generated } = await resolve(kind, props)
  const path = `/${kind}/${slug}${pageNumber > 1 ? `?page=${pageNumber}` : ''}`
  const text = catalogText(page, locale)
  const title = `${text.name} ${catalogCopy(locale).location}${pageNumber > 1 ? ` — ${pageNumber}` : ''}`
  const metadata = buildPageMetadata({ locale, path, title, description: text.advice.slice(0, 160), keywords: [text.name, 'Tanger', 'Tangier', 'طنجة', '丹吉尔'], indexable: data.pagination.total_items >= (generated ? MIN_INDEXABLE_PRODUCTS : 1) })
  metadata.alternates = { canonical: localizedUrl(locale, path), languages: Object.fromEntries(CATALOG_LOCALES.map(l => [l, localizedUrl(l, path)])) }
  return metadata
}
export async function catalogRoute(kind: CatalogKind, props: CatalogProps) {
  const { page, data, locale, pageNumber, parent, children } = await resolve(kind, props)
  return <CatalogLanding kind={kind} page={page} data={data} locale={locale} pageNumber={pageNumber} parent={parent} subcategories={children} />
}
