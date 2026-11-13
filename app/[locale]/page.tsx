import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { FlagshipBrands } from '@/components/home/flagship/flagship-brands'
import { ConstructionSequence } from '@/components/home/flagship/construction-sequence'
import { FlagshipPlanner } from '@/components/home/flagship/flagship-planner'
import { FlagshipHero } from '@/components/home/flagship/flagship-hero'
import { FlagshipJourneys } from '@/components/home/flagship/flagship-journeys'
import { FlagshipNewArrivals, FlagshipPromotions } from '@/components/home/flagship/flagship-products'
import { FlagshipServices } from '@/components/home/flagship/flagship-services'
import { FlagshipShowcase } from '@/components/home/flagship/flagship-showcase'
import { FlagshipStore } from '@/components/home/flagship/flagship-store'
import { FlagshipUniverses, type Universe } from '@/components/home/flagship/flagship-universes'
import { normalizeLocale } from '@/i18n/locale'
import { API_CONFIG } from '@/lib/api-config'
import { catalogHref, categories as catalogCategories } from '@/lib/catalog/registry'
import { getActiveServices } from '@/lib/service-requests'
import type { PublicService } from '@/types/service-request'
import type { Metadata } from 'next'
import { buildPageMetadata } from '@/lib/seo/metadata'
import { constructionCopy } from '@/lib/seo/construction-copy'
import { jsonLdScript, siteJsonLd } from '@/lib/seo/site-json-ld'

export async function generateMetadata({ params }: {
  params: Promise<{ locale?: string }>
}): Promise<Metadata> {
  const { locale: rawLocale } = await params
  const locale = normalizeLocale(rawLocale)
  const copy = constructionCopy[locale]
  return buildPageMetadata({
    locale, path: '/', title: copy.homeTitle,
    description: copy.description, keywords: copy.keywords, indexable: true,
  })
}

/** Editorial order of the product universes (verified registry slugs). */
const UNIVERSES: { slug: string; fallback: string | null }[] = [
  { slug: '73-matieres-de-construction', fallback: '/product-fallbacks/mineral.webp' },
  { slug: '50-colles-carrelage-marbre', fallback: '/product-fallbacks/tile.webp' },
  { slug: '72-peinture', fallback: '/utility-types/home-diy-workshop.webp' },
  { slug: '75-etancheite-bitume', fallback: null },
  { slug: '53-plomberie', fallback: '/product-fallbacks/metal.webp' },
  { slug: '48-outillage-carreleur', fallback: '/utility-types/professionnel-atelier-editorial-2026.webp' },
  { slug: '10-outillage', fallback: '/utility-types/professional-workshop.webp' },
]

function absoluteImage(src?: string | null) {
  const value = String(src ?? '').trim()
  if (!value || value === 'null') return null
  if (/^https?:\/\//i.test(value)) return value
  return `${API_CONFIG.BASE_URL}${value.startsWith('/') ? value : `/${value}`}`
}

/** First real product photo of a category, if the catalogue has one. */
async function categoryImage(categoryId: number): Promise<string | null> {
  try {
    const res = await fetch(`${API_CONFIG.BASE_URL}/api/ecommerce/products?category_id=${categoryId}&per_page=12&in_stock_only=false`, {
      headers: { Platform: 'web' },
      next: { revalidate: 900 },
    })
    if (!res.ok) return null
    const data = await res.json()
    const product = (data?.products ?? []).find((p: { image_url?: string | null }) => absoluteImage(p.image_url))
    return product ? absoluteImage(product.image_url) : null
  } catch {
    return null
  }
}

async function loadServices(): Promise<PublicService[]> {
  try {
    const res = await getActiveServices({ perPage: 12 })
    return res?.services ?? []
  } catch {
    return []
  }
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale?: string }>
}) {
  const { locale: localeParam } = await params
  const locale = normalizeLocale(localeParam)

  const [services, images] = await Promise.all([
    loadServices(),
    Promise.all(
      UNIVERSES.map(async ({ slug }) => {
        const page = catalogCategories.find((c) => c.slug === slug)
        return page ? categoryImage(page.id) : null
      })
    ),
  ])

  const universes: Universe[] = UNIVERSES.flatMap(({ slug, fallback }, index) => {
    const page = catalogCategories.find((c) => c.slug === slug)
    if (!page) return []
    return [{
      slug,
      href: catalogHref(locale, 'categories', page.id),
      title: (page as unknown as Record<string, string>)[locale] ?? page.fr,
      image: images[index],
      fallback,
    }]
  })

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLdScript(siteJsonLd(locale)) }} />
      <Header />
      <main id="main-content" className="overflow-x-clip">
        {/* 1 */}<FlagshipHero locale={locale} />
        <FlagshipPromotions locale={locale} />
        {/* 2 */}<FlagshipUniverses locale={locale} universes={universes} />
        {/* 3 */}<ConstructionSequence locale={locale} />
        {/* 4 */}<FlagshipShowcase locale={locale} />
        {/* 5 */}<FlagshipNewArrivals locale={locale} />
        <FlagshipJourneys locale={locale} />
        {/* 6 */}<FlagshipBrands locale={locale} />
        {/* 7 */}<FlagshipServices locale={locale} services={services} />
        {/* 8 */}<FlagshipPlanner locale={locale} />
        <FlagshipStore />
      </main>
      <Footer cta="home" />
    </>
  )
}
