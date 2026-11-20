'use client'
import { catalogHref } from '@/lib/catalog/registry'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { ChevronDown, ChevronRight, Menu } from 'lucide-react'

import { cn } from '@/lib/utils'
import { getLocalizedCategoryName } from '@/lib/localized-fields'
import { useGetCategoriesQuery } from '@/state/api/categories-api-slice'
import type { Category } from '@/types/category'
import { compareCategoryOrder } from '@/lib/category-order'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { CategoryThumb, useCategoryCovers } from './category-thumb'

type CategoryByParent = Map<number, Category[]>

function getCategoryLabel(category: Category, locale: string) {
  return getLocalizedCategoryName(category, locale)
}

function byLabelThenId(locale: string) {
  return (a: Category, b: Category) => compareCategoryOrder(a, b, (c) => getCategoryLabel(c, locale) || '')
}

function buildChildrenMap(categories: Category[], locale: string): CategoryByParent {
  const map: CategoryByParent = new Map()
  for (const c of categories) {
    const parentId = c.parent_id ?? 0
    const list = map.get(parentId) ?? []
    list.push(c)
    map.set(parentId, list)
  }

  const sorter = byLabelThenId(locale)
  for (const [key, list] of map.entries()) {
    list.sort(sorter)
    map.set(key, list)
  }

  return map
}

export function CategoriesMobileMenu({
  onNavigate,
  tone = 'onPrimary',
}: {
  onNavigate?: () => void
  tone?: 'onPrimary' | 'onSurface'
}) {
  const t = useTranslations('header')
  const locale = useLocale()

  const { data: categories = [], isLoading } = useGetCategoriesQuery()
  const [open, setOpen] = useState(false)
  const [expandedParents, setExpandedParents] = useState<number[]>([])

  const childrenMap = useMemo(() => buildChildrenMap(categories, locale), [categories, locale])

  const roots = useMemo(() => {
    const rootCandidates = categories.filter((c) => !c.parent_id)
    const list = (rootCandidates.length > 0 ? rootCandidates : categories).slice()
    list.sort(byLabelThenId(locale))
    return list
  }, [categories, locale])

  // Photos : rayons affichés + sous-catégories des rayons ouverts (photo d'un produit si besoin).
  const coverTargets = useMemo(() => {
    const visibleRoots = roots.slice(0, 18)
    const expanded = visibleRoots
      .filter((c) => expandedParents.includes(c.id))
      .flatMap((c) => (childrenMap.get(c.id) ?? []).slice(0, 24))
    return [...visibleRoots, ...expanded]
  }, [roots, expandedParents, childrenMap])
  const coverOf = useCategoryCovers(coverTargets, childrenMap, open)

  const toggleParent = (id: number) => {
    setExpandedParents((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  const isOnPrimary = tone === 'onPrimary'

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex w-full items-center justify-between gap-3 px-3 py-3 text-sm font-semibold rounded-xl transition-colors',
            isOnPrimary
              ? 'bg-white/10 border border-white/15 hover:bg-white/15 hover:border-white/25 text-white/90 hover:text-white'
              : 'bg-card border border-border/50 hover:bg-muted/40 text-foreground'
          )}
        >
          <span className="flex items-center gap-3 min-w-0">
            <span
              className={cn(
                'grid h-7 w-7 shrink-0 place-items-center rounded-lg border',
                isOnPrimary ? 'bg-white/10 border-white/15' : 'bg-primary/10 border-primary/15'
              )}
              aria-hidden="true"
            >
              <Menu className={cn('w-4 h-4', isOnPrimary ? 'text-white/90' : 'text-primary')} />
            </span>
            <span className="truncate">{t('categories')}</span>
          </span>
          <ChevronDown
            className={cn(
              'w-4 h-4 shrink-0 transition-transform duration-200',
              isOnPrimary ? 'text-white/80' : 'text-muted-foreground',
              open && 'rotate-180'
            )}
          />
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent className="data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-top-1 motion-reduce:animate-none">
        <div className="mt-2 flex flex-col gap-1.5">
          {isLoading ? (
            <div className="space-y-2 px-1 py-1">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={cn('h-11 w-11 rounded-xl animate-pulse', isOnPrimary ? 'bg-white/10' : 'bg-muted/40')} />
                  <div className={cn('h-4 flex-1 rounded animate-pulse', isOnPrimary ? 'bg-white/10' : 'bg-muted/40')} />
                </div>
              ))}
            </div>
          ) : roots.length === 0 ? (
              <div className={cn('px-3 py-2 text-sm', isOnPrimary ? 'text-white/60' : 'text-muted-foreground')}>—</div>
          ) : (
            roots.slice(0, 18).map((c) => {
              const children = childrenMap.get(c.id ?? -1) ?? []
              const hasChildren = children.length > 0
              const isExpanded = expandedParents.includes(c.id)
              const label = getCategoryLabel(c, locale)

              return (
                <div
                  key={c.id}
                  className={cn(
                    'overflow-hidden rounded-2xl border transition-colors',
                    isOnPrimary
                      ? cn('border-white/10', isExpanded ? 'bg-white/[0.08]' : 'bg-white/[0.04]')
                      : cn('border-border/50', isExpanded ? 'bg-muted/40' : 'bg-card')
                  )}
                >
                  <div className="flex items-center gap-1 p-1.5">
                    <Link
                      href={catalogHref(locale, 'categories', c.id, c.nom)}
                      onClick={() => {
                        onNavigate?.()
                        setOpen(false)
                      }}
                      className={cn(
                        'group flex min-w-0 flex-1 items-center gap-3 rounded-xl px-1.5 py-1 text-sm transition-colors',
                        isOnPrimary ? 'text-white/90 hover:text-white' : 'text-foreground/90 hover:text-foreground'
                      )}
                    >
                      <CategoryThumb
                        category={c}
                        label={label}
                        cover={coverOf(c)}
                        className={cn('h-11 w-11 text-sm', isOnPrimary && 'ring-white/15')}
                        imgClassName="group-hover:scale-110"
                      />
                      <span className="min-w-0">
                        <span className="line-clamp-2 font-semibold leading-snug">{label}</span>
                        {hasChildren ? (
                          <span className={cn('block truncate text-[11px]', isOnPrimary ? 'text-white/55' : 'text-muted-foreground')}>
                            {t('subcategoriesCount', { count: children.length })}
                          </span>
                        ) : null}
                      </span>
                    </Link>

                    {hasChildren ? (
                      <button
                        type="button"
                        aria-label={isExpanded ? t('close') : t('open')}
                        aria-expanded={isExpanded}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          toggleParent(c.id)
                        }}
                        className={cn(
                          'grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-colors',
                          isOnPrimary
                            ? cn('hover:bg-white/10', isExpanded && 'bg-white/10')
                            : cn('hover:bg-muted/60', isExpanded && 'bg-muted/60')
                        )}
                      >
                        <ChevronRight
                          className={cn(
                            'w-4 h-4 transition-transform duration-200 rtl:rotate-180',
                            isOnPrimary ? 'text-white/70' : 'text-muted-foreground',
                            isExpanded && 'rotate-90 rtl:rotate-90'
                          )}
                        />
                      </button>
                    ) : null}
                  </div>

                  {hasChildren && isExpanded ? (
                    <div className="grid grid-cols-2 gap-2 px-2 pb-2 animate-in fade-in-0 duration-200 motion-reduce:animate-none">
                      {children.slice(0, 24).map((child) => {
                        const childLabel = getCategoryLabel(child, locale)
                        return (
                          <Link
                            key={child.id}
                            href={catalogHref(locale, 'categories', child.id, child.nom)}
                            onClick={() => {
                              onNavigate?.()
                              setOpen(false)
                            }}
                            className={cn(
                              'group flex min-w-0 flex-col overflow-hidden rounded-xl text-xs font-semibold transition-colors',
                              isOnPrimary
                                ? 'bg-white/[0.06] text-white/85 ring-1 ring-white/10 hover:bg-white/[0.12] hover:text-white'
                                : 'bg-background text-foreground/85 ring-1 ring-border/50 hover:bg-muted/60 hover:text-foreground'
                            )}
                          >
                            <CategoryThumb
                              category={child}
                              label={childLabel}
                              cover={coverOf(child)}
                              rounded="rounded-none"
                              className="aspect-4/3 w-full text-xl ring-0"
                              displayWidth={200}
                              imgClassName="group-hover:scale-105"
                            />
                            <span className="block px-2 py-1.5">
                              <span className="line-clamp-2 min-h-[2.5em] leading-snug [overflow-wrap:anywhere]">{childLabel}</span>
                            </span>
                          </Link>
                        )
                      })}
                    </div>
                  ) : null}
                </div>
              )
            })
          )}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}
