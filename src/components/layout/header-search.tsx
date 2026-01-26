'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { skipToken } from '@reduxjs/toolkit/query'
import { Clock, Search, TrendingUp, X } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useLocale, useTranslations } from 'next-intl'

import { Button } from '@/components/ui/button'
import { Popover, PopoverAnchor, PopoverContent } from '@/components/ui/popover'
import { useDebounce } from '@/hooks/use-debounce'
import { cn } from '@/lib/utils'
import { useGetProductsQuery } from '@/state/api/products-api-slice'

type Variant = 'inline' | 'icon'

type SuggestionItem =
  | { type: 'search'; label: string; query: string }
  | { type: 'recent'; label: string; query: string }
  | {
      type: 'product'
      id: number
      label: string
      imageUrl?: string
      category?: string
      brand?: string
    }

function storageKey(locale: string) {
  return `boukir_recent_searches_${locale}`
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

function clampIndex(index: number, length: number) {
  if (length <= 0) return -1
  return Math.max(0, Math.min(index, length - 1))
}

function useRecentSearches(locale: string) {
  const [recent, setRecent] = useState<string[]>([])

  useEffect(() => {
    const stored = safeParseJson<string[]>(
      typeof window !== 'undefined' ? window.localStorage.getItem(storageKey(locale)) : null
    )
    if (stored && Array.isArray(stored)) {
      setRecent(stored.filter(Boolean).slice(0, 8))
    } else {
      setRecent([])
    }
  }, [locale])

  const saveRecent = useCallback(
    (q: string) => {
      const normalized = normalizeQuery(q)
      if (!normalized) return

      setRecent((prev) => {
        const next = [normalized, ...prev.filter((x) => x.toLowerCase() !== normalized.toLowerCase())].slice(0, 8)
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
  inputRef,
  className,
}: {
  value: string
  placeholder: string
  onChange: (value: string) => void
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void
  onFocus: () => void
  onClear: () => void
  inputRef: React.RefObject<HTMLInputElement | null>
  className?: string
}) {
  const hasValue = !!value
  return (
    <div className={cn('relative w-full', className)}>
      <Search className="absolute ltr:left-4 rtl:right-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/70" />
      <input
        ref={inputRef}
        type="search"
        value={value}
        placeholder={placeholder}
        onFocus={onFocus}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={onKeyDown}
        className={cn(
          'h-11 w-full rounded-full border border-white/20 bg-white/10 text-white',
          'ltr:pl-11 rtl:pr-11 ltr:pr-11 rtl:pl-11',
          'placeholder:text-white/60',
          'outline-none ring-0',
          'focus:border-white/30 focus:ring-2 focus:ring-white/15',
          '[&::-webkit-search-cancel-button]:appearance-none'
        )}
      />
      {hasValue ? (
        <button
          type="button"
          onClick={onClear}
          className="absolute ltr:right-2.5 rtl:left-2.5 top-1/2 -translate-y-1/2 grid h-8 w-8 place-items-center rounded-full hover:bg-white/10"
          aria-label="Clear"
        >
          <X className="h-4 w-4 text-white/75" />
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
  onPickProduct,
}: {
  locale: string
  t: (key: string, values?: Record<string, any>) => string
  query: string
  recent: string[]
  isFetching: boolean
  suggestions: SuggestionItem[]
  activeIndex: number
  onHoverIndex: (index: number) => void
  onClearRecent: () => void
  onSubmitSearch: (query: string) => void
  onPickProduct: (id: number) => void
}) {
  const hasQuery = !!normalizeQuery(query)
  const hasRecents = recent.length > 0
  const productCount = suggestions.filter((s) => s.type === 'product').length

  return (
    <div className="overflow-hidden rounded-xl border border-border/40 bg-background/98 backdrop-blur-2xl shadow-xl shadow-black/10">
      <div className="flex items-center justify-between border-b border-border/40 bg-linear-to-br from-muted/50 via-muted/30 to-transparent px-4 py-3">
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

      <div className="max-h-[340px] overflow-auto p-2">
        {hasQuery && isFetching ? (
          <div className="px-3 py-3 text-sm text-muted-foreground">{t('loading')}</div>
        ) : null}

        {suggestions.length === 0 ? (
          <div className="px-3 py-4 text-sm text-muted-foreground">{t('empty')}</div>
        ) : (
          <div className="space-y-1">
            {suggestions.map((item, idx) => {
              const isActive = idx === activeIndex

              if (item.type === 'product') {
                return (
                  <button
                    key={`p-${item.id}`}
                    type="button"
                    onClick={() => onPickProduct(item.id)}
                    onMouseEnter={() => onHoverIndex(idx)}
                    className={cn(
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
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
                      ) : null}
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
                  onClick={() => onSubmitSearch(item.query)}
                  onMouseEnter={() => onHoverIndex(idx)}
                  className={cn(
                    'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition-colors',
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

  const { recent, saveRecent, clearRecent } = useRecentSearches(locale)

  useEffect(() => {
    if (!autoFocus) return
    const id = window.setTimeout(() => inputRef.current?.focus(), 0)
    return () => window.clearTimeout(id)
  }, [autoFocus])

  const debouncedQuery = useDebounce(normalizeQuery(query), 250)
  const productsQueryArgs = debouncedQuery ? ({ search: debouncedQuery, limit: 6 } as const) : skipToken
  const { data, isFetching } = useGetProductsQuery(productsQueryArgs)

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

      for (const p of data?.products ?? []) {
        items.push({
          type: 'product',
          id: p.id,
          label: p.designation,
          imageUrl: p.image_url,
          category: p.categorie?.nom,
          brand: p.brand?.nom,
        })
      }

      return items
    }

    return recent.map((r) => ({ type: 'recent', label: r, query: r }))
  }, [data?.products, query, recent, t])

  const close = useCallback(() => {
    setOpen(false)
    setActiveIndex(-1)
  }, [])

  const submitSearch = useCallback(
    (q: string) => {
      const normalized = normalizeQuery(q)
      if (!normalized) return

      saveRecent(normalized)
      close()
      onSearchDone?.()
      router.push(`/${locale}/shop?search=${encodeURIComponent(normalized)}`)
    },
    [close, locale, onSearchDone, router, saveRecent]
  )

  const pickProduct = useCallback(
    (id: number) => {
      close()
      onSearchDone?.()
      router.push(`/${locale}/product/${id}`)
    },
    [close, locale, onSearchDone, router]
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
          else submitSearch(item.query)
          return
        }

        e.preventDefault()
        submitSearch(normalized)
      }
    },
    [activeIndex, close, open, pickProduct, query, submitSearch, suggestions]
  )

  const inputEl = (
    <SearchField
      value={query}
      placeholder={placeholder ?? t('placeholder')}
      inputRef={inputRef}
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
      onPickProduct={pickProduct}
    />
  )

  return (
    <Popover open={open} onOpenChange={(next) => (next ? setOpen(true) : close())}>
      <PopoverAnchor asChild>
        {variant === 'icon' ? (
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
        ) : (
          <div className={cn('w-full', maxWidthClassName, className)}>{inputEl}</div>
        )}
      </PopoverAnchor>

      {variant === 'icon' ? (
        <PopoverContent
          align="end"
          side="bottom"
          sideOffset={10}
          className="w-[min(92vw,560px)] border-border/40 bg-background/98 p-3 backdrop-blur-2xl shadow-xl shadow-black/10"
          onOpenAutoFocus={(e) => e.preventDefault()}
        >
          {inputEl}
          <div className="mt-3">{panel}</div>
        </PopoverContent>
      ) : (
        <PopoverContent
          align="center"
          side="bottom"
          sideOffset={12}
          className={cn(
            'w-[min(92vw,720px)] border-0 bg-transparent p-0 shadow-none',
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
