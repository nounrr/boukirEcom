import { useTranslations } from 'next-intl'

import { HomeCatalogHighlights } from '@/components/home/home-catalog-highlights'
import { HomeBrandsCarousel } from '@/components/home/home-brands-carousel'
import { HomeHero, type HeroSlide } from '@/components/home/home-hero'
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

  // Test slide with secondary image
  const testSlides: HeroSlide[] = [
    {
      id: 'test-1',
      type: 'campaign',
      title: 'New brand arrive',
      subtitle: "Let's checkout these",
      imageSrc: '/hero/hero-1.jpg',
      imageAlt: 'Hero background',
      secondaryImageSrc: '/hero/blal.webp',
      secondaryImageAlt: 'Featured tools',
      primaryCta: {
        label: "Let's see it",
        href: `/${locale}/shop`,
      },
      secondaryCta: {
        label: 'Learn more',
        href: `/${locale}/shop?sort=promo`,
      },
    },
  ]

  return (
    <>
      <Header />
      <main>
        <HomeHero locale={locale} slides={testSlides} />
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
