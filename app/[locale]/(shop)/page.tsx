import { getTranslations } from 'next-intl/server'

import { HomeHeroBanner } from '@/components/home/home-hero-banner'
import { HomeTrustStrip } from '@/components/home/home-trust-strip'
import { HomeProductSections } from '@/components/home/home-product-sections'
import { normalizeLocale } from '@/i18n/locale'
import { buildPageMetadata } from '@/lib/seo/metadata'
import type { Metadata } from 'next'

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>
}): Promise<Metadata> {
  const { locale: rawLocale } = await params
  const locale = normalizeLocale(rawLocale)

  const titleByLocale: Record<string, string> = {
    fr: 'Accueil',
    ar: 'الرئيسية',
    en: 'Home',
    zh: '首页',
  }

  const descriptionByLocale: Record<string, string> = {
    fr: 'Boukir Diamond — droguerie & produits d’entretien au Maroc. Découvrez nos nouveautés et promotions avec livraison partout au Maroc.',
    ar: 'بوكِير دايموند — دروجري ومواد تنظيف بالمغرب. اكتشف العروض والجديد مع توصيل إلى جميع مدن المغرب.',
    en: 'Boukir Diamond — hardware & home care products in Morocco. Discover new arrivals and deals with fast delivery across Morocco.',
    zh: 'Boukir Diamond——摩洛哥五金与家居清洁用品商城。发现新品与优惠，摩洛哥全境快速配送。',
  }

  const keywordsByLocale: Record<string, string[]> = {
    fr: ['droguerie', "produits d'entretien", 'produits ménagers', 'Maroc', 'livraison Maroc', 'Boukir Diamond'],
    ar: ['دروجري', 'مواد التنظيف', 'منتجات منزلية', 'المغرب', 'توصيل بالمغرب', 'Boukir Diamond'],
    en: ['hardware', 'home care', 'cleaning products', 'Morocco', 'delivery Morocco', 'Boukir Diamond'],
    zh: ['五金', '清洁用品', '家居用品', '摩洛哥', '配送', 'Boukir Diamond'],
  }

  return buildPageMetadata({
    locale,
    path: '/',
    title: titleByLocale[locale] ?? titleByLocale.fr,
    description: descriptionByLocale[locale] ?? descriptionByLocale.fr,
    keywords: keywordsByLocale[locale] ?? keywordsByLocale.fr,
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
