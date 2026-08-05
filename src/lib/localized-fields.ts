export type SupportedLocaleKey = 'fr' | 'ar' | 'en' | 'zh'

function normalizeLocaleKey(locale: string | undefined | null): SupportedLocaleKey {
  if (locale === 'ar' || locale === 'en' || locale === 'zh') return locale
  return 'fr'
}

function pickLocalized(
  locale: string,
  base: string | null | undefined,
  translated: { ar?: string | null; en?: string | null; zh?: string | null } | null | undefined
): string {
  const key = normalizeLocaleKey(locale)
  if (key === 'ar') return translated?.ar || base || ''
  if (key === 'en') return translated?.en || base || ''
  if (key === 'zh') return translated?.zh || base || ''
  return base || ''
}

export type TranslatedCategoryLike = {
  nom?: string | null
  nom_ar?: string | null
  nom_en?: string | null
  nom_zh?: string | null
} | null | undefined

export function getLocalizedCategoryName(category: TranslatedCategoryLike, locale: string): string {
  if (!category) return ''
  return pickLocalized(locale, category.nom ?? '', {
    ar: category.nom_ar,
    en: category.nom_en,
    zh: category.nom_zh,
  })
}

export type TranslatedProductNameLike = {
  designation?: string | null
  designation_ar?: string | null
  designation_en?: string | null
  designation_zh?: string | null
} | null | undefined

export function getLocalizedProductName(product: TranslatedProductNameLike, locale: string): string {
  if (!product) return ''
  return pickLocalized(locale, product.designation ?? '', {
    ar: product.designation_ar,
    en: product.designation_en,
    zh: product.designation_zh,
  })
}

export type CartItemLocalizedLike = {
  name?: string
  designation?: string | null
  designation_ar?: string | null
  designation_en?: string | null
  designation_zh?: string | null
  category?: string | null
  categoryObj?: TranslatedCategoryLike
} | null | undefined

export function getLocalizedCartItemBaseName(item: CartItemLocalizedLike, locale: string): string {
  if (!item) return ''
  const base = item.designation ?? item.name ?? ''
  return pickLocalized(locale, base, {
    ar: item.designation_ar,
    en: item.designation_en,
    zh: item.designation_zh,
  })
}

export function getLocalizedCartItemCategory(item: CartItemLocalizedLike, locale: string): string {
  if (!item) return ''
  if (item.categoryObj) return getLocalizedCategoryName(item.categoryObj, locale)
  return item.category ?? ''
}
