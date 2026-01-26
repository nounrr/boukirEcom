'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowRight, ShieldCheck, Truck, CreditCard } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { cn } from '@/lib/utils'
import { API_CONFIG } from '@/lib/api-config'
import { normalizeLocale } from '@/i18n/locale'
import { useGetHeroSlidesQuery } from '@/state/api/hero-slides-api-slice'
import type { HeroSlideApi } from '@/types/api/hero-slides'

type HeroSlideType = 'category' | 'brand' | 'campaign' | 'product'

const DEFAULT_BRAND_ID = 1

type HeroCta = {
  label: string
  href: string
}

export type HeroSlide = {
  id: string
  type: HeroSlideType
  title: string
  subtitle?: string
  imageSrc: string
  imageAlt: string
  primaryCta: HeroCta
  secondaryCta?: HeroCta
}

export function HomeHero({
  locale,
  className,
  slides,
}: {
    locale?: string
  className?: string
    slides?: HeroSlide[]
}) {
  const t = useTranslations('home')
  const detectedLocale = useLocale()
  const activeLocale = normalizeLocale(locale ?? detectedLocale)

  const {
    data: apiSlides,
    isLoading,
    isFetching,
    isError,
  } = useGetHeroSlidesQuery(
    { locale: activeLocale, limit: 4 },
    { skip: !!(slides && slides.length > 0) }
  )

  const [api, setApi] = useState<CarouselApi | null>(null)
  const [isPaused, setIsPaused] = useState(false)
  const [activeIndex, setActiveIndex] = useState(0)

  const resolvedSlides = useMemo<HeroSlide[]>(() => {
    if (slides && slides.length > 0) return slides

    const normalizeInternalHref = (href: string): string => {
      if (!href) return `/${activeLocale}/shop`
      if (/^https?:\/\//i.test(href)) return href
      if (/^\/(fr|ar)(\/|$)/.test(href)) return href
      if (href.startsWith('/')) return `/${activeLocale}${href}`
      return `/${activeLocale}/${href}`
    }

    const defaultHrefFor = (type: HeroSlideType, targetId?: string | number | null): string => {
      switch (type) {
        case 'category':
          return `/${activeLocale}/shop?category_id=${targetId ?? 23}`
        case 'brand':
          return `/${activeLocale}/shop?brand_id=${targetId ?? DEFAULT_BRAND_ID}`
        case 'product':
          return targetId != null ? `/${activeLocale}/product/${targetId}` : `/${activeLocale}/shop`
        case 'campaign':
        default:
          return `/${activeLocale}/shop?sort=promo`
      }
    }

    const defaultSecondaryHrefFor = (type: HeroSlideType): string => {
      switch (type) {
        case 'campaign':
          return `/${activeLocale}/shop`
        default:
          return `/${activeLocale}/shop?sort=promo`
      }
    }

    const toAbsoluteImageUrl = (imageUrl?: string | null): string => {
      if (!imageUrl) return '/hero/hero-1.jpg'
      if (/^https?:\/\//i.test(imageUrl)) return imageUrl

      const base = (API_CONFIG.BASE_URL || '').replace(/\/+$/, '')
      if (!base) return imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`

      const path = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`
      return `${base}${path}`
    }

    const getTargetId = (type: HeroSlideType, target?: HeroSlideApi['target'] | null) => {
      if (!target) return null

      const legacyId = target.id ?? null
      switch (type) {
        case 'category':
          return target.category_id ?? legacyId
        case 'brand':
          return target.brand_id ?? legacyId
        case 'product':
          return target.product_id ?? legacyId
        case 'campaign':
          return target.campaign_id ?? legacyId
      }
    }

    const mapApiSlide = (s: HeroSlideApi): HeroSlide => {
      const type = (s.type ?? 'campaign') as HeroSlideType
      const targetId = getTargetId(type, s.target)
      const legacyCtas = Array.isArray(s.ctas) ? s.ctas : []

      const primaryLabel = s.cta?.primary?.label ?? legacyCtas[0]?.label ?? t('ctaShop')
      const secondaryLabel = s.cta?.secondary?.label ?? legacyCtas[1]?.label

      // Backend must NOT provide hrefs. We derive the href from the slide type + target.
      // Legacy payloads may still contain hrefs; in that case we accept them.
      const primaryHref = legacyCtas[0]?.href
        ? normalizeInternalHref(legacyCtas[0].href)
        : defaultHrefFor(type, targetId)

      const secondaryHref = legacyCtas[1]?.href
        ? normalizeInternalHref(legacyCtas[1].href)
        : defaultSecondaryHrefFor(type)

      return {
        id: String(s.id),
        type,
        title: s.content?.title ?? t('heroTitle'),
        subtitle: s.content?.subtitle ?? t('heroSubtitle'),
        imageSrc: toAbsoluteImageUrl(s.media?.image_url),
        imageAlt: s.media?.image_alt || 'Hero slide',
        primaryCta: {
          label: primaryLabel,
          href: primaryHref,
        },
        secondaryCta: secondaryLabel
          ? {
            label: secondaryLabel,
            href: secondaryHref,
          }
          : undefined,
      }
    }

    if (apiSlides && apiSlides.length > 0) {
      return apiSlides.map(mapApiSlide)
    }

    return []
  }, [activeLocale, apiSlides, slides, t])

  useEffect(() => {
    if (!api) return
    if (isPaused) return

    const id = window.setInterval(() => {
      api.scrollNext()
    }, 2000)

    return () => window.clearInterval(id)
  }, [api, isPaused])

  useEffect(() => {
    if (!api) return

    const onSelect = () => {
      setActiveIndex(api.selectedScrollSnap())
    }

    onSelect()
    api.on('select', onSelect)
    api.on('reInit', onSelect)

    return () => {
      api.off('select', onSelect)
    }
  }, [api])

  const slideTag = (type: HeroSlideType) => {
    switch (type) {
      case 'category':
        return 'Catégorie'
      case 'brand':
        return 'Marque'
      case 'campaign':
        return 'Promo'
      case 'product':
        return 'Produit'
    }
  }

  return (
    <section
      className={cn(
        'relative overflow-hidden border-b border-border/30',
        'bg-linear-to-b from-primary/15 via-background to-background',
        className
      )}
    >
      <div className="container mx-auto px-6 sm:px-8 lg:px-16">
        <div className="py-8 md:py-10">
          {isLoading || (isFetching && (!apiSlides || apiSlides.length === 0)) ? (
            <div>
              <div className="relative overflow-hidden rounded-3xl border border-border/40 bg-muted/20 h-[420px] sm:h-[540px] lg:h-[640px]">
                <Skeleton className="absolute inset-0 rounded-3xl" />
                <div className="absolute inset-0 bg-linear-to-r from-background/70 via-background/30 to-transparent" />
                <div className="relative h-full px-6 py-10 sm:px-10 sm:py-12 lg:px-14 lg:py-14 flex items-center">
                  <div className="max-w-[680px] space-y-4">
                    <Skeleton className="h-7 w-32 rounded-full" />
                    <Skeleton className="h-12 w-[min(520px,85vw)]" />
                    <Skeleton className="h-5 w-[min(420px,75vw)]" />
                    <div className="pt-3 flex gap-3">
                      <Skeleton className="h-11 w-40 rounded-xl" />
                      <Skeleton className="h-11 w-32 rounded-xl" />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-3 sm:grid-cols-3">
                <Skeleton className="h-12 rounded-2xl" />
                <Skeleton className="h-12 rounded-2xl" />
                <Skeleton className="h-12 rounded-2xl" />
              </div>
            </div>
          ) : resolvedSlides.length === 0 ? (
            <div className="relative overflow-hidden rounded-3xl border border-border/40 bg-muted/20 h-80 sm:h-[380px]">
              <div className="absolute inset-0 bg-linear-to-r from-primary/10 via-background to-background" />
              <div className="relative h-full px-6 py-10 sm:px-10 flex items-center">
                <div className="max-w-[720px]">
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                    {isError ? t('heroTitle') : t('heroTitle')}
                  </h1>
                  <p className="mt-2 text-sm sm:text-base text-muted-foreground max-w-[60ch]">
                    {isError
                      ? 'Impossible de charger les slides pour le moment.'
                      : 'Aucune slide disponible pour le moment.'}
                  </p>
                  <div className="mt-6">
                    <Link href={`/${activeLocale}/shop`}>
                      <Button size="lg" className="gap-2">
                        {t('ctaShop')}
                        <ArrowRight className="h-4 w-4" />
                      </Button>
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
              onFocusCapture={() => setIsPaused(true)}
              onBlurCapture={() => setIsPaused(false)}
            >
              <Carousel
                className="relative"
                opts={{ loop: true, align: 'start' }}
                setApi={(a) => setApi(a)}
              >
                <CarouselContent className="ml-0">
                  {resolvedSlides.map((s, idx) => (
                    <CarouselItem key={s.id} className="pl-0">
                      <div className="relative overflow-hidden rounded-3xl border border-border/40 bg-muted/20 h-[420px] sm:h-[540px] lg:h-[640px]">
                        <div className="absolute inset-0">
                          <Image
                            src={s.imageSrc}
                            alt={s.imageAlt}
                            fill
                            priority={idx === 0}
                            unoptimized={/^https?:\/\//i.test(s.imageSrc)}
                            sizes="(min-width: 1024px) 1100px, 100vw"
                            className="object-cover object-center"
                            style={{ objectFit: 'cover' }}
                          />
                          {/* darken + soften for readable text */}
                          <div className="absolute inset-0 bg-black/35" />
                          <div className="absolute inset-0 bg-linear-to-r from-black/75 via-black/35 to-transparent" />
                        </div>

                        <div className="relative h-full px-6 py-10 sm:px-10 sm:py-12 lg:px-14 lg:py-14 flex items-center">
                          <div className="max-w-[680px]">
                            <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1 text-xs text-white/90 backdrop-blur-sm">
                              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                              <span>{slideTag(s.type)}</span>
                            </div>

                            <h1 className="mt-4 text-3xl sm:text-4xl lg:text-6xl font-extrabold tracking-tight text-white">
                              {s.title}
                            </h1>

                            {s.subtitle ? (
                              <p className="mt-3 text-base sm:text-lg text-white/85 max-w-[52ch] sm:truncate">
                                {s.subtitle}
                              </p>
                            ) : null}

                            <div className="mt-7 flex flex-wrap items-center gap-3">
                              <Link href={s.primaryCta.href}>
                                <Button size="lg" className="gap-2">
                                  {s.primaryCta.label}
                                  <ArrowRight className="h-4 w-4" />
                                </Button>
                              </Link>

                              {s.secondaryCta ? (
                                <Link href={s.secondaryCta.href}>
                                  <Button
                                    size="lg"
                                    variant="outline"
                                    className="gap-2 border-white/30 bg-white/10 text-white hover:bg-white/15 hover:text-white"
                                  >
                                    {s.secondaryCta.label}
                                  </Button>
                                </Link>
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                    </CarouselContent>

                    <CarouselPrevious
                      className="left-4 top-1/2 -translate-y-1/2 bg-white/15 border-white/20 text-white hover:bg-white/25"
                    />
                    <CarouselNext
                      className="right-4 top-1/2 -translate-y-1/2 bg-white/15 border-white/20 text-white hover:bg-white/25"
                    />

                    {/* Pagination dots */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
                      {Array.from({ length: api?.scrollSnapList().length ?? resolvedSlides.length }).map((_, i) => {
                        const isActive = i === activeIndex
                        return (
                          <button
                            key={i}
                            type="button"
                            aria-label={`Go to slide ${i + 1}`}
                            className={cn(
                              'h-2.5 rounded-full transition-all',
                              isActive ? 'w-6 bg-white/90' : 'w-2.5 bg-white/40 hover:bg-white/60'
                            )}
                            onClick={() => api?.scrollTo(i)}
                          />
                        )
                      })}
                    </div>
                  </Carousel>
                </div>
          )}

          {/* Ecommerce-style trust row under the hero */}
          {!isLoading && resolvedSlides.length > 0 ? (
            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <TrustPill icon={Truck} title={t('trustDelivery')} />
              <TrustPill icon={ShieldCheck} title={t('trustSecure')} />
              <TrustPill icon={CreditCard} title={t('trustPayments')} />
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}

function TrustPill({
  icon: Icon,
  title,
  tone = 'default',
}: {
  icon: typeof Truck
  title: string
    tone?: 'default' | 'onMedia'
}) {
  const isOnMedia = tone === 'onMedia'
  return (
    <div
      className={cn(
        'group flex items-center gap-3.5 rounded-full px-5 py-3.5 transition-all duration-300',
        isOnMedia
          ? 'border border-white/15 bg-white/10 text-white backdrop-blur-sm hover:bg-white/20'
          : 'border-2 border-border/40 bg-background/90 hover:bg-primary/5 hover:border-primary/30 shadow-sm hover:shadow-md'
      )}
    >
      <div
        className={cn(
          'grid h-10 w-10 shrink-0 place-items-center rounded-full transition-all duration-300',
          isOnMedia
            ? 'bg-white/20 group-hover:bg-white/30'
            : 'bg-primary/10 group-hover:bg-primary/20'
        )}
      >
        <Icon
          className={cn(
            'h-5 w-5 transition-colors duration-300',
            isOnMedia ? 'text-white' : 'text-primary group-hover:text-primary'
          )}
        />
      </div>
      <div className={cn('text-sm font-semibold leading-tight', isOnMedia ? 'text-white' : 'text-foreground')}>
        {title}
      </div>
    </div>
  )
}
