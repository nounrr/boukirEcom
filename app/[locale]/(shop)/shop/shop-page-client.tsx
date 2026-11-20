"use client"

import { ProductFilters } from "@/components/shop/product-filters"
import { FlagshipNewArrivals } from "@/components/home/flagship/flagship-products"
import { ProductsList } from "@/components/shop/products-list"
import { Button } from "@/components/ui/button"
import { useGetProductsQuery } from "@/state/api/products-api-slice"
import { filterStateToApiRequest, type FilterState, type ProductsListResponse } from "@/types/api/products"
import { sameFilterState, shopPageHref } from '@/lib/seo/shop-url'
import type { ProductBrand, ProductCategory, ProductListItem } from "@/types/api/products"
import { Columns4, Grid2x2, Grid3x3, List, Package, PanelLeftClose, Search, SlidersHorizontal, X } from "lucide-react"
import type { ShopViewMode } from "@/components/shop/products-list"
import { useLocale, useTranslations } from "next-intl"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState } from "react"

function getCategoryLabel(category: ProductCategory | undefined, locale: string) {
  if (!category) return ""
  if (locale === "ar") return category.nom_ar || category.nom
  if (locale === "en") return category.nom_en || category.nom
  if (locale === "zh") return category.nom_zh || category.nom
  return category.nom
}

function flattenCategories(categories: ProductCategory[]): ProductCategory[] {
  const out: ProductCategory[] = []
  const visit = (node: ProductCategory) => {
    out.push(node)
    if (node.children && node.children.length) {
      for (const child of node.children) visit(child)
    }
  }
  for (const c of categories) visit(c)
  return out
}

export default function ShopPageClient({ seed, initialData, initialFilters, heading, description }: { seed: number; initialData: ProductsListResponse; initialFilters: FilterState; heading: string; description: string }) {
  const t = useTranslations("shop")
  const locale = useLocale()

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const parseIdList = useCallback((value: string | null): number[] => {
    if (!value) return []
    return value
      .split(",")
      .map((v) => Number.parseInt(v.trim(), 10))
      .filter((n) => Number.isFinite(n) && n > 0)
  }, [])

  const parseStringList = useCallback((value: string | null): string[] => {
    if (!value) return []
    return value
      .split(",")
      .map((v) => v.trim())
      .filter(Boolean)
  }, [])

  const urlFilters = useMemo<FilterState>(() => {
    const categories = parseIdList(searchParams.get("category_id"))
    const brands = parseIdList(searchParams.get("brand_id"))

    const utilityTypesRaw = parseStringList(searchParams.get("utility_type"))
    const categorieBaseRaw = parseStringList(searchParams.get("categorie_base"))
    const utilityTypes = Array.from(new Set([...utilityTypesRaw, ...categorieBaseRaw]))

    const search = searchParams.get("search") ?? ""

    const sortRaw = searchParams.get("sort")
    const allowedSort: Array<FilterState["sort"]> = [
      "random",
      "category",
      "price_asc",
      "price_desc",
      "promo",
      "popular",
    ]
    const sort = (allowedSort as readonly string[]).includes(sortRaw ?? "")
      ? (sortRaw as FilterState["sort"])
      : "random"

    const inStock = false

    const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1)
    const per_page = Math.max(
      1,
      Number.parseInt(searchParams.get("per_page") ?? "20", 10) || 20,
    )

    const min_price = Number.parseInt(searchParams.get("min_price") ?? "", 10)
    const max_price = Number.parseInt(searchParams.get("max_price") ?? "", 10)
    const priceRange: [number, number] = [
      Number.isFinite(min_price) ? min_price : 0,
      Number.isFinite(max_price) ? max_price : 10000,
    ]

    const colors = parseStringList(searchParams.get("colors"))
    const units = parseStringList(searchParams.get("units"))

    return {
      categories,
      brands,
      priceRange,
      colors,
      units,
      utilityTypes,
      search,
      inStock,
      sort,
      page,
      per_page,
    }
  }, [parseIdList, parseStringList, searchParams])

  const [filterState, setFilterState] = useState<FilterState>(() => urlFilters)

  // Affichage choisi : retenu sur cet appareil pour la prochaine visite.
  const [viewMode, setViewModeState] = useState<ShopViewMode>("grid")
  useEffect(() => {
    try {
      const saved = localStorage.getItem("shop.viewMode")
      if (saved === "large" || saved === "grid" || saved === "dense" || saved === "list") setViewModeState(saved)
    } catch { /* stockage indisponible */ }
  }, [])
  const setViewMode = useCallback((mode: ShopViewMode) => {
    setViewModeState(mode)
    try { localStorage.setItem("shop.viewMode", mode) } catch { /* stockage indisponible */ }
  }, [])
  // Desktop filters panel shown or hidden; the visitor's choice is remembered.
  const [isFiltersCollapsed, setIsFiltersCollapsedState] = useState(false)
  useEffect(() => {
    try {
      if (localStorage.getItem("shop.filtersHidden") === "1") setIsFiltersCollapsedState(true)
    } catch { /* stockage indisponible */ }
  }, [])
  const setIsFiltersCollapsed = useCallback((value: boolean | ((prev: boolean) => boolean)) => {
    setIsFiltersCollapsedState((prev) => {
      const next = typeof value === "function" ? value(prev) : value
      try { localStorage.setItem("shop.filtersHidden", next ? "1" : "0") } catch { /* stockage indisponible */ }
      return next
    })
  }, [])

  // Keep state aligned when user uses browser back/forward or manual URL edits
  useEffect(() => {
    const same =
      filterState.search === urlFilters.search &&
      filterState.sort === urlFilters.sort &&
      filterState.inStock === urlFilters.inStock &&
      filterState.page === urlFilters.page &&
      filterState.per_page === urlFilters.per_page &&
      filterState.priceRange[0] === urlFilters.priceRange[0] &&
      filterState.priceRange[1] === urlFilters.priceRange[1] &&
      filterState.categories.join(",") === urlFilters.categories.join(",") &&
      filterState.brands.join(",") === urlFilters.brands.join(",") &&
      filterState.colors.join(",") === urlFilters.colors.join(",") &&
      filterState.units.join(",") === urlFilters.units.join(",") &&
      filterState.utilityTypes.join(",") === urlFilters.utilityTypes.join(",")

    if (!same) {
      setFilterState(urlFilters)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlFilters])

  // Debounced URL sync for shareable/filterable URLs without thrashing
  useEffect(() => {
    const id = window.setTimeout(() => {
      const next = new URLSearchParams()

      if (filterState.categories.length > 0) next.set("category_id", filterState.categories.join(","))
      if (filterState.brands.length > 0) next.set("brand_id", filterState.brands.join(","))
      if (filterState.search) next.set("search", filterState.search)

      if (filterState.sort && filterState.sort !== "random") next.set("sort", filterState.sort)
      if (filterState.page && filterState.page !== 1) next.set("page", String(filterState.page))
      if (filterState.per_page && filterState.per_page !== 20) {
        next.set("per_page", String(filterState.per_page))
      }

      // Only include min/max if they are meaningful (avoid noise)
      if (filterState.priceRange?.[0] != null && filterState.priceRange[0] !== 0) {
        next.set("min_price", String(filterState.priceRange[0]))
      }
      if (filterState.priceRange?.[1] != null && filterState.priceRange[1] !== 10000) {
        next.set("max_price", String(filterState.priceRange[1]))
      }

      if (filterState.colors.length > 0) next.set("colors", filterState.colors.join(","))
      if (filterState.units.length > 0) next.set("units", filterState.units.join(","))
      if (filterState.utilityTypes.length > 0) {
        next.set("utility_type", filterState.utilityTypes.join(","))
      }

      const nextQuery = next.toString()
      const currentQuery = searchParams.toString()

      if (nextQuery !== currentQuery) {
        router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false })
      }
    }, 200)

    return () => window.clearTimeout(id)
  }, [filterState, pathname, router, searchParams])

  // Convert filter state to API request
  // Random order: the visit's seed keeps the next pages in the same order (no product twice).
  const apiFilters = useMemo(() => {
    const request = filterStateToApiRequest(filterState)
    return request.sort === "random" ? { ...request, seed } : request
  }, [filterState, seed])

  // Chargement continu : pour les mêmes filtres, les pages suivantes s'ajoutent sous la liste
  // (défilement ou bouton « Voir plus »). Changer un filtre repart de la page de départ.
  const startPage = filterState.page || 1
  const baseKey = useMemo(() => {
    const { page: _page, ...rest } = apiFilters
    return JSON.stringify(rest)
  }, [apiFilters])
  const listKey = `${baseKey}|${startPage}`
  type LoadState = { key: string; lastPage: number; pages: Record<number, ProductListItem[]>; pagination?: ProductsListResponse['pagination'] }
  const [loadState, setLoadState] = useState<LoadState>(() => ({ key: listKey, lastPage: startPage, pages: {} }))
  const activeLoad: LoadState = loadState.key === listKey ? loadState : { key: listKey, lastPage: startPage, pages: {} }

  const queryArgs = useMemo(() => ({ ...apiFilters, page: activeLoad.lastPage }), [apiFilters, activeLoad.lastPage])
  const { currentData: queryData, isLoading: queryLoading, isFetching, error, refetch } = useGetProductsQuery(queryArgs)
  const canUseInitialData = activeLoad.lastPage === startPage && sameFilterState(filterState, initialFilters)
  const data = queryData ?? (canUseInitialData ? initialData : undefined)

  // Range chaque page reçue à sa place (les pages déjà chargées restent affichées).
  useEffect(() => {
    if (!data) return
    const page = activeLoad.lastPage
    setLoadState((prev) => {
      const base = prev.key === listKey ? prev : { key: listKey, lastPage: startPage, pages: {} }
      if (base.pages[page] === data.products && base.pagination === data.pagination) return base
      return { ...base, pages: { ...base.pages, [page]: data.products }, pagination: data.pagination }
    })
  }, [data, listKey, startPage, activeLoad.lastPage])

  const loadedProducts = useMemo(() => {
    const seen = new Set<number>()
    const out: ProductListItem[] = []
    for (let page = startPage; page <= activeLoad.lastPage; page++) {
      for (const product of activeLoad.pages[page] ?? (page === activeLoad.lastPage ? data?.products ?? [] : [])) {
        if (seen.has(product.id)) continue
        seen.add(product.id)
        out.push(product)
      }
    }
    return out
  }, [activeLoad, startPage, data])

  const isLoading = loadedProducts.length === 0 && (queryLoading || isFetching) && !canUseInitialData
  const isLoadingMore = activeLoad.lastPage > startPage && !activeLoad.pages[activeLoad.lastPage] && !error
  // Dernière pagination connue (reste affichée pendant le chargement de la suite).
  const lastPagination = data?.pagination ?? activeLoad.pagination
  const hasMore = Boolean(lastPagination?.has_next) && !isLoadingMore

  const loadMore = useCallback(() => {
    if (!hasMore) return
    setLoadState((prev) => {
      const base = prev.key === listKey ? prev : { key: listKey, lastPage: startPage, pages: {} }
      // Une seule page à la fois : tant que la précédente n'est pas arrivée, un 2e clic ne fait rien.
      if (!base.pages[base.lastPage]) return base
      return { ...base, lastPage: base.lastPage + 1 }
    })
  }, [hasMore, listKey, startPage])

  // Filters panel content (categories, brands, prices…). While the next page or a new filter loads there is
  // no answer yet: keep the last one, otherwise the panel empties, the page shrinks and jumps back to the top.
  const [lastFilterMeta, setLastFilterMeta] = useState(data?.filters)
  useEffect(() => {
    if (data?.filters) setLastFilterMeta(data.filters)
  }, [data?.filters])
  const filterMeta = data?.filters ?? lastFilterMeta
  const categories = filterMeta?.categories || []
  const brands = filterMeta?.brands || []
  const availableColors = filterMeta?.colors || []
  const availableUnits = filterMeta?.units || []
  const availableUtilityTypes = filterMeta?.utility_types || []
  const minPrice = filterMeta?.price_range?.min || 0
  const maxPrice = filterMeta?.price_range?.max || 10000
  const products = loadedProducts
  const pagination = lastPagination

  const selectedCategoryLabels = useMemo(() => {
    if (!filterState.categories.length) return []

    const flat = flattenCategories(categories as ProductCategory[])
    const map = new Map<number, ProductCategory>()
    for (const c of flat) map.set(c.id, c)

    return filterState.categories
      .map((id) => map.get(id))
      .filter(Boolean)
      .map((c) => getCategoryLabel(c, locale))
      .filter(Boolean)
  }, [categories, filterState.categories, locale])

  const selectedBrandLabels = useMemo(() => {
    if (!filterState.brands.length) return []

    const map = new Map<number, ProductBrand>()
    for (const b of brands as ProductBrand[]) map.set(b.id, b)

    return filterState.brands.map((id) => map.get(id)?.nom).filter(Boolean) as string[]
  }, [brands, filterState.brands])

  const handleFilterChange = useCallback((filters: FilterState) => {
    setFilterState(filters)
  }, [])

  // Barre de recherche centrée : saisie libre, appliquée après une courte pause.
  const [searchInput, setSearchInput] = useState(filterState.search)
  const lastAppliedSearch = useRef(filterState.search)
  const resultsTopRef = useRef<HTMLDivElement | null>(null)
  // Nouvelle recherche : si l'on était descendu dans la liste, on remonte au début des résultats.
  const applySearch = useCallback((value: string) => {
    lastAppliedSearch.current = value
    setFilterState((prev) => ({ ...prev, search: value, page: 1 }))
    const element = resultsTopRef.current
    if (element && element.getBoundingClientRect().top < 0) {
      element.scrollIntoView({ behavior: "smooth", block: "start" })
    }
  }, [])
  useEffect(() => {
    // Recherche modifiée ailleurs (URL, retour arrière) : la barre suit.
    if (filterState.search !== lastAppliedSearch.current) {
      lastAppliedSearch.current = filterState.search
      setSearchInput(filterState.search)
    }
  }, [filterState.search])
  useEffect(() => {
    const value = searchInput.trim()
    if (value === lastAppliedSearch.current) return
    const id = window.setTimeout(() => applySearch(value), 350)
    return () => window.clearTimeout(id)
  }, [searchInput, applySearch])

  const handleAddToCart = useCallback((productId: number, variantId?: number) => {
    console.log("Add to cart:", productId, variantId)
    // TODO: Implement add to cart
  }, [])

  const handleToggleWishlist = useCallback(
    (productId: number) => {
      // Immediately refetch products to refresh is_wishlisted flags
      refetch()
    },
    [refetch],
  )

  const handleQuickView = useCallback((productId: number) => {
    console.log("Quick view:", productId)
    // TODO: Implement quick view modal
  }, [])


  const viewToggle = (
    <div className="flex h-9 sm:h-10 items-center gap-1.5 sm:gap-2 rounded-full bg-muted/40 px-1.5 sm:px-2 shadow-sm ring-1 ring-border/30">
      <span className="hidden text-xs text-muted-foreground sm:inline">
        {t("viewToggle.label", { defaultValue: "Vue" })}
      </span>
      <div
        role="group"
        className="flex items-center gap-1"
        aria-label={t("viewToggle.aria")}
      >
        {([
          { mode: "large", icon: Grid2x2, label: t("viewToggle.largeAria") },
          { mode: "grid", icon: Grid3x3, label: t("viewToggle.gridAria") },
          { mode: "dense", icon: Columns4, label: t("viewToggle.denseAria") },
          { mode: "list", icon: List, label: t("viewToggle.listAria") },
        ] as const).map(({ mode, icon: Icon, label }) => (
          <Button
            key={mode}
            type="button"
            variant={viewMode === mode ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode(mode)}
            className="h-8 w-8 sm:h-9 sm:w-9 p-0 rounded-full"
            aria-pressed={viewMode === mode}
            aria-label={label}
            title={label}
          >
            <Icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
          </Button>
        ))}
      </div>
    </div>
  )

  return (
    <div className="bg-background">
      <div className="container mx-auto px-6 sm:px-8 lg:px-16 py-6">
        {/* Title and description kept for search engines and screen readers, not shown. */}
        <header className="sr-only">
          <h1>{heading}</h1>
          <p>{description}</p>
        </header>
        {/* « Nos promotions » : deux lignes qui défilent, seulement sur la boutique sans filtre */}
        {searchParams.toString() === "" ? <FlagshipNewArrivals locale={locale} variant="shop" /> : null}
        {/* Barre de recherche : centrée, reste collée sous le menu pendant le défilement */}
        <div className="sticky top-[var(--site-header-h,64px)] z-30 -mx-6 mb-5 border-b border-border/50 bg-background/85 px-6 py-3 backdrop-blur-xl supports-[backdrop-filter]:bg-background/70 sm:-mx-8 sm:px-8 lg:-mx-16 lg:px-16">
          <form
            role="search"
            onSubmit={(event) => {
              event.preventDefault()
              applySearch(searchInput.trim())
            }}
            className="relative w-full"
          >
            <label htmlFor="shop-search" className="sr-only">{t("searchBarPlaceholder")}</label>
            <Search className="pointer-events-none absolute start-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
            <input
              id="shop-search"
              type="search"
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder={t("searchBarPlaceholder")}
              enterKeyHint="search"
              className="h-12 w-full rounded-full border border-border bg-card ps-12 pe-12 text-[15px] shadow-sm outline-none transition-[border-color,box-shadow] duration-500 ease-hover placeholder:text-muted-foreground focus:border-brand-orange/70 focus:shadow-[0_0_0_4px_rgba(242,159,4,0.15)]"
            />
            {searchInput ? (
              <button
                type="button"
                onClick={() => setSearchInput("")}
                aria-label={t("clearSearch")}
                className="absolute end-2.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
          </form>
        </div>

        {/* Toolbar: filter toggle, results, view toggle */}
        <div ref={resultsTopRef} className="scroll-mt-[calc(var(--site-header-h,64px)+5.5rem)] mb-5 rounded-2xl border border-border/40 bg-card/60 px-5 py-3 shadow-sm backdrop-blur-sm">
          <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Left: Desktop filters collapse toggle */}
            <div className="hidden lg:flex items-center">
              <Button
                type="button"
                variant="default"
                size="sm"
                className="gap-2 rounded-full px-4 py-2 text-sm font-medium bg-primary text-white hover:bg-primary/90"
                onClick={() => setIsFiltersCollapsed((prev) => !prev)}
                aria-expanded={!isFiltersCollapsed}
                aria-controls="shop-filters-panel"
              >
                {isFiltersCollapsed ? <SlidersHorizontal className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4 rtl:-scale-x-100" />}
                {isFiltersCollapsed ? t("showFilters") : t("hideFilters")}
              </Button>
            </div>

            {/* Center: summary + compact tagline (centered) */}
            <div className="flex flex-col items-center justify-center text-center text-xs sm:text-sm">
              {isLoading && !data ? (
                <div className="h-5 w-40 rounded bg-muted/50 animate-pulse" />
              ) : error ? (
                <p className="text-sm font-medium text-destructive">
                  {t("loadError", { defaultValue: "Erreur lors du chargement" })}
                </p>
              ) : (
                <>
                  <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-background px-5 py-2 text-xs font-medium text-primary shadow-sm sm:text-sm transition-all duration-300">
                    <Package className="h-4 w-4" />
                    <span>
                      <span className="font-semibold">{pagination?.total_items || 0}</span>{" "}
                      {t("productsLabel", { defaultValue: "produits" })}

                    </span>
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground sm:text-xs">
                    {pagination && pagination.total_items > 0 ? (
                      <span className="font-medium text-foreground">
                        {t("loadedOf", { loaded: products.length, total: pagination.total_items })}
                      </span>
                    ) : null}
                    <span className="ml-2">• {t("taglineShort", { defaultValue: "Livraison rapide • Paiement sécurisé" })}</span>
                  </p>
                </>
              )}
            </div>

            {/* Right: View mode toggle (desktop) */}
            <div className="hidden lg:flex items-center justify-end">{viewToggle}</div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex flex-col gap-6 lg:flex-row">
          {/* Filters Sidebar */}
          <ProductFilters
            onFilterChange={handleFilterChange}
            initialFilters={urlFilters}
            categories={categories}
            brands={brands}
            availableColors={availableColors}
            availableUnits={availableUnits}
            availableUtilityTypes={availableUtilityTypes}
            minPrice={minPrice}
            maxPrice={maxPrice}
            isLoading={isLoading}
            isCollapsed={isFiltersCollapsed}
            onCollapsedChange={setIsFiltersCollapsed}
            mobileActionSlot={viewToggle}
          />

          {/* Products List */}
          <ProductsList
            products={products}
            isLoading={isLoading}
            isFetching={isFetching}
            error={error}
            onRetry={() => void refetch()}
            selectedCategoryLabels={selectedCategoryLabels}
            selectedBrandLabels={selectedBrandLabels}
            pagination={pagination}
            hasMore={hasMore}
            isLoadingMore={isLoadingMore}
            onLoadMore={loadMore}
            nextHref={shopPageHref(pathname, searchParams, activeLoad.lastPage + 1)}
            onAddToCart={handleAddToCart}
            onToggleWishlist={handleToggleWishlist}
            onQuickView={handleQuickView}
            viewMode={viewMode}
            isFiltersCollapsed={isFiltersCollapsed}
          />
        </div>
      </div>
    </div>
  )
}
