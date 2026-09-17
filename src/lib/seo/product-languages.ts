import type { AppLocale } from '@/i18n/locale'
import type { ProductUrlData } from './product-url'

export const SEO_LOCALES = ['fr', 'ar', 'en', 'zh'] as const satisfies readonly AppLocale[]

const hasText = (value: unknown): value is string => typeof value === 'string' && value.trim().length > 0
const hasArabic = (value: unknown) => hasText(value) && /\p{Script=Arabic}/u.test(value)
const hasHan = (value: unknown) => hasText(value) && /\p{Script=Han}/u.test(value)

/**
 * A localized route can stay accessible while remaining outside hreflang and
 * the sitemap until the product has real content in that language.
 */
export function hasLocalizedProductContent(product: ProductUrlData, locale: AppLocale): boolean {
  if (locale === 'fr') return hasText(product.designation) || hasText(product.name)
  if (locale === 'ar') return hasArabic(product.designation_ar) || hasArabic(product.designation)
  if (locale === 'en') return hasText(product.designation_en)
  return hasHan(product.designation_zh)
}

export function productTranslationLocales(product: ProductUrlData): AppLocale[] {
  return SEO_LOCALES.filter(locale => hasLocalizedProductContent(product, locale))
}
