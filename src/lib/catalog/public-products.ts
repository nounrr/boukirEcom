import type {
  ProductDetail,
  ProductListItem,
  ProductsListResponse,
} from '@/types/api/products'

/**
 * Server-rendered catalogue data is shared between visitors by Next's cache.
 * Keep account-specific fields out of that cache and let RTK Query refresh them
 * in the browser with the visitor's own session.
 */
export function publicProductListItem(product: ProductListItem): ProductListItem {
  return { ...product, is_wishlisted: false }
}

export function publicProductDetail(product: ProductDetail): ProductDetail {
  return {
    ...product,
    is_wishlisted: false,
    similar_products: (product.similar_products ?? []).map(publicProductListItem),
    suggestions: product.suggestions?.map(publicProductListItem),
  }
}

export function publicProductsResponse(data: ProductsListResponse): ProductsListResponse {
  return {
    ...data,
    products: data.products.map(publicProductListItem),
  }
}
