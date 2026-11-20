/**
 * URL of a category page: « {id}-{name} » from the French name (one stable slug for every
 * language, like the hand-written pages). Pure function, usable on the server and in the browser.
 */
export function slugify(name: string | null | undefined): string {
  return String(name ?? '')
    .normalize('NFKD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 80)
    .replace(/-$/g, '')
}

export function categorySlug(id: number | string, name?: string | null): string {
  const words = slugify(name)
  return words ? `${id}-${words}` : String(id)
}

/** Generated category pages are indexed (and listed in the sitemap) from this many products. */
export const MIN_INDEXABLE_PRODUCTS = 3

/** Category id at the start of a slug (« 83-echelles » → 83), or null. */
export function categoryIdFromSlug(slug: string): number | null {
  const match = /^([1-9]\d*)(?:-|$)/.exec(slug)
  const id = match ? Number(match[1]) : NaN
  return Number.isSafeInteger(id) ? id : null
}

/** Readable name from a slug, for a label shown before the real name is known. */
export function nameFromSlug(slug: string, locale: string): string {
  let words = ''
  try { words = decodeURIComponent(slug).replace(/^\d+-?/, '').replace(/-/g, ' ').trim() } catch { return '' }
  return words ? words.charAt(0).toLocaleUpperCase(locale) + words.slice(1) : ''
}
