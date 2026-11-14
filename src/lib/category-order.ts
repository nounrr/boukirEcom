// Display order of sibling categories, set by drag & drop in the backoffice:
// manual sort_order first, then never-ordered categories by name.
type OrderableCategory = { id?: number | null; sort_order?: number | null }

export function compareCategoryOrder<T extends OrderableCategory>(
  a: T,
  b: T,
  label: (category: T) => string
): number {
  const ao = a.sort_order ?? null
  const bo = b.sort_order ?? null
  if (ao !== null && bo !== null && ao !== bo) return ao - bo
  if (ao === null && bo !== null) return 1
  if (ao !== null && bo === null) return -1
  const nameCmp = (label(a) || '').localeCompare(label(b) || '')
  if (nameCmp !== 0) return nameCmp
  return (a.id ?? 0) - (b.id ?? 0)
}
