export function isRequiredVariant(...flags: unknown[]): boolean {
  return flags.some(flag => flag === true || flag === 1 || flag === '1')
}

type CardVariant = {
  id: number
  prix_vente?: unknown
  price?: unknown
  prix_original?: unknown
  originalPrice?: unknown
}

type CardOffer = {
  price: number
  originalPrice?: number
  isVariantRequired?: boolean
  variants?: CardVariant[]
  sale?: { discount: number }
}

function positivePrice(value: unknown): number | null {
  const price = Number(value)
  return Number.isFinite(price) && price > 0 ? price : null
}

export function resolveCardVariant(product: CardOffer, selectedId: number | null) {
  const selected = product.variants?.find(variant => variant.id === selectedId)
  return selected ?? (product.isVariantRequired ? product.variants?.[0] : undefined)
}

export function resolveCardPrice(product: CardOffer, selectedId: number | null) {
  const variant = resolveCardVariant(product, selectedId)
  const variantPrice = positivePrice(variant?.prix_vente ?? variant?.price)
  const discount = Number(product.sale?.discount)
  const percentage = Number.isFinite(discount) && discount > 0 && discount < 100 ? discount : 0

  if (variantPrice != null) {
    return {
      price: Math.round(variantPrice * (1 - percentage / 100) * 100) / 100,
      originalPrice: positivePrice(variant?.prix_original ?? variant?.originalPrice)
        ?? (percentage > 0 ? variantPrice : null),
    }
  }
  // A mandatory variant is the offer: never replace its missing price with the parent price.
  if (product.isVariantRequired) return { price: null, originalPrice: null }
  return { price: product.price, originalPrice: product.originalPrice ?? null }
}
