'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useState, useEffect, useMemo } from 'react'
import { Sparkles, ArrowRight } from 'lucide-react'
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
import { useGetBrandsQuery } from '@/state/api/brands-api-slice'
import type { Brand } from '@/types/brand'

type BrandShape = 'rounded' | 'circle'

function toAbsoluteImageUrl(imageUrl?: string | null): string | null {
  if (!imageUrl) return null
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl

  const base = (API_CONFIG.BASE_URL || '').replace(/\/+$/, '')
  const path = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`

  return base ? `${base}${path}` : path
}

function BrandCard({
  brand,
  locale,
  shape,
}: {
  brand: Brand
  locale: string
  shape: BrandShape
}) {
  const href = `/${locale}/shop?brand_id=${encodeURIComponent(String(brand.id))}`
  const imageSrc = toAbsoluteImageUrl(brand.image_url)
  const isCircle = shape === 'circle'
  const brandInitial = brand.nom?.[0]?.toUpperCase() ?? 'B'

  return (
    <Link href={href} className="group block">
      <div className="relative">
        {/* Glow effect on hover */}
        <div className="absolute inset-0 bg-linear-to-br from-amber-400/0 via-orange-400/0 to-red-400/0 group-hover:from-amber-400/20 group-hover:via-orange-400/20 group-hover:to-red-400/20 rounded-full blur-xl transition-all duration-500" />
        
        {/* Brand logo container - MUCH LARGER */}
        <div
          className={cn(
            'relative overflow-hidden bg-white dark:bg-gray-900',
            'border-2 border-amber-100 dark:border-amber-900/50',
            'transition-all duration-300',
            'group-hover:border-amber-300 dark:group-hover:border-amber-700',
            'group-hover:shadow-xl group-hover:shadow-amber-500/20',
            'aspect-square w-full max-w-40 mx-auto',
            isCircle ? 'rounded-full' : 'rounded-2xl'
          )}
        >
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={brand.nom}
              fill
              sizes="(min-width: 1024px) 160px, (min-width: 768px) 140px, 120px"
              unoptimized={/^https?:\/\//i.test(imageSrc)}
              className="object-contain p-5 transition-transform duration-300 group-hover:scale-110"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
              <span className="text-4xl font-bold text-amber-600 dark:text-amber-400">
                {brandInitial}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Brand name */}
      <div className="mt-3 text-center">
        <p className="text-sm font-semibold text-foreground line-clamp-2 group-hover:text-amber-600 dark:group-hover:text-amber-400 transition-colors">
          {brand.nom}
        </p>
      </div>
    </Link>
  )
}

export function HomeBrandsCarousel({
  locale,
  className,
  shape = 'rounded',
  limit = 24,
}: {
  locale?: string
  className?: string
  shape?: BrandShape
  limit?: number
}) {
  const t = useTranslations('home')
  const detectedLocale = useLocale()
  const activeLocale = normalizeLocale(locale ?? detectedLocale)

  const { data: brands = [], isLoading } = useGetBrandsQuery()

  const [api, setApi] = useState<CarouselApi | null>(null)
  const [isPaused, setIsPaused] = useState(false)

  const items = useMemo(() => {
    const list = Array.isArray(brands) ? brands : []
    const sorted = [...list].sort((a, b) => (a.nom || '').localeCompare(b.nom || ''))
    return sorted.slice(0, limit)
  }, [brands, limit])

  // Auto-scroll carousel
  useEffect(() => {
    if (!api) return
    if (isPaused) return
    if (items.length <= 5) return

    const id = window.setInterval(() => {
      api.scrollNext()
    }, 3500)

    return () => window.clearInterval(id)
  }, [api, isPaused, items.length])

  return (
    <section className={cn('relative py-20 overflow-hidden', className)}>
      {/* Moroccan-inspired gradient background */}
      <div className="absolute inset-0 bg-linear-to-br from-amber-50/60 via-orange-50/40 to-red-50/60 dark:from-amber-950/30 dark:via-orange-950/20 dark:to-red-950/30" />
      
      {/* Moroccan zellige pattern overlay */}
      <div className="absolute inset-0 opacity-[0.015]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="moroccan-pattern" x="0" y="0" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d="M30 0L35 10L45 15L35 20L30 30L25 20L15 15L25 10Z" fill="currentColor" />
              <circle cx="30" cy="30" r="3" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#moroccan-pattern)" />
        </svg>
      </div>

      <div className="relative container mx-auto px-6 sm:px-8 lg:px-16">
        {/* Moroccan-style header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-linear-to-br from-amber-500 to-orange-500 rounded-xl blur-md opacity-50" />
              <div className="relative bg-linear-to-br from-amber-500 to-orange-500 p-2.5 rounded-xl shadow-lg">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-amber-600 via-orange-600 to-red-600 bg-clip-text text-transparent">
                {t('brandsTitle')}
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">{t('brandsDesc')}</p>
            </div>
          </div>
          <Link href={`/${activeLocale}/shop`}>
            <Button
              variant="outline"
              className="gap-2 border-amber-200 hover:bg-amber-50 hover:border-amber-300 dark:border-amber-800 dark:hover:bg-amber-950/50"
            >
              {t('viewAll')}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-3">
                <Skeleton
                  className={cn(
                    'aspect-square w-full max-w-40',
                    shape === 'circle' ? 'rounded-full' : 'rounded-2xl'
                  )}
                />
                <Skeleton className="h-4 w-24" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-3xl border border-amber-200 dark:border-amber-800 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm p-12 text-center">
            <p className="text-muted-foreground">{t('emptyBrands')}</p>
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
              opts={{
                loop: items.length > 5,
                align: 'start',
                slidesToScroll: 1,
              }}
              setApi={(a) => setApi(a)}
            >
              <CarouselContent className="-ml-6 md:-ml-8">
                {items.map((b) => (
                  <CarouselItem
                    key={b.id}
                    className="pl-6 md:pl-8 basis-1/2 sm:basis-1/3 md:basis-1/4 lg:basis-1/5 xl:basis-1/6"
                  >
                    <BrandCard brand={b} locale={activeLocale} shape={shape} />
                  </CarouselItem>
                ))}
              </CarouselContent>

              {items.length > 5 && (
                <>
                  <CarouselPrevious
                    className="-left-4 bg-white/95 dark:bg-gray-900/95 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50 shadow-lg"
                  />
                  <CarouselNext
                    className="-right-4 bg-white/95 dark:bg-gray-900/95 border-amber-200 dark:border-amber-800 text-amber-600 dark:text-amber-400 hover:bg-amber-50 dark:hover:bg-amber-950/50 shadow-lg"
                  />
                </>
              )}
            </Carousel>
          </div>
        )}
      </div>
    </section>
  )
}
