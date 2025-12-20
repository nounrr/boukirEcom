"use client"

import { ProductFilters } from "@/components/shop/product-filters"
import { ProductsList } from "@/components/shop/products-list"
import { FilterStateProvider } from "@/components/shop/filter-state-provider"
import { useTranslations } from "next-intl"
import { useState, useCallback, useMemo } from "react"
import { useGetProductsQuery } from "@/state/api/products-api-slice"
import { filterStateToApiRequest, type FilterState } from "@/types/api/products"

export default function ShopPage() {
  const t = useTranslations('shop')

  // First fetch to get initial data and price range
  const { data: initialData } = useGetProductsQuery({ page: 1, per_page: 20, in_stock_only: true, sort: 'newest' })

  const [filterState, setFilterState] = useState<FilterState>({
    categories: [],
    brands: [],
    priceRange: [initialData?.filters?.price_range?.min || 0, initialData?.filters?.price_range?.max || 10000],
    colors: [],
    units: [],
    search: '',
    inStock: true,
    sort: 'newest',
    page: 1,
    per_page: 20
  })

  // Convert filter state to API request
  const apiFilters = useMemo(() => filterStateToApiRequest(filterState), [filterState])

  // Fetch products with filters (capture refetch for manual refresh)
  const { data, isLoading, isFetching, error, refetch } = useGetProductsQuery(apiFilters)

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
    <FilterStateProvider>
      <div className="bg-background">
        {/* Main Content */}
        <div className="container mx-auto px-6 sm:px-8 lg:px-16 py-6">
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
            />
          </div>
        </div>
      </div>
    </FilterStateProvider>
  )
}