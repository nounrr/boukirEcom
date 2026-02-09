'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import { ArrowRight } from 'lucide-react'
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
  description?: string
  imageSrc: string
  imageAlt: string
  secondaryImageSrc?: string
  secondaryImageAlt?: string
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
  const isRtl = activeLocale === 'ar'

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
      if (/^\/(fr|ar|en|zh)(\/|$)/.test(href)) return href
      if (href.startsWith('/')) return `/${activeLocale}${href}`
      return `/${activeLocale}/${href}`
    }

    const resolveLocalizedText = (value: unknown): string | undefined => {
      if (typeof value === 'string') return value
      if (!value || typeof value !== 'object') return undefined

      const record = value as Record<string, unknown>
      const preferred =
        record[activeLocale] ?? record.fr ?? record.en ?? record.ar ?? record.zh

      if (typeof preferred === 'string') return preferred
      return Object.values(record).find((v) => typeof v === 'string') as string | undefined
    }

    const resolveLocalizedCtaLabel = (value: unknown): string | undefined => {
      if (!value || typeof value !== 'object') {
        return typeof value === 'string' ? value : undefined
      }

      const obj = value as Record<string, unknown>
      const base = obj.label
      const localized =
        (activeLocale === 'ar' ? obj.label_ar : undefined) ??
        (activeLocale === 'en' ? obj.label_en : undefined) ??
        (activeLocale === 'zh' ? obj.label_zh : undefined) ??
        base

      return typeof localized === 'string' ? localized : typeof base === 'string' ? base : undefined
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

      const primaryFromResolved = s.cta_resolved?.primary?.label
      const secondaryFromResolved = s.cta_resolved?.secondary?.label

      const primaryFromCtasResolved = Array.isArray(s.ctas_resolved)
        ? s.ctas_resolved.find((c) => (c.style ?? 'primary') === 'primary')?.label ??
        s.ctas_resolved[0]?.label
        : undefined

      const secondaryFromCtasResolved = Array.isArray(s.ctas_resolved)
        ? s.ctas_resolved.find((c) => (c.style ?? 'secondary') === 'secondary')?.label ??
        s.ctas_resolved[1]?.label
        : undefined

      const primaryLabel =
        resolveLocalizedCtaLabel(s.cta?.primary) ??
        resolveLocalizedCtaLabel(legacyCtas[0]) ??
        primaryFromCtasResolved ??
        primaryFromResolved ??
        t('ctaShop')

      const secondaryLabel =
        resolveLocalizedCtaLabel(s.cta?.secondary) ??
        resolveLocalizedCtaLabel(legacyCtas[1])
        ?? secondaryFromCtasResolved
        ?? secondaryFromResolved

      // Backend must NOT provide hrefs. We derive the href from the slide type + target.
      // Legacy payloads may still contain hrefs; in that case we accept them.
      const primaryHref = legacyCtas[0]?.href
        ? normalizeInternalHref(legacyCtas[0].href)
        : defaultHrefFor(type, targetId)

      const secondaryHref = legacyCtas[1]?.href
        ? normalizeInternalHref(legacyCtas[1].href)
        : defaultSecondaryHrefFor(type)

      const resolvedContent = s.content_resolved?.locale === activeLocale ? s.content_resolved : undefined
      const title = resolvedContent?.title ?? resolveLocalizedText(s.content?.title) ?? t('heroTitle')
      const subtitle = resolvedContent?.subtitle ?? resolveLocalizedText(s.content?.subtitle) ?? t('heroSubtitle')
      const description = resolvedContent?.description ?? resolveLocalizedText(s.content?.description)

      return {
        id: String(s.id),
        type,
        title,
        subtitle: subtitle ?? undefined,
        description: description ?? undefined,
        imageSrc: toAbsoluteImageUrl(s.media?.image_url),
        imageAlt: s.media?.image_alt || t('heroSlideAlt'),
        secondaryImageSrc: s.media?.secondary_image_url ? toAbsoluteImageUrl(s.media.secondary_image_url) : undefined,
        secondaryImageAlt: s.media?.secondary_image_alt || undefined,
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

    if (api.scrollSnapList().length < 2) return

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
        return t('heroTags.category')
      case 'brand':
        return t('heroTags.brand')
      case 'campaign':
        return t('heroTags.campaign')
      case 'product':
        return t('heroTags.product')
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
                        ? t('heroLoadError')
                        : t('heroEmpty')}
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
                  {(() => {
                    const shouldLoop = resolvedSlides.length > 1

                    return (
              <Carousel
                className="relative"
                    dir={isRtl ? 'rtl' : 'ltr'}
                    opts={{
                      loop: shouldLoop,
                      align: 'start',
                      direction: isRtl ? 'rtl' : 'ltr',
                    }}
                setApi={(a) => setApi(a)}
              >
                <CarouselContent className="ml-0">
                  {resolvedSlides.map((s, idx) => (
                    <CarouselItem key={s.id} className="pl-0">
                      <div className="relative overflow-hidden rounded-3xl border border-border/40 bg-background/70 backdrop-blur-sm">
                        <div className="absolute inset-0 pointer-events-none bg-linear-to-br from-primary/10 via-background to-background" />

                        <div className="relative px-6 py-8 sm:px-10 sm:py-10 lg:px-14 lg:py-14">
                          <div className="grid items-center gap-8 lg:grid-cols-2">
                            {/* Left: copy + CTAs */}
                            <div className="order-2 lg:order-1 max-w-[680px]">
                              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs text-primary">
                                <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                                <span className="font-semibold">{slideTag(s.type)}</span>
                              </div>

                              <div className="mt-4 space-y-2">
                                {s.subtitle ? (
                                  <p className="text-xs sm:text-sm text-muted-foreground max-w-[60ch]">
                                    {s.subtitle}
                                  </p>
                                ) : null}

                                <h1 className="text-3xl sm:text-4xl lg:text-6xl font-extrabold tracking-tight text-foreground">
                                  {s.title}
                                </h1>

                                {s.description ? (
                                  <p className="text-xs sm:text-sm text-muted-foreground max-w-[70ch]">
                                    {s.description}
                                  </p>
                                ) : null}
                              </div>

                              <div className="mt-7 flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-3">
                                <Link href={s.primaryCta.href} className="w-full sm:w-auto">
                                  <Button size="lg" className="w-full sm:w-auto gap-2">
                                    {s.primaryCta.label}
                                    <ArrowRight className="h-4 w-4" />
                                  </Button>
                                </Link>

                                {s.secondaryCta ? (
                                  <Link href={s.secondaryCta.href} className="w-full sm:w-auto">
                                    <Button
                                      size="lg"
                                      variant="outline"
                                      className="w-full sm:w-auto gap-2 border-primary/25 bg-background/60 hover:bg-primary/5"
                                    >
                                      {s.secondaryCta.label}
                                    </Button>
                                  </Link>
                                ) : null}
                              </div>
                            </div>

                            {/* Right: square clickable product image */}
                            <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
                              <Link
                                href={s.primaryCta.href}
                                aria-label={s.secondaryImageAlt || s.imageAlt || s.title}
                                className="group"
                              >
                                <div
                                  className={cn(
                                    'relative aspect-square w-[min(320px,80vw)] sm:w-[380px] lg:w-[440px]',
                                    'rounded-3xl overflow-hidden',
                                    'border border-border/40 bg-muted/20',
                                    'shadow-sm transition-all duration-300',
                                    'group-hover:shadow-md group-hover:border-primary/25',
                                    'group-focus-visible:outline-hidden group-focus-visible:ring-2 group-focus-visible:ring-primary/40'
                                  )}
                                >
                                  <Image
                                    src={s.secondaryImageSrc || s.imageSrc}
                                    alt={s.secondaryImageAlt || s.imageAlt}
                                    fill
                                    priority={idx === 0}
                                    unoptimized={/^https?:\/\//i.test((s.secondaryImageSrc || s.imageSrc) ?? '')}
                                    sizes="(min-width: 1024px) 440px, (min-width: 640px) 380px, 80vw"
                                    className="object-cover object-center transition-transform duration-300 group-hover:scale-[1.03]"
                                  />
                                  <div className="absolute inset-0 pointer-events-none bg-linear-to-t from-background/15 via-transparent to-transparent" />
                                </div>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CarouselItem>
                  ))}
                    </CarouselContent>

                    <CarouselPrevious
                      className="hidden md:inline-flex left-4 top-1/2 -translate-y-1/2 bg-white/15 border-white/20 text-white hover:bg-white/25"
                    />
                    <CarouselNext
                      className="hidden md:inline-flex right-4 top-1/2 -translate-y-1/2 bg-white/15 border-white/20 text-white hover:bg-white/25"
                    />

                    {/* Pagination dots */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2">
                      {Array.from({ length: api?.scrollSnapList().length ?? resolvedSlides.length }).map((_, i) => {
                        const isActive = i === activeIndex
                        return (
                          <button
                            key={i}
                            type="button"
                            aria-label={t('heroGoToSlide', { index: i + 1 })}
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
                    )
                  })()}
                </div>
          )}
        </div>
      </div>
    </section>
  )
}
