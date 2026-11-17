"use client"

import { isRequiredVariant } from '@/lib/product-card-price'
import { ProductCardRow } from "@/components/shop/product-card-row"
import { ProductCardTile } from "@/components/shop/product-card-tile"
import { Button } from "@/components/ui/button"
import { ChevronDown, Loader2, Package, Tag, Store } from "lucide-react"
import { useMemo } from "react"
import type { ProductListItem } from "@/types/api/products"
import { useLocale, useTranslations } from "next-intl"
import Link from 'next/link'
import { getLocalizedCategoryName, getLocalizedProductName } from "@/lib/localized-fields"

/** large : grandes cartes · grid : grille · dense : petites cartes, plus de colonnes · list : une ligne par produit */
export type ShopViewMode = 'large' | 'grid' | 'dense' | 'list'

interface ProductsListProps {
  products: ProductListItem[]
  isLoading: boolean
  isFetching: boolean
  error: any
  onRetry: () => void
  selectedCategoryLabels?: string[]
  selectedBrandLabels?: string[]
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
  /** Chargement continu : plus de pagination numérotée, la suite s'ajoute sous la liste. */
  hasMore: boolean
  isLoadingMore: boolean
  onLoadMore: () => void
  /** Lien réel vers la page suivante (lisible par les moteurs de recherche). */
  nextHref?: string
  onAddToCart: (productId: number, variantId?: number) => void
  onToggleWishlist: (productId: number) => void
  onQuickView: (productId: number) => void
  viewMode: ShopViewMode
  isFiltersCollapsed: boolean
}

export function ProductsList({
  products,
  isLoading,
  isFetching,
  error,
  onRetry,
  selectedCategoryLabels,
  selectedBrandLabels,
  pagination,
  hasMore,
  isLoadingMore,
  onLoadMore,
  nextHref,
  onAddToCart,
  onToggleWishlist,
  onQuickView,
  viewMode,
  isFiltersCollapsed,
}: ProductsListProps) {
  const locale = useLocale()
  const t = useTranslations('productsList')

  const isRows = viewMode === 'list'

  // Colonnes selon l'affichage choisi et l'état du panneau de filtres.
  const columns = {
    large: isFiltersCollapsed ? 'grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3' : 'grid-cols-1 sm:grid-cols-2',
    grid: isFiltersCollapsed ? 'grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4' : 'grid-cols-2 xl:grid-cols-3',
    dense: isFiltersCollapsed ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6' : 'grid-cols-2 md:grid-cols-3 xl:grid-cols-4',
    list: 'grid-cols-1 xl:grid-cols-2',
  }[viewMode]
  const gap = viewMode === 'dense' ? 'gap-3' : viewMode === 'large' ? 'gap-6' : viewMode === 'list' ? 'gap-3' : 'gap-5'

  const getLocalizedDesignation = (product: ProductListItem): string => {
    const fallback = String((product as any)?.designation ?? (product as any)?.name ?? '')
    const value = getLocalizedProductName(product as any, locale).trim()
    return value || fallback
  }

  // Transform API products to ProductCard format (memoized for performance)
  const transformedProducts = useMemo(() => {
    return products.map((product) => {
      const currentPrice = product.prix_promo || product.prix_vente
      const hasDiscount = product.prix_promo && product.prix_promo < product.prix_vente
      const stockFlag = (product as any)?.in_stock ?? (product as any)?.inStock

      return {
        id: product.id,
        name: getLocalizedDesignation(product),
        designation: (product as any)?.designation ?? null,
        designation_ar: (product as any)?.designation_ar ?? null,
        designation_en: (product as any)?.designation_en ?? null,
        designation_zh: (product as any)?.designation_zh ?? null,
        description: '',
        price: currentPrice,
        originalPrice: hasDiscount ? product.prix_vente : undefined,
        image: product.image_url || '',
        category: getLocalizedCategoryName(product.categorie as any, locale) || '',
        categoryObj: (product as any)?.categorie ?? null,
        brand: product.brand?.nom,
        unit: product.base_unit,
        stock: product.quantite_disponible,
        purchase_limit: typeof (product as any)?.purchase_limit === 'number' ? (product as any).purchase_limit : undefined,
        in_stock: typeof stockFlag === 'boolean' ? stockFlag : undefined,
        inStock: typeof stockFlag === 'boolean' ? stockFlag : undefined,
        rating: 0,
        reviews: 0,
        variants: product.variants?.all?.map(v => ({
          id: v.id,
          name: v.type,
          variant_name: v.variant_name ?? v.name,
          color_name: v.color_name,
          value: v.name,
          available: v.available,
          prix_vente: v.prix_vente,
          image: v.image_url ?? undefined
        })) || [],
        isVariantRequired:
          isRequiredVariant(product.is_obligatoire_variant, product.isObligatoireVariant),
        is_wishlisted: product.is_wishlisted || false,
        sale: product.pourcentage_promo > 0 ? { discount: product.pourcentage_promo } : undefined,
        badges: [
          ...(product.has_promo ? [{ text: t('badges.new'), variant: "new" as const }] : []),
          ...(product.pourcentage_promo > 0 ? [{ text: t('badges.promo'), variant: "promo" as const }] : []),
        ],
      }
    })
  }, [products, t, locale])

  const wrapperClasses = "flex-1 min-w-0"

  const hasSelection =
    (selectedCategoryLabels?.length ?? 0) > 0 || (selectedBrandLabels?.length ?? 0) > 0

  const categoryText = (selectedCategoryLabels ?? []).filter(Boolean).join(', ')
  const brandText = (selectedBrandLabels ?? []).filter(Boolean).join(', ')

  return (
    <div className={wrapperClasses}>
      {/* Active selection (category / brands) */}
      {hasSelection ? (
        <div className="mb-4 rounded-2xl border border-border/40 bg-card/60 px-5 py-4 shadow-sm backdrop-blur-sm">
          <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
            {categoryText ? (
              <div className="flex items-center gap-3 min-w-0">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary ring-1 ring-primary/20">
                  <Tag className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <div className="truncate text-lg font-extrabold tracking-tight text-foreground">{categoryText}</div>
                </div>
              </div>
            ) : null}

            {brandText ? (
              <div className="flex items-center gap-3 min-w-0">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-muted/40 text-foreground ring-1 ring-border/40">
                  <Store className="h-5 w-5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <div className="truncate text-lg font-extrabold tracking-tight text-foreground">{brandText}</div>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Products Grid */}
      {isLoading ? (
        <div className={`grid ${gap} ${columns}`}>
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
            {t('errorTitle')}
          </h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md">
            {t('errorDescription')}
          </p>
          <Button onClick={onRetry} disabled={isFetching} className="shadow-md">
            {t('retry')}
          </Button>
        </div>
      ) : transformedProducts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
            <Package className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            {t('emptyTitle')}
          </h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-md">
            {t('emptyDescription')}
          </p>
        </div>
      ) : (
              <div className={`grid ${gap} ${columns}`}>
                {transformedProducts.map((product) =>
                  isRows ? (
                    <ProductCardRow
                      key={product.id}
                      product={product}
                      viewMode="list"
                      isWide
                      onAddToCart={onAddToCart}
                      onToggleWishlist={onToggleWishlist}
                      onQuickView={onQuickView}
                    />
                  ) : (
                    <ProductCardTile
                      key={product.id}
                      product={product}
                      viewMode="grid"
                      isWide={viewMode !== 'grid' || isFiltersCollapsed}
                      onAddToCart={onAddToCart}
                      onToggleWishlist={onToggleWishlist}
                      onQuickView={onQuickView}
                    />
                  )
                )}
              </div>
      )}

      {/* Suite de la liste : bouton « Voir plus », une page de produits par clic */}
      {!isLoading && !error && transformedProducts.length > 0 ? (
        <div className="mt-8 flex flex-col items-center gap-3">
          {isLoadingMore ? (
            <div className={`grid w-full ${gap} ${columns}`} aria-hidden="true">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="overflow-hidden rounded-[1.4rem] border border-border/40 bg-card">
                  <div className="aspect-square animate-pulse bg-muted" />
                  <div className="space-y-3 p-4">
                    <div className="h-4 animate-pulse rounded bg-muted/70" />
                    <div className="h-4 w-2/3 animate-pulse rounded bg-muted/50" />
                  </div>
                </div>
              ))}
            </div>
          ) : null}
          {hasMore || isLoadingMore ? (
            <Button asChild size="lg" variant="outline" className="h-12 rounded-full px-7 text-sm font-semibold">
              <Link
                href={nextHref ?? '#'}
                rel="next"
                scroll={false}
                aria-busy={isLoadingMore}
                onClick={(event) => {
                  event.preventDefault()
                  onLoadMore()
                }}
              >
                {isLoadingMore ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : <ChevronDown className="h-4 w-4" aria-hidden="true" />}
                {isLoadingMore ? t('loadingMore') : t('loadMore')}
                {pagination && !isLoadingMore ? (
                  <span className="text-xs font-normal text-muted-foreground">
                    · {t('remaining', { count: Math.max(0, pagination.total_items - transformedProducts.length) })}
                  </span>
                ) : null}
              </Link>
            </Button>
          ) : pagination && pagination.total_items > (pagination.per_page || 0) ? (
            <p className="rounded-full border border-border/50 px-5 py-2 text-xs font-medium text-muted-foreground">{t('allLoaded')}</p>
          ) : null}
        </div>
      ) : null}
    </div>
  )
}
