import { useTranslations } from 'next-intl'

import { HomeCatalogHighlights } from '@/components/home/home-catalog-highlights'
import { HomeHero } from '@/components/home/home-hero'
import { HomeProductSections } from '@/components/home/home-product-sections'

export default function HomePage({
  params,
}: {
  params: { locale: string }
}) {
  const tShop = useTranslations('shop')

  return (
    <main>
      <HomeHero locale={params.locale} />
      <HomeCatalogHighlights />
      <HomeProductSections
        locale={params.locale}
        featuredTitle={tShop('featuredTitle')}
        featuredDesc={tShop('featuredDesc')}
        newArrivalsTitle={tShop('newArrivalsTitle')}
        newArrivalsDesc={tShop('newArrivalsDesc')}
      />
    </main>
  )
}
