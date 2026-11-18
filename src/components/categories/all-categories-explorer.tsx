'use client'

import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import {
  ArrowUpRight, Check, ChevronDown, ChevronsDownUp, ChevronsUpDown, Layers, LayoutGrid, Search, Sparkles, X,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { useDragScroll } from '@/hooks/use-drag-scroll'
import { shopCategoryHref } from '@/lib/catalog/shop-href'
import { compareCategoryOrder } from '@/lib/category-order'
import { getLocalizedCategoryName } from '@/lib/localized-fields'
import { useGetCategoriesQuery } from '@/state/api/categories-api-slice'
import type { Category } from '@/types/category'
import { CategoryThumb, useCategoryCovers, type CategoryCover } from '@/components/layout/category-thumb'
import { SubcategoryCard } from '@/components/layout/categories-mega-menu'

type ChildrenMap = Map<number, Category[]>

function normalize(value: string) {
  return value.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
}

function buildChildrenMap(categories: Category[]): ChildrenMap {
  const map: ChildrenMap = new Map()
  for (const category of categories) {
    const parentId = category.parent_id ?? 0
    const list = map.get(parentId) ?? []
    list.push(category)
    map.set(parentId, list)
  }
  for (const list of map.values()) list.sort((a, b) => compareCategoryOrder(a, b, (c) => c.nom || ''))
  return map
}

/** Toutes les catégories du catalogue : grandes cartes par univers, filtres, ouverture / fermeture. */
export function AllCategoriesExplorer({ initialCategories }: { initialCategories: Category[] }) {
  const t = useTranslations('categoriesPage')
  const locale = useLocale()
  const isArabic = locale === 'ar'
  const { data } = useGetCategoriesQuery()
  const categories = data && data.length > 0 ? data : initialCategories

  const childrenMap = useMemo(() => buildChildrenMap(categories), [categories])
  const roots = useMemo(() => {
    const list = categories.filter((c) => !c.parent_id)
    return (list.length > 0 ? list : categories).slice().sort((a, b) => compareCategoryOrder(a, b, (c) => c.nom || ''))
  }, [categories])

  const label = (category: Category) => getLocalizedCategoryName(category, locale) || category.nom

  const [selected, setSelected] = useState<Set<number>>(() => new Set())
  // Univers strip: dragged with the mouse like a finger on a phone.
  const universStripRef = useRef<HTMLDivElement>(null)
  useDragScroll(universStripRef)
  const [opened, setOpened] = useState<Set<number>>(() => new Set(roots[0] ? [roots[0].id] : []))
  const [query, setQuery] = useState('')
  const needle = normalize(query)

  // Une catégorie correspond à la recherche si son nom ou celui d'une sous-catégorie correspond.
  const matches = useMemo(() => {
    if (!needle) return null
    const memo = new Map<number, boolean>()
    const visit = (category: Category): boolean => {
      if (memo.has(category.id)) return memo.get(category.id)!
      const own = [category.nom, category.nom_ar, category.nom_en, category.nom_zh]
        .some((name) => typeof name === 'string' && normalize(name).includes(needle))
      const result = own || (childrenMap.get(category.id) ?? []).some(visit)
      memo.set(category.id, result)
      return result
    }
    categories.forEach(visit)
    return memo
  }, [needle, categories, childrenMap])

  const visibleRoots = roots.filter((root) => (selected.size === 0 || selected.has(root.id)) && (!matches || matches.get(root.id)))
  const isOpen = (id: number) => opened.has(id) || Boolean(matches)

  // Photos : univers + sous-catégories des cartes ouvertes (photo d'un produit si la catégorie n'en a pas).
  const coverTargets = useMemo(() => {
    const list: Category[] = [...roots]
    for (const root of roots) {
      const children = childrenMap.get(root.id) ?? []
      if (opened.has(root.id) || matches?.get(root.id)) list.push(...children)
    }
    return list
  }, [roots, opened, matches, childrenMap])
  const coverOf = useCategoryCovers(coverTargets, childrenMap, true)

  const subcategoriesTotal = Math.max(0, categories.length - roots.length)
  const slides = roots.filter((root) => root.image_url)

  const toggleSelected = (id: number) => setSelected((prev) => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  })
  const toggleOpen = (id: number) => setOpened((prev) => {
    const next = new Set(prev)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    return next
  })
  const allOpen = visibleRoots.length > 0 && visibleRoots.every((root) => opened.has(root.id))
  const toggleAll = () => setOpened(allOpen ? new Set() : new Set(visibleRoots.map((root) => root.id)))

  return (
    <div className="pb-20" dir={isArabic ? 'rtl' : 'ltr'}>
      {/* En-tête */}
      <section className="relative overflow-hidden bg-ink text-white">
        <div className="pointer-events-none absolute -end-24 -top-24 size-[28rem] rounded-full bg-brand-orange/20 blur-3xl" aria-hidden="true" />
        <div className="pointer-events-none absolute -bottom-32 start-1/3 size-80 rounded-full bg-brand-yellow/10 blur-3xl" aria-hidden="true" />
        <div className="relative mx-auto grid max-w-[1440px] grid-cols-[minmax(0,1fr)] gap-10 px-4 py-12 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,500px)] lg:items-center lg:px-10 lg:py-14">
          <div className="min-w-0">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-brand-yellow">
              <Sparkles className="size-3.5" aria-hidden="true" />{t('eyebrow')}
            </p>
            <h1 className="mt-5 text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">{t('title')}</h1>
            <p className="mt-4 max-w-xl text-base leading-relaxed text-white/70">
              {t('subtitle', { universes: roots.length, subcategories: subcategoriesTotal })}
            </p>
          </div>

          {/* Slider automatique des univers */}
          {slides.length > 0 ? (
            <HeroCategorySlider slides={slides} label={label} coverOf={coverOf} locale={locale} />
          ) : null}
        </div>
      </section>

      {/* Barre de recherche : reste collée sous le menu pendant le défilement */}
      <div className="sticky top-[var(--site-header-h,64px)] z-30 border-b border-border/70 bg-background/85 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70">
        <div className="mx-auto flex max-w-[1440px] items-center gap-3 px-4 py-3 sm:px-6 lg:px-10">
          <label className="relative min-w-0 flex-1 lg:max-w-2xl">
            <span className="sr-only">{t('searchPlaceholder')}</span>
            <Search className="pointer-events-none absolute start-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t('searchPlaceholder')}
              className="h-12 w-full rounded-2xl border border-border bg-card ps-12 pe-12 text-[15px] outline-none transition-[border-color,box-shadow] duration-500 ease-hover placeholder:text-muted-foreground focus:border-brand-orange/70 focus:shadow-[0_0_0_4px_rgba(242,159,4,0.15)]"
            />
            {query ? (
              <button type="button" onClick={() => setQuery('')} aria-label={t('clearSearch')} className="absolute end-2.5 top-1/2 grid size-8 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground">
                <X className="size-4" />
              </button>
            ) : null}
          </label>
          <p className="hidden text-sm text-muted-foreground sm:block lg:ms-auto" aria-live="polite">
            {t('resultsCount', { count: visibleRoots.length })}
          </p>
          <button
            type="button"
            onClick={toggleAll}
            disabled={Boolean(matches) || visibleRoots.length === 0}
            aria-label={allOpen ? t('collapseAll') : t('expandAll')}
            className="inline-flex h-12 shrink-0 items-center gap-2 rounded-2xl border border-border bg-card px-3.5 text-sm font-semibold transition-colors hover:border-brand-orange/50 hover:bg-muted/60 disabled:opacity-40 sm:h-10 sm:rounded-full sm:px-4"
          >
            {allOpen ? <ChevronsDownUp className="size-4" aria-hidden="true" /> : <ChevronsUpDown className="size-4" aria-hidden="true" />}
            <span className="hidden sm:inline">{allOpen ? t('collapseAll') : t('expandAll')}</span>
          </button>
        </div>
      </div>

      <div className="mx-auto grid max-w-[1440px] gap-8 px-4 pt-8 sm:px-6 lg:grid-cols-[280px_minmax(0,1fr)] lg:px-10">
        {/* Filtres par univers */}
        <aside className="min-w-0 lg:sticky lg:top-[calc(var(--site-header-h,112px)+5.5rem)] lg:self-start">
          <div className="flex items-center justify-between gap-2">
            <h2 className="flex items-center gap-2 text-sm font-bold uppercase tracking-[0.16em] text-muted-foreground">
              <LayoutGrid className="size-4" aria-hidden="true" />{t('filtersTitle')}
            </h2>
            {selected.size > 0 ? (
              <button type="button" onClick={() => setSelected(new Set())} className="text-xs font-semibold text-accent-text hover:underline underline-offset-4">
                {t('showAll')}
              </button>
            ) : null}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            {selected.size > 0 ? t('selectedCount', { count: selected.size }) : t('filtersHint')}
          </p>
          <div ref={universStripRef} className="no-scrollbar -mx-4 mt-3 flex cursor-grab snap-x snap-proximity gap-2 overflow-x-auto overscroll-x-contain px-4 pb-2 data-[dragging=true]:cursor-grabbing data-[dragging=true]:snap-none lg:mx-0 lg:cursor-auto lg:snap-none lg:max-h-[calc(100vh-var(--site-header-h,112px)-11rem)] lg:flex-col lg:gap-1 lg:overflow-y-auto lg:overflow-x-visible lg:px-0 lg:pe-1">
            {roots.map((root) => {
              const active = selected.has(root.id)
              const count = childrenMap.get(root.id)?.length ?? 0
              return (
                <button
                  key={root.id}
                  type="button"
                  aria-pressed={active}
                  onClick={() => toggleSelected(root.id)}
                  className={cn(
                    'group flex shrink-0 items-center gap-3 rounded-2xl border px-2 py-2 text-start transition-[background-color,border-color,box-shadow] duration-500 ease-hover lg:w-full',
                    active
                      ? 'border-brand-orange/60 bg-brand-orange/10 shadow-[0_8px_24px_-16px_rgba(242,159,4,0.8)]'
                      : 'border-border bg-card hover:border-brand-orange/40 hover:bg-muted/50'
                  )}
                >
                  <CategoryThumb category={root} label={label(root)} cover={coverOf(root)} className="size-10 text-sm" />
                  <span className="min-w-0 max-w-36 flex-1 lg:max-w-none">
                    <span className="line-clamp-2 text-[13px] font-semibold leading-snug">{label(root)}</span>
                    {count > 0 ? <span className="block text-[11px] text-muted-foreground">{t('subCount', { count })}</span> : null}
                  </span>
                  <span className={cn('grid size-5 shrink-0 place-items-center rounded-md border transition-colors duration-500', active ? 'border-brand-orange bg-brand-orange text-ink' : 'border-border text-transparent')} aria-hidden="true">
                    <Check className="size-3.5" strokeWidth={3} />
                  </span>
                </button>
              )
            })}
          </div>
        </aside>

        {/* Univers */}
        <section className="min-w-0" aria-label={t('title')}>

          {categories.length === 0 ? (
            <p className="rounded-3xl border border-dashed border-border p-10 text-center text-muted-foreground">{t('empty')}</p>
          ) : visibleRoots.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border p-10 text-center">
              <p className="text-muted-foreground">{needle ? t('noResults', { query: query.trim() }) : t('noSelection')}</p>
              <button type="button" onClick={() => { setQuery(''); setSelected(new Set()) }} className="mt-4 inline-flex h-10 items-center rounded-full bg-gold px-5 text-sm font-bold text-ink">
                {t('resetFilters')}
              </button>
            </div>
          ) : (
            <ol className="space-y-5">
              {visibleRoots.map((root, index) => (
                <UniverseCard
                  key={root.id}
                  root={root}
                  index={roots.indexOf(root)}
                  order={index}
                  label={label}
                  childrenMap={childrenMap}
                  coverOf={coverOf}
                  open={isOpen(root.id)}
                  onToggle={() => toggleOpen(root.id)}
                  matches={matches}
                  locale={locale}
                />
              ))}
            </ol>
          )}
        </section>
      </div>
    </div>
  )
}

function UniverseCard({
  root, index, order, label, childrenMap, coverOf, open, onToggle, matches, locale,
}: {
  root: Category
  index: number
  order: number
  label: (category: Category) => string
  childrenMap: ChildrenMap
  coverOf: (category: Category) => CategoryCover | null
  open: boolean
  onToggle: () => void
  matches: Map<number, boolean> | null
  locale: string
}) {
  const t = useTranslations('categoriesPage')

  const allChildren = childrenMap.get(root.id) ?? []
  // En recherche : seulement les sous-catégories qui correspondent (toutes si seul l'univers correspond).
  const matchingChildren = matches ? allChildren.filter((child) => matches.get(child.id)) : allChildren
  const children = matches && matchingChildren.length > 0 ? matchingChildren : allChildren
  const leavesTotal = allChildren.reduce((sum, child) => sum + (childrenMap.get(child.id)?.length ?? 0), 0)
  const href = shopCategoryHref(locale, root.id)
  const rootCover = coverOf(root)
  const number = String(index + 1).padStart(2, '0')
  const bodyId = `universe-${root.id}`

  return (
    <li
      id={`cat-${root.id}`}
      className="scroll-mt-[calc(var(--site-header-h,112px)+6rem)] animate-in fade-in-0 slide-in-from-bottom-3 duration-700 motion-reduce:animate-none"
      style={{ animationDelay: `${Math.min(order, 8) * 60}ms`, animationFillMode: 'both' } as CSSProperties}
    >
      <article className={cn(
        'group/universe overflow-hidden rounded-[1.75rem] border bg-card shadow-[0_18px_50px_-40px_rgba(13,13,13,0.6)] transition-[border-color,box-shadow] duration-700 ease-hover',
        open ? 'border-brand-orange/40 shadow-[0_30px_70px_-45px_rgba(242,159,4,0.55)]' : 'border-border hover:border-brand-orange/30'
      )}>
        <div className="grid md:grid-cols-[minmax(200px,24%)_minmax(0,1fr)]">
          {/* Grande photo de l'univers */}
          <Link href={href} className="group/photo relative block min-h-36 overflow-hidden md:min-h-[136px]" aria-label={label(root)}>
            <CategoryThumb
              category={root}
              label={label(root)}
              cover={rootCover}
              rounded="rounded-none"
              className="absolute inset-0 size-full text-6xl ring-0"
              displayWidth={320}
              imgClassName="duration-[1400ms] ease-hover group-hover/photo:scale-105"
            />
            <span className="absolute inset-0 bg-linear-to-t from-black/75 via-black/20 to-transparent md:bg-linear-to-r md:from-black/10 md:via-transparent md:to-transparent" aria-hidden="true" />
            <span className="absolute start-3 top-3 rounded-full bg-black/55 px-2.5 py-0.5 text-[11px] font-bold tracking-[0.18em] text-brand-yellow backdrop-blur" aria-hidden="true">{number}</span>
            <span className="absolute bottom-3 end-3 inline-flex items-center gap-1.5 rounded-full bg-white px-3 py-1 text-[11px] font-bold text-neutral-900 shadow-lg transition-colors duration-500 group-hover/photo:bg-gold">
              {t('viewAll')}<ArrowUpRight className="size-3.5 rtl:-scale-x-100" aria-hidden="true" />
            </span>
          </Link>

          <div className="flex min-w-0 flex-col justify-center p-4 sm:px-6 sm:py-5">
            <div className="flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.18em] text-accent-text">{t('universeLabel', { index: number })}</p>
                <h2 className="mt-1 text-xl font-extrabold leading-tight tracking-tight sm:text-2xl">
                  <Link href={href} className="transition-colors duration-500 hover:text-accent-text">{label(root)}</Link>
                </h2>
                <p className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-muted-foreground">
                  <span className="inline-flex items-center gap-1.5"><Layers className="size-4" aria-hidden="true" />{t('subCount', { count: allChildren.length })}</span>
                  {leavesTotal > 0 ? <span>· {t('leavesCount', { count: leavesTotal })}</span> : null}
                </p>
              </div>
              {allChildren.length > 0 ? (
                <button
                  type="button"
                  onClick={onToggle}
                  aria-expanded={open}
                  aria-controls={bodyId}
                  disabled={Boolean(matches)}
                  className={cn(
                    'inline-flex h-11 shrink-0 items-center gap-2 rounded-full border px-4 text-sm font-semibold transition-[background-color,border-color,color] duration-500 ease-hover disabled:cursor-default',
                    open ? 'border-brand-orange/50 bg-brand-orange/10 text-accent-text' : 'border-border bg-background hover:border-brand-orange/40'
                  )}
                >
                  <span className="hidden sm:inline">{open ? t('close') : t('open')}</span>
                  <ChevronDown className={cn('size-4 transition-transform duration-500 ease-hover', open && 'rotate-180')} aria-hidden="true" />
                </button>
              ) : null}
            </div>

            {allChildren.length === 0 ? (
              <Link href={href} className="mt-4 inline-flex h-10 items-center gap-2 rounded-full bg-gold px-5 text-sm font-bold text-ink">
                {t('viewProducts')}<ArrowUpRight className="size-4 rtl:-scale-x-100" aria-hidden="true" />
              </Link>
            ) : null}

            {/* Ouvert : toutes les sous-catégories en cartes photo */}
            {allChildren.length > 0 ? (
              <div id={bodyId} className={cn('grid transition-[grid-template-rows] duration-700 ease-hover', open ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
                {/* Toujours rendu (animation de fermeture), mais inerte et sans chargement d'images tant que c'est fermé. */}
                <div className="min-h-0 overflow-hidden" inert={!open}>
                    <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] items-start gap-3 pt-5">
                      {children.map((child) => (
                        <SubcategoryCard
                          key={child.id}
                          category={child}
                          label={label(child)}
                          cover={coverOf(child)}
                          href={shopCategoryHref(locale, child.id)}
                          leaves={childrenMap.get(child.id) ?? []}
                          locale={locale}
                          onNavigate={() => {}}
                        />
                      ))}
                    </div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </article>
    </li>
  )
}

const SLIDE_INTERVAL = 3800

/** Photos des univers qui défilent seules (pause au survol, et si le mouvement réduit est demandé). */
function HeroCategorySlider({
  slides, label, coverOf, locale,
}: {
  slides: Category[]
  label: (category: Category) => string
  coverOf: (category: Category) => CategoryCover | null
  locale: string
}) {
  const t = useTranslations('categoriesPage')
  const [index, setIndex] = useState(0)
  const [paused, setPaused] = useState(false)
  const count = slides.length

  useEffect(() => {
    if (count < 2 || paused) return
    if (typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const timer = window.setInterval(() => {
      if (document.visibilityState === 'visible') setIndex((value) => (value + 1) % count)
    }, SLIDE_INTERVAL)
    return () => window.clearInterval(timer)
  }, [count, paused])

  const current = slides[index % count]

  // Swipe (finger or mouse) to the next / previous univers; a swipe does not open the card.
  const swipeRef = useRef<{ x: number; y: number; id: number } | null>(null)
  const swipedRef = useRef(false)
  const isRtl = () => typeof document !== 'undefined' && document.documentElement.dir === 'rtl'

  return (
    <div
      className="relative touch-pan-y select-none"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={() => setPaused(false)}
      onPointerDown={(event) => {
        if (event.pointerType === 'mouse' && event.button !== 0) return
        swipeRef.current = { x: event.clientX, y: event.clientY, id: event.pointerId }
      }}
      onPointerUp={(event) => {
        const start = swipeRef.current
        swipeRef.current = null
        if (!start || start.id !== event.pointerId || count < 2) return
        const dx = event.clientX - start.x
        const dy = event.clientY - start.y
        if (Math.abs(dx) < 40 || Math.abs(dx) < Math.abs(dy) * 1.3) return
        swipedRef.current = true
        window.setTimeout(() => { swipedRef.current = false }, 80)
        const forward = isRtl() ? dx > 0 : dx < 0
        setIndex((value) => (value + (forward ? 1 : count - 1)) % count)
      }}
      onPointerCancel={() => { swipeRef.current = null }}
      onClickCapture={(event) => {
        if (!swipedRef.current) return
        swipedRef.current = false
        event.preventDefault()
        event.stopPropagation()
      }}
      onDragStart={(event) => event.preventDefault()}
    >
      <div className="relative h-56 sm:h-64 lg:h-72">
        {slides.map((slide, slideIndex) => {
          const offset = (slideIndex - index + count) % count
          const pose =
            offset === 0
              ? 'z-30 opacity-100 translate-x-0 rotate-0 scale-100'
              : offset === 1
                ? 'z-20 opacity-70 translate-x-[7%] rotate-[4deg] scale-[0.92]'
                : offset === 2
                  ? 'z-10 opacity-40 translate-x-[13%] rotate-[8deg] scale-[0.85]'
                  : 'z-0 opacity-0 translate-x-[18%] rotate-[10deg] scale-[0.8]'
          return (
            <Link
              key={slide.id}
              href={shopCategoryHref(locale, slide.id)}
              tabIndex={offset === 0 ? 0 : -1}
              aria-hidden={offset !== 0}
              className={cn(
                'group/slide absolute inset-0 overflow-hidden rounded-[1.75rem] border-4 border-white/10 bg-ink shadow-2xl shadow-black/60 transition-[translate,rotate,scale,opacity] duration-[900ms] ease-hover will-change-transform motion-reduce:transition-none',
                pose,
                offset !== 0 && 'pointer-events-none'
              )}
            >
              <CategoryThumb
                category={slide}
                label={label(slide)}
                cover={coverOf(slide)}
                rounded="rounded-none"
                className="size-full ring-0"
                displayWidth={480}
                imgClassName={cn('duration-[4000ms] ease-linear', offset === 0 ? 'scale-110' : 'scale-100')}
              />
              <span className={cn('absolute inset-0 bg-linear-to-t from-black/80 via-black/15 to-transparent transition-opacity duration-700', offset === 0 ? 'opacity-100' : 'opacity-0')} aria-hidden="true" />
              {/* Légende : seulement sur la carte de devant (pas de textes superposés) */}
              <span className={cn('absolute inset-x-5 bottom-4 flex items-end justify-between gap-3 transition-[opacity,translate] duration-700 ease-hover', offset === 0 ? 'translate-y-0 opacity-100 delay-200' : 'translate-y-2 opacity-0')}>
                <span className="min-w-0">
                  <span className="block text-[10px] font-bold uppercase tracking-[0.2em] text-brand-yellow">
                    {t('universeLabel', { index: String(slideIndex + 1).padStart(2, '0') })}
                  </span>
                  <span className="mt-1 line-clamp-2 text-lg font-extrabold leading-tight text-white">{label(slide)}</span>
                </span>
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-white text-neutral-900 transition-colors duration-500 group-hover/slide:bg-gold">
                  <ArrowUpRight className="size-4 rtl:-scale-x-100" aria-hidden="true" />
                </span>
              </span>
            </Link>
          )
        })}
      </div>
      <div className="mx-auto mt-5 flex max-w-full flex-wrap items-center justify-center gap-x-1 gap-y-1.5" aria-label={current ? label(current) : undefined}>
        {slides.map((slide, slideIndex) => (
          <button
            key={slide.id}
            type="button"
            onClick={() => setIndex(slideIndex)}
            aria-label={label(slide)}
            aria-current={slideIndex === index ? 'true' : undefined}
            className="grid h-4 place-items-center px-0.5"
          >
            <span className={cn('block h-1 rounded-full transition-all duration-500', slideIndex === index ? 'w-6 bg-brand-orange' : 'w-1.5 bg-white/25 hover:bg-white/50')} />
          </button>
        ))}
      </div>
    </div>
  )
}
