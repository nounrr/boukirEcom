import { getTranslations } from 'next-intl/server'

import { HomeCatalogHighlights } from '@/components/home/home-catalog-highlights'
import { HomeBrandsCarousel } from '@/components/home/home-brands-carousel'
import { HomeHero } from '@/components/home/home-hero'
import { HomeUtilityTypeSelector } from '@/components/home/home-utility-type-selector'
import { HomeProductSections } from '@/components/home/home-product-sections'
import { HomeStoreSection } from '@/components/home/home-store-section'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { normalizeLocale } from '@/i18n/locale'

export default async function HomePage({
  params,
}: {
    params: Promise<{ locale?: string }>
}) {
  const { locale: localeParam } = await params
  const locale = normalizeLocale(localeParam)
  const tShop = await getTranslations({ locale, namespace: 'shop' })
  const tFooter = await getTranslations({ locale, namespace: 'footer' })

  return (
    <>
      <Header />
      <main>
        <HomeHero locale={locale} />
        <HomeUtilityTypeSelector locale={locale} className="pt-6 md:pt-8" />
        <HomeCatalogHighlights className="pt-0" />
        <HomeBrandsCarousel locale={locale} className="pt-0" shape="rounded" />
        <HomeProductSections
          locale={locale}
          featuredTitle={tShop('featuredTitle')}
          featuredDesc={tShop('featuredDesc')}
          newArrivalsTitle={tShop('newArrivalsTitle')}
          newArrivalsDesc={tShop('newArrivalsDesc')}
        />

        <HomeStoreSection
          title={tFooter('storeLocationTitle')}
          description={tFooter('storeLocationDesc')}
          openLabel={tFooter('openInMaps')}
          contactTitle={tFooter('storeContactTitle')}
          contactDesc={tFooter('storeContactDesc')}
          labelPhone={tFooter('storeContactPhone')}
          labelEmail={tFooter('storeContactEmail')}
          labelAddress={tFooter('storeContactAddress')}
          labelHours={tFooter('storeContactHours')}
          unavailableLabel={tFooter('storeContactUnavailable')}
        />
      </main>
      <Footer />
    </>
  )
}
