/**
 * Link to the shop filtered on one category (a univers includes all its sub-categories),
 * used where a click on a category should show its products rather than the category page.
 */
export function shopCategoryHref(locale: string, categoryId: number | string) {
  return `/${locale}/shop?category_id=${encodeURIComponent(String(categoryId))}`
}
