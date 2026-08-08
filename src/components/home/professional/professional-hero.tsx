'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  Boxes,
  Headphones,
  Pause,
  Play,
  ShieldCheck,
  Truck,
} from 'lucide-react'
import { useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import {
  type CarouselApi,
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from '@/components/ui/carousel'
import { Skeleton } from '@/components/ui/skeleton'
import { useCarouselAutoplay, useCarouselRuntimeState } from '@/hooks/use-carousel-playback'
import { API_CONFIG } from '@/lib/api-config'
import { cn } from '@/lib/utils'
import { useGetHeroSlidesQuery } from '@/state/api/hero-slides-api-slice'
import type { HeroSlideApi, HeroSlideTypeApi } from '@/types/api/hero-slides'

type EditorialSlide = {
  id: string
  type: HeroSlideTypeApi
  title: string
  subtitle?: string
  description?: string
  image: string
  alt: string
  primaryLabel: string
  primaryHref: string
  secondaryLabel?: string
  secondaryHref?: string
}

function absoluteImageUrl(src?: string | null) {
  const value = String(src ?? '').trim()
  if (!value) return '/utility-types/professional-workshop.webp'
  if (/^https?:\/\//i.test(value)) return value
  const base = (API_CONFIG.BASE_URL || '').replace(/\/+$/, '')
  const path = value.startsWith('/') ? value : `/${value}`
  return base ? `${base}${path}` : path
}

function localizedText(value: unknown, locale: string) {
  if (typeof value === 'string') return value
  if (!value || typeof value !== 'object') return undefined
  const record = value as Record<string, unknown>
  const preferred = record[locale] ?? record.fr ?? record.en ?? record.ar ?? record.zh
  return typeof preferred === 'string'
    ? preferred
    : (Object.values(record).find((item) => typeof item === 'string') as string | undefined)
}

function localizedCta(value: unknown, locale: string) {
  if (typeof value === 'string') return value
  if (!value || typeof value !== 'object') return undefined
  const record = value as Record<string, unknown>
  const localized = locale === 'fr' ? record.label : record[`label_${locale}`]
  return typeof localized === 'string'
    ? localized
    : typeof record.label === 'string'
      ? record.label
      : undefined
}

function targetId(slide: HeroSlideApi) {
  const target = slide.target
  if (!target) return null
  if (slide.type === 'category') return target.category_id ?? target.id ?? null
  if (slide.type === 'brand') return target.brand_id ?? target.id ?? null
  if (slide.type === 'product') return target.product_id ?? target.id ?? null
  return target.campaign_id ?? target.id ?? null
}

function defaultHref(type: HeroSlideTypeApi, id: number | string | null, locale: string) {
  if (type === 'category') return `/${locale}/shop?category_id=${id ?? 23}`
  if (type === 'brand') return `/${locale}/shop?brand_id=${id ?? 1}`
  if (type === 'product' && id != null) return `/${locale}/product/${id}`
  return `/${locale}/shop?sort=promo`
}

function normalizeHref(href: string | undefined, locale: string) {
  if (!href) return `/${locale}/shop`
  if (/^https?:\/\//i.test(href) || /^\/(fr|ar|en|zh)(\/|$)/.test(href)) return href
  return href.startsWith('/') ? `/${locale}${href}` : `/${locale}/${href}`
}

function HeroImage({ src, alt, priority }: { src: string; alt: string; priority: boolean }) {
  const [failed, setFailed] = useState(false)
  const image = failed ? '/utility-types/professional-workshop.webp' : src

  return (
    <Image
      src={image}
      alt={alt}
      fill
      priority={priority}
      unoptimized={/^https?:\/\//i.test(image)}
      sizes="(min-width: 1024px) 55vw, 100vw"
      className="object-cover transition-transform duration-500 motion-safe:group-hover/hero:scale-[1.025]"
      onError={() => setFailed(true)}
    />
  )
}

export function ProfessionalHero({ locale }: { locale: string }) {
  const t = useTranslations('home')
  const tShop = useTranslations('shop')
  const isRtl = locale === 'ar'
  const { data, isLoading, isFetching, isError } = useGetHeroSlidesQuery({
    locale: locale as 'fr' | 'ar' | 'en' | 'zh',
    limit: 4,
  })
  const [api, setApi] = useState<CarouselApi | null>(null)
  const [activeIndex, setActiveIndex] = useState(0)
  const [isHovered, setIsHovered] = useState(false)
  const [isFocusWithin, setIsFocusWithin] = useState(false)
  const [isPaused, setIsPaused] = useState(false)
  const { isScrollable, isLooping } = useCarouselRuntimeState(api)

  const slides = useMemo<EditorialSlide[]>(() => {
    return (data ?? []).map((slide) => {
      const resolved = slide.content_resolved?.locale === locale ? slide.content_resolved : undefined
      const legacyCtas = Array.isArray(slide.ctas) ? slide.ctas : []
      const primaryResolved = Array.isArray(slide.ctas_resolved)
        ? slide.ctas_resolved.find((cta) => (cta.style ?? 'primary') === 'primary')?.label
        : undefined
      const secondaryResolved = Array.isArray(slide.ctas_resolved)
        ? slide.ctas_resolved.find((cta) => cta.style === 'secondary')?.label
        : undefined
      const id = targetId(slide)

      return {
        id: String(slide.id),
        type: slide.type ?? 'campaign',
        title: resolved?.title ?? localizedText(slide.content?.title, locale) ?? t('heroTitle'),
        subtitle: resolved?.subtitle ?? localizedText(slide.content?.subtitle, locale),
        description: resolved?.description ?? localizedText(slide.content?.description, locale),
        image: absoluteImageUrl(slide.media?.image_url),
        alt: slide.media?.image_alt || t('heroSlideAlt'),
        primaryLabel:
          localizedCta(slide.cta?.primary, locale) ??
          localizedCta(legacyCtas[0], locale) ??
          primaryResolved ??
          slide.cta_resolved?.primary?.label ??
          t('ctaShop'),
        primaryHref: legacyCtas[0]?.href
          ? normalizeHref(legacyCtas[0].href, locale)
          : defaultHref(slide.type, id, locale),
        secondaryLabel:
          localizedCta(slide.cta?.secondary, locale) ??
          localizedCta(legacyCtas[1], locale) ??
          secondaryResolved ??
          slide.cta_resolved?.secondary?.label ??
          undefined,
        secondaryHref: legacyCtas[1]?.href
          ? normalizeHref(legacyCtas[1].href, locale)
          : `/${locale}/shop`,
      }
    })
  }, [data, locale, t])

  useCarouselAutoplay({
    api,
    delay: 5200,
    enabled: isScrollable === true,
    paused: isPaused || isHovered || isFocusWithin,
  })

  useEffect(() => {
    if (!api) return
    const update = () => setActiveIndex(api.selectedScrollSnap())
    update()
    api.on('select', update)
    api.on('reInit', update)
    return () => {
      api.off('select', update)
      api.off('reInit', update)
    }
  }, [api])

  const tagLabel = (type: HeroSlideTypeApi) => t(`heroTags.${type}`)
  const playLabel = locale === 'ar' ? 'تشغيل العرض' : locale === 'zh' ? '播放轮播' : locale === 'en' ? 'Play slideshow' : 'Lire le diaporama'
  const pauseLabel = locale === 'ar' ? 'إيقاف العرض' : locale === 'zh' ? '暂停轮播' : locale === 'en' ? 'Pause slideshow' : 'Mettre le diaporama en pause'

  return (
    <section className="border-b border-[#ded5c2] bg-[#f4f0e6] text-foreground" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="mx-auto max-w-[1600px]">
        {isLoading || (isFetching && !data?.length) ? (
          <div className="grid min-h-[520px] lg:grid-cols-[0.9fr_1.1fr]">
            <div className="flex items-center px-6 py-14 sm:px-10 lg:px-16 xl:px-24">
              <div className="w-full max-w-xl space-y-5">
                <Skeleton className="h-3 w-28 bg-[#ded5c2]" />
                <Skeleton className="h-14 w-full bg-[#ded5c2]" />
                <Skeleton className="h-20 w-4/5 bg-[#e8e1d2]" />
                <Skeleton className="h-12 w-40 bg-primary/30" />
              </div>
            </div>
            <Skeleton className="min-h-[360px] rounded-none bg-[#e4dccb] lg:min-h-[520px]" />
          </div>
        ) : slides.length === 0 ? (
          <div className="grid min-h-[460px] lg:grid-cols-[0.9fr_1.1fr]">
            <div className="flex items-center px-6 py-14 sm:px-10 lg:px-16 xl:px-24">
              <div className="max-w-xl">
                <p className="mb-5 text-xs font-bold uppercase tracking-[0.22em] text-primary">Boukir Diamond / Tanger</p>
                <h1 className="text-4xl font-black leading-[1.04] tracking-[-0.035em] sm:text-5xl">{t('heroTitle')}</h1>
                <p className="mt-5 max-w-lg text-base leading-7 text-muted-foreground">{isError ? t('heroLoadError') : t('heroEmpty')}</p>
                <Button asChild size="lg" className="mt-8 h-12 rounded-sm px-6 font-bold">
                  <Link href={`/${locale}/shop`}>
                    {t('ctaShop')}
                    <ArrowRight className={cn('h-4 w-4', isRtl && 'rotate-180')} />
                  </Link>
                </Button>
              </div>
            </div>
            <div className="relative min-h-[330px] overflow-hidden lg:min-h-[460px]">
              <Image src="/utility-types/professional-workshop.webp" alt="" fill sizes="55vw" className="object-cover" />
              <div className="absolute inset-0 bg-black/20" />
            </div>
          </div>
        ) : (
          <div
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            onFocusCapture={() => setIsFocusWithin(true)}
            onBlurCapture={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setIsFocusWithin(false)
            }}
          >
            <Carousel
              className="w-full"
              dir={isRtl ? 'rtl' : 'ltr'}
              opts={{ loop: slides.length > 1, align: 'start', direction: isRtl ? 'rtl' : 'ltr' }}
              setApi={setApi}
              data-looping={isLooping}
            >
              <CarouselContent className="m-0!">
                {slides.map((slide, index) => (
                  <CarouselItem key={slide.id} className="p-0!">
                    <article className="group/hero grid min-h-[540px] lg:grid-cols-[0.9fr_1.1fr] lg:min-h-[610px]">
                      <div className="relative z-10 flex items-center border-[#ded5c2] px-6 py-14 sm:px-10 lg:border-e lg:px-16 xl:px-24">
                        <div className="max-w-xl">
                          <div className="mb-7 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.2em] text-primary">
                            <span className="h-px w-10 bg-primary" />
                            {tagLabel(slide.type)}
                          </div>
                          {slide.subtitle ? <p className="mb-3 text-sm font-semibold text-muted-foreground">{slide.subtitle}</p> : null}
                          <h1 className="text-4xl font-black leading-[1.02] tracking-[-0.04em] text-balance sm:text-5xl xl:text-[64px]">
                            {slide.title}
                          </h1>
                          {slide.description ? (
                            <p className="mt-6 max-w-[56ch] text-sm leading-7 text-muted-foreground sm:text-base">{slide.description}</p>
                          ) : null}
                          <div className="mt-9 flex flex-wrap gap-3">
                            <Button asChild size="lg" className="h-12 rounded-sm px-6 font-bold">
                              <Link href={slide.primaryHref}>
                                {slide.primaryLabel}
                                <ArrowRight className={cn('h-4 w-4', isRtl && 'rotate-180')} />
                              </Link>
                            </Button>
                            {slide.secondaryLabel ? (
                              <Button asChild size="lg" variant="outline" className="h-12 rounded-sm border-foreground/25 bg-white/35 px-6 text-foreground hover:bg-white">
                                <Link href={slide.secondaryHref ?? `/${locale}/shop`}>{slide.secondaryLabel}</Link>
                              </Button>
                            ) : null}
                          </div>
                        </div>
                      </div>
                      <Link href={slide.primaryHref} className="relative min-h-[340px] overflow-hidden outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary lg:min-h-[610px]">
                        <HeroImage src={slide.image} alt={slide.alt} priority={index === 0} />
                        <div className="absolute inset-0 bg-linear-to-t from-black/48 via-transparent to-black/8 lg:bg-linear-to-r lg:from-[#202321]/20 lg:via-transparent lg:to-transparent" />
                        <div className="absolute inset-x-0 bottom-0 flex items-end justify-between border-t border-white/55 bg-[#f4f0e6]/88 px-5 py-4 backdrop-blur-[3px] sm:px-7">
                          <span className="text-xs font-semibold uppercase tracking-[0.18em] text-foreground/70">Boukir Diamond / {String(index + 1).padStart(2, '0')}</span>
                          <span className="flex h-10 w-10 items-center justify-center border border-white/35 bg-primary text-primary-foreground transition-transform group-hover/hero:translate-x-1 rtl:group-hover/hero:-translate-x-1">
                            <ArrowRight className={cn('h-4 w-4', isRtl && 'rotate-180')} />
                          </span>
                        </div>
                      </Link>
                    </article>
                  </CarouselItem>
                ))}
              </CarouselContent>

              {isScrollable ? (
                <div className="absolute bottom-[76px] start-6 z-20 flex items-center gap-2 sm:start-10 lg:bottom-8 lg:start-auto lg:end-[calc(55%+2rem)]">
                  <CarouselPrevious className="static! size-10! translate-none! rounded-none border-foreground/20 bg-white/90 text-foreground hover:bg-primary hover:text-primary-foreground" />
                  <CarouselNext className="static! size-10! translate-none! rounded-none border-foreground/20 bg-white/90 text-foreground hover:bg-primary hover:text-primary-foreground" />
                  <button
                    type="button"
                    onClick={() => setIsPaused((value) => !value)}
                    className="flex size-10 items-center justify-center border border-foreground/20 bg-white/90 text-foreground transition-colors hover:bg-primary hover:text-primary-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    aria-label={isPaused ? playLabel : pauseLabel}
                  >
                    {isPaused ? <Play className="h-4 w-4" /> : <Pause className="h-4 w-4" />}
                  </button>
                </div>
              ) : null}

              {isScrollable ? (
                <div className="absolute bottom-[92px] end-6 z-20 flex items-center gap-2 sm:end-10 lg:bottom-10 lg:end-8">
                  {slides.map((slide, index) => (
                    <button
                      key={slide.id}
                      type="button"
                      aria-label={t('heroGoToSlide', { index: index + 1 })}
                      onClick={() => api?.scrollTo(index)}
                      className={cn(
                        'h-0.5 transition-[width,background-color] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                        index === activeIndex ? 'w-10 bg-primary' : 'w-5 bg-foreground/30 hover:bg-foreground/55'
                      )}
                    />
                  ))}
                </div>
              ) : null}
            </Carousel>
          </div>
        )}
      </div>

      <div className="border-t border-[#ded5c2] bg-white/75">
        <div className="mx-auto grid max-w-[1600px] grid-cols-2 lg:grid-cols-4">
          {[
            { Icon: Truck, title: t('trustBar.deliveryTitle'), desc: t('trustBar.deliveryDesc') },
            { Icon: Boxes, title: tShop('heroStatProducts'), desc: tShop('featureQualityDesc') },
            { Icon: Headphones, title: t('trustBar.supportTitle'), desc: t('trustBar.supportDesc') },
            { Icon: ShieldCheck, title: t('trustBar.securePaymentTitle'), desc: t('trustBar.securePaymentDesc') },
          ].map(({ Icon, title, desc }, index) => (
            <div key={title} className={cn('flex min-h-28 items-center gap-3 px-5 py-5 sm:px-8', index % 2 !== 0 && 'border-s border-[#ded5c2]', index > 1 && 'border-t border-[#ded5c2] lg:border-t-0', index > 0 && 'lg:border-s lg:border-[#ded5c2]')}>
              <Icon className="h-5 w-5 shrink-0 text-primary" strokeWidth={1.7} />
              <div>
                <p className="text-sm font-bold text-foreground">{title}</p>
                <p className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function ProfessionalJourneys({ locale }: { locale: string }) {
  const t = useTranslations('home')
  const isRtl = locale === 'ar'
  const items = [
    {
      value: 'Maison',
      title: t('utilityType.homeLabel'),
      description: t('utilityType.homeDesc'),
      image: '/utility-types/maison-diy-editorial-2026.webp',
      imagePosition: 'object-[62%_center]',
      copyPosition: isRtl ? 'items-end text-start' : 'items-start text-start',
      copyWidth: 'max-w-md',
      sideShade: 'bg-linear-to-r from-black/75 via-black/28 to-transparent',
    },
    {
      value: 'Professionel',
      title: t('utilityType.proLabel'),
      description: t('utilityType.proDesc'),
      image: '/utility-types/professionnel-atelier-editorial-2026.webp',
      imagePosition: 'object-[42%_center]',
      copyPosition: isRtl ? 'items-start text-start' : 'items-end text-end',
      copyWidth: 'max-w-sm',
      sideShade: 'bg-linear-to-l from-black/78 via-black/30 to-transparent',
    },
  ] as const

  return (
    <section className="border-y border-[#ded5c2] bg-[#f4f0e6] py-10 md:py-20" dir={isRtl ? 'rtl' : 'ltr'}>
      <div className="container mx-auto px-5 sm:px-8 lg:px-16">
        <div className="mb-8 grid items-end gap-5 border-b border-[#cfc5b1] pb-6 md:mb-10 md:grid-cols-[1fr_auto]">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-primary">01 / {t('utilityType.kicker')}</p>
            <h2 className="mt-3 max-w-2xl text-[26px] font-black leading-[1.08] tracking-[-0.03em] text-foreground sm:text-4xl">{t('utilityType.title')}</h2>
          </div>
          <p className="max-w-md text-sm leading-6 text-muted-foreground md:text-end">{t('utilityType.desc')}</p>
        </div>
        <div className="grid gap-3 md:grid-cols-2 lg:gap-4">
          {items.map((item, index) => (
            <Link
              key={item.value}
              href={`/${locale}/shop?utility_type=${item.value}`}
              className="group relative isolate flex h-[150px] overflow-hidden rounded-[2px] border border-black/20 bg-[#25231f] outline-none focus-visible:border-primary focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-4 focus-visible:ring-offset-[#f4f0e6] sm:h-[180px] lg:h-[250px]"
            >
              <Image
                src={item.image}
                alt=""
                fill
                sizes="(min-width: 1024px) 48vw, (min-width: 768px) 50vw, 100vw"
                className={cn(
                  'object-cover transition-transform duration-700 ease-out motion-reduce:transition-none',
                  'group-hover:scale-[1.035] group-focus-visible:scale-[1.035]',
                  item.imagePosition
                )}
              />
              <div className="absolute inset-0 bg-linear-to-t from-black/90 via-black/20 to-black/5" aria-hidden="true" />
              <div className={cn('absolute inset-0 opacity-90 transition-opacity duration-500 group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none', item.sideShade)} aria-hidden="true" />

              <div className={cn('relative z-10 flex w-full flex-col justify-between p-4 text-white sm:p-5 lg:p-7', item.copyPosition)}>
                <div className="hidden items-center gap-3 text-[11px] font-bold uppercase tracking-[0.24em] text-white/85 sm:flex">
                  <span className="text-primary">0{index + 1}</span>
                  <span className="h-px w-8 bg-primary" aria-hidden="true" />
                  <span>{t('utilityType.kicker')}</span>
                </div>

                <div className={cn('w-full', item.copyWidth)}>
                  <h3 className="text-2xl font-black leading-none tracking-[-0.035em] text-balance sm:text-3xl lg:text-4xl">
                    {item.title}
                  </h3>
                  <p className="mt-2 hidden text-sm leading-6 text-white/86 sm:block">
                    {item.description}
                  </p>
                  <span className={cn('mt-3 flex items-center gap-3 text-xs font-bold uppercase tracking-[0.18em] text-white sm:mt-4', index === 1 && !isRtl && 'justify-end')}>
                    <span className="h-px w-8 bg-white/55 transition-[width,background-color] duration-300 group-hover:w-12 group-hover:bg-primary group-focus-visible:w-12 group-focus-visible:bg-primary motion-reduce:transition-none" aria-hidden="true" />
                    <span className="flex size-10 items-center justify-center border border-white/55 bg-black/15 transition-[transform,background-color,border-color] duration-300 group-hover:border-primary group-hover:bg-primary group-hover:text-primary-foreground group-focus-visible:border-primary group-focus-visible:bg-primary group-focus-visible:text-primary-foreground motion-reduce:transition-none">
                      <ArrowRight className={cn('size-4 transition-transform duration-300 group-hover:translate-x-0.5 group-focus-visible:translate-x-0.5 motion-reduce:transition-none', isRtl && 'rotate-180 group-hover:-translate-x-0.5 group-focus-visible:-translate-x-0.5')} />
                    </span>
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  )
}
