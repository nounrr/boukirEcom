import type { ProductDetail, ProductListItem } from '@/types/api/products'

function mergeWishlistState<T extends ProductListItem>(initial: T, fresh: ProductListItem | undefined): T {
  return fresh?.is_wishlisted === undefined
    ? initial
    : { ...initial, is_wishlisted: fresh.is_wishlisted }
}

function mergeProductList(initial: ProductListItem[] | undefined, fresh: ProductListItem[] | undefined) {
  if (!initial) return initial
  const freshById = new Map((fresh ?? []).map(product => [product.id, product]))
  return initial.map(product => mergeWishlistState(product, freshById.get(product.id)))
}

/** Keep the server-rendered commercial snapshot stable while refreshing visitor-only state. */
export function mergeProductSessionState(initial: ProductDetail, fresh?: ProductDetail): ProductDetail {
  if (!fresh) return initial
  const productWithSessionState: ProductDetail = fresh.is_wishlisted === undefined
    ? initial
    : { ...initial, is_wishlisted: fresh.is_wishlisted }
  return {
    ...productWithSessionState,
    similar_products: mergeProductList(initial.similar_products, fresh.similar_products) ?? [],
    suggestions: mergeProductList(initial.suggestions, fresh.suggestions),
  }
}
