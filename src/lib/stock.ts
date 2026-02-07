export type StockLike = {
  stock?: unknown
  quantite_disponible?: unknown
  in_stock?: unknown
  inStock?: unknown
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== 'object') return null
  return value as Record<string, unknown>
}

function isExplicitFalse(value: unknown) {
  return value === false || value === 0 || value === '0' || value === 'false'
}

function toNumberOrNull(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) return value
  if (typeof value === 'string') {
    const n = Number(value)
    return Number.isFinite(n) ? n : null
  }
  return null
}

export function isOutOfStockLike(value: unknown): boolean {
  const obj = asRecord(value)
  if (!obj) return false

  const stockFlag = obj.in_stock ?? obj.inStock
  if (isExplicitFalse(stockFlag)) return true

  const qty = toNumberOrNull(obj.quantite_disponible)
  if (qty != null && qty <= 0) return true

  const stock = toNumberOrNull(obj.stock)
  if (stock != null && stock <= 0) return true

  return false
}
