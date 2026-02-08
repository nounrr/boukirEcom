'use client'

import Image from 'next/image'
import Link from 'next/link'
import { useMemo } from 'react'
import { ArrowRight } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'
import AutoScroll from 'embla-carousel-auto-scroll'

import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import {
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
  const raw = String(imageUrl ?? '').trim()
  if (!raw) return null
  if (raw === 'null' || raw === 'undefined') return null
  if (/^https?:\/\//i.test(raw)) return raw

  const base = (API_CONFIG.BASE_URL || '').replace(/\/+$/, '')
  const path = raw.startsWith('/') ? raw : `/${raw}`

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
        {/* Brand container */}
        <div
          className={cn(
            'relative overflow-hidden bg-white dark:bg-gray-900',
            'transition-all duration-300',
            'group-hover:shadow-md group-hover:shadow-gray-500/40 dark:group-hover:shadow-black/40',
            'aspect-square w-full mx-auto',
            isCircle ? 'rounded-full' : 'rounded-xl'
          )}
        >
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={brand.nom}
              fill
              sizes="(min-width: 1024px) 96px, (min-width: 768px) 88px, 80px"
              unoptimized={/^https?:\/\//i.test(imageSrc)}
              className="object-cover transition-transform duration-300 group-hover:scale-125"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-teal-50 to-cyan-50 dark:from-teal-950/20 dark:to-cyan-950/20">
              <span className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                {brandInitial}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Brand name */}
      <div className="mt-2 text-center">
        <p className="text-xs font-medium text-foreground line-clamp-2 transition-all duration-300 group-hover:text-primary group-hover:scale-105 group-hover:font-bold">
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

  const items = useMemo(() => {
    const list = Array.isArray(brands) ? brands : []
    const sorted = [...list].sort((a, b) => (a.nom || '').localeCompare(b.nom || ''))
    return sorted.slice(0, limit)
  }, [brands, limit])

  return (
    <section className={cn('py-20', className)}>
      <div className="container mx-auto px-6 sm:px-8 lg:px-16">
        <div className="mb-10 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-primary">{t('brandsTitle')}</h2>
          <p className="text-sm text-muted-foreground mt-1">{t('brandsDesc')}</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-3">
                <Skeleton
                  className={cn(
                    'aspect-square w-full max-w-[96px]',
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
              <div className="mx-auto">
            <Carousel
              className="relative mx-auto"
              opts={{
                loop: items.length > 6,
                align: 'start',
                dragFree: true,
                skipSnaps: true,
              }}
                  plugins={
                    items.length > 6
                      ? [
                        AutoScroll({
                          speed: 0.7,
                          startDelay: 600,
                          stopOnInteraction: false,
                          stopOnMouseEnter: true,
                          stopOnFocusIn: true,
                        }),
                      ]
                      : undefined
                  }
            >
                  <CarouselContent className="justify-start">
                {items.map((b) => (
                  <CarouselItem
                    key={b.id}
                    className="basis-[92px] sm:basis-[96px] md:basis-[104px] lg:basis-[112px] xl:basis-[120px]"
                  >
                    <BrandCard brand={b} locale={activeLocale} shape={shape} />
                  </CarouselItem>
                ))}
              </CarouselContent>

              {items.length > 6 && (
                <>
                      <CarouselPrevious className="hidden md:inline-flex -left-4" />
                      <CarouselNext className="hidden md:inline-flex -right-4" />
                </>
              )}
            </Carousel>

            <div className="mt-6 flex justify-center">
              <Link href={`/${activeLocale}/shop`}>
                <Button variant="outline" className="gap-2">
                  {t('viewAll')}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}
