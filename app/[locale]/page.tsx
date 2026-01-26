import { useTranslations } from 'next-intl'

import { HomeCatalogHighlights } from '@/components/home/home-catalog-highlights'
import { HomeBrandsCarousel } from '@/components/home/home-brands-carousel'
import { HomeHero } from '@/components/home/home-hero'
import { HomeProductSections } from '@/components/home/home-product-sections'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { normalizeLocale } from '@/i18n/locale'

export default function HomePage({
  params,
}: {
    params: { locale?: string }
}) {
  const tShop = useTranslations('shop')
  const locale = normalizeLocale(params.locale)

  return (
    <>
      <Header />
      <main>
        <HomeHero locale={locale} />
        <HomeCatalogHighlights className="-mt-8 md:-mt-10" />
        <HomeBrandsCarousel locale={locale} className="pt-0" shape="rounded" />
        <HomeProductSections
          locale={locale}
          featuredTitle={tShop('featuredTitle')}
          featuredDesc={tShop('featuredDesc')}
          newArrivalsTitle={tShop('newArrivalsTitle')}
          newArrivalsDesc={tShop('newArrivalsDesc')}
        />
      </main>
      <Footer />
    </>
  )
}
