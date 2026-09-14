import type { FilterState, ProductFiltersRequest } from '@/types/api/products'

export type ShopSearchParams = Record<string, string | string[] | undefined>
const SORTS = new Set(['newest', 'price_asc', 'price_desc', 'promo', 'popular'])
const TRACKING = /^(utm_[a-z0-9_]+|gclid|fbclid|msclkid)$/i
const FILTER_KEYS = ['category_id', 'brand_id', 'search', 'sort', 'min_price', 'max_price', 'colors', 'units', 'utility_type'] as const

function first(value: string | string[] | undefined) { return Array.isArray(value) ? value[0] : value }
function cleanList(value: string | undefined, numeric = false) {
  if (!value) return ''
  const values = [...new Set(value.split(',').map(v => v.trim()).filter(v => numeric ? /^[1-9]\d*$/.test(v) : Boolean(v)))]
  values.sort(numeric ? (a, b) => Number(a) - Number(b) : (a, b) => a.localeCompare(b))
  return values.slice(0, 20).join(',')
}
function cleanNumber(value: string | undefined) {
  return value && /^\d+$/.test(value) ? String(Number(value)) : ''
}
export function parsePage(value: string | undefined) {
  if (value === undefined) return 1
  if (!/^[1-9]\d*$/.test(value)) return null
  const page = Number(value)
  return Number.isSafeInteger(page) && page <= 100000 ? page : null
}

export function normalizeShopParams(input: ShopSearchParams) {
  const canonical = new URLSearchParams()
  const navigation = new URLSearchParams()
  const pageRaw = first(input.page)
  const page = parsePage(pageRaw) ?? 1
  let changed = pageRaw !== undefined && (parsePage(pageRaw) === null || page === 1 || pageRaw !== String(page))
  const source: Record<string, string | undefined> = {}
  for (const key of FILTER_KEYS) { source[key] = first(input[key]); if (Array.isArray(input[key])) changed = true }
  if (!source.utility_type && first(input.categorie_base)) { source.utility_type = first(input.categorie_base); changed = true }
  const normalized: Record<string, string> = {
    category_id: cleanList(source.category_id, true), brand_id: cleanList(source.brand_id, true),
    search: (source.search || '').trim().replace(/\s+/g, ' ').slice(0, 100),
    sort: source.sort && SORTS.has(source.sort) && source.sort !== 'newest' ? source.sort : '',
    min_price: cleanNumber(source.min_price), max_price: cleanNumber(source.max_price),
    colors: cleanList(source.colors), units: cleanList(source.units), utility_type: cleanList(source.utility_type),
  }
  for (const key of FILTER_KEYS) {
    const raw = source[key] || ''
    if (raw !== normalized[key]) changed = true
    if (normalized[key]) { canonical.set(key, normalized[key]); navigation.set(key, normalized[key]) }
  }
  if (page > 1) { canonical.set('page', String(page)); navigation.set('page', String(page)) }
  for (const [key, raw] of Object.entries(input)) {
    if (TRACKING.test(key)) {
      for (const value of Array.isArray(raw) ? raw : [raw]) if (value) navigation.append(key, value)
    } else if (![...FILTER_KEYS, 'page', 'per_page', 'categorie_base'].includes(key) && raw != null) changed = true
  }
  if (input.per_page !== undefined) changed = true // The catalogue has one stable page size (20).
  const hasFilters = FILTER_KEYS.some(key => Boolean(normalized[key]))
  const categoryIds = normalized.category_id?.split(',').filter(Boolean) || []
  const brandIds = normalized.brand_id?.split(',').filter(Boolean) || []
  return { page, canonical, navigation, normalized, hasFilters, categoryIds, brandIds, changed }
}

export function shopApiRequest(result: ReturnType<typeof normalizeShopParams>): ProductFiltersRequest {
  const n = result.normalized
  return {
    page: result.page, per_page: 20, sort: (n.sort || 'newest') as ProductFiltersRequest['sort'], in_stock_only: false,
    ...(n.category_id ? { category_id: n.category_id } : {}), ...(n.brand_id ? { brand_id: n.brand_id } : {}),
    ...(n.search ? { search: n.search } : {}), ...(n.min_price ? { min_price: Number(n.min_price) } : {}),
    ...(n.max_price ? { max_price: Number(n.max_price) } : {}), ...(n.colors ? { color: n.colors } : {}),
    ...(n.units ? { unit: n.units } : {}), ...(n.utility_type ? { utility_type: n.utility_type } : {}),
  }
}
export function shopFilterState(result: ReturnType<typeof normalizeShopParams>): FilterState {
  const n = result.normalized
  return { categories: result.categoryIds.map(Number), brands: result.brandIds.map(Number),
    priceRange: [n.min_price ? Number(n.min_price) : 0, n.max_price ? Number(n.max_price) : 10000],
    colors: n.colors ? n.colors.split(',') : [], units: n.units ? n.units.split(',') : [],
    utilityTypes: n.utility_type ? n.utility_type.split(',') : [], search: n.search || '', inStock: false,
    sort: (n.sort || 'newest') as FilterState['sort'], page: result.page, per_page: 20 }
}
export function shopPageHref(pathname: string, params: URLSearchParams, page: number) {
  const next = new URLSearchParams(params)
  if (page <= 1) next.delete('page'); else next.set('page', String(page))
  return `${pathname}${next.size ? `?${next}` : ''}`
}
export function sameFilterState(a: FilterState, b: FilterState) {
  return JSON.stringify(a) === JSON.stringify(b)
}
