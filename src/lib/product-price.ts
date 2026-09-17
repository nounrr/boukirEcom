import type { ProductDetail, ProductUnit } from '@/types/api/products'

type ProductVariant = ProductDetail['variants'][number]

export type ProductOfferPrice = {
  listPrice: number | null
  price: number | null
  discountPercentage: number
  onPromotion: boolean
}

function positiveMoney(value: unknown): number | null {
  if (value === null || value === undefined || value === '') return null
  const parsed = Number(value)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : null
}

function roundMoney(value: number): number {
  return Number(value.toFixed(2))
}

/**
 * Resolves the same public offer for the page, cart seed and structured data.
 * Unit prices returned by the public API already include their conversion.
 * A selected variant still needs the selected unit conversion, as at checkout.
 */
export function resolveProductOfferPrice(
  product: Pick<ProductDetail, 'prix_vente' | 'prix_promo' | 'pourcentage_promo' | 'has_promo'>,
  selection: { variant?: ProductVariant | null; unit?: ProductUnit | null } = {},
): ProductOfferPrice {
  const { variant = null, unit = null } = selection
  const productPrice = positiveMoney(product.prix_vente)
  const variantPrice = positiveMoney(variant?.prix_vente)
  const unitPrice = positiveMoney(unit?.prix_vente)
  const factor = positiveMoney(unit?.conversion_factor) ?? 1

  const listPrice = variantPrice != null
    ? roundMoney(variantPrice * factor)
    : unitPrice ?? productPrice

  const percentage = Number(product.pourcentage_promo)
  const discountPercentage = product.has_promo && Number.isFinite(percentage) && percentage > 0 && percentage < 100
    ? percentage
    : 0

  if (listPrice == null) {
    return { listPrice: null, price: null, discountPercentage, onPromotion: false }
  }

  if (discountPercentage === 0) {
    return { listPrice, price: listPrice, discountPercentage: 0, onPromotion: false }
  }

  // Preserve the API's rounded base promo price when this is the base offer.
  const exactBasePromo = !variant && (!unit || factor === 1) ? positiveMoney(product.prix_promo) : null
  const price = exactBasePromo ?? roundMoney(listPrice * (1 - discountPercentage / 100))
  return { listPrice, price, discountPercentage, onPromotion: price < listPrice }
}

