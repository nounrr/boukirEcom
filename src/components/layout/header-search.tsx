'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { skipToken } from '@reduxjs/toolkit/query'
import { Clock, Layers3, Search, Store, TrendingUp, X } from 'lucide-react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover'
import { useDebounce } from '@/hooks/use-debounce'
import { cn } from '@/lib/utils'
import { useGetSearchSuggestionsQuery } from '@/state/api/search-suggestions-api-slice'
import type { SearchSuggestionCategory, SearchSuggestionProduct } from '@/types/api/search-suggestions'

type Variant = 'inline' | 'icon'

type SuggestionItem =
  | { type: 'search'; label: string; query: string }
  | { type: 'recent'; label: string; query: string }
  | {
    type: 'category'
    id: number
    label: string
    query: string
    imageUrl?: string
    scopeIds?: number[]
  }
  | {
    type: 'brand'
    id: number
    label: string
    query: string
    imageUrl?: string
  }
  | {
      type: 'product'
      id: number
      label: string
      imageUrl?: string
      category?: string
      brand?: string
    }

type RecentSearchEntry = { q: string; ts: number }

const RECENT_SEARCHES_VERSION = 'v1'
const RECENTS_MAX = 10
const RECENTS_TTL_DAYS = 30

function storageKey(locale: string) {
  return `ecom_recent_searches_${RECENT_SEARCHES_VERSION}_${locale}`
}

function safeParseJson<T>(value: string | null): T | null {
  if (!value) return null
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
}

function normalizeQuery(value: string) {
  return value.trim()
}

function parseDirectProductLookupId(value: string): number | null {
  const q = normalizeQuery(value)
  if (!q) return null

  // Plain numeric id
  const asNumber = q.match(/^\d+$/)
  if (asNumber) return Number(q)

  // id:123 / ref:123
  const colon = q.match(/^(?:id|ref)\s*:\s*(\d+)$/i)
  if (colon) return Number(colon[1])

  // reference 123
  const reference = q.match(/^reference\s+(\d+)$/i)
  if (reference) return Number(reference[1])

  return null
}

function findDirectProductId(products: SearchSuggestionProduct[] | undefined, lookupId: number): number | null {
  if (!products || products.length === 0) return null
  if (!Number.isFinite(lookupId)) return null

  const lookupRef = String(lookupId)
  const match = products.find((p) => p.id === lookupId || (p.reference ? String(p.reference) === lookupRef : false))
  return match?.id ?? null
}

function clampIndex(index: number, length: number) {
  if (length <= 0) return -1
  return Math.max(0, Math.min(index, length - 1))
}

function getSuggestionCategoryLabel(category: SearchSuggestionCategory, locale: string) {
  if (locale === 'ar') return category.nom_ar || category.nom
  if (locale === 'en') return category.nom_en || category.nom
  if (locale === 'zh') return category.nom_zh || category.nom
  return category.nom
}

function getSuggestionProductLabel(product: SearchSuggestionProduct, locale: string) {
  if (locale === 'ar') return product.designation_ar || product.designation
  if (locale === 'en') return product.designation_en || product.designation
  if (locale === 'zh') return product.designation_zh || product.designation
  return product.designation
}

function pruneRecents(entries: RecentSearchEntry[]) {
  const now = Date.now()
  const ttlMs = RECENTS_TTL_DAYS * 24 * 60 * 60 * 1000

  const normalized: RecentSearchEntry[] = []
  const seen = new Set<string>()

  for (const e of entries) {
    const q = normalizeQuery(e?.q ?? '')
    if (!q) continue
    const ts = Number.isFinite(e?.ts) ? e.ts : now
    if (now - ts > ttlMs) continue
    const key = q.toLowerCase()
    if (seen.has(key)) continue
    seen.add(key)
    normalized.push({ q, ts })
  }

  normalized.sort((a, b) => b.ts - a.ts)
  return normalized.slice(0, RECENTS_MAX)
}

function migrateRecents(raw: unknown): RecentSearchEntry[] {
  if (!raw) return []
  if (Array.isArray(raw)) {
    // New format
    if (raw.length === 0 || typeof raw[0] === 'object') {
      return pruneRecents(raw as RecentSearchEntry[])
    }
    // Legacy format: string[]
    if (typeof raw[0] === 'string') {
      const now = Date.now()
      const entries = (raw as string[]).map((q, idx) => ({ q, ts: now - idx }))
      return pruneRecents(entries)
    }
  }
  return []
}

function useRecentSearches(locale: string) {
  const [recent, setRecent] = useState<RecentSearchEntry[]>([])

  useEffect(() => {
    const stored = safeParseJson<unknown>(
      typeof window !== 'undefined' ? window.localStorage.getItem(storageKey(locale)) : null
    )
    const next = migrateRecents(stored)
    setRecent(next)

    // Best-effort: persist migrated/pruned format
    try {
      window.localStorage.setItem(storageKey(locale), JSON.stringify(next))
    } catch {
    // ignore
    }
  }, [locale])

  const saveRecent = useCallback(
    (q: string) => {
      const normalized = normalizeQuery(q)
      if (!normalized) return

      setRecent((prev) => {
        const now = Date.now()
        const next = pruneRecents([
          { q: normalized, ts: now },
          ...prev.filter((x) => x.q.toLowerCase() !== normalized.toLowerCase()),
        ])
        try {
          window.localStorage.setItem(storageKey(locale), JSON.stringify(next))
        } catch {
          // ignore
        }
        return next
      })
    },
    [locale]
  )

  const clearRecent = useCallback(() => {
    setRecent([])
    try {
      window.localStorage.removeItem(storageKey(locale))
    } catch {
      // ignore
    }
  }, [locale])

  return { recent, saveRecent, clearRecent }
}

function SearchField({
  value,
  placeholder,
  onChange,
  onKeyDown,
  onFocus,
  onClear,
  clearLabel,
  inputRef,
  appearance = 'header',
  className,
}: {
  value: string
  placeholder: string
  onChange: (value: string) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
  onFocus: () => void
  onClear: () => void
    clearLabel: string
  inputRef: React.RefObject<HTMLInputElement | null>
    appearance?: 'header' | 'panel'
  className?: string
}) {
  const hasValue = !!value
  const isPanel = appearance === 'panel'
  return (
    <div className={cn('relative w-full', className)}>
      <Search
        className={cn(
          'absolute top-1/2 -translate-y-1/2 h-4 w-4',
          'ltr:left-3 rtl:right-3 sm:ltr:left-4 sm:rtl:right-4',
          isPanel ? 'text-muted-foreground' : 'text-white/70'
        )}
      />
      <input
        ref={inputRef}
        type="search"
        value={value}
        placeholder={placeholder}
        onFocus={onFocus}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        className={cn(
          isPanel
            ? 'h-11 w-full rounded-full border border-border/50 bg-background text-foreground'
            : 'h-12 md:h-11 w-full rounded-full border border-white/20 bg-white/10 text-white',
          'ltr:pl-10 rtl:pr-10 sm:ltr:pl-11 sm:rtl:pr-11 ltr:pr-10 rtl:pl-10 sm:ltr:pr-11 sm:rtl:pl-11',
          isPanel ? 'placeholder:text-muted-foreground' : 'placeholder:text-white/60',
          isPanel ? 'text-sm' : 'text-base md:text-sm',
          'outline-none ring-0',
          isPanel
            ? 'focus:border-ring/50 focus:ring-2 focus:ring-ring/20'
            : 'focus:border-white/30 focus:ring-2 focus:ring-white/15',
          '[&::-webkit-search-cancel-button]:appearance-none'
        )}
      />
      {hasValue ? (
        <button
          type="button"
          onClick={onClear}
          className={cn(
            'absolute top-1/2 -translate-y-1/2 grid h-9 w-9 place-items-center rounded-full outline-none',
            'ltr:right-2 rtl:left-2 sm:ltr:right-2.5 sm:rtl:left-2.5',
            isPanel
              ? 'hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/30'
              : 'hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-white/20'
          )}
          aria-label={clearLabel}
        >
          <X className={cn('h-4 w-4', isPanel ? 'text-muted-foreground' : 'text-white/75')} />
        </button>
      ) : null}
    </div>
  )
}

function SuggestionsPanel({
  locale,
  t,
  query,
  recent,
  isFetching,
  suggestions,
  activeIndex,
  onHoverIndex,
  onClearRecent,
  onSubmitSearch,
  onSelectRecent,
  onPickProduct,
}: {
  locale: string
  t: (key: string, values?: Record<string, any>) => string
  query: string
    recent: RecentSearchEntry[]
  isFetching: boolean
  suggestions: SuggestionItem[]
  activeIndex: number
  onHoverIndex: (index: number) => void
  onClearRecent: () => void
  onSubmitSearch: (query: string) => void
    onSelectRecent: (query: string) => void
  onPickProduct: (id: number) => void
}) {
  const hasQuery = !!normalizeQuery(query)
  const hasRecents = recent.length > 0
  const productCount = suggestions.filter((s) => s.type === 'product').length

  return (
    <div className="overflow-hidden rounded-xl border border-border/40 bg-background/98 backdrop-blur-2xl shadow-xl shadow-black/10">
      <div className="flex items-center justify-between border-b border-border/40 bg-linear-to-br from-muted/50 via-muted/30 to-transparent px-3 sm:px-4 py-2.5 sm:py-3">
        <div className="flex items-center gap-2 text-sm font-medium text-foreground">
          {hasQuery ? (
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <Clock className="h-4 w-4 text-muted-foreground" />
          )}
          <span>{hasQuery ? t('suggestions') : t('recentSearches')}</span>
        </div>

        {!hasQuery && hasRecents ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onClearRecent}
            className="h-8 text-xs text-muted-foreground hover:text-foreground"
          >
            {t('clear')}
          </Button>
        ) : null}
      </div>

      <div className="max-h-[60vh] md:max-h-[340px] overflow-auto p-1.5 sm:p-2">
        {hasQuery && isFetching ? (
          <div className="px-3 py-3 text-sm text-muted-foreground">{t('loading')}</div>
        ) : null}

        {suggestions.length === 0 ? (
          <div className="px-3 py-4 text-sm text-muted-foreground">{t('empty')}</div>
        ) : (
          <div className="space-y-1">
            {suggestions.map((item, idx) => {
              const isActive = idx === activeIndex

              if (item.type === 'category') {
                return (
                  <button
                    key={`c-${item.id}-${item.scopeIds?.length ?? 0}`}
                    type="button"
                    onClick={() => onSubmitSearch(item.query)}
                    onMouseEnter={() => onHoverIndex(idx)}
                    className={cn(
                      'flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/30',
                      isActive ? 'bg-muted' : 'hover:bg-muted/60'
                    )}
                  >
                    <div className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-md border border-border/40 bg-muted text-foreground">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.label}
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      ) : (
                        <Layers3 className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-foreground">{item.label}</div>
                      <div className="truncate text-xs text-muted-foreground">{t('category')}</div>
                    </div>
                  </button>
                )
              }

              if (item.type === 'brand') {
                return (
                  <button
                    key={`b-${item.id}`}
                    type="button"
                    onClick={() => onSubmitSearch(item.query)}
                    onMouseEnter={() => onHoverIndex(idx)}
                    className={cn(
                      'flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/30',
                      isActive ? 'bg-muted' : 'hover:bg-muted/60'
                    )}
                  >
                    <div className="relative grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-md border border-border/40 bg-muted text-foreground">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.label}
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      ) : (
                        <Store className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-semibold text-foreground">{item.label}</div>
                      <div className="truncate text-xs text-muted-foreground">{t('brand')}</div>
                    </div>
                  </button>
                )
              }

              if (item.type === 'product') {
                return (
                  <button
                    key={`p-${item.id}`}
                    type="button"
                    onClick={() => onPickProduct(item.id)}
                    onMouseEnter={() => onHoverIndex(idx)}
                    className={cn(
                      'flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/30',
                      isActive ? 'bg-muted' : 'hover:bg-muted/60'
                    )}
                  >
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-md border border-border/40 bg-muted">
                      {item.imageUrl ? (
                        <Image
                          src={item.imageUrl}
                          alt={item.label}
                          fill
                          sizes="40px"
                          className="object-cover"
                        />
                      ) : (
                        <div className="absolute inset-0 grid place-items-center bg-linear-to-br from-muted via-muted/60 to-transparent">
                          <Search className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium text-foreground">{item.label}</div>
                      <div className="truncate text-xs text-muted-foreground">
                        {[item.brand, item.category].filter(Boolean).join(' • ')}
                      </div>
                    </div>
                  </button>
                )
              }

              return (
                <button
                  key={`${item.type}-${item.query}`}
                  type="button"
                  onClick={() => (item.type === 'recent' ? onSelectRecent(item.query) : onSubmitSearch(item.query))}
                  onMouseEnter={() => onHoverIndex(idx)}
                  className={cn(
                    'flex w-full cursor-pointer items-center gap-3 rounded-lg px-3 py-3 text-left transition-colors outline-none focus-visible:ring-2 focus-visible:ring-ring/30',
                    isActive ? 'bg-muted' : 'hover:bg-muted/60'
                  )}
                >
                  {item.type === 'recent' ? (
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Search className="h-4 w-4 text-muted-foreground" />
                  )}
                  <span className="truncate text-sm text-foreground">{item.label}</span>
                  {item.type === 'recent' ? (
                    <span className="ml-auto text-[10px] text-muted-foreground">{t('recent')}</span>
                  ) : null}
                </button>
              )
            })}
          </div>
        )}

        {hasQuery && !isFetching && productCount === 0 ? (
          <div className="px-3 pt-2 pb-1 text-xs text-muted-foreground">{t('noResults')}</div>
        ) : null}
      </div>
    </div>
  )
}

export function HeaderSearch({
  className,
  variant = 'inline',
  onSearchDone,
  autoFocus,
  placeholder,
  maxWidthClassName = 'max-w-[720px]',
}: {
  className?: string
  variant?: Variant
  autoFocus?: boolean
  placeholder?: string
  maxWidthClassName?: string
  onSearchDone?: () => void
}) {
  const locale = useLocale()
  const t = useTranslations('headerSearch')
  const router = useRouter()

  const inputRef = useRef<HTMLInputElement>(null)
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [activeIndex, setActiveIndex] = useState(-1)
  const [isMobile, setIsMobile] = useState(false)

  const { recent, saveRecent, clearRecent } = useRecentSearches(locale)

  useEffect(() => {
    if (typeof window === 'undefined') return
    const media = window.matchMedia('(max-width: 640px)')
    const update = () => setIsMobile(media.matches)
    update()
    media.addEventListener?.('change', update)
    return () => media.removeEventListener?.('change', update)
  }, [])

  useEffect(() => {
    if (!autoFocus) return
    const id = window.setTimeout(() => inputRef.current?.focus(), 0)
    return () => window.clearTimeout(id)
  }, [autoFocus])

  const debouncedQuery = useDebounce(normalizeQuery(query), 250)
  const suggestionsArgs = debouncedQuery
    ? ({ q: debouncedQuery, limit_products: 8, limit_categories: 6, limit_brands: 6, in_stock_only: true } as const)
    : skipToken
  const { data, isFetching } = useGetSearchSuggestionsQuery(suggestionsArgs)

  const suggestions: SuggestionItem[] = useMemo(() => {
    const normalized = normalizeQuery(query)
    if (normalized) {
      const items: SuggestionItem[] = [
        {
          type: 'search',
          label: t('searchFor', { query: normalized }),
          query: normalized,
        },
      ]

      const directLookupId = parseDirectProductLookupId(normalized)
      const directProductId = directLookupId !== null ? findDirectProductId(data?.products, directLookupId) : null
      const directProduct =
        directProductId !== null ? data?.products?.find((p) => p.id === directProductId) ?? null : null

      const addedProductIds = new Set<number>()

      if (directProduct) {
        addedProductIds.add(directProduct.id)
        items.push({
          type: 'product',
          id: directProduct.id,
          label: getSuggestionProductLabel(directProduct, locale),
          imageUrl: directProduct.image_url ?? undefined,
          category: getSuggestionCategoryLabel(directProduct.categorie, locale),
          brand: directProduct.brand?.nom,
        })
      }

      // Intent-aware quick jump: if backend detects brand/category, prefer those as top picks.
      const detectedCategory = data?.intent?.detected_category ?? null
      const detectedBrand = data?.intent?.detected_brand ?? null

      if (detectedCategory) {
        const label = getSuggestionCategoryLabel(detectedCategory, locale)
        const scopeIds = detectedCategory.category_ids_scope
        const queryParam = scopeIds && scopeIds.length > 0 ? scopeIds.join(',') : String(detectedCategory.id)
        items.push({
          type: 'category',
          id: detectedCategory.id,
          label,
          imageUrl: detectedCategory.image_url ?? undefined,
          scopeIds,
          query: `__category__:${queryParam}`,
        })
      }

      if (detectedBrand) {
        items.push({
          type: 'brand',
          id: detectedBrand.id,
          label: detectedBrand.nom,
          imageUrl: detectedBrand.image_url ?? undefined,
          query: `__brand__:${detectedBrand.id}`,
        })
      }

      // Also list other matching categories/brands
      for (const c of data?.categories ?? []) {
        // avoid duplicates with detected
        if (detectedCategory && c.id === detectedCategory.id) continue
        const label = getSuggestionCategoryLabel(c, locale)
        const scopeIds = c.category_ids_scope
        const queryParam = scopeIds && scopeIds.length > 0 ? scopeIds.join(',') : String(c.id)
        items.push({
          type: 'category',
          id: c.id,
          label,
          imageUrl: c.image_url ?? undefined,
          scopeIds,
          query: `__category__:${queryParam}`,
        })
      }

      for (const b of data?.brands ?? []) {
        if (detectedBrand && b.id === detectedBrand.id) continue
        items.push({
          type: 'brand',
          id: b.id,
          label: b.nom,
          imageUrl: b.image_url ?? undefined,
          query: `__brand__:${b.id}`,
        })
      }

      for (const p of data?.products ?? []) {
        if (addedProductIds.has(p.id)) continue
        items.push({
          type: 'product',
          id: p.id,
          label: getSuggestionProductLabel(p, locale),
          imageUrl: p.image_url ?? undefined,
          category: getSuggestionCategoryLabel(p.categorie, locale),
          brand: p.brand?.nom,
        })
      }

      return items
    }

    return recent.map((r) => ({ type: 'recent', label: r.q, query: r.q }))
  }, [data?.brands, data?.categories, data?.intent, data?.products, locale, query, recent, t])

  const close = useCallback(() => {
    setOpen(false)
    setActiveIndex(-1)
  }, [])

  const applyRecentToInput = useCallback(
    (q: string) => {
      const normalized = normalizeQuery(q)
      if (!normalized) return
      setQuery(normalized)
      setActiveIndex(-1)
      setOpen(true)
      window.setTimeout(() => inputRef.current?.focus(), 0)
    },
    []
  )

  const recordTypedQuery = useCallback(() => {
    const normalized = normalizeQuery(query)
    if (!normalized) return
    saveRecent(normalized)
  }, [query, saveRecent])

  const pickProduct = useCallback(
    (id: number) => {
      recordTypedQuery()
      close()
      onSearchDone?.()
      router.push(`/${locale}/product/${id}`)
    },
    [close, locale, onSearchDone, recordTypedQuery, router]
  )

  const submitSearch = useCallback(
    (q: string) => {
      const normalized = normalizeQuery(q)
      if (!normalized) return

      // Direct product jump (backend prepends matched product to suggestions)
      const directLookupId = parseDirectProductLookupId(normalized)
      if (directLookupId !== null) {
        const directProductId = findDirectProductId(data?.products, directLookupId)
        if (directProductId !== null) {
          pickProduct(directProductId)
          return
        }
      }

      // Special internal targets for quick navigation
      if (normalized.startsWith('__category__:')) {
        recordTypedQuery()
        const raw = normalized.slice('__category__:'.length)
        close()
        onSearchDone?.()
        router.push(`/${locale}/shop?category_id=${encodeURIComponent(raw)}`)
        return
      }

      if (normalized.startsWith('__brand__:')) {
        recordTypedQuery()
        const raw = normalized.slice('__brand__:'.length)
        close()
        onSearchDone?.()
        router.push(`/${locale}/shop?brand_id=${encodeURIComponent(raw)}`)
        return
      }

      saveRecent(normalized)
      close()
      onSearchDone?.()
      router.push(`/${locale}/shop?search=${encodeURIComponent(normalized)}`)
    },
    [close, data?.products, locale, onSearchDone, pickProduct, recordTypedQuery, router, saveRecent]
  )

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLInputElement>) => {
      const length = suggestions.length

      if (!open && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
        setOpen(true)
        return
      }

      if (e.key === 'Escape') {
        e.preventDefault()
        close()
        return
      }

      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setOpen(true)
        setActiveIndex((prev) => clampIndex(prev + 1, length))
        return
      }

      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setOpen(true)
        setActiveIndex((prev) => {
          if (length <= 0) return -1
          if (prev <= 0) return length - 1
          return prev - 1
        })
        return
      }

      if (e.key === 'Enter') {
        const normalized = normalizeQuery(query)
        if (!normalized) return

        if (activeIndex >= 0 && activeIndex < suggestions.length) {
          e.preventDefault()
          const item = suggestions[activeIndex]
          if (item.type === 'product') pickProduct(item.id)
          else if (item.type === 'recent') applyRecentToInput(item.query)
          else submitSearch(item.query)
          return
        }

        e.preventDefault()
        submitSearch(normalized)
      }
    },
    [activeIndex, applyRecentToInput, close, open, pickProduct, query, submitSearch, suggestions]
  )

  const inputEl = (
    <SearchField
      value={query}
      placeholder={placeholder ?? t('placeholder')}
      inputRef={inputRef}
      clearLabel={t('clear')}
      onFocus={() => setOpen(true)}
      onChange={(value) => {
        setQuery(value)
        setActiveIndex(-1)
        setOpen(true)
      }}
      onKeyDown={handleKeyDown}
      onClear={() => {
        setQuery('')
        setActiveIndex(-1)
        window.setTimeout(() => inputRef.current?.focus(), 0)
      }}
    />
  )

  const panelInputEl = (
    <SearchField
      value={query}
      placeholder={placeholder ?? t('placeholder')}
      inputRef={inputRef}
      clearLabel={t('clear')}
      appearance="panel"
      onFocus={() => setOpen(true)}
      onChange={(value) => {
        setQuery(value)
        setActiveIndex(-1)
        setOpen(true)
      }}
      onKeyDown={handleKeyDown}
      onClear={() => {
        setQuery('')
        setActiveIndex(-1)
        window.setTimeout(() => inputRef.current?.focus(), 0)
      }}
    />
  )

  const panel = (
    <SuggestionsPanel
      locale={locale}
      t={t}
      query={query}
      recent={recent}
      isFetching={isFetching}
      suggestions={suggestions}
      activeIndex={activeIndex}
      onHoverIndex={(idx) => setActiveIndex(idx)}
      onClearRecent={clearRecent}
      onSubmitSearch={submitSearch}
      onSelectRecent={applyRecentToInput}
      onPickProduct={pickProduct}
    />
  )

  return (
    <Popover open={open} onOpenChange={(next) => (next ? setOpen(true) : close())}>
      {variant === 'icon' ? (
        <>
          {/* Mobile UX: center the panel within the viewport (not relative to the icon). */}
          <PopoverAnchor className="fixed left-1/2 top-[75px] h-0 w-0" />
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className={cn('hover:bg-white/10 transition-all duration-200', className)}
            onClick={() => {
              setOpen(true)
              window.setTimeout(() => inputRef.current?.focus(), 0)
            }}
            aria-label={t('openSearch')}
          >
            <Search className="w-4.5 h-4.5 text-white/85 hover:text-white transition-colors" />
          </Button>
        </>
      ) : (
          <>
            {isMobile ? <PopoverAnchor className="fixed left-1/2 top-[75px] h-0 w-0" /> : null}
            {isMobile ? (
              <div className={cn('w-full', maxWidthClassName, className)}>{inputEl}</div>
            ) : (
              <PopoverAnchor asChild>
                <div className={cn('w-full', maxWidthClassName, className)}>{inputEl}</div>
              </PopoverAnchor>
            )}
        </>
      )}

      {variant === 'icon' ? (
        <PopoverContent
          align="center"
          side="bottom"
          sideOffset={12}
          collisionPadding={12}
          className="w-[min(96vw,560px)] border-border/40 bg-background/98 p-2 sm:p-3 backdrop-blur-2xl shadow-xl shadow-black/10"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {panelInputEl}
          <div className="mt-2">{panel}</div>
        </PopoverContent>
      ) : (
        <PopoverContent
          align="center"
          side="bottom"
          sideOffset={12}
          className={cn(
            'w-[min(96vw,720px)] border-0 bg-transparent p-0 shadow-none',
            maxWidthClassName
          )}
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {panel}
        </PopoverContent>
      )}
    </Popover>
  )
}
