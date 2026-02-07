'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { ChevronDown, ChevronRight, Menu } from 'lucide-react'

import { cn } from '@/lib/utils'
import { useGetCategoriesQuery } from '@/state/api/categories-api-slice'
import type { Category } from '@/types/category'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'

type CategoryByParent = Map<number, Category[]>

function getCategoryLabel(category: Category, locale: string) {
  if (locale === 'ar') return category.nom_ar || category.nom
  if (locale === 'en') return category.nom_en || category.nom
  if (locale === 'zh') return category.nom_zh || category.nom
  return category.nom
}

function byLabelThenId(locale: string) {
  return (a: Category, b: Category) => {
    const nameA = getCategoryLabel(a, locale) || ''
    const nameB = getCategoryLabel(b, locale) || ''
    const nameCmp = nameA.localeCompare(nameB)
    if (nameCmp !== 0) return nameCmp
    return (a.id ?? 0) - (b.id ?? 0)
  }
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

export function CategoriesMobileMenu({ onNavigate }: { onNavigate?: () => void }) {
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

  const toggleParent = (id: number) => {
    setExpandedParents((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))
  }

  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger asChild>
        <button
          type="button"
          className={cn(
            'flex w-full items-center justify-between gap-3 px-3 py-3 text-sm font-semibold rounded-xl transition-colors',
            'bg-white/10 border border-white/15 hover:bg-white/15 hover:border-white/25',
            'text-white/90 hover:text-white'
          )}
        >
          <span className="flex items-center gap-3 min-w-0">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-white/10 border border-white/15" aria-hidden="true">
              <Menu className="w-4 h-4 text-white/90" />
            </span>
            <span className="truncate">{t('categories')}</span>
          </span>
          <ChevronDown
            className={cn(
              'w-4 h-4 shrink-0 text-white/80 transition-transform duration-200',
              open && 'rotate-180'
            )}
          />
        </button>
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="mt-1 ml-2 pl-2 border-l border-white/15 flex flex-col gap-1">
          {isLoading ? (
            <div className="px-3 py-2 space-y-2">
              <div className="h-9 rounded-md bg-white/10 animate-pulse" />
              <div className="h-9 rounded-md bg-white/10 animate-pulse" />
              <div className="h-9 rounded-md bg-white/10 animate-pulse" />
            </div>
          ) : roots.length === 0 ? (
            <div className="px-3 py-2 text-sm text-white/60">—</div>
          ) : (
            roots.slice(0, 18).map((c) => {
              const children = childrenMap.get(c.id ?? -1) ?? []
              const hasChildren = children.length > 0
              const isExpanded = expandedParents.includes(c.id)

              return (
                <div key={c.id} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/${locale}/shop?category_id=${encodeURIComponent(String(c.id))}`}
                      onClick={() => {
                        onNavigate?.()
                        setOpen(false)
                      }}
                      className="flex-1 px-3 py-2 rounded-lg text-sm text-white/80 hover:text-white hover:bg-white/10 transition-colors min-w-0 truncate"
                    >
                      {getCategoryLabel(c, locale)}
                    </Link>

                    {hasChildren ? (
                      <button
                        type="button"
                        aria-label={isExpanded ? t('close') : t('open')}
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          toggleParent(c.id)
                        }}
                        className="h-9 w-9 rounded-lg hover:bg-white/10 transition-colors flex items-center justify-center"
                      >
                        <ChevronRight className={cn('w-4 h-4 text-white/70 transition-transform duration-200', isExpanded && 'rotate-90')} />
                      </button>
                    ) : null}
                  </div>

                  {hasChildren && isExpanded ? (
                    <div className="ml-3 pl-2 border-l border-white/10 flex flex-col gap-1">
                      {children.slice(0, 24).map((child) => (
                        <Link
                          key={child.id}
                          href={`/${locale}/shop?category_id=${encodeURIComponent(String(child.id))}`}
                          onClick={() => {
                            onNavigate?.()
                            setOpen(false)
                          }}
                          className="px-3 py-2 rounded-lg text-sm text-white/75 hover:text-white hover:bg-white/10 transition-colors"
                        >
                          {getCategoryLabel(child, locale)}
                        </Link>
                      ))}
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
