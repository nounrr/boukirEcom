'use client'
import { catalogHref } from '@/lib/catalog/registry'

import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { ArrowUpRight, ChevronDown, ChevronRight, Layers, Menu } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { getLocalizedCategoryName } from '@/lib/localized-fields'
import { useGetCategoriesQuery } from '@/state/api/categories-api-slice'
import type { Category } from '@/types/category'
import { compareCategoryOrder } from '@/lib/category-order'
import { CategoryThumb, useCategoryCovers, type CategoryCover } from './category-thumb'

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

function getCategoryLabel(category: Category, locale: string) {
  return getLocalizedCategoryName(category, locale)
}

/** Le popup occupe 90 % de la largeur de l'écran, centré, et ne dépasse pas le bas de l'écran. */
type PanelBox = { left: number; width: number; maxHeight: number }
const PANEL_WIDTH_RATIO = 0.9
const PANEL_GAP = 12

/** Bandeau du rayon survolé : photo, nom, nombre de sous-catégories, bouton « Tout voir ». */
function ParentBanner({
  category,
  cover,
  label,
  count,
  href,
  eyebrow,
  countLabel,
  cta,
  onNavigate,
}: {
  category: Category
  cover: CategoryCover | null
  label: string
  count: number
  href: string
  eyebrow: string
  countLabel: string
  cta: string
  onNavigate: () => void
}) {
  const scene = cover?.kind === 'category' ? cover.src : null
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className="group relative flex min-h-36 items-center overflow-hidden rounded-2xl bg-linear-to-br from-primary via-primary/90 to-primary/60 p-6 text-white"
    >
      {scene ? (
        // eslint-disable-next-line @next/next/no-img-element -- photo servie par l'API
        <img
          src={scene}
          alt=""
          loading="lazy"
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 motion-reduce:transition-none"
        />
      ) : null}
      <span className="absolute inset-0 bg-linear-to-r from-black/80 via-black/50 to-black/5 rtl:bg-linear-to-l" aria-hidden="true" />
      <span className="relative flex w-full items-center justify-between gap-6">
        <span className="min-w-0">
          <span className="block text-[11px] font-semibold uppercase tracking-[0.2em] text-white/70">{eyebrow}</span>
          <span className="mt-1.5 line-clamp-2 text-2xl font-extrabold leading-tight xl:text-3xl">{label}</span>
          {count > 0 ? (
            <span className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium text-white/90 backdrop-blur">
              <Layers className="h-3.5 w-3.5" aria-hidden="true" />
              {countLabel}
            </span>
          ) : null}
        </span>
        <span className="flex shrink-0 items-center gap-4">
          {cover?.kind === 'product' ? (
            <CategoryThumb category={category} label={label} cover={cover} rounded="rounded-2xl" className="hidden h-24 w-24 shadow-lg md:block" />
          ) : null}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-2 text-xs font-bold text-neutral-900 shadow-md transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
            {cta}
            <ArrowUpRight className="h-3.5 w-3.5 rtl:-scale-x-100" />
          </span>
        </span>
      </span>
    </Link>
  )
}

/** Carte d'une sous-catégorie : grande photo, nom, et ses propres sous-catégories en pastilles. */
function SubcategoryCard({
  category,
  label,
  cover,
  href,
  leaves,
  locale,
  onNavigate,
}: {
  category: Category
  label: string
  cover: CategoryCover | null
  href: string
  leaves: Category[]
  locale: string
  onNavigate: () => void
}) {
  const shown = leaves.slice(0, 4)
  return (
    <div className="group/card flex flex-col overflow-hidden rounded-2xl border border-border/60 bg-card transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-xl hover:shadow-black/10 motion-reduce:transition-none motion-reduce:hover:translate-y-0">
      <Link href={href} onClick={onNavigate} className="block">
        <span className="relative block">
          <CategoryThumb
            category={category}
            label={label}
            cover={cover}
            rounded="rounded-none"
            className="aspect-4/3 w-full text-3xl ring-0"
            imgClassName="group-hover/card:scale-105"
          />
          {leaves.length > 0 ? (
            <span className="absolute end-2 top-2 inline-flex items-center gap-1 rounded-full bg-black/60 px-2 py-0.5 text-[11px] font-semibold text-white backdrop-blur">
              <Layers className="h-3 w-3" aria-hidden="true" />
              {leaves.length}
            </span>
          ) : null}
        </span>
        <span className="flex items-start justify-between gap-2 px-3 pt-2.5 pb-2">
          <span className="line-clamp-2 text-[13px] font-semibold leading-snug text-foreground transition-colors group-hover/card:text-primary">
            {label}
          </span>
          <ArrowUpRight className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/card:opacity-100 rtl:-scale-x-100" />
        </span>
      </Link>
      {shown.length > 0 ? (
        <ul className="flex flex-wrap gap-1 px-3 pb-3">
          {shown.map((leaf) => (
            <li key={leaf.id} className="max-w-full">
              <Link
                href={catalogHref(locale, 'categories', leaf.id)}
                onClick={onNavigate}
                className="block max-w-full truncate rounded-full bg-muted/70 px-2 py-0.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
              >
                {getCategoryLabel(leaf, locale)}
              </Link>
            </li>
          ))}
          {leaves.length > shown.length ? (
            <li>
              <Link
                href={href}
                onClick={onNavigate}
                className="block rounded-full px-1.5 py-0.5 text-[11px] font-semibold text-primary hover:underline underline-offset-4"
              >
                +{leaves.length - shown.length}
              </Link>
            </li>
          ) : null}
        </ul>
      ) : null}
    </div>
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
  const [panelBox, setPanelBox] = useState<PanelBox | null>(null)

  const containerRef = useRef<HTMLDivElement | null>(null)
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

  // Position du popup : 90 % de la largeur visible, centré sur l'écran (et non sous le bouton).
  useLayoutEffect(() => {
    if (!open) return
    const measure = () => {
      const el = containerRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const viewport = document.documentElement.clientWidth
      const width = Math.round(viewport * PANEL_WIDTH_RATIO)
      const left = Math.round((viewport - width) / 2 - rect.left)
      const maxHeight = Math.max(320, Math.round(window.innerHeight - rect.bottom - PANEL_GAP - 16))
      setPanelBox((prev) =>
        prev && prev.left === left && prev.width === width && prev.maxHeight === maxHeight ? prev : { left, width, maxHeight }
      )
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [open])

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

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

  const visibleRoots = useMemo(() => roots.slice(0, 18), [roots])
  const visibleChildren = useMemo(() => level1.slice(0, 24), [level1])
  const coverTargets = useMemo(() => [...visibleRoots, ...visibleChildren], [visibleRoots, visibleChildren])
  const coverOf = useCategoryCovers(coverTargets, childrenMap, open)

  const triggerLabel = t('categories')
  const close = () => setOpen(false)

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

  const columnMaxHeight = panelBox?.maxHeight ?? 640

  return (
    <div
      ref={containerRef}
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
          className="absolute top-full z-50 animate-in fade-in-0 slide-in-from-top-2 duration-200 motion-reduce:animate-none"
          style={{
            marginTop: PANEL_GAP,
            left: panelBox?.left ?? 0,
            width: panelBox?.width ?? `${PANEL_WIDTH_RATIO * 100}vw`,
          }}
          onMouseEnter={() => {
            cancelClose()
          }}
          onMouseLeave={() => {
            scheduleClose()
          }}
        >
          <div className="overflow-hidden rounded-3xl border border-border/60 bg-background shadow-2xl shadow-black/25 ring-1 ring-black/5 dark:ring-white/10">
            <div
              dir={isArabic ? 'rtl' : 'ltr'}
              className="grid grid-cols-[300px_minmax(0,1fr)] text-start xl:grid-cols-[330px_minmax(0,1fr)]"
            >
              {/* Rayons */}
              <div className="flex min-h-0 flex-col border-e border-border/50 bg-muted/40" style={{ maxHeight: columnMaxHeight }}>
                <div className="flex shrink-0 items-center justify-between px-5 pt-4 pb-2">
                  <span className="text-[11px] font-bold uppercase tracking-[0.16em] text-muted-foreground">{triggerLabel}</span>
                  <Link
                    href={`/${locale}/shop`}
                    className="text-xs font-semibold text-primary hover:underline underline-offset-4"
                    onClick={close}
                  >
                    {t('shop')}
                  </Link>
                </div>

                <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-3 [scrollbar-width:thin]">
                  {isLoading ? (
                    <div className="space-y-2 px-2 py-1">
                      {Array.from({ length: 7 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3">
                          <div className="h-11 w-11 animate-pulse rounded-xl bg-muted" />
                          <div className="h-4 flex-1 animate-pulse rounded bg-muted" />
                        </div>
                      ))}
                    </div>
                  ) : roots.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-muted-foreground">—</div>
                  ) : (
                    visibleRoots.map((c) => {
                      const isActive = c.id === activeParentId
                      const label = getCategoryLabel(c, locale)
                      const count = childrenMap.get(c.id)?.length ?? 0
                      return (
                        <Link
                          key={c.id}
                          href={catalogHref(locale, 'categories', c.id)}
                          onMouseEnter={() => setActiveParentId(c.id)}
                          onFocus={() => setActiveParentId(c.id)}
                          onClick={close}
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
                            cover={coverOf(c)}
                            className="h-11 w-11 text-sm"
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
                              'h-4 w-4 shrink-0 rtl:rotate-180',
                              isActive ? 'text-primary' : 'text-muted-foreground/70'
                            )}
                          />
                        </Link>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Rayon actif : bandeau + sous-catégories en cartes photo */}
              <div className="min-w-0 overflow-y-auto overscroll-contain p-5 [scrollbar-width:thin]" style={{ maxHeight: columnMaxHeight }}>
                {isLoading ? (
                  <div className="space-y-4">
                    <div className="h-36 animate-pulse rounded-2xl bg-muted" />
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] gap-3">
                      {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="aspect-4/3 animate-pulse rounded-2xl bg-muted" />
                      ))}
                    </div>
                  </div>
                ) : !activeParent ? (
                  <div className="text-sm text-muted-foreground">—</div>
                ) : (
                  <div key={activeParent.id} className="space-y-5 animate-in fade-in-0 duration-200 motion-reduce:animate-none">
                    <ParentBanner
                      category={activeParent}
                      cover={coverOf(activeParent)}
                      label={getCategoryLabel(activeParent, locale)}
                      count={level1.length}
                      href={catalogHref(locale, 'categories', activeParent.id)}
                      eyebrow={t('exploreCategory')}
                      countLabel={t('subcategoriesCount', { count: level1.length })}
                      cta={t('viewAllIn')}
                      onNavigate={close}
                    />

                    {visibleChildren.length > 0 ? (
                      <div className="grid grid-cols-[repeat(auto-fill,minmax(170px,1fr))] items-start gap-3">
                        {visibleChildren.map((child) => (
                          <SubcategoryCard
                            key={child.id}
                            category={child}
                            label={getCategoryLabel(child, locale)}
                            cover={coverOf(child)}
                            href={catalogHref(locale, 'categories', child.id)}
                            leaves={childrenMap.get(child.id) ?? []}
                            locale={locale}
                            onNavigate={close}
                          />
                        ))}
                      </div>
                    ) : null}
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
