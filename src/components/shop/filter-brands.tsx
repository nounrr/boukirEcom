'use client'

import { Check, Search } from 'lucide-react'
import { useMemo, useState } from 'react'

import { SearchMediaButtons } from '@/components/layout/search-media-buttons'
import { toAbsoluteImageUrl } from '@/lib/image-url'
import { optimizedImageProps } from '@/lib/image-optimize'
import { cn } from '@/lib/utils'
import type { ProductBrand } from '@/types/api/products'

/** Brands shown before « See all ». */
const FIRST = 12

/**
 * Brand filter as a grid of logo tiles. A tile toggles its brand (aria-pressed); the selected
 * ones get a gold frame and a check. Search box and « See all » when the list is long.
 */
export function FilterBrands({
  brands,
  selected,
  onToggle,
  disabled,
  labels,
}: {
  brands: ProductBrand[]
  selected: number[]
  onToggle: (brandId: number) => void
  disabled?: boolean
  labels: { search: string; showAll: (count: number) => string; showFewer: string; noMatch: string }
}) {
  const [query, setQuery] = useState('')
  const [showAll, setShowAll] = useState(false)

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    const list = q ? brands.filter((b) => b.nom.toLowerCase().includes(q)) : brands
    // Selected brands first, so they stay visible when the list is cut.
    return [...list].sort((a, b) => Number(selected.includes(b.id)) - Number(selected.includes(a.id)))
  }, [brands, query, selected])

  const visible = showAll || query ? filtered : filtered.slice(0, FIRST)

  return (
    <div className="space-y-3 pt-1">
      {brands.length > FIRST ? (
        <label className="relative block">
          <span className="sr-only">{labels.search}</span>
          <Search className="pointer-events-none absolute start-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={labels.search}
            className="h-9 w-full rounded-full border border-border bg-background ps-9 pe-10 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-primary/60"
          />
          <span className="absolute end-1 top-1/2 flex -translate-y-1/2 items-center">
            <SearchMediaButtons tone="panel" image={false} onInterim={setQuery} onQuery={setQuery} />
          </span>
        </label>
      ) : null}

      {visible.length === 0 ? (
        <p className="py-2 text-center text-xs text-muted-foreground">{labels.noMatch}</p>
      ) : (
        <div className="grid grid-cols-3 gap-2">
          {visible.map((brand) => {
            const on = selected.includes(brand.id)
            const logo = toAbsoluteImageUrl(brand.image_url)
            return (
              <button
                key={brand.id}
                type="button"
                onClick={() => onToggle(brand.id)}
                disabled={disabled}
                aria-pressed={on}
                title={brand.nom}
                className={cn(
                  'group relative flex flex-col items-center gap-1.5 rounded-xl border bg-card p-1.5 pb-2 text-center transition-[border-color,box-shadow,translate] duration-300 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary disabled:opacity-60',
                  on ? 'border-primary shadow-[0_10px_24px_-14px_rgba(242,159,4,0.9)]' : 'border-border hover:border-primary/50'
                )}
              >
                <span className="grid aspect-[4/3] w-full place-items-center overflow-hidden rounded-lg bg-white">
                  {logo ? (
                    // eslint-disable-next-line @next/next/no-img-element -- logos servis par l'API
                    <img {...optimizedImageProps(logo, 96)} alt="" loading="lazy" decoding="async" className="size-full object-contain p-1.5 transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <span className="text-base font-extrabold tracking-tight text-neutral-700">{brand.nom.slice(0, 2).toUpperCase()}</span>
                  )}
                </span>
                <span className={cn('w-full truncate text-[10px] font-bold uppercase leading-none tracking-wide', on ? 'text-accent-text' : 'text-foreground/75')}>
                  {brand.nom}
                </span>
                {on ? (
                  <span className="absolute -end-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-primary text-white shadow" aria-hidden="true">
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                ) : null}
              </button>
            )
          })}
        </div>
      )}

      {!query && filtered.length > FIRST ? (
        <button
          type="button"
          onClick={() => setShowAll((value) => !value)}
          className="w-full rounded-full border border-dashed border-border py-2 text-xs font-semibold text-muted-foreground transition-colors hover:border-primary/50 hover:text-accent-text"
        >
          {showAll ? labels.showFewer : labels.showAll(filtered.length)}
        </button>
      ) : null}
    </div>
  )
}
