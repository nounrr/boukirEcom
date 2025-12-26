"use client"

import { ProductFilters } from "@/components/shop/product-filters"
import { ProductsList } from "@/components/shop/products-list"
import { useTranslations } from "next-intl"
import { useState, useCallback, useMemo, useEffect } from "react"
import { useGetProductsQuery, useGetFeaturedPromoQuery, useGetNewArrivalsQuery } from "@/state/api/products-api-slice"
import { filterStateToApiRequest, type FilterState } from "@/types/api/products"
import { Button } from "@/components/ui/button"
import { SlidersHorizontal, Grid3x3, LayoutGrid, Package } from "lucide-react"
import { ProductSuggestions } from "@/components/shop/product-suggestions"

export default function ShopPage() {
  const t = useTranslations('shop')

  const [filterState, setFilterState] = useState<FilterState>({
    categories: [],
    brands: [],
    // The real min/max range will be hydrated from the API response
    priceRange: [0, 10000],
    colors: [],
    units: [],
    search: '',
    inStock: true,
    sort: 'newest',
    page: 1,
    per_page: 20
  })

  const [viewMode, setViewMode] = useState<'grid' | 'large'>('grid')
  const [isFiltersCollapsed, setIsFiltersCollapsed] = useState(false)

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

  return (
    <div className="bg-background">
      <div className="container mx-auto px-6 sm:px-8 lg:px-16 py-6">
        {/* Toolbar: filter toggle, results, view toggle */}
        <div className="mb-5 rounded-2xl border border-border/40 bg-card/60 px-5 py-3 shadow-sm backdrop-blur-sm">
          <div className="grid grid-cols-3 items-center gap-4">
            {/* Left: Filters toggle */}
            <div className="flex items-center">
              <Button
                type="button"
                variant="default"
                size="sm"
                className="hidden gap-2 rounded-full px-4 py-2 text-sm font-medium lg:inline-flex bg-primary text-white hover:bg-primary/90"
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

            {/* Right: View mode toggle (eye comfort) */}
            <div className="flex items-center justify-end">
              <div className="flex items-center gap-2 rounded-full bg-muted/40 px-2 py-1 shadow-sm ring-1 ring-border/30">
                <span className="hidden text-xs text-muted-foreground sm:inline">Vue</span>
                <div className="flex items-center gap-1" aria-label="Mode d'affichage">
                  <Button
                    type="button"
                    variant={viewMode === 'grid' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('grid')}
                    className="h-9 w-9 p-0 rounded-full"
                    aria-pressed={viewMode === 'grid'}
                    aria-label="Grille compacte"
                  >
                    <Grid3x3 className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant={viewMode === 'large' ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setViewMode('large')}
                    className="h-9 w-9 p-0 rounded-full"
                    aria-pressed={viewMode === 'large'}
                    aria-label="Vue confortable"
                  >
                    <LayoutGrid className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex gap-6">
            {/* Filters Sidebar */}
            <ProductFilters
              onFilterChange={handleFilterChange}
              categories={categories}
              brands={brands}
              availableColors={availableColors}
              availableUnits={availableUnits}
              minPrice={minPrice}
              maxPrice={maxPrice}
              isLoading={isLoading || isFetching}
            isCollapsed={isFiltersCollapsed}
            onCollapsedChange={setIsFiltersCollapsed}
            />

            {/* Products List */}
            <ProductsList
              products={products}
              isLoading={isLoading}
              isFetching={isFetching}
              error={error}
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