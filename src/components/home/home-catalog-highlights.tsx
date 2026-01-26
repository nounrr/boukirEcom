'use client'

import { useMemo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Building2, Grid3X3, ArrowRight } from 'lucide-react'
import { useLocale, useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useGetBrandsQuery } from '@/state/api/brands-api-slice'
import { useGetCategoriesQuery } from '@/state/api/categories-api-slice'

export function HomeCatalogHighlights({ className }: { className?: string }) {
  const locale = useLocale()
  const t = useTranslations('home')

  const { data: categories = [], isLoading: isCategoriesLoading } = useGetCategoriesQuery()
  const { data: brands = [], isLoading: isBrandsLoading } = useGetBrandsQuery()

  const topCategories = useMemo(() => {
    const roots = categories.filter((c) => !c.parent_id)
    return (roots.length > 0 ? roots : categories).slice(0, 10)
  }, [categories])

  const topBrands = useMemo(() => brands.slice(0, 12), [brands])

  return (
    <section className={cn('py-10', className)}>
      <div className="container mx-auto px-6 sm:px-8 lg:px-16">
        <div className="grid gap-8 lg:grid-cols-2">
          {/* Categories */}
          <div className="rounded-3xl border border-border/40 bg-card p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Grid3X3 className="h-4 w-4 text-muted-foreground" />
                  {t('categoriesTitle')}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">{t('categoriesDesc')}</div>
              </div>
              <Link href={`/${locale}/shop`} className="shrink-0">
                <Button variant="outline" className="gap-2">
                  {t('viewAll')}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
              {isCategoriesLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <div
                    key={i}
                    className="h-[68px] rounded-2xl border border-border/30 bg-muted/40 animate-pulse"
                  />
                ))
              ) : topCategories.length === 0 ? (
                <div className="col-span-full text-sm text-muted-foreground">{t('emptyCategories')}</div>
              ) : (
                topCategories.map((c) => (
                  <Link
                    key={c.id}
                    href={`/${locale}/shop?category_id=${encodeURIComponent(String(c.id))}`}
                    className="group flex items-center gap-3 rounded-2xl border border-border/40 bg-background/60 p-3 hover:bg-muted/40 transition-colors"
                  >
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl border border-border/40 bg-muted/60">
                      {c.image_url ? (
                        <Image
                          src={c.image_url}
                          alt={c.nom}
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="grid h-full w-full place-items-center text-xs font-bold text-foreground/70">
                          {c.nom?.[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-sm font-semibold text-foreground group-hover:text-foreground">
                        {c.nom}
                      </div>
                      <div className="text-xs text-muted-foreground truncate">
                        {t('browse')}
                      </div>
                    </div>
                  </Link>
                ))
              )}
            </div>
          </div>

          {/* Brands */}
          <div className="rounded-3xl border border-border/40 bg-card p-6 shadow-sm">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                  {t('brandsTitle')}
                </div>
                <div className="mt-1 text-sm text-muted-foreground">{t('brandsDesc')}</div>
              </div>
              <Link href={`/${locale}/shop`} className="shrink-0">
                <Button variant="outline" className="gap-2">
                  {t('viewAll')}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="mt-5">
              {isBrandsLoading ? (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div
                      key={i}
                      className="h-14 rounded-2xl border border-border/30 bg-muted/40 animate-pulse"
                    />
                  ))}
                </div>
              ) : topBrands.length === 0 ? (
                <div className="text-sm text-muted-foreground">{t('emptyBrands')}</div>
              ) : (
                <div className="grid grid-cols-3 gap-3 sm:grid-cols-4">
                  {topBrands.map((b) => (
                    <Link
                      key={b.id}
                      href={`/${locale}/shop?brand_id=${encodeURIComponent(String(b.id))}`}
                      className="group flex h-14 items-center justify-center rounded-2xl border border-border/40 bg-background/60 px-3 hover:bg-muted/40 transition-colors"
                      aria-label={b.nom}
                      title={b.nom}
                    >
                      <div className="relative h-8 w-full max-w-[120px]">
                        {b.image_url ? (
                          <Image
                            src={b.image_url}
                            alt={b.nom}
                            fill
                            sizes="120px"
                            className="object-contain opacity-90 group-hover:opacity-100 transition-opacity"
                          />
                        ) : (
                          <div className="w-full text-center text-xs font-semibold text-foreground/80 truncate">
                            {b.nom}
                          </div>
                        )}
                      </div>
                    </Link>
                  ))}
                </div>
              )}

              <div className="mt-5 flex items-center justify-between">
                <div className="text-xs text-muted-foreground">{t('brandsHint')}</div>
                <Link
                  href={`/${locale}/shop`}
                  className="text-sm font-semibold text-primary hover:underline underline-offset-4"
                >
                  {t('ctaBrowse')}
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
