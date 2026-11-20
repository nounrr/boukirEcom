'use client'

import { Check, ChevronDown } from 'lucide-react'
import { useMemo, useState } from 'react'

import { CategoryThumb, useCategoryCovers } from '@/components/layout/category-thumb'
import { getLocalizedCategoryName } from '@/lib/localized-fields'
import { cn } from '@/lib/utils'
import { useGetCategoriesQuery } from '@/state/api/categories-api-slice'
import type { ProductCategory } from '@/types/api/products'
import type { Category } from '@/types/category'

type Flat = { node: ProductCategory; depth: number }

function descendants(node: ProductCategory, depth = 1): Flat[] {
  return (node.children ?? []).flatMap((child) => [{ node: child, depth }, ...descendants(child, depth + 1)])
}

/**
 * Category filter as cards: each department has its photo, its name and how many
 * sub-categories it holds; the card selects the whole department, the arrow opens its
 * sub-categories as chips. Selected items are gold. A department holding a selection opens by
 * itself.
 */
export function FilterCategories({
  categories,
  selected,
  onToggle,
  disabled,
  locale,
  labels,
}: {
  categories: ProductCategory[]
  selected: number[]
  onToggle: (categoryId: number) => void
  disabled?: boolean
  locale: string
  labels: { subcategories: (count: number) => string; expand: (name: string) => string }
}) {
  // Photos: the full category list (with images) from the shared cache.
  const { data: full = [] } = useGetCategoriesQuery()
  const byId = useMemo(() => new Map(full.map((c) => [c.id, c])), [full])
  const childrenMap = useMemo(() => {
    const map = new Map<number, Category[]>()
    for (const c of full) {
      if (!c.parent_id) continue
      const list = map.get(c.parent_id) ?? []
      list.push(c)
      map.set(c.parent_id, list)
    }
    return map
  }, [full])

  const asCategory = (node: ProductCategory): Category => byId.get(node.id) ?? (node as Category)
  const tops = useMemo(() => categories.map((c) => byId.get(c.id) ?? (c as Category)), [categories, byId])
  const coverOf = useCategoryCovers(tops, childrenMap, tops.length > 0)

  const [opened, setOpened] = useState<number[]>([])
  const label = (node: ProductCategory) => getLocalizedCategoryName(node as never, locale) || node.nom

  return (
    <div className="space-y-2 pt-1">
      {categories.map((top) => {
        const subs = descendants(top)
        const on = selected.includes(top.id)
        const holdsSelection = subs.some((s) => selected.includes(s.node.id))
        const open = opened.includes(top.id) || holdsSelection
        const name = label(top)
        return (
          <div
            key={top.id}
            className={cn(
              'overflow-hidden rounded-2xl border bg-card transition-[border-color,box-shadow] duration-300',
              on ? 'border-primary shadow-[0_10px_24px_-16px_rgba(242,159,4,0.9)]' : holdsSelection ? 'border-primary/50' : 'border-border hover:border-primary/40'
            )}
          >
            <div className="flex items-center gap-1 p-1.5">
              <button
                type="button"
                onClick={() => onToggle(top.id)}
                disabled={disabled}
                aria-pressed={on}
                className="group flex min-w-0 flex-1 items-center gap-3 rounded-xl p-1 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60"
              >
                <span className="relative shrink-0">
                  <CategoryThumb category={asCategory(top)} label={name} cover={coverOf(asCategory(top))} className="size-11" imgClassName="group-hover:scale-110" />
                  {on ? (
                    <span className="absolute -end-1 -top-1 grid size-4 place-items-center rounded-full bg-primary text-white" aria-hidden="true">
                      <Check className="size-2.5" strokeWidth={3.5} />
                    </span>
                  ) : null}
                </span>
                <span className="min-w-0 flex-1">
                  <span className={cn('line-clamp-2 text-[12.5px] font-bold leading-snug', on ? 'text-accent-text' : 'text-foreground/90 group-hover:text-accent-text')}>{name}</span>
                  {subs.length > 0 ? <span className="mt-0.5 block text-[10.5px] text-muted-foreground">{labels.subcategories(subs.length)}</span> : null}
                </span>
              </button>
              {subs.length > 0 ? (
                <button
                  type="button"
                  onClick={() => setOpened((ids) => (ids.includes(top.id) ? ids.filter((id) => id !== top.id) : [...ids, top.id]))}
                  aria-expanded={open}
                  aria-label={labels.expand(name)}
                  className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <ChevronDown className={cn('size-4 transition-transform duration-300', open && 'rotate-180')} />
                </button>
              ) : null}
            </div>
            {subs.length > 0 && open ? (
              <div className="flex flex-wrap gap-1.5 border-t border-border/60 bg-muted/30 p-2.5">
                {subs.map(({ node, depth }) => {
                  const chipOn = selected.includes(node.id)
                  return (
                    <button
                      key={node.id}
                      type="button"
                      onClick={() => onToggle(node.id)}
                      disabled={disabled}
                      aria-pressed={chipOn}
                      className={cn(
                        'inline-flex max-w-full items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-semibold leading-tight transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60',
                        chipOn ? 'border-primary bg-primary text-white' : 'border-border bg-background text-foreground/80 hover:border-primary/50 hover:text-accent-text',
                        depth > 1 && 'text-[10.5px] opacity-90'
                      )}
                    >
                      {chipOn ? <Check className="size-3 shrink-0" strokeWidth={3} aria-hidden="true" /> : null}
                      <span className="truncate">{label(node)}</span>
                    </button>
                  )
                })}
              </div>
            ) : null}
          </div>
        )
      })}
    </div>
  )
}
