import { cache } from 'react'
import { API_CONFIG } from '@/lib/api-config'
import { catalogPage, type CatalogKind } from './registry'
import type { ProductsListResponse } from '@/types/api/products'

export const loadCatalogPage = cache(async (kind: CatalogKind, slug: string, pageNumber: number) => {
  const page = catalogPage(kind, slug)
  if (!page) return null
  // Confirm the ID still exists: the legacy product endpoint ignores unknown categories.
  const source = await fetch(`${API_CONFIG.BASE_URL}/api/${kind === 'categories' ? 'categories' : 'brands'}`, { next: { revalidate: 300 }, signal: AbortSignal.timeout(15000) })
  if (!source.ok) throw new Error('Catalogue indisponible')
  const taxonomy = await source.json()
  if (!Array.isArray(taxonomy)) throw new Error('Catalogue invalide')
  if (!taxonomy.some(row => row.id === page.id)) return null
  const query = new URLSearchParams({ [kind === 'categories' ? 'category_id' : 'brand_id']: String(page.id), per_page: '24', page: String(pageNumber), in_stock_only: 'false' })
  if (page.search) query.set('search', page.search)
  const response = await fetch(`${API_CONFIG.BASE_URL}/api/ecommerce/products?${query}`, { next: { revalidate: 300 }, signal: AbortSignal.timeout(15000) })
  if (!response.ok) throw new Error('Produits indisponibles')
  const data = await response.json() as ProductsListResponse
  if (!Array.isArray(data.products) || !data.pagination || !Number.isFinite(data.pagination.total_items)) throw new Error('Liste produits invalide')
  return { page, data }
})

export function catalogPageNumber(value: string | string[] | undefined) {
  if (value === undefined) return 1
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) return null
  const n = Number(value)
  return Number.isSafeInteger(n) && n <= 100000 ? n : null
}
