import { getTranslations } from 'next-intl/server'

import { HomeBrandsCarousel } from '@/components/home/home-brands-carousel'
import { HomeCatalogHighlights } from '@/components/home/home-catalog-highlights'
import { HomeHero } from '@/components/home/home-hero'
import { HomeProductSections } from '@/components/home/home-product-sections'
import { HomeStoreSection } from '@/components/home/home-store-section'
import { HomeTrustBar } from '@/components/home/home-trust-bar'
import { HomeUtilityTypeSelector } from '@/components/home/home-utility-type-selector'
import { Footer } from '@/components/layout/footer'
import { Header } from '@/components/layout/header'
import { normalizeLocale } from '@/i18n/locale'

/**
 * Snapshot navigable de la page d'accueil avant sa refonte UI/UX.
 * Cette route permet de comparer le nouveau design avec la version précédente.
 */
export default async function ClassicHomePage({
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
        <HomeTrustBar locale={locale} className="pt-4 md:pt-6" />
        <HomeUtilityTypeSelector locale={locale} className="pt-6 md:pt-8" />
        <HomeProductSections
          locale={locale}
          featuredTitle={tShop('featuredTitle')}
          featuredDesc={tShop('featuredDesc')}
          newArrivalsTitle={tShop('newArrivalsTitle')}
          newArrivalsDesc={tShop('newArrivalsDesc')}
          viewAllLabel={tShop('viewAll')}
          emptyLabel={tShop('noProducts')}
        />
        <HomeCatalogHighlights className="pt-0" />
        <HomeBrandsCarousel locale={locale} className="pt-0" shape="rounded" />

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
