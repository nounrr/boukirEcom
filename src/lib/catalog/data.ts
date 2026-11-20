import { cache } from 'react'
import { API_CONFIG } from '@/lib/api-config'
import { catalogPage, categories as editorialCategories, type CatalogKind, type CatalogPage } from './registry'
import { categoryIdFromSlug, categorySlug, MIN_INDEXABLE_PRODUCTS } from './category-slug'
import type { ProductsListResponse } from '@/types/api/products'
import { publicProductsResponse } from './public-products'

/** A category of the back office, as /api/categories returns it (flat list). */
export type TaxonomyRow = { id: number; nom: string; nom_ar?: string | null; nom_en?: string | null; nom_zh?: string | null; parent_id?: number | null }
type Localized = { fr: string; ar: string; en: string; zh: string }
/** A linked category (parent or sub-category) with its name in each language. */
export type CategoryLink = { slug: string; name: Localized }

export { MIN_INDEXABLE_PRODUCTS }

export const loadTaxonomy = cache(async (kind: CatalogKind): Promise<TaxonomyRow[]> => {
  const source = await fetch(`${API_CONFIG.BASE_URL}/api/${kind === 'categories' ? 'categories' : 'brands'}`, { next: { revalidate: 300 }, signal: AbortSignal.timeout(15000) })
  if (!source.ok) throw new Error('Catalogue indisponible')
  const taxonomy = await source.json()
  if (!Array.isArray(taxonomy)) throw new Error('Catalogue invalide')
  return taxonomy as TaxonomyRow[]
})

/** « CIMENTS ET LIANTS » (names typed in capitals in the back office) → « Ciments et liants ». */
function sentenceCase(name: string, locale: string): string {
  const text = name.trim().replace(/\s+/g, ' ')
  const letters = text.replace(/[^\p{L}]/gu, '')
  if (!letters || letters !== letters.toLocaleUpperCase(locale) || letters === letters.toLocaleLowerCase(locale)) return text
  const lower = text.toLocaleLowerCase(locale)
  return lower.charAt(0).toLocaleUpperCase(locale) + lower.slice(1)
}

export function localizedNames(row: TaxonomyRow): Localized {
  const fr = sentenceCase(row.nom, 'fr')
  return { fr, ar: row.nom_ar?.trim() || fr, en: row.nom_en?.trim() ? sentenceCase(row.nom_en, 'en') : fr, zh: row.nom_zh?.trim() || fr }
}

/**
 * Category page behind a slug: a hand-written page, or a page generated from the back-office
 * category (« 83-echelles »). `slug` is the canonical one; when it differs from the URL, redirect.
 */
export const resolveCategory = cache(async (slug: string) => {
  const editorial = editorialCategories.find(c => c.slug === slug)
  const taxonomy = await loadTaxonomy('categories')
  const id = editorial?.id ?? categoryIdFromSlug(slug)
  const row = id ? taxonomy.find(r => Number(r.id) === id) : undefined
  if (!row) return null
  if (editorial) return { page: editorial, slug, generated: false, row, taxonomy }
  // A category that has a hand-written page keeps that page (and its text).
  const own = editorialCategories.find(c => c.id === row.id && !c.search)
  if (own) return { page: own, slug: own.slug, generated: false, row, taxonomy }
  const names = localizedNames(row)
  const page: CatalogPage = { id: row.id, slug: categorySlug(row.id, row.nom), ...names, adviceFr: '', adviceAr: '', adviceEn: '', adviceZh: '' }
  return { page, slug: page.slug, generated: true, row, taxonomy }
})

/** Factual introduction of a generated page: count, sub-categories and brands actually present. */
function generatedAdvice(names: Localized, total: number, subs: Localized[], brands: string[]) {
  const list = (items: string[]) => items.slice(0, 6).join(', ')
  const sub = (l: keyof Localized) => list(subs.map(s => s[l]))
  return {
    adviceFr: `${names.fr} : ${total} référence${total > 1 ? 's' : ''} au catalogue de Boukir Diamond à Tanger${brands.length ? `, notamment des marques ${list(brands)}` : ''}.${subs.length ? ` Sous-catégories : ${sub('fr')}.` : ''} Comparez l’usage, les dimensions, l’unité de vente et le prix affiché sur chaque fiche, ou contactez le magasin pour un conseil.`,
    adviceAr: `${names.ar}: ${total} منتج في كتالوج بوكِير دايموند بطنجة${brands.length ? `، من بينها علامات ${list(brands)}` : ''}.${subs.length ? ` الفئات الفرعية: ${sub('ar')}.` : ''} قارن الاستعمال والمقاسات ووحدة البيع والسعر المعروض في كل منتج، أو اتصل بالمتجر للاستشارة.`,
    adviceEn: `${names.en}: ${total} product${total > 1 ? 's' : ''} in the Boukir Diamond catalogue in Tangier${brands.length ? `, including the brands ${list(brands)}` : ''}.${subs.length ? ` Subcategories: ${sub('en')}.` : ''} Compare use, dimensions, sales unit and displayed price on each product page, or contact the store for advice.`,
    adviceZh: `${names.zh}：Boukir Diamond 丹吉尔目录中共有 ${total} 款产品${brands.length ? `，包括品牌 ${list(brands)}` : ''}。${subs.length ? `子类别：${sub('zh')}。` : ''}请在各产品页面比较用途、尺寸、销售单位和展示价格，或联系门店获取建议。`,
  }
}

export const loadCatalogPage = cache(async (kind: CatalogKind, slug: string, pageNumber: number) => {
  let page: CatalogPage | undefined
  let parent: CategoryLink | null = null
  let children: CategoryLink[] = []
  let generated = false
  if (kind === 'categories') {
    const resolved = await resolveCategory(slug)
    if (!resolved || resolved.slug !== slug) return null
    page = resolved.page
    generated = resolved.generated
    const { row, taxonomy } = resolved
    const link = (r: TaxonomyRow): CategoryLink => {
      const own = editorialCategories.find(c => c.id === r.id && !c.search)
      return { slug: own ? own.slug : categorySlug(r.id, r.nom), name: localizedNames(r) }
    }
    const parentRow = row.parent_id ? taxonomy.find(r => Number(r.id) === Number(row.parent_id)) : undefined
    parent = parentRow ? link(parentRow) : null
    children = taxonomy.filter(r => Number(r.parent_id) === Number(row.id)).map(link)
  } else {
    page = catalogPage(kind, slug)
    if (!page) return null
    // Confirm the ID still exists: the legacy product endpoint ignores unknown brands.
    const taxonomy = await loadTaxonomy(kind)
    if (!taxonomy.some(row => Number(row.id) === page!.id)) return null
  }
  const query = new URLSearchParams({ [kind === 'categories' ? 'category_id' : 'brand_id']: String(page.id), per_page: '24', page: String(pageNumber), in_stock_only: 'false' })
  if (page.search) query.set('search', page.search)
  const response = await fetch(`${API_CONFIG.BASE_URL}/api/ecommerce/products?${query}`, { next: { revalidate: 300 }, signal: AbortSignal.timeout(15000) })
  if (!response.ok) throw new Error('Produits indisponibles')
  const data = await response.json() as ProductsListResponse
  if (!Array.isArray(data.products) || !data.pagination || !Number.isFinite(data.pagination.total_items)) throw new Error('Liste produits invalide')
  if (generated) {
    // Brands seen on this page of products, most frequent first (a sample, hence « notamment »).
    const counts = new Map<string, number>()
    for (const product of data.products) if (product.brand?.nom) counts.set(product.brand.nom, (counts.get(product.brand.nom) ?? 0) + 1)
    const brands = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 4).map(([name]) => name)
    page = { ...page, ...generatedAdvice({ fr: page.fr, ar: page.ar, en: page.en, zh: page.zh }, data.pagination.total_items, children.map(c => c.name), brands) }
  }
  return { page, data: publicProductsResponse(data), generated, parent, children }
})

export function catalogPageNumber(value: string | string[] | undefined) {
  if (value === undefined) return 1
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value)) return null
  const n = Number(value)
  return Number.isSafeInteger(n) && n <= 100000 ? n : null
}
