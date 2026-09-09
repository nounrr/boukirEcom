import { getTranslations } from 'next-intl/server'

import { HomeHeroBanner } from '@/components/home/home-hero-banner'
import { HomeTrustStrip } from '@/components/home/home-trust-strip'
import { HomeProductSections } from '@/components/home/home-product-sections'
import { normalizeLocale } from '@/i18n/locale'
import { buildPageMetadata } from '@/lib/seo/metadata'
import type { Metadata } from 'next'
import { constructionCopy } from '@/lib/seo/construction-copy'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale: rawLocale } = await params
  const locale = normalizeLocale(rawLocale)

  const copy = constructionCopy[locale]

  return buildPageMetadata({
    locale,
    path: '/',
    title: copy.homeTitle,
    description: copy.description,
    keywords: copy.keywords,
    indexable: true,
  })
}

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>
}) {
  const { locale: rawLocale } = await params
  const locale = normalizeLocale(rawLocale)
  const tCommon = await getTranslations({ locale, namespace: 'common' })
  const tShop = await getTranslations({ locale, namespace: 'shop' })

  return (
    <div className="min-h-screen">
      <HomeHeroBanner
        locale={locale}
        tagline={tShop('tagline')}
        title={tShop('heroTitle')}
        titleAccent={tShop('heroTitleAccent')}
        description={tShop('heroDescription')}
        ctaProducts={tCommon('products')}
        ctaPromo={tShop('featuredTitle')}
        deliveryTitle={tShop('heroStatDelivery')}
        deliveryDesc={tShop('heroStatDeliveryDesc')}
      />

      <HomeTrustStrip
        deliveryTitle={tShop('featureDeliveryTitle')}
        deliveryDesc={tShop('featureDeliveryDesc')}
        paymentTitle={tShop('featureSecurePaymentTitle')}
        paymentDesc={tShop('featureSecurePaymentDesc')}
        qualityTitle={tShop('featureQualityTitle')}
        qualityDesc={tShop('featureQualityDesc')}
      />

      {/* Product sections */}
      <HomeProductSections
        locale={locale}
        featuredTitle={tShop('featuredTitle')}
        featuredDesc={tShop('featuredDesc')}
        newArrivalsTitle={tShop('newArrivalsTitle')}
        newArrivalsDesc={tShop('newArrivalsDesc')}
        viewAllLabel={tShop('viewAll')}
        emptyLabel={tShop('noProducts')}
      />
    </div>
  )
}
