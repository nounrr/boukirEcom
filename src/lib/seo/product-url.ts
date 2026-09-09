export type ProductUrlData = { id: number | string; designation?: string | null; name?: string | null; designation_ar?: string | null; designation_en?: string | null; designation_zh?: string | null }
export function productIdFromSegment(segment: unknown): string | null {
  if (typeof segment !== 'string') return null
  let value = segment
  try { value = decodeURIComponent(value) } catch { return null }
  const match = /^([1-9]\d*)(?:-[\p{L}\p{N}-]+)?$/u.exec(value)
  return match && Number.isSafeInteger(Number(match[1])) ? match[1] : null
}
export function productSlug(product: ProductUrlData, locale: string): string {
  const translated = locale === 'ar' ? product.designation_ar : locale === 'en' ? product.designation_en : locale === 'zh' ? product.designation_zh : product.designation
  const name = translated?.trim() || product.designation?.trim() || product.name?.trim() || 'produit'
  return name.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^\p{L}\p{N}]+/gu, '-').replace(/^-|-$/g, '').slice(0, 100).replace(/-$/g, '') || 'produit'
}
export function productPath(product: ProductUrlData, locale: string) {
  return `/product/${product.id}-${productSlug(product, locale)}`
}
export function productHref(product: ProductUrlData, locale: string) {
  return `/${locale}${productPath(product, locale)}`
}
