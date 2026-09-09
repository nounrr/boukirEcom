import { notFound, redirect } from 'next/navigation'
import type { Metadata } from 'next'
import { CatalogLanding } from '@/components/shop/catalog-landing'
import { buildPageMetadata, localizedUrl } from '@/lib/seo/metadata'
import { loadCatalogPage, catalogPageNumber } from './data'
import { catalogPage, type CatalogKind } from './registry'

export type CatalogProps = { params: Promise<{ locale: string; slug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }
async function resolve(kind: CatalogKind, props: CatalogProps) {
  const { locale, slug } = await props.params
  const known = catalogPage(kind, slug)
  if (!known) notFound()
  if (locale !== 'fr' && locale !== 'ar') {
    if (!['en', 'zh'].includes(locale)) notFound()
    const filter = new URLSearchParams({ [kind === 'categories' ? 'category_id' : 'brand_id']: String(known.id) })
    if (known.search) filter.set('search', known.search)
    redirect(`/${locale}/shop?${filter}`)
  }
  const query = await props.searchParams
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
  return { ...result, locale: locale as 'fr' | 'ar', slug, pageNumber, query }
}
export async function catalogMetadata(kind: CatalogKind, props: CatalogProps): Promise<Metadata> {
  const { page, data, locale, slug, pageNumber } = await resolve(kind, props)
  const path = `/${kind}/${slug}${pageNumber > 1 ? `?page=${pageNumber}` : ''}`
  const title = `${locale === 'ar' ? `${page.ar} في طنجة` : `${page.fr} à Tanger`}${pageNumber > 1 ? ` — ${pageNumber}` : ''}`
  const metadata = buildPageMetadata({ locale, path, title, description: (locale === 'ar' ? page.adviceAr : page.adviceFr).slice(0, 160), keywords: [page.fr, page.ar, 'Tanger', 'طنجة'], indexable: data.pagination.total_items > 0 })
  metadata.alternates = { canonical: localizedUrl(locale, path), languages: { fr: localizedUrl('fr', path), ar: localizedUrl('ar', path) } }
  return metadata
}
export async function catalogRoute(kind: CatalogKind, props: CatalogProps) {
  const { page, data, locale, pageNumber } = await resolve(kind, props)
  return <CatalogLanding kind={kind} page={page} data={data} locale={locale} pageNumber={pageNumber} />
}
