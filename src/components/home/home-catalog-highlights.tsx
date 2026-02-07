'use client'

import { useMemo, useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
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
  const raw = String(imageUrl ?? '').trim()
  if (!raw) return null
  if (raw === 'null' || raw === 'undefined') return null
  if (/^https?:\/\//i.test(raw)) return raw

  const base = (API_CONFIG.BASE_URL || '').replace(/\/+$/, '')
  const path = raw.startsWith('/') ? raw : `/${raw}`

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
        {/* Category container - SMALLER than brands */}
        <div
          className={cn(
            'relative overflow-hidden bg-white dark:bg-gray-900',
            'transition-all duration-300',
            'group-hover:shadow-md group-hover:shadow-gray-500/40 dark:group-hover:shadow-black/40',
            'aspect-square w-full max-w-24 mx-auto',
            isCircle ? 'rounded-full' : 'rounded-xl'
          )}
        >
          {imageSrc ? (
            <Image
              src={imageSrc}
              alt={label}
              fill
              sizes="(min-width: 1024px) 96px, (min-width: 768px) 88px, 80px"
              unoptimized={/^https?:\/\//i.test(imageSrc)}
              className="object-cover transition-transform duration-300 group-hover:scale-125"
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
        <p className="text-xs font-medium text-foreground line-clamp-2 transition-all duration-300 group-hover:text-primary group-hover:scale-105 group-hover:font-bold">
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
    <section className={cn('py-20', className)}>
      <div className="container mx-auto px-6 sm:px-8 lg:px-16">
        <div className="mb-10 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-primary">
            {t('categoriesTitle')}
          </h2>
          <p className="text-sm text-muted-foreground mt-1">{t('categoriesDesc')}</p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 lg:grid-cols-8 xl:grid-cols-10 gap-5">
            {Array.from({ length: 20 }).map((_, i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <Skeleton
                  className={cn(
                    'aspect-square w-full max-w-24',
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
            className="mx-auto"
            onMouseEnter={() => setIsPaused(true)}
            onMouseLeave={() => setIsPaused(false)}
            onFocusCapture={() => setIsPaused(true)}
            onBlurCapture={() => setIsPaused(false)}
          >
            <Carousel
              className="relative mx-auto"
              opts={{
                loop: items.length > 6,
                align: 'center',
                slidesToScroll: 1,
              }}
              setApi={(a) => setApi(a)}
            >
              <CarouselContent className="justify-center">
                {items.map((c) => (
                  <CarouselItem
                    key={c.id}
                    className="basis-1/4 sm:basis-1/5 md:basis-1/6 lg:basis-1/8 xl:basis-1/10"
                  >
                    <CategoryCard category={c} locale={activeLocale} shape={shape} />
                  </CarouselItem>
                ))}
              </CarouselContent>

              {items.length > 6 && (
                <>
                  <CarouselPrevious className="-left-4" />
                  <CarouselNext className="-right-4" />
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
