"use client"

import { ProductCard } from "@/components/shop/product-card"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ChevronRight, Package } from "lucide-react"
import { useMemo } from "react"
import type { ProductListItem } from "@/types/api/products"

interface ProductsListProps {
  products: ProductListItem[]
  isLoading: boolean
  isFetching: boolean
  error: any
  pagination?: {
    current_page: number
    per_page: number
    total_items: number
    total_pages: number
    has_previous: boolean
    has_next: boolean
    from: number
    to: number
  }
  onPageChange: (page: number) => void
  onAddToCart: (productId: number, variantId?: number) => void
  onToggleWishlist: (productId: number) => void
  onQuickView: (productId: number) => void
  viewMode: 'grid' | 'large'
  isFiltersCollapsed: boolean
}

export function ProductsList({
  products,
  isLoading,
  isFetching,
  error,
  pagination,
  onPageChange,
  onAddToCart,
  onToggleWishlist,
  onQuickView,
  viewMode,
  isFiltersCollapsed,
}: ProductsListProps) {

  // Dynamic grid columns based on filter state and view mode
  const gridColumns = (() => {
    if (viewMode === 'large') {
      // Comfortable view: fewer columns, larger tiles
      return isFiltersCollapsed
        ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-2 2xl:grid-cols-3'
        : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-2'
    }
    // Compact grid
    return isFiltersCollapsed
      ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4'
      : 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'
  })()

  // Transform API products to ProductCard format (memoized for performance)
  const transformedProducts = useMemo(() => {
    return products.map((product) => {
      const currentPrice = product.prix_promo || product.prix_vente
      const hasDiscount = product.prix_promo && product.prix_promo < product.prix_vente

      return {
        id: product.id,
        name: product.designation,
        description: '',
        price: currentPrice,
        originalPrice: hasDiscount ? product.prix_vente : undefined,
        image: product.image_url || '',
        category: product.categorie?.nom || '',
        brand: product.brand?.nom,
        unit: product.base_unit,
        stock: product.quantite_disponible,
        rating: 0,
        reviews: 0,
        variants: product.variants?.all?.map(v => ({
          id: v.id,
          name: v.type,
          value: v.name,
          available: v.available,
          image: v.image_url ?? undefined
        })) || [],
        isVariantRequired:
          product.is_obligatoire_variant === true || product.isObligatoireVariant === true,
        is_wishlisted: product.is_wishlisted || false,
        sale: product.pourcentage_promo > 0 ? { discount: product.pourcentage_promo } : undefined,
        badges: [
          ...(product.has_promo ? [{ text: "NOUVEAU", variant: "new" as const }] : []),
          ...(product.pourcentage_promo > 0 ? [{ text: "PROMO", variant: "promo" as const }] : []),
        ],
      }
    })
  }, [products])

  const wrapperClasses = "flex-1 min-w-0"

  return (
    <div className={wrapperClasses}>
      {/* Products Grid */}
      {isLoading ? (
        <div className={`grid gap-5 ${viewMode === 'grid' ? gridColumns : 'grid-cols-1'}`}>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="bg-card rounded-lg border border-border/40 overflow-hidden">
              <div className="aspect-square bg-muted animate-pulse" />
              <div className="p-4 space-y-3">
                <div className="h-4 bg-muted/70 animate-pulse rounded" />
                <div className="h-4 bg-muted/50 animate-pulse rounded w-2/3" />
                <div className="h-6 bg-muted/60 animate-pulse rounded w-1/3" />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
            <Package className="w-8 h-8 text-destructive" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Impossible de charger les produits
          </h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md">
            Une erreur s'est produite lors du chargement des produits. Veuillez réessayer plus tard.
          </p>
          <Button onClick={() => window.location.reload()} className="shadow-md">
            Réessayer
          </Button>
        </div>
      ) : transformedProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
            <Package className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Aucun produit trouvé
          </h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md">
            Essayez de modifier vos filtres ou votre recherche pour découvrir nos produits.
          </p>
        </div>
      ) : (
              <div className={`grid ${viewMode === 'large' ? 'gap-6' : 'gap-5'} ${gridColumns}`}>
          {transformedProducts.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              viewMode={viewMode}
              isWide={isFiltersCollapsed || viewMode === 'large'}
              onAddToCart={onAddToCart}
              onToggleWishlist={onToggleWishlist}
              onQuickView={onQuickView}
            />
          ))}
        </div>
      )}

      {/* Pagination */}
      {pagination && pagination.total_pages > 1 && !isLoading && (
        <div className="mt-6 flex justify-center">
          <div className="inline-flex items-center gap-2 border border-border/40 rounded-lg p-2">
            <Button
              variant="ghost"
              size="sm"
              disabled={pagination.current_page === 1 || isFetching}
              onClick={() => onPageChange(pagination.current_page - 1)}
              className="h-9 px-3"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Précédent
            </Button>

            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, pagination.total_pages) }, (_, i) => {
                let pageNum: number;
                if (pagination.total_pages <= 5) {
                  pageNum = i + 1;
                } else if (pagination.current_page <= 3) {
                  pageNum = i + 1;
                } else if (pagination.current_page >= pagination.total_pages - 2) {
                  pageNum = pagination.total_pages - 4 + i;
                } else {
                  pageNum = pagination.current_page - 2 + i;
                }

                return (
                  <Button
                    key={pageNum}
                    variant={pagination.current_page === pageNum ? 'default' : 'ghost'}
                    size="sm"
                    disabled={isFetching}
                    onClick={() => onPageChange(pageNum)}
                    className="h-9 w-9"
                  >
                    {pageNum}
                  </Button>
                );
              })}
            </div>

            <Button
              variant="ghost"
              size="sm"
              disabled={pagination.current_page === pagination.total_pages || isFetching}
              onClick={() => onPageChange(pagination.current_page + 1)}
              className="h-9 px-3"
            >
              Suivant
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
