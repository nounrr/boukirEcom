'use client'
import { catalogHref } from '@/lib/catalog/registry'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { ArrowUpRight, ChevronDown, ChevronRight, Menu } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getLocalizedCategoryName } from '@/lib/localized-fields'
import { useGetCategoriesQuery } from '@/state/api/categories-api-slice'
import type { Category } from '@/types/category'
import { compareCategoryOrder } from '@/lib/category-order'
import { CategoryThumb, categoryImageSrc } from './category-thumb'

type CategoryByParent = Map<number, Category[]>

function byNameThenId(a: Category, b: Category) {
  return compareCategoryOrder(a, b, (c) => c.nom || '')
}

function buildChildrenMap(categories: Category[]): CategoryByParent {
  const map: CategoryByParent = new Map()
  for (const c of categories) {
    const parentId = c.parent_id ?? 0
    const list = map.get(parentId) ?? []
    list.push(c)
    map.set(parentId, list)
  }

  for (const [key, list] of map.entries()) {
    list.sort(byNameThenId)
    map.set(key, list)
  }

  return map
}

function hasChildren(childrenMap: CategoryByParent, parentId: number) {
  const children = childrenMap.get(parentId)
  return !!children && children.length > 0
}

function getCategoryLabel(category: Category, locale: string) {
  return getLocalizedCategoryName(category, locale)
}

/** Bandeau du rayon survolé : grande image, nom, nombre de sous-catégories, bouton « Tout voir ». */
function ParentBanner({
  category,
  label,
  count,
  href,
  eyebrow,
  countLabel,
  cta,
  onNavigate,
}: {
  category: Category
  label: string
  count: number
  href: string
  eyebrow: string
  countLabel: string
  cta: string
  onNavigate: () => void
}) {
  const src = categoryImageSrc(category)
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="group relative flex min-h-32 items-end overflow-hidden rounded-2xl bg-linear-to-br from-primary to-primary/70 p-5 text-white"
    >
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- image servie par l'API
        <img
          src={src}
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
      ) : null}
      <span className="absolute inset-0 bg-linear-to-r from-black/75 via-black/45 to-black/10 rtl:bg-linear-to-l" aria-hidden="true" />
      <span className="relative flex w-full items-end justify-between gap-4">
        <span className="min-w-0">
          <span className="block text-[11px] font-semibold uppercase tracking-[0.18em] text-white/70">{eyebrow}</span>
          <span className="mt-1 line-clamp-2 text-2xl font-extrabold leading-tight">{label}</span>
          {count > 0 ? <span className="mt-0.5 block text-xs text-white/80">{countLabel}</span> : null}
        </span>
        <span className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-bold text-neutral-900 shadow-md transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
          {cta}
          <ArrowUpRight className="h-3.5 w-3.5 rtl:-scale-x-100" />
        </span>
      </span>
    </Link>
  )
}

export function CategoriesMegaMenu({
  className,
  tone = 'onPrimary',
}: {
  className?: string
  tone?: 'onPrimary' | 'onSurface'
}) {
  const t = useTranslations('header')
  const locale = useLocale()
  const isArabic = locale === 'ar'

  const { data: categories = [], isLoading } = useGetCategoriesQuery()

  const childrenMap = useMemo(() => buildChildrenMap(categories), [categories])

  const roots = useMemo(() => {
    const rootCandidates = categories.filter((c) => !c.parent_id)
    const list = (rootCandidates.length > 0 ? rootCandidates : categories).slice()
    list.sort(byNameThenId)
    return list
  }, [categories])

  const [open, setOpen] = useState(false)
  const [activeParentId, setActiveParentId] = useState<number | null>(null)

  const closeTimeoutRef = useRef<number | null>(null)

  const cancelClose = () => {
    if (closeTimeoutRef.current != null) {
      window.clearTimeout(closeTimeoutRef.current)
      closeTimeoutRef.current = null
    }
  }

  const scheduleClose = () => {
    cancelClose()
    closeTimeoutRef.current = window.setTimeout(() => {
      setOpen(false)
    }, 160)
  }

  useEffect(() => {
    return () => {
      if (closeTimeoutRef.current != null) window.clearTimeout(closeTimeoutRef.current)
    }
  }, [])

  useEffect(() => {
    if (!open) return
    if (activeParentId != null) return
    if (roots.length > 0) setActiveParentId(roots[0].id)
  }, [open, activeParentId, roots])

  const activeParent = useMemo(
    () => (activeParentId == null ? null : roots.find((c) => c.id === activeParentId) ?? null),
    [activeParentId, roots]
  )

  const level1 = useMemo(() => {
    if (!activeParent) return []
    return childrenMap.get(activeParent.id) ?? []
  }, [activeParent, childrenMap])

  const hasGrandChildren = useMemo(() => {
    return level1.some((c) => hasChildren(childrenMap, c.id))
  }, [level1, childrenMap])

  const triggerLabel = t('categories')

  const triggerClassName = cn(
    'h-10 px-3 rounded-xl text-sm font-bold border transition-colors duration-200',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    tone === 'onPrimary'
      ? 'text-white/95 bg-white/5 hover:bg-white/10 border-white/15 hover:border-white/25 focus-visible:ring-white/25 focus-visible:ring-offset-primary'
      : 'text-primary bg-primary/10 hover:bg-primary/15 border-primary/20 hover:border-primary/30 focus-visible:ring-primary/25 focus-visible:ring-offset-background',
    open && (tone === 'onPrimary' ? 'bg-white/10 border-white/25' : 'bg-primary/15 border-primary/30')
  )

  const triggerIconWrapClassName = cn(
    'grid h-7 w-7 place-items-center rounded-lg border transition-colors',
    tone === 'onPrimary'
      ? 'bg-white/10 border-white/15'
      : 'bg-primary/15 border-primary/20'
  )

  return (
    <div
      className={cn('relative hidden lg:block', className)}
      onMouseEnter={() => {
        cancelClose()
        setOpen(true)
      }}
      onMouseLeave={() => {
        scheduleClose()
      }}
    >
      <Button
        type="button"
        variant="ghost"
        className={triggerClassName}
        onFocus={() => setOpen(true)}
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <span className={triggerIconWrapClassName} aria-hidden="true">
          <Menu className={cn('h-4 w-4', tone === 'onPrimary' ? 'text-white/90' : 'text-primary')} />
        </span>
        <span className="mx-2">{triggerLabel}</span>
        <ChevronDown
          className={cn(
            'h-4 w-4 transition-transform duration-200',
            tone === 'onPrimary' ? 'text-white/75' : 'text-primary/70',
            open && 'rotate-180'
          )}
        />
      </Button>

      {open && (
        <div
          className={cn(
            'absolute top-full mt-3 z-50 animate-in fade-in-0 slide-in-from-top-2 duration-200 motion-reduce:animate-none',
            isArabic ? 'right-0' : 'left-0'
          )}
          onMouseEnter={() => {
            cancelClose()
          }}
          onMouseLeave={() => {
            scheduleClose()
          }}
        >
          <div
            className={cn(
              'overflow-hidden rounded-3xl border border-border/60 bg-background shadow-2xl shadow-black/20 ring-1 ring-black/5 dark:ring-white/10',
              'w-[min(1040px,calc(100vw-3rem))]'
            )}
          >
            <div
              dir={isArabic ? 'rtl' : 'ltr'}
              className="grid grid-cols-[320px_minmax(0,1fr)] text-start"
            >
              {/* Rayons : liste avec vignettes */}
              <div className="border-e border-border/50 bg-muted/40">
                <div className="flex items-center justify-between px-5 pt-4 pb-2">
                  <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{triggerLabel}</span>
                  <Link
                    href={`/${locale}/shop`}
                    className="text-xs font-semibold text-primary hover:underline underline-offset-4"
                    onClick={() => setOpen(false)}
                  >
                    {t('shop')}
                  </Link>
                </div>

                <div className="max-h-[min(560px,calc(100vh-11rem))] overflow-y-auto overscroll-contain px-2 pb-3 [scrollbar-width:thin]">
                  {isLoading ? (
                    <div className="space-y-2 px-2 py-1">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-muted animate-pulse" />
                          <div className="h-4 flex-1 rounded bg-muted animate-pulse" />
                        </div>
                      ))}
                    </div>
                  ) : roots.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-muted-foreground">—</div>
                  ) : (
                    roots.slice(0, 18).map((c) => {
                      const isActive = c.id === activeParentId
                      const label = getCategoryLabel(c, locale)
                      const count = childrenMap.get(c.id)?.length ?? 0
                      return (
                        <Link
                          key={c.id}
                          href={catalogHref(locale, 'categories', c.id)}
                          onMouseEnter={() => setActiveParentId(c.id)}
                          onFocus={() => setActiveParentId(c.id)}
                          onClick={() => setOpen(false)}
                          className={cn(
                            'group relative my-0.5 flex items-center gap-3 rounded-2xl px-2.5 py-2 text-sm transition-all duration-200',
                            isActive
                              ? 'bg-background text-foreground shadow-sm ring-1 ring-border/60'
                              : 'text-foreground/80 hover:bg-background/70 hover:text-foreground'
                          )}
                        >
                          <span
                            className={cn(
                              'absolute inset-y-2 start-0 w-1 rounded-full bg-primary transition-opacity',
                              isActive ? 'opacity-100' : 'opacity-0'
                            )}
                            aria-hidden="true"
                          />
                          <CategoryThumb
                            category={c}
                            label={label}
                            className="h-10 w-10 text-sm"
                            imgClassName="group-hover:scale-110"
                          />
                          <span className="min-w-0 flex-1">
                            <span className={cn('line-clamp-2 text-[13px] font-semibold leading-snug', isActive && 'text-primary')}>{label}</span>
                            {count > 0 ? (
                              <span className="block truncate text-[11px] text-muted-foreground">
                                {t('subcategoriesCount', { count })}
                              </span>
                            ) : null}
                          </span>
                          <ChevronRight
                            className={cn(
                              'h-4 w-4 shrink-0 transition-transform duration-200 rtl:rotate-180',
                              isActive ? 'text-primary' : 'text-muted-foreground/70'
                            )}
                          />
                        </Link>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Sous-catégories : bandeau du rayon + cartes illustrées */}
              <div className="min-w-0 max-h-[min(620px,calc(100vh-8rem))] overflow-y-auto overscroll-contain p-5 [scrollbar-width:thin]">
                {isLoading ? (
                  <div className="space-y-4">
                    <div className="h-28 rounded-2xl bg-muted animate-pulse" />
                    <div className="grid grid-cols-3 gap-3">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="h-20 rounded-2xl bg-muted animate-pulse" />
                      ))}
                    </div>
                  </div>
                ) : !activeParent ? (
                  <div className="text-sm text-muted-foreground">—</div>
                ) : (
                  <div key={activeParent.id} className="space-y-5 animate-in fade-in-0 duration-200 motion-reduce:animate-none">
                    <ParentBanner
                      category={activeParent}
                      label={getCategoryLabel(activeParent, locale)}
                      count={level1.length}
                      href={catalogHref(locale, 'categories', activeParent.id)}
                      eyebrow={t('exploreCategory')}
                      countLabel={t('subcategoriesCount', { count: level1.length })}
                      cta={t('viewAllIn')}
                      onNavigate={() => setOpen(false)}
                    />

                    {level1.length === 0 ? null : hasGrandChildren ? (
                      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
                        {level1.slice(0, 12).map((group) => {
                          const grand = childrenMap.get(group.id) ?? []
                          const groupLabel = getCategoryLabel(group, locale)
                          return (
                            <div
                              key={group.id}
                              className="min-w-0 rounded-2xl border border-border/60 bg-card p-3 transition-colors hover:border-primary/30"
                            >
                              <Link
                                href={catalogHref(locale, 'categories', group.id)}
                                className="group flex items-center gap-3"
                                onClick={() => setOpen(false)}
                              >
                                <CategoryThumb
                                  category={group}
                                  label={groupLabel}
                                  className="h-12 w-12 text-base"
                                  imgClassName="group-hover:scale-110"
                                />
                                <span className="min-w-0 line-clamp-2 text-sm font-bold leading-snug text-foreground transition-colors group-hover:text-primary">
                                  {groupLabel}
                                </span>
                              </Link>
                              {grand.length > 0 ? (
                                <ul className="mt-2.5 flex flex-wrap gap-1.5">
                                  {grand.slice(0, 8).map((leaf) => (
                                    <li key={leaf.id} className="max-w-full">
                                      <Link
                                        href={catalogHref(locale, 'categories', leaf.id)}
                                        className="block max-w-full truncate rounded-full bg-muted/70 px-2.5 py-1 text-xs font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                                        onClick={() => setOpen(false)}
                                      >
                                        {getCategoryLabel(leaf, locale)}
                                      </Link>
                                    </li>
                                  ))}
                                  {grand.length > 8 ? (
                                    <li>
                                      <Link
                                        href={catalogHref(locale, 'categories', group.id)}
                                        className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold text-primary hover:underline underline-offset-4"
                                        onClick={() => setOpen(false)}
                                      >
                                        +{grand.length - 8}
                                      </Link>
                                    </li>
                                  ) : null}
                                </ul>
                              ) : null}
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-4">
                        {level1.slice(0, 24).map((child) => {
                          const childLabel = getCategoryLabel(child, locale)
                          return (
                            <Link
                              key={child.id}
                              href={catalogHref(locale, 'categories', child.id)}
                              className="group flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-lg hover:shadow-black/10 motion-reduce:hover:translate-y-0"
                              onClick={() => setOpen(false)}
                            >
                              <CategoryThumb
                                category={child}
                                label={childLabel}
                                rounded="rounded-none"
                                className="aspect-[4/3] w-full text-2xl ring-0"
                                imgClassName="group-hover:scale-105"
                              />
                              <span className="flex items-center justify-between gap-2 px-3 py-2.5">
                                <span className="min-w-0 line-clamp-2 text-[13px] font-semibold leading-snug text-foreground/90 group-hover:text-primary">
                                  {childLabel}
                                </span>
                                <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 rtl:-scale-x-100" />
                              </span>
                            </Link>
                          )
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
