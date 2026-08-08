'use client'

import { useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { ArrowUpRight } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'

import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/utils'
import { API_CONFIG } from '@/lib/api-config'
import { getLocalizedCategoryName } from '@/lib/localized-fields'
import { useGetCategoriesQuery } from '@/state/api/categories-api-slice'
import type { Category } from '@/types/category'

function getCategoryLabel(category: Category, locale: string) {
  return getLocalizedCategoryName(category, locale)
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

function CategoryArrowButton({ isRtl }: { isRtl?: boolean }) {
  return (
    <span className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white text-foreground shadow-md transition-transform duration-300 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground">
      <ArrowUpRight className={cn('h-4 w-4', isRtl && '-scale-x-100')} />
    </span>
  )
}

function FeaturedCategoryCard({
  category,
  locale,
  isRtl,
  saleLabel,
  discountLabel,
}: {
  category: Category
  locale: string
  isRtl: boolean
  saleLabel: string
  discountLabel: string
}) {
  const href = `/${locale}/shop?category_id=${encodeURIComponent(String(category.id))}`
  const imageSrc = toAbsoluteImageUrl(category.image_url)
  const label = getCategoryLabel(category, locale)

  return (
    <Link
      href={href}
      className="group relative flex h-full min-h-96 flex-col justify-end overflow-hidden bg-muted p-6 sm:min-h-[520px] sm:p-10"
    >
      {imageSrc ? (
        <Image
          src={imageSrc}
          alt={label}
          fill
          sizes="(min-width: 1024px) 42vw, 100vw"
          unoptimized={/^https?:\/\//i.test(imageSrc)}
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 bg-linear-to-br from-teal-100 to-cyan-100 dark:from-teal-950/30 dark:to-cyan-950/30" />
      )}

      <div className="absolute inset-0 bg-linear-to-t from-black/60 via-black/10 to-transparent" />

      <Badge className="absolute start-6 top-6 rounded-full bg-primary px-3 py-1 text-xs font-bold text-primary-foreground hover:bg-primary sm:start-8 sm:top-8">
        {saleLabel}
      </Badge>

      <div className="relative flex items-end justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-white/90 sm:text-base">{discountLabel}</p>
          <h3 className="mt-1 truncate text-2xl font-bold text-white sm:text-4xl">{label}</h3>
        </div>
        <CategoryArrowButton isRtl={isRtl} />
      </div>
    </Link>
  )
}

function GridCategoryCard({
  category,
  locale,
  isRtl,
}: {
  category: Category
  locale: string
  isRtl: boolean
}) {
  const href = `/${locale}/shop?category_id=${encodeURIComponent(String(category.id))}`
  const imageSrc = toAbsoluteImageUrl(category.image_url)
  const label = getCategoryLabel(category, locale)
  const categoryInitial = label?.[0]?.toUpperCase() ?? 'C'

  return (
    <Link
      href={href}
      className="group relative flex min-h-[150px] flex-col justify-between overflow-hidden bg-muted p-4 sm:min-h-[195px] sm:p-5"
    >
      {imageSrc ? (
        <Image
          src={imageSrc}
          alt={label}
          fill
          sizes="(min-width: 1024px) 20vw, 50vw"
          unoptimized={/^https?:\/\//i.test(imageSrc)}
          className="object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <div className="absolute inset-0 flex items-center justify-center bg-linear-to-br from-teal-50 to-cyan-50 dark:from-teal-950/20 dark:to-cyan-950/20">
          <span className="text-3xl font-bold text-teal-600 dark:text-teal-400">{categoryInitial}</span>
        </div>
      )}

      <div className="absolute inset-0 bg-linear-to-t from-black/55 via-black/5 to-transparent" />

      <span className="relative ms-auto">
        <CategoryArrowButton isRtl={isRtl} />
      </span>

      <h3 className="relative line-clamp-2 text-base font-bold text-white sm:text-lg">{label}</h3>
    </Link>
  )
}

export function HomeCatalogHighlights({
  locale,
  className,
  limit = 10,
}: {
  locale?: string
  className?: string
  shape?: 'rounded' | 'circle'
  limit?: number
}) {
  const t = useTranslations('home')
  const detectedLocale = useLocale()
  const activeLocale = locale || detectedLocale
  const isRtl = activeLocale === 'ar'

  const { data: categories = [], isLoading } = useGetCategoriesQuery()

  const items = useMemo(() => {
    const roots = categories.filter((c) => !c.parent_id)
    const list = roots.length > 0 ? roots : categories
    return list.slice(0, limit)
  }, [categories, limit])

  const [featured, ...rest] = items
  const topRowItems = rest.slice(0, 6)
  const bottomRowItems = rest.slice(6, 9)

  return (
    <section className={cn('py-20', className)}>
      <div className="container mx-auto px-6 sm:px-8 lg:px-16">
        <div className="mb-10 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-primary">{t('categoriesTitle')}</h2>
          <p className="text-sm text-muted-foreground mt-1">{t('categoriesDesc')}</p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.35fr_1fr]">
              <Skeleton className="min-h-96 w-full sm:min-h-[520px]" />
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="min-h-[150px] w-full sm:min-h-[195px]" />
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="min-h-[150px] w-full sm:min-h-[195px]" />
              ))}
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="border border-teal-200 dark:border-teal-800 bg-white/60 dark:bg-gray-900/60 backdrop-blur-sm p-12 text-center">
            <p className="text-muted-foreground">{t('emptyCategories')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.35fr_1fr]">
              {featured && (
                <FeaturedCategoryCard
                  category={featured}
                  locale={activeLocale}
                  isRtl={isRtl}
                  saleLabel={t('categoriesSaleBadge')}
                  discountLabel={t('categoriesSaleDiscount', { percent: 25 })}
                />
              )}

              {topRowItems.length > 0 && (
                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  {topRowItems.map((category) => (
                    <GridCategoryCard key={category.id} category={category} locale={activeLocale} isRtl={isRtl} />
                  ))}
                </div>
              )}
            </div>

            {bottomRowItems.length > 0 && (
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {bottomRowItems.map((category) => (
                  <GridCategoryCard key={category.id} category={category} locale={activeLocale} isRtl={isRtl} />
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  )
}
