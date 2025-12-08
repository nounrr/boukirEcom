export interface Address {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  postalCode?: string;
  isDefault: boolean;
}

export interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  productNameAr?: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Order {
  id: string;
  orderNumber: string;
  userId: string;
  items: OrderItem[];
  shippingAddress: Address;
  billingAddress: Address;
  subtotal: number;
  tax: number;
  shipping: number;
  discount: number;
  total: number;
  paymentMethod: 'cash_on_delivery' | 'credit_card' | 'bank_transfer';
  paymentStatus: 'pending' | 'paid' | 'failed' | 'refunded';
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  notes?: string;
  pointsEarned?: number;
  pointsRedeemed?: number;
  createdAt: string;
  updatedAt: string;
}

export interface OrdersResponse {
  orders: Order[];
  total: number;
  page: number;
  pageSize: number;
}

export interface CreateOrderData {
  items: Array<{ productId: string; quantity: number }>;
  shippingAddressId: string;
  billingAddressId: string;
  paymentMethod: 'cash_on_delivery' | 'credit_card' | 'bank_transfer';
  notes?: string;
  pointsToRedeem?: number;
}
