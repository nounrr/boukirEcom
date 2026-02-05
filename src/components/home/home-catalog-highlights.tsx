'use client'

import { useMemo, useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Grid3X3, ArrowRight } from 'lucide-react'
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
import { useGetCategoriesQuery } from '@/state/api/categories-api-slice'
import type { Category } from '@/types/category'

type CategoryShape = 'rounded' | 'circle'

function getCategoryLabel(category: Category, locale: string) {
  if (locale === 'ar') return category.nom_ar || category.nom
  if (locale === 'en') return category.nom_en || category.nom
  if (locale === 'zh') return category.nom_zh || category.nom
  return category.nom
}

function toAbsoluteImageUrl(imageUrl?: string | null): string | null {
  if (!imageUrl) return null
  if (/^https?:\/\//i.test(imageUrl)) return imageUrl

  const base = (API_CONFIG.BASE_URL || '').replace(/\/+$/, '')
  const path = imageUrl.startsWith('/') ? imageUrl : `/${imageUrl}`

  return base ? `${base}${path}` : path
}

function CategoryCard({
  category,
  locale,
  shape,
}: {
  category: Category
  locale: string
  shape: CategoryShape
}) {
  const href = `/${locale}/shop?category_id=${encodeURIComponent(String(category.id))}`
  const imageSrc = toAbsoluteImageUrl(category.image_url)
  const isCircle = shape === 'circle'
  const label = getCategoryLabel(category, locale)
  const categoryInitial = label?.[0]?.toUpperCase() ?? 'C'

  return (
    <Link href={href} className="group block">
      <div className="relative">
        {/* Glow effect on hover */}
        <div className="absolute inset-0 bg-linear-to-br from-teal-400/0 via-cyan-400/0 to-blue-400/0 group-hover:from-teal-400/20 group-hover:via-cyan-400/20 group-hover:to-blue-400/20 rounded-full blur-xl transition-all duration-500" />

        {/* Category container - SMALLER than brands */}
        <div
          className={cn(
            'relative overflow-hidden bg-white dark:bg-gray-900',
            'border-2 border-teal-100 dark:border-teal-900/50',
            'transition-all duration-300',
            'group-hover:border-teal-300 dark:group-hover:border-teal-700',
            'group-hover:shadow-xl group-hover:shadow-teal-500/20',
            'aspect-square w-full max-w-20 mx-auto',
            isCircle ? 'rounded-full' : 'rounded-xl'
          )}
        >
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={label}
              fill
              sizes="(min-width: 1024px) 80px, (min-width: 768px) 72px, 64px"
              unoptimized={/^https?:\/\//i.test(imageSrc)}
              className="object-contain p-2.5 transition-transform duration-300 group-hover:scale-110"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-linear-to-br from-teal-50 to-cyan-50 dark:from-teal-950/20 dark:to-cyan-950/20">
              <span className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                {categoryInitial}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Category name */}
      <div className="mt-2 text-center">
        <p className="text-xs font-medium text-foreground line-clamp-2 group-hover:text-teal-600 dark:group-hover:text-teal-400 transition-colors">
          {label}
        </p>
      </div>
    </Link>
  )
}

export function HomeCatalogHighlights({
  locale,
  className,
  shape = 'rounded',
  limit = 20,
}: {
  locale?: string
  className?: string
  shape?: CategoryShape
  limit?: number
}) {
  const t = useTranslations('home')
  const detectedLocale = useLocale()
  const activeLocale = locale || detectedLocale

  const { data: categories = [], isLoading } = useGetCategoriesQuery()

  const [api, setApi] = useState<CarouselApi | null>(null)
  const [isPaused, setIsPaused] = useState(false)

  const items = useMemo(() => {
    const roots = categories.filter((c) => !c.parent_id)
    const list = roots.length > 0 ? roots : categories
    return list.slice(0, limit)
  }, [categories, limit])

  // Auto-scroll carousel
  useEffect(() => {
    if (!api) return
    if (isPaused) return
    if (items.length <= 6) return

    const id = window.setInterval(() => {
      api.scrollNext()
    }, 3500)

    return () => window.clearInterval(id)
  }, [api, isPaused, items.length])

  return (
    <section className={cn('relative py-20 overflow-hidden', className)}>
      {/* Moroccan-inspired gradient background */}
      <div className="absolute inset-0 bg-linear-to-br from-teal-50/60 via-cyan-50/40 to-blue-50/60 dark:from-teal-950/30 dark:via-cyan-950/20 dark:to-blue-950/30" />

      {/* Moroccan zellige pattern overlay */}
      <div className="absolute inset-0 opacity-[0.015]">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="moroccan-categories-pattern" x="0" y="0" width="50" height="50" patternUnits="userSpaceOnUse">
              <path d="M25 0L30 10L40 15L30 20L25 25L20 20L10 15L20 10Z" fill="currentColor" />
              <circle cx="25" cy="25" r="2.5" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#moroccan-categories-pattern)" />
        </svg>
      </div>

      <div className="relative container mx-auto px-6 sm:px-8 lg:px-16">
        {/* Moroccan-style header */}
        <div className="flex items-center justify-between mb-10">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-linear-to-br from-teal-500 to-cyan-500 rounded-xl blur-md opacity-50" />
              <div className="relative bg-linear-to-br from-teal-500 to-cyan-500 p-2.5 rounded-xl shadow-lg">
                <Grid3X3 className="h-5 w-5 text-white" />
              </div>
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-bold bg-linear-to-r from-teal-600 via-cyan-600 to-blue-600 bg-clip-text text-transparent">
                {t('categoriesTitle')}
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">{t('categoriesDesc')}</p>
            </div>
          </div>
          <Link href={`/${activeLocale}/shop`}>
            <Button
              variant="outline"
              className="gap-2 border-teal-200 hover:bg-teal-50 hover:border-teal-300 dark:border-teal-800 dark:hover:bg-teal-950/50"
            >
              {t('viewAll')}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-5">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <Skeleton
                  className={cn(
                    'aspect-square w-full max-w-20',
                    shape === 'circle' ? 'rounded-full' : 'rounded-xl'
                  )}
                />
                <Skeleton className="h-3 w-16" />
              </div>
            ))}
          </div>
        ) : items.length === 0 ? (
          <div className="rounded-3xl border border-teal-200 dark:border-teal-800 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm p-12 text-center">
            <p className="text-muted-foreground">{t('emptyCategories')}</p>
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
                    loop: items.length > 6,
                    align: 'start',
                    slidesToScroll: 1,
                  }}
                  setApi={(a) => setApi(a)}
                >
                  <CarouselContent className="-ml-3 md:-ml-5">
                    {items.map((c) => (
                      <CarouselItem
                        key={c.id}
                        className="pl-3 md:pl-5 basis-1/4 sm:basis-1/5 md:basis-1/6 lg:basis-1/8 xl:basis-1/10"
                      >
                    <CategoryCard category={c} locale={activeLocale} shape={shape} />
                  </CarouselItem>
                ))}
                  </CarouselContent>

                  {items.length > 6 && (
                    <>
                      <CarouselPrevious
                        className="-left-4 bg-white/95 dark:bg-gray-900/95 border-teal-200 dark:border-teal-800 text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/50 shadow-lg"
                      />
                      <CarouselNext
                        className="-right-4 bg-white/95 dark:bg-gray-900/95 border-teal-200 dark:border-teal-800 text-teal-600 dark:text-teal-400 hover:bg-teal-50 dark:hover:bg-teal-950/50 shadow-lg"
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
