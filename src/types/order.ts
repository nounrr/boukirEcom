export type PaymentMethod = 'cash_on_delivery' | 'card' | 'bank_transfer' | 'mobile_payment' | 'solde' | 'pay_in_store'

export type DeliveryMethod = 'delivery' | 'pickup'

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'

export interface PickupLocation {
  id: number
  name: string
  address: string
  addressLine1?: string | null
  addressLine2?: string | null
  city: string
  state?: string | null
  postalCode?: string | null
  country?: string
  phone?: string | null
  openingHours?: string | null
  isActive?: boolean
}

export interface OrderItem {
  id: number
  productId: number
  variantId?: number | null
  unitId?: number | null
  productName: string
  productNameAr?: string | null
  variantName?: string | null
  variantType?: string | null
  unitName?: string | null
  unitPrice: number
  quantity: number
  subtotal: number
  discountPercentage?: number | null
  discountAmount?: number | null
  imageUrl?: string | null
}

export interface ShippingAddress {
  line1: string
  line2?: string | null
  city: string
  state?: string | null
  postalCode?: string | null
  country: string
}

export interface OrderStatusHistoryEntry {
  oldStatus: OrderStatus | null
  newStatus: OrderStatus
  changedByType: 'customer' | 'admin'
  notes?: string | null
  timestamp: string
}

// Full order detail as returned by GET /api/ecommerce/orders/:id
export interface Order {
  id: number
  orderNumber: string
  customerName: string
  customerEmail: string
  customerPhone?: string | null
  shippingAddress: ShippingAddress
  subtotal: number
  taxAmount: number
  shippingCost: number
  discountAmount: number
  remiseUsedAmount?: number
  totalAmount: number
  isSolde?: boolean
  soldeAmount?: number
  status: OrderStatus
  paymentStatus: PaymentStatus
  paymentMethod: PaymentMethod
  deliveryMethod?: DeliveryMethod
  pickupLocationId?: number | null
  pickupLocation?: PickupLocation | null
  customerNotes?: string | null
  adminNotes?: string | null
  itemsCount: number
  createdAt: string
  confirmedAt?: string | null
  shippedAt?: string | null
  deliveredAt?: string | null
  cancelledAt?: string | null
  items?: OrderItem[]
  statusHistory?: OrderStatusHistoryEntry[]
}

// List orders response from GET /api/ecommerce/orders
export interface OrdersResponse {
  orders: Order[]
  total: number
}

export interface CreateOrderItemInput {
  productId: number
  variantId?: number
  unitId?: number
  quantity: number
}

// Payload used when creating an order via POST /api/ecommerce/orders
export interface CreateOrderData {
  customerName: string
  customerEmail: string
  customerPhone?: string
  deliveryMethod?: DeliveryMethod
  pickupLocationId?: number
  shippingAddressLine1?: string
  shippingCity?: string
  shippingAddressLine2?: string
  shippingState?: string
  shippingPostalCode?: string
  shippingCountry?: string
  paymentMethod?: PaymentMethod
  customerNotes?: string
  promoCode?: string
  useRemiseBalance?: boolean
  remiseToUse?: number
  useCart?: boolean
  items?: CreateOrderItemInput[]
}

// Payload used when cancelling an order
export interface CancelOrderData {
  id: number | string
  email?: string
  reason?: string
}
