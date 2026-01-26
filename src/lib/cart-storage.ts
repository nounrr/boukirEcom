const CART_STORAGE_KEY = 'boukir_guest_cart'

interface StoredCartItem {
  productId: number
  variantId?: number
  name: string
  price: number
  quantity: number
  image?: string
  category?: string
  stock?: number
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
