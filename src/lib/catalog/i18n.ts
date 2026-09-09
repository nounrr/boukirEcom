import type { CatalogPage } from './registry'
export const CATALOG_LOCALES = ['fr', 'ar', 'en', 'zh'] as const
export type CatalogLocale = typeof CATALOG_LOCALES[number]
export function isCatalogLocale(locale: string): locale is CatalogLocale { return CATALOG_LOCALES.some(l => l === locale) }
const copy = {
  fr: { home: 'Accueil', shop: 'Boutique', breadcrumb: 'Fil d’Ariane', location: 'à Tanger', page: 'page', count: 'produits au catalogue', refine: 'Affiner par prix, marque et caractéristiques', empty: 'Aucun produit disponible dans cette sélection pour le moment.', currency: 'MAD', price: 'Prix à confirmer', pagination: 'Pagination des produits', previous: 'Précédent', next: 'Suivant', related: 'Préparer votre chantier' },
  ar: { home: 'الرئيسية', shop: 'المتجر', breadcrumb: 'مسار التصفح', location: 'في طنجة', page: 'صفحة', count: 'منتج في الكتالوج', refine: 'تصفية حسب السعر والعلامة والخصائص', empty: 'لا توجد منتجات متاحة في هذه الفئة حالياً.', currency: 'درهم', price: 'استفسر عن السعر', pagination: 'صفحات المنتجات', previous: 'السابق', next: 'التالي', related: 'أقسام مرتبطة بمشروعك' },
  en: { home: 'Home', shop: 'Shop', breadcrumb: 'Breadcrumb', location: 'in Tangier', page: 'page', count: 'products in the catalogue', refine: 'Filter by price, brand and specifications', empty: 'There are currently no products in this selection.', currency: 'MAD', price: 'Price to be confirmed', pagination: 'Product pages', previous: 'Previous', next: 'Next', related: 'Plan your building project' },
  zh: { home: '首页', shop: '商城', breadcrumb: '面包屑导航', location: '— 丹吉尔', page: '页', count: '款目录产品', refine: '按价格、品牌和规格筛选', empty: '此分类目前没有可用产品。', currency: '摩洛哥迪拉姆', price: '价格待确认', pagination: '产品分页', previous: '上一页', next: '下一页', related: '规划您的施工项目' },
}
export function catalogCopy(locale: string) { return copy[isCatalogLocale(locale) ? locale : 'fr'] }
export function catalogText(page: CatalogPage, locale: string) {
  const l = isCatalogLocale(locale) ? locale : 'fr'
  const advice = { fr: page.adviceFr, ar: page.adviceAr, en: page.adviceEn, zh: page.adviceZh }
  return { name: page[l], advice: advice[l] }
}
