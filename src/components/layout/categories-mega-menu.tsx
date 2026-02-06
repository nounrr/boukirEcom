'use client'

import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { ChevronDown, ChevronRight, Menu } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import { useGetCategoriesQuery } from '@/state/api/categories-api-slice'
import type { Category } from '@/types/category'

type CategoryByParent = Map<number, Category[]>

function byNameThenId(a: Category, b: Category) {
  const nameCmp = (a.nom || '').localeCompare(b.nom || '')
  if (nameCmp !== 0) return nameCmp
  return (a.id ?? 0) - (b.id ?? 0)
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
  if (locale === 'ar') return category.nom_ar || category.nom
  if (locale === 'en') return category.nom_en || category.nom
  if (locale === 'zh') return category.nom_zh || category.nom
  return category.nom
}

export function CategoriesMegaMenu({ className }: { className?: string }) {
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
        className={cn(
          'h-9 px-3 rounded-full text-sm font-semibold text-white/90 hover:text-white hover:bg-white/10 border border-transparent hover:border-white/20 transition-all duration-200',
          open && 'bg-white/10 border-white/20'
        )}
        onFocus={() => setOpen(true)}
      >
        <Menu className="h-4 w-4" />
        <span className="mx-2">{triggerLabel}</span>
        <ChevronDown className={cn('h-4 w-4 text-white/75 transition-transform duration-200', open && 'rotate-180')} />
      </Button>

      {open && (
        <div
          className={cn(
            'absolute top-full mt-3 z-50',
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
              'rounded-2xl border border-border/50 bg-background/98 backdrop-blur-xl shadow-xl shadow-black/15 overflow-hidden',
              'w-[min(980px,calc(100vw-3rem))]'
            )}
          >
            <div className={cn('grid', isArabic ? 'grid-cols-[1fr_280px]' : 'grid-cols-[280px_1fr]')}>
              {/* Parents */}
              <div className="border-border/50 bg-muted/30">
                <div className="px-4 py-3 text-sm font-bold text-foreground/90 flex items-center justify-between">
                  <span>{triggerLabel}</span>
                  <Link
                    href={`/${locale}/shop`}
                    className="text-xs font-semibold text-primary hover:underline underline-offset-4"
                    onClick={() => setOpen(false)}
                  >
                    {t('shop')}
                  </Link>
                </div>

                <div className="py-2">
                  {isLoading ? (
                    <div className="px-4 py-2 space-y-2">
                      <div className="h-9 rounded-md bg-muted animate-pulse" />
                      <div className="h-9 rounded-md bg-muted animate-pulse" />
                      <div className="h-9 rounded-md bg-muted animate-pulse" />
                      <div className="h-9 rounded-md bg-muted animate-pulse" />
                    </div>
                  ) : roots.length === 0 ? (
                    <div className="px-4 py-3 text-sm text-muted-foreground">—</div>
                  ) : (
                    roots.slice(0, 18).map((c) => {
                      const isActive = c.id === activeParentId
                      return (
                        <Link
                          key={c.id}
                          href={`/${locale}/shop?category_id=${encodeURIComponent(String(c.id))}`}
                          onMouseEnter={() => setActiveParentId(c.id)}
                          onFocus={() => setActiveParentId(c.id)}
                          onClick={() => setOpen(false)}
                          className={cn(
                            'mx-2 my-0.5 flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                            isActive
                              ? 'bg-background text-primary'
                              : 'text-foreground/85 hover:bg-background/60 hover:text-foreground'
                          )}
                        >
                          <span className="truncate">{getCategoryLabel(c, locale)}</span>
                          <ChevronRight
                            className={cn(
                              'h-4 w-4 shrink-0',
                              isActive ? 'text-primary' : 'text-muted-foreground'
                            )}
                          />
                        </Link>
                      )
                    })
                  )}
                </div>
              </div>

              {/* Children */}
              <div className="p-5">
                {isLoading ? (
                  <div className="space-y-3">
                    <div className="h-5 w-48 bg-muted rounded animate-pulse" />
                    <div className="grid grid-cols-3 gap-4">
                      <div className="h-24 bg-muted rounded animate-pulse" />
                      <div className="h-24 bg-muted rounded animate-pulse" />
                      <div className="h-24 bg-muted rounded animate-pulse" />
                    </div>
                  </div>
                ) : !activeParent ? (
                  <div className="text-sm text-muted-foreground">—</div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <div className="text-sm font-bold text-foreground truncate">{getCategoryLabel(activeParent, locale)}</div>
                        <div className="text-xs text-muted-foreground">
                          {level1.length > 0 ? `${level1.length} sous-catégories` : 'Aucune sous-catégorie'}
                        </div>
                      </div>
                      <Link
                        href={`/${locale}/shop?category_id=${encodeURIComponent(String(activeParent.id))}`}
                        className="text-xs font-semibold text-primary hover:underline underline-offset-4 shrink-0"
                        onClick={() => setOpen(false)}
                      >
                        Voir
                      </Link>
                    </div>

                    {level1.length === 0 ? null : hasGrandChildren ? (
                      <div className="grid gap-6 md:grid-cols-3">
                        {level1.slice(0, 12).map((group) => {
                          const grand = childrenMap.get(group.id) ?? []
                          if (grand.length === 0) return null
                          return (
                            <div key={group.id} className="min-w-0">
                              <Link
                                href={`/${locale}/shop?category_id=${encodeURIComponent(String(group.id))}`}
                                className="text-sm font-semibold text-foreground hover:text-primary transition-colors"
                                onClick={() => setOpen(false)}
                              >
                                {getCategoryLabel(group, locale)}
                              </Link>
                              <ul className="mt-2 space-y-1.5">
                                {grand.slice(0, 10).map((leaf) => (
                                  <li key={leaf.id}>
                                    <Link
                                      href={`/${locale}/shop?category_id=${encodeURIComponent(String(leaf.id))}`}
                                      className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                                      onClick={() => setOpen(false)}
                                    >
                                      {getCategoryLabel(leaf, locale)}
                                    </Link>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <div className="grid gap-2 sm:grid-cols-2 md:grid-cols-3">
                        {level1.slice(0, 24).map((child) => (
                          <Link
                            key={child.id}
                            href={`/${locale}/shop?category_id=${encodeURIComponent(String(child.id))}`}
                            className="rounded-lg px-3 py-2 text-sm font-medium text-foreground/85 hover:text-foreground hover:bg-muted/50 transition-colors"
                            onClick={() => setOpen(false)}
                          >
                            {getCategoryLabel(child, locale)}
                          </Link>
                        ))}
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
