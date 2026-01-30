const CART_STORAGE_KEY = 'boukir_guest_cart'

interface StoredCartItem {
  productId: number
  variantId?: number
  unitId?: number
  unitName?: string
  variantName?: string
  name: string
  price: number
  quantity: number
  image?: string
  category?: string
  stock?: number
}

export function getCartItemKey(item: Pick<StoredCartItem, 'productId' | 'variantId' | 'unitId'>): string {
  const variantKey = item.variantId ?? 'no-variant'
  const unitKey = item.unitId ?? 'no-unit'
  return `${item.productId}:${variantKey}:${unitKey}`
}

export function formatCartItemName(
  item: Pick<StoredCartItem, 'name' | 'variantName' | 'unitName' | 'variantId' | 'unitId'>
): string {
  const baseName = item.name || ''
  const suffixParts: string[] = []

  const fallbackVariantLabel = !item.variantName && item.variantId ? `Variante #${item.variantId}` : undefined
  const variantLabel = item.variantName || fallbackVariantLabel
  if (variantLabel && !baseName.includes(variantLabel)) {
    suffixParts.push(variantLabel)
  }

  const fallbackUnitLabel = !item.unitName && item.unitId ? `Unité #${item.unitId}` : undefined
  const unitLabel = item.unitName || fallbackUnitLabel
  if (unitLabel && !baseName.includes(unitLabel)) {
    suffixParts.push(unitLabel)
  }

  if (suffixParts.length === 0) return baseName

  return `${baseName} • ${suffixParts.join(' · ')}`
}

function isBrowser() {
  return typeof window !== 'undefined'
}

function safeParse(value: string | null): StoredCartItem[] {
  if (!value) return []
  try {
    const parsed = JSON.parse(value)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

export const cartStorage = {
  getCart(): StoredCartItem[] {
    if (!isBrowser()) return []
    const raw = window.localStorage.getItem(CART_STORAGE_KEY)
    return safeParse(raw)
  },

  saveCart(items: StoredCartItem[]): void {
    if (!isBrowser()) return
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items))
      window.dispatchEvent(new CustomEvent('cart:updated'))
    } catch {
      // ignore quota / access errors
    }
  },

  clearCart(): void {
    if (!isBrowser()) return
    try {
      window.localStorage.removeItem(CART_STORAGE_KEY)
      window.dispatchEvent(new CustomEvent('cart:updated'))
    } catch {
      // ignore
    }
  },
}

export type { StoredCartItem }
