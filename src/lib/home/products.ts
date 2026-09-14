import { cache } from 'react'

import { API_CONFIG } from '@/lib/api-config'
import { publicProductListItem } from '@/lib/catalog/public-products'
import type { ProductListItem, ProductsListResponse } from '@/types/api/products'

export type HomeProducts = {
  newArrivals: ProductListItem[]
  featured: ProductListItem[]
}

async function fetchProductArray(path: string, limit: number): Promise<ProductListItem[]> {
  const query = new URLSearchParams({ limit: String(limit) })
  const response = await fetch(`${API_CONFIG.BASE_URL}${path}?${query}`, {
    next: { revalidate: 120 },
    headers: { Platform: 'web' },
    signal: AbortSignal.timeout(15000),
  })
  if (!response.ok) throw new Error(`Home products API HTTP ${response.status}`)
  const data = await response.json()
  if (!Array.isArray(data)) throw new Error('Home products API response is invalid')
  return (data as ProductListItem[]).map(publicProductListItem)
}

async function fetchCatalogueFallback(limit: number): Promise<ProductListItem[]> {
  const query = new URLSearchParams({ page: '1', per_page: String(limit), sort: 'newest', in_stock_only: 'false' })
  const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.PRODUCTS}?${query}`, {
    next: { revalidate: 120 },
    headers: { Platform: 'web' },
    signal: AbortSignal.timeout(15000),
  })
  if (!response.ok) throw new Error(`Home catalogue fallback HTTP ${response.status}`)
  const data = await response.json() as ProductsListResponse
  if (!Array.isArray(data.products)) throw new Error('Home catalogue fallback response is invalid')
  return data.products.map(publicProductListItem)
}

export const loadHomeProducts = cache(async (): Promise<HomeProducts> => {
  const [newResult, featuredResult] = await Promise.allSettled([
    fetchProductArray(API_CONFIG.ENDPOINTS.NEW_ARRIVALS, 8),
    fetchProductArray(API_CONFIG.ENDPOINTS.FEATURED_PROMO, 12),
  ])

  let newArrivals = newResult.status === 'fulfilled' ? newResult.value : []
  const featured = featuredResult.status === 'fulfilled' ? featuredResult.value : []

  // Keep the commercial HTML useful if the specialized "new" endpoint is
  // temporarily unavailable or legitimately empty.
  if (newArrivals.length === 0) {
    try {
      newArrivals = await fetchCatalogueFallback(8)
    } catch (error) {
      console.error('Home SSR products unavailable', error)
    }
  }

  if (newResult.status === 'rejected') console.error('Home SSR new arrivals unavailable', newResult.reason)
  if (featuredResult.status === 'rejected') console.error('Home SSR featured products unavailable', featuredResult.reason)

  return { newArrivals, featured }
})
