import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithAuth } from '@/lib/base-query';
import { API_CONFIG } from '@/lib/api-config';
import type {
  Order,
  OrdersResponse,
  CreateOrderData,
  CancelOrderData,
  OrderItem,
  OrderStatusHistoryEntry,
  ShippingAddress,
} from '@/types/order';

// Helpers to map backend snake_case structures to our frontend camelCase types

const mapOrderItemsFromApi = (items: any[] | undefined): OrderItem[] | undefined => {
  if (!items) return undefined;

  return items.map((item) => ({
    id: item.id,
    productId: item.product_id,
    variantId: item.variant_id ?? null,
    unitId: item.unit_id ?? null,
    productName: item.product_name,
    productNameAr: item.product_name_ar ?? null,
    variantName: item.variant_name ?? null,
    variantType: item.variant_type ?? null,
    unitName: item.unit_name ?? null,
    unitPrice: Number(item.unit_price ?? 0),
    quantity: Number(item.quantity ?? 0),
    subtotal: Number(item.subtotal ?? 0),
    discountPercentage: item.discount_percentage ?? null,
    discountAmount: item.discount_amount ?? null,
    imageUrl: item.image_url ?? null,
  }));
};

const mapShippingAddressFromApi = (order: any): ShippingAddress => {
  const addressObj = order.shipping_address || {};

  return {
    line1: order.shipping_address_line1 ?? addressObj.line1 ?? '',
    line2: order.shipping_address_line2 ?? addressObj.line2 ?? null,
    city: order.shipping_city ?? addressObj.city ?? '',
    state: order.shipping_state ?? addressObj.state ?? null,
    postalCode: order.shipping_postal_code ?? addressObj.postal_code ?? null,
    country: order.shipping_country ?? addressObj.country ?? 'Morocco',
  };
};

const mapStatusHistoryFromApi = (history: any[] | undefined): OrderStatusHistoryEntry[] | undefined => {
  if (!history) return undefined;

  return history.map((entry) => ({
    oldStatus: entry.old_status ?? null,
    newStatus: entry.new_status,
    changedByType: entry.changed_by_type,
    notes: entry.notes ?? null,
    timestamp: entry.timestamp ?? entry.created_at,
  }));
};

const mapOrderFromApi = (order: any): Order => {
  if (!order) {
    // Fallback empty structure – should not normally happen
    return {
      id: 0,
      orderNumber: '',
      customerName: '',
      customerEmail: '',
      customerPhone: null,
      shippingAddress: {
        line1: '',
        city: '',
        country: 'Morocco',
      } as ShippingAddress,
      subtotal: 0,
      taxAmount: 0,
      shippingCost: 0,
      discountAmount: 0,
      totalAmount: 0,
      status: 'pending',
      paymentStatus: 'pending',
      paymentMethod: 'cash_on_delivery',
      customerNotes: null,
      adminNotes: null,
      itemsCount: 0,
      createdAt: new Date().toISOString(),
      confirmedAt: null,
      shippedAt: null,
      deliveredAt: null,
      cancelledAt: null,
      items: [],
      statusHistory: [],
    };
  }

  const items = mapOrderItemsFromApi(order.items);
  const statusHistory = mapStatusHistoryFromApi(order.status_history);
  const shippingAddress = mapShippingAddressFromApi(order);

  return {
    id: order.id,
    orderNumber: order.order_number,
    customerName: order.customer_name,
    customerEmail: order.customer_email,
    customerPhone: order.customer_phone ?? null,
    shippingAddress,
    subtotal: Number(order.subtotal ?? 0),
    taxAmount: Number(order.tax_amount ?? 0),
    shippingCost: Number(order.shipping_cost ?? 0),
    discountAmount: Number(order.discount_amount ?? 0),
    totalAmount: Number(order.total_amount ?? 0),
    status: order.status,
    paymentStatus: order.payment_status,
    paymentMethod: order.payment_method,
    customerNotes: order.customer_notes ?? null,
    adminNotes: order.admin_notes ?? null,
    itemsCount: order.items_count ?? (items ? items.length : 0),
    createdAt: order.created_at,
    confirmedAt: order.confirmed_at ?? null,
    shippedAt: order.shipped_at ?? null,
    deliveredAt: order.delivered_at ?? null,
    cancelledAt: order.cancelled_at ?? null,
    items,
    statusHistory,
  };
};

export const ordersApi = createApi({
  reducerPath: 'ordersApi',
  baseQuery: baseQueryWithAuth,
  tagTypes: ['Orders'],
  endpoints: (builder) => ({
    // List orders for authenticated user or guest (by email)
    getOrders: builder.query<OrdersResponse, { email?: string } | void>({
      query: (args) => {
        const url = API_CONFIG.ENDPOINTS.ORDERS;
        const email = (args as { email?: string } | undefined)?.email;

        if (email) {
          return { url, params: { email } };
        }

        return { url };
      },
      providesTags: ['Orders'],
      transformResponse: (response: any): OrdersResponse => {
        const ordersRaw = response.orders || [];
        return {
          orders: ordersRaw.map(mapOrderFromApi),
          total: response.total ?? ordersRaw.length,
        };
      },
    }),

    // Get a single order (authenticated by user or guest by email)
    getOrder: builder.query<Order, { id: number | string; email?: string }>({
      query: ({ id, email }) => {
        const url = `${API_CONFIG.ENDPOINTS.ORDERS}/${id}`;
        return email ? { url, params: { email } } : { url };
      },
      providesTags: (result, error, arg) => [{ type: 'Orders', id: arg.id }],
      transformResponse: (response: any): Order => {
        // Backend returns { order: {...} }
        return mapOrderFromApi(response.order || response);
      },
    }),

    // Create an order (checkout)
    createOrder: builder.mutation<Order, CreateOrderData>({
      query: (data) => ({
        url: API_CONFIG.ENDPOINTS.ORDERS,
        method: 'POST',
        body: {
          customer_name: data.customerName,
          customer_email: data.customerEmail,
          customer_phone: data.customerPhone,
          shipping_address_line1: data.shippingAddressLine1,
          shipping_address_line2: data.shippingAddressLine2,
          shipping_city: data.shippingCity,
          shipping_state: data.shippingState,
          shipping_postal_code: data.shippingPostalCode,
          shipping_country: data.shippingCountry,
          payment_method: data.paymentMethod ?? 'cash_on_delivery',
          customer_notes: data.customerNotes,
          promo_code: data.promoCode,
          use_cart: data.useCart !== undefined ? data.useCart : true,
          items: data.items?.map((item) => ({
            product_id: item.productId,
            variant_id: item.variantId,
            unit_id: item.unitId,
            quantity: item.quantity,
          })),
        },
      }),
      invalidatesTags: ['Orders'],
      transformResponse: (response: any): Order => {
        // Backend returns { message, order }
        return mapOrderFromApi(response.order || response);
      },
    }),

    // Cancel an order (customer)
    cancelOrder: builder.mutation<{ orderId: number; orderNumber: string }, CancelOrderData>({
      query: ({ id, email, reason }) => ({
        url: `${API_CONFIG.ENDPOINTS.ORDERS}/${id}/cancel`,
        method: 'POST',
        body: email || reason ? { email, reason } : undefined,
      }),
      invalidatesTags: ['Orders'],
      transformResponse: (response: any) => ({
        orderId: response.order_id,
        orderNumber: response.order_number,
      }),
    }),
  }),
});

export const {
  useGetOrdersQuery,
  useGetOrderQuery,
  useCreateOrderMutation,
  useCancelOrderMutation,
} = ordersApi;
