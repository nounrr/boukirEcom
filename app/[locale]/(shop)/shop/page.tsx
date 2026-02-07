"use client"

import { ProductFilters } from "@/components/shop/product-filters"
import { ProductsList } from "@/components/shop/products-list"
import { useTranslations } from "next-intl"
import { useState, useCallback, useMemo, useEffect, useRef } from "react"
import { useGetProductsQuery, useGetFeaturedPromoQuery, useGetNewArrivalsQuery } from "@/state/api/products-api-slice"
import { filterStateToApiRequest, type FilterState } from "@/types/api/products"
import { Button } from "@/components/ui/button"
import { SlidersHorizontal, Grid3x3, LayoutGrid, Package } from "lucide-react"
import { ProductSuggestions } from "@/components/shop/product-suggestions"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useLocale } from "next-intl"
import type { ProductCategory, ProductBrand } from "@/types/api/products"

function getCategoryLabel(
  category: ProductCategory | undefined,
  locale: string
) {
  if (!category) return ''
  if (locale === 'ar') return category.nom_ar || category.nom
  if (locale === 'en') return category.nom_en || category.nom
  if (locale === 'zh') return category.nom_zh || category.nom
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

export default function ShopPage() {
  const t = useTranslations('shop')
  const locale = useLocale()

  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()

  const parseIdList = useCallback((value: string | null): number[] => {
    if (!value) return []
    return value
      .split(',')
      .map((v) => Number.parseInt(v.trim(), 10))
      .filter((n) => Number.isFinite(n) && n > 0)
  }, [])

  const parseStringList = useCallback((value: string | null): string[] => {
    if (!value) return []
    return value
      .split(',')
      .map((v) => v.trim())
      .filter(Boolean)
  }, [])

  const urlFilters = useMemo<FilterState>(() => {
    const categories = parseIdList(searchParams.get('category_id'))
    const brands = parseIdList(searchParams.get('brand_id'))

    const search = searchParams.get('search') ?? ''

    const sortRaw = searchParams.get('sort')
    const allowedSort: Array<FilterState['sort']> = ['newest', 'price_asc', 'price_desc', 'promo', 'popular']
    const sort = (allowedSort as readonly string[]).includes(sortRaw ?? '')
      ? (sortRaw as FilterState['sort'])
      : 'newest'

    const inStockRaw = searchParams.get('inStock')
    const inStock = inStockRaw == null
      ? true
      : inStockRaw === '1' || inStockRaw === 'true' || inStockRaw === 'yes'

    const page = Math.max(1, Number.parseInt(searchParams.get('page') ?? '1', 10) || 1)
    const per_page = Math.max(1, Number.parseInt(searchParams.get('per_page') ?? '20', 10) || 20)

    const min_price = Number.parseInt(searchParams.get('min_price') ?? '', 10)
    const max_price = Number.parseInt(searchParams.get('max_price') ?? '', 10)
    const priceRange: [number, number] = [
      Number.isFinite(min_price) ? min_price : 0,
      Number.isFinite(max_price) ? max_price : 10000,
    ]

    const colors = parseStringList(searchParams.get('colors'))
    const units = parseStringList(searchParams.get('units'))

    return {
      categories,
      brands,
      priceRange,
      colors,
      units,
      search,
      inStock,
      sort,
      page,
      per_page,
    }
  }, [parseIdList, parseStringList, searchParams])

  const [filterState, setFilterState] = useState<FilterState>(() => urlFilters)

  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [isFiltersCollapsed, setIsFiltersCollapsed] = useState(false)

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
      filterState.categories.join(',') === urlFilters.categories.join(',') &&
      filterState.brands.join(',') === urlFilters.brands.join(',') &&
      filterState.colors.join(',') === urlFilters.colors.join(',') &&
      filterState.units.join(',') === urlFilters.units.join(',')

    if (!same) {
      setFilterState(urlFilters)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [urlFilters])

  // Debounced URL sync for shareable/filterable URLs without thrashing
  const lastUrlRef = useRef<string>('')
  useEffect(() => {
    const id = window.setTimeout(() => {
      const next = new URLSearchParams()

      if (filterState.categories.length > 0) next.set('category_id', filterState.categories.join(','))
      if (filterState.brands.length > 0) next.set('brand_id', filterState.brands.join(','))
      if (filterState.search) next.set('search', filterState.search)

      if (filterState.sort && filterState.sort !== 'newest') next.set('sort', filterState.sort)
      if (filterState.inStock === false) next.set('inStock', '0')

      if (filterState.page && filterState.page !== 1) next.set('page', String(filterState.page))
      if (filterState.per_page && filterState.per_page !== 20) next.set('per_page', String(filterState.per_page))

      // Only include min/max if they are meaningful (avoid noise)
      if (filterState.priceRange?.[0] != null && filterState.priceRange[0] !== 0) {
        next.set('min_price', String(filterState.priceRange[0]))
      }
      if (filterState.priceRange?.[1] != null && filterState.priceRange[1] !== 10000) {
        next.set('max_price', String(filterState.priceRange[1]))
      }

      if (filterState.colors.length > 0) next.set('colors', filterState.colors.join(','))
      if (filterState.units.length > 0) next.set('units', filterState.units.join(','))

      const nextQuery = next.toString()
      const currentQuery = searchParams.toString()

      if (nextQuery !== currentQuery && nextQuery !== lastUrlRef.current) {
        lastUrlRef.current = nextQuery
        router.replace(nextQuery ? `${pathname}?${nextQuery}` : pathname, { scroll: false })
      }
    }, 200)

    return () => window.clearTimeout(id)
  }, [filterState, pathname, router, searchParams])

  // Convert filter state to API request
  const apiFilters = useMemo(() => filterStateToApiRequest(filterState), [filterState])

  // Fetch products with filters (capture refetch for manual refresh)
  const { data, isLoading, isFetching, error, refetch } = useGetProductsQuery(apiFilters)

  // Suggestions sections
  const { data: featuredPromo = [] } = useGetFeaturedPromoQuery(8)
  const { data: newArrivals = [] } = useGetNewArrivalsQuery(8)

  // Extract metadata from API response
  const categories = data?.filters?.categories || []
  const brands = data?.filters?.brands || []
  const availableColors = data?.filters?.colors || []
  const availableUnits = data?.filters?.units || []
  const minPrice = data?.filters?.price_range?.min || 0
  const maxPrice = data?.filters?.price_range?.max || 10000
  const products = data?.products || []
  const pagination = data?.pagination

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

    return filterState.brands
      .map((id) => map.get(id)?.nom)
      .filter(Boolean) as string[]
  }, [brands, filterState.brands])

  const handleFilterChange = useCallback((filters: FilterState) => {
    setFilterState(filters)
  }, [])

  const handleAddToCart = useCallback((productId: number, variantId?: number) => {
    console.log('Add to cart:', productId, variantId)
    // TODO: Implement add to cart
  }, [])

  const handleToggleWishlist = useCallback((productId: number) => {
    // Immediately refetch products to refresh is_wishlisted flags
    refetch()
  }, [refetch])

  const handleQuickView = useCallback((productId: number) => {
    console.log('Quick view:', productId)
    // TODO: Implement quick view modal
  }, [])

  const handlePageChange = useCallback((page: number) => {
    setFilterState(prev => ({ ...prev, page }))
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [])

  const viewToggle = (
    <div className="flex h-9 sm:h-10 items-center gap-1.5 sm:gap-2 rounded-full bg-muted/40 px-1.5 sm:px-2 shadow-sm ring-1 ring-border/30">
      <span className="hidden text-xs text-muted-foreground sm:inline">Vue</span>
      <div className="flex items-center gap-1" aria-label="Mode d'affichage">
        <Button
          type="button"
          variant={viewMode === 'grid' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('grid')}
          className="h-8 w-8 sm:h-9 sm:w-9 p-0 rounded-full"
          aria-pressed={viewMode === 'grid'}
          aria-label="Grille compacte"
        >
          <Grid3x3 className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </Button>
        <Button
          type="button"
          variant={viewMode === 'list' ? 'default' : 'ghost'}
          size="sm"
          onClick={() => setViewMode('list')}
          className="h-8 w-8 sm:h-9 sm:w-9 p-0 rounded-full"
          aria-pressed={viewMode === 'list'}
          aria-label="Liste"
        >
          <LayoutGrid className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        </Button>
      </div>
    </div>
  )

  return (
    <div className="bg-background">
      <div className="container mx-auto px-6 sm:px-8 lg:px-16 py-6">
        {/* Toolbar: filter toggle, results, view toggle */}
        <div className="mb-5 rounded-2xl border border-border/40 bg-card/60 px-5 py-3 shadow-sm backdrop-blur-sm">
          <div className="flex flex-col gap-3 sm:gap-4 lg:flex-row lg:items-center lg:justify-between">
            {/* Left: Desktop filters collapse toggle */}
            <div className="hidden lg:flex items-center">
              <Button
                type="button"
                variant="default"
                size="sm"
                className="gap-2 rounded-full px-4 py-2 text-sm font-medium bg-primary text-white hover:bg-primary/90"
                onClick={() => setIsFiltersCollapsed(prev => !prev)}
              >
                <SlidersHorizontal className="h-4 w-4" />
                {t('filters', { defaultValue: 'Filtres' })}
              </Button>
            </div>  

            {/* Center: summary + compact tagline (centered) */}
            <div className="flex flex-col items-center justify-center text-center text-xs sm:text-sm">
              {isLoading && !data ? (
                <div className="h-5 w-40 rounded bg-muted/50 animate-pulse" />
              ) : error ? (
                <p className="text-sm font-medium text-destructive">Erreur lors du chargement</p>
              ) : (
                <>
                  <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-background px-5 py-2 text-xs font-medium text-primary shadow-sm sm:text-sm transition-all duration-300">
                    <Package className="h-4 w-4" />
                    <span>
                      <span className="font-semibold">{pagination?.total_items || 0}</span> {t('productsLabel', { defaultValue: 'produits' })}
                      {pagination && pagination.total_items > 0 && (
                        <span className="ml-2 text-[11px] sm:text-xs opacity-90 text-primary">
                          · Page {pagination.current_page}/{pagination.total_pages}
                        </span>
                      )}
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground sm:text-xs">
                    {pagination && pagination.total_items > 0 ? (
                      <>
                        Affichage{' '}
                        <span className="font-medium text-foreground">{pagination.from}-{pagination.to}</span>{' '}
                        sur{' '}
                        <span className="font-medium text-foreground">{pagination.total_items}</span>
                      </>
                    ) : null}
                    <span className="ml-2">• {t('taglineShort', { defaultValue: 'Livraison rapide • Paiement sécurisé' })}</span>
                  </p>
                </>
              )}
            </div>

            {/* Right: View mode toggle (desktop) */}
            <div className="hidden lg:flex items-center justify-end">
              {viewToggle}
            </div>
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
              minPrice={minPrice}
              maxPrice={maxPrice}
              isLoading={isLoading || isFetching}
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
            selectedCategoryLabels={selectedCategoryLabels}
            selectedBrandLabels={selectedBrandLabels}
              pagination={pagination}
              onPageChange={handlePageChange}
              onAddToCart={handleAddToCart}
              onToggleWishlist={handleToggleWishlist}
              onQuickView={handleQuickView}
            viewMode={viewMode}
            isFiltersCollapsed={isFiltersCollapsed}
          />
        </div>

        {/* Suggestions sections */}
        {(featuredPromo.length > 0 || newArrivals.length > 0) && (
          <div className="mt-12 space-y-12">
            {featuredPromo.length > 0 && (
              <ProductSuggestions
                products={featuredPromo as any}
                title={t('featuredTitle', { defaultValue: 'Promotions du moment' })}
                description={t('featuredDesc', { defaultValue: 'Nos meilleures offres sélectionnées pour vous' })}
              />
            )}
            {newArrivals.length > 0 && (
              <ProductSuggestions
                products={newArrivals as any}
                title={t('newArrivalsTitle', { defaultValue: 'Nouveautés' })}
                description={t('newArrivalsDesc', { defaultValue: 'Les derniers produits ajoutés à la boutique' })}
              />
            )}
          </div>
        )}
      </div>
    </div>
  )
}