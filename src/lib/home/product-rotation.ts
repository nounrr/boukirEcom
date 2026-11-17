/**
 * Rules for the homepage product walls (hero grid, "À découvrir aujourd'hui"):
 * - only products worth showing: at least MIN_SHOWCASE_PRICE and with a photo,
 * - never the same product twice until every product has been shown,
 * - neighbours from different categories whenever the catalogue allows it.
 */

export const MIN_SHOWCASE_PRICE = 550

export type RotatingProduct = {
  id: number
  prix_vente: number
  prix_promo?: number | null
  image_url?: string | null
  categorie?: { id: number } | null
}

/** The price the customer pays (the promo price when there is one). */
export function displayPrice(product: Pick<RotatingProduct, 'prix_vente' | 'prix_promo'>): number {
  const promo = Number(product.prix_promo)
  const base = Number(product.prix_vente)
  return promo > 0 && promo < base ? promo : base
}

export const categoryKey = (product: RotatingProduct) => (product.categorie?.id != null ? String(product.categorie.id) : `none-${product.id}`)

/** Keeps each product once, with a photo and a price of at least `minPrice`. */
export function showcaseProducts<T extends RotatingProduct>(lists: Array<T[] | undefined>, minPrice = MIN_SHOWCASE_PRICE): T[] {
  const seen = new Set<number>()
  const out: T[] = []
  for (const list of lists) {
    for (const product of list ?? []) {
      if (seen.has(product.id) || !product.image_url || !(displayPrice(product) >= minPrice)) continue
      seen.add(product.id)
      out.push(product)
    }
  }
  return out
}

/** Seeded random generator (the same draw for a given seed). */
export function seededRandom(seed: number) {
  let a = seed >>> 0
  return () => {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function shuffle<T>(list: T[], random: () => number): T[] {
  const out = list.slice()
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1))
    ;[out[i], out[j]] = [out[j], out[i]]
  }
  return out
}

/**
 * Shuffles, then deals the products category by category (round robin), so two neighbours
 * almost never share a category.
 */
export function interleaveByCategory<T extends RotatingProduct>(list: T[], random: () => number): T[] {
  const groups = new Map<string, T[]>()
  for (const product of shuffle(list, random)) {
    const key = categoryKey(product)
    groups.set(key, [...(groups.get(key) ?? []), product])
  }
  const queues = shuffle([...groups.values()], random)
  const out: T[] = []
  while (queues.some((q) => q.length)) {
    for (const queue of queues) {
      const next = queue.shift()
      if (next) out.push(next)
    }
  }
  return out
}

/**
 * The product that replaces the one leaving a cell.
 * - Never one on screen, never one already shown in this round (`used`); when every product has had its turn,
 *   a new round starts (`used` is cleared by the caller through `resetRound`).
 * - Prefers a category nobody else shows; else at least not the category of the product it replaces.
 * Returns the index in `pool`, or -1 when nothing can come in.
 */
export function pickNext<T extends RotatingProduct>(
  pool: T[],
  { shown, used, leaving }: { shown: number[]; used: Set<number>; leaving: number | null },
): { index: number; resetRound: boolean } {
  const onScreen = new Set(shown)
  const others = shown.filter((i) => i !== leaving)
  const takenCategories = new Set(others.map((i) => categoryKey(pool[i])))
  const leavingCategory = leaving != null && pool[leaving] ? categoryKey(pool[leaving]) : null

  const choose = (allowUsed: boolean) => {
    const free = pool.map((_, i) => i).filter((i) => !onScreen.has(i) && (allowUsed || !used.has(i)))
    return (
      free.find((i) => !takenCategories.has(categoryKey(pool[i])) && categoryKey(pool[i]) !== leavingCategory) ??
      free.find((i) => categoryKey(pool[i]) !== leavingCategory) ??
      free[0] ??
      -1
    )
  }

  const fresh = choose(false)
  if (fresh !== -1) return { index: fresh, resetRound: false }
  // Every product had its turn: start a new round.
  return { index: choose(true), resetRound: true }
}
