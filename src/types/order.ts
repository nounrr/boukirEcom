export type PaymentMethod = 'cash_on_delivery' | 'card' | 'bank_transfer' | 'mobile_payment' | 'solde' | 'pay_in_store'

export type DeliveryMethod = 'delivery' | 'pickup'

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled'

export type PaymentStatus = 'pending' | 'paid' | 'failed' | 'refunded'

export type SoldeStatementSource =
  | 'SOLDE_INITIAL'
  | 'BON_ECOMMERCE'
  | 'AVOIR_ECOMMERCE'
  | 'BON_SORTIE'
  | 'AVOIR_CLIENT'
  | 'PAYMENT'

export interface SoldeTimelineContact {
  id: number
  nomComplet: string
  email: string
  telephone?: string | null
  isSolde: boolean
  plafond: number
}

export interface SoldeOrdersTimelineSummary {
  ordersCount: number
  soldeTotal: number
}

export interface SoldeTimelineOrderItem {
  productId: number
  productName: string
  unitPrice: number
  quantity: number
  subtotal: number
  discountAmount?: number | null
}

export interface SoldeTimelineOrder {
  id: number
  orderNumber: string
  createdAt: string
  status: OrderStatus
  paymentStatus: PaymentStatus
  paymentMethod: PaymentMethod
  totalAmount: number
  remiseUsedAmount: number
  isSolde: boolean
  soldeAmount: number
  soldeCumule: number
  deliveryMethod: DeliveryMethod
  pickupLocationId: number | null
  items?: SoldeTimelineOrderItem[]
}

export interface SoldeOrdersTimelineResponse {
  contact: SoldeTimelineContact
  summary: SoldeOrdersTimelineSummary
  orders: SoldeTimelineOrder[]
}

export interface SoldeStatementSummary {
  initialSolde: number
  debitTotal: number
  creditTotal: number
  finalSolde: number
  returned: number
  limit: number
  offset: number
}

export interface SoldeStatementTimelineRow {
  source: SoldeStatementSource
  docId: number | null
  ref: string | null
  date: string | null
  statut: string | null
  debit: number
  credit: number
  delta: number
  soldeCumule: number
  linkedId: number | null
  modePaiement: string | null
}

export interface SoldeOrdersStatementResponse {
  view: 'statement'
  contact: SoldeTimelineContact
  summary: SoldeStatementSummary
  timeline: SoldeStatementTimelineRow[]
}

export interface SoldeOrdersLegacyResponse {
  view: 'orders'
  contact: SoldeTimelineContact
  summary: SoldeOrdersTimelineSummary
  orders: SoldeTimelineOrder[]
}

export type SoldeOrdersHistoryResponse = SoldeOrdersStatementResponse | SoldeOrdersLegacyResponse

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
