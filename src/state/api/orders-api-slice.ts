import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithAuth, baseQueryPublic } from '@/lib/base-query';
import { API_CONFIG } from '@/lib/api-config';
import type {
  Order,
  OrdersResponse,
  CreateOrderData,
  CancelOrderData,
  OrderItem,
  OrderStatusHistoryEntry,
  ShippingAddress,
  PickupLocation,
  SoldeOrdersTimelineResponse,
  SoldeTimelineOrder,
  SoldeTimelineOrderItem,
  SoldeOrdersHistoryResponse,
  SoldeOrdersStatementResponse,
  SoldeOrdersLegacyResponse,
  SoldeStatementTimelineRow,
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
    productNameEn: item.product_name_en ?? null,
    productNameZh: item.product_name_zh ?? null,
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

const mapPickupLocationFromApi = (location: any): PickupLocation | null => {
  if (!location) return null;
  return {
    id: location.id,
    name: location.name,
    address: location.address ?? location.address_line1 ?? '',
    addressLine1: location.address_line1 ?? null,
    addressLine2: location.address_line2 ?? null,
    city: location.city,
    state: location.state ?? null,
    postalCode: location.postal_code ?? null,
    country: location.country ?? 'Morocco',
    phone: location.phone ?? null,
    openingHours: location.opening_hours ?? null,
    isActive: location.is_active ?? true,
  };
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
      deliveryMethod: 'delivery',
      pickupLocationId: null,
      pickupLocation: null,
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
  const pickupLocation = mapPickupLocationFromApi(order.pickup_location);

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
    remiseUsedAmount: order.remise_used_amount != null ? Number(order.remise_used_amount) : undefined,
    totalAmount: Number(order.total_amount ?? 0),
    isSolde: order.is_solde === 1 || order.is_solde === true,
    soldeAmount: order.solde_amount != null ? Number(order.solde_amount) : undefined,
    status: order.status,
    paymentStatus: order.payment_status,
    paymentMethod: order.payment_method,
    deliveryMethod: order.delivery_method ?? 'delivery',
    pickupLocationId: order.pickup_location_id ?? null,
    pickupLocation,
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
    getOrders: builder.query<OrdersResponse, {
      email?: string
      page?: number
      limit?: number
      period?: 'this_week' | 'this_month'
      startDate?: string
      endDate?: string
      status?: string
      paymentStatus?: string
      paymentMethod?: string
      deliveryMethod?: string
    } | void>({
      query: (args) => {
        const url = API_CONFIG.ENDPOINTS.ORDERS;
        const params: Record<string, any> = {};

        if (args) {
          if (args.email) params.email = args.email;
          if (args.page) params.page = args.page;
          if (args.limit) params.limit = args.limit;
          if (args.period) params.period = args.period;
          if (args.startDate) params.start_date = args.startDate;
          if (args.endDate) params.end_date = args.endDate;
          if (args.status) params.status = args.status;
          if (args.paymentStatus) params.payment_status = args.paymentStatus;
          if (args.paymentMethod) params.payment_method = args.paymentMethod;
          if (args.deliveryMethod) params.delivery_method = args.deliveryMethod;
        }

        return { url, params: Object.keys(params).length > 0 ? params : undefined };
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
          delivery_method: data.deliveryMethod ?? 'delivery',
          pickup_location_id: data.pickupLocationId,
          shipping_address_line1: data.shippingAddressLine1,
          shipping_address_line2: data.shippingAddressLine2,
          shipping_city: data.shippingCity,
          shipping_state: data.shippingState,
          shipping_postal_code: data.shippingPostalCode,
          shipping_country: data.shippingCountry,
          payment_method: data.paymentMethod ?? 'cash_on_delivery',
          customer_notes: data.customerNotes,
          promo_code: data.promoCode,
          use_remise_balance: data.useRemiseBalance,
          remise_to_use: data.remiseToUse,
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

    // Solde orders timeline/table for the authenticated contact (or a target contact_id for backoffice roles)
    getSoldeOrdersTimeline: builder.query<
      SoldeOrdersTimelineResponse,
      {
        includeItems?: boolean | 0 | 1 | '0' | '1' | 'false' | 'true'
        contactId?: number | string
      } | void
    >({
      query: (args) => {
        const url = `${API_CONFIG.ENDPOINTS.ORDERS}/solde`;
        const params: Record<string, any> = {};

        // Ensure we always request the legacy "orders" view.
        // Backend defaults to "statement" which has a different shape.
        params.view = 'orders';

        if (args) {
          if (args.contactId != null && args.contactId !== '') params.contact_id = args.contactId;

          if (args.includeItems != null) {
            const raw = args.includeItems;
            const isFalseLike = raw === false || raw === 0 || raw === '0' || raw === 'false';
            if (isFalseLike) params.include_items = 0;
          }
        }

        return { url, params: Object.keys(params).length > 0 ? params : undefined };
      },
      providesTags: ['Orders'],
      transformResponse: (response: any): SoldeOrdersTimelineResponse => {
        const contactRaw = response.contact ?? {};
        const summaryRaw = response.summary ?? {};
        const ordersRaw = response.orders ?? [];

        const mapItem = (item: any): SoldeTimelineOrderItem => ({
          productId: Number(item.product_id ?? 0),
          productName: item.product_name ?? '',
          unitPrice: Number(item.unit_price ?? 0),
          quantity: Number(item.quantity ?? 0),
          subtotal: Number(item.subtotal ?? 0),
          discountAmount: item.discount_amount != null ? Number(item.discount_amount) : null,
        });

        const mapOrder = (order: any): SoldeTimelineOrder => ({
          id: Number(order.id ?? 0),
          orderNumber: order.order_number ?? '',
          createdAt: order.created_at,
          status: order.status,
          paymentStatus: order.payment_status,
          paymentMethod: order.payment_method,
          totalAmount: Number(order.total_amount ?? 0),
          remiseUsedAmount: Number(order.remise_used_amount ?? 0),
          isSolde: order.is_solde === 1 || order.is_solde === true,
          soldeAmount: Number(order.solde_amount ?? 0),
          soldeCumule: Number(order.solde_cumule ?? 0),
          deliveryMethod: order.delivery_method ?? 'delivery',
          pickupLocationId: order.pickup_location_id ?? null,
          items: Array.isArray(order.items) ? order.items.map(mapItem) : undefined,
        });

        return {
          contact: {
            id: Number(contactRaw.id ?? 0),
            nomComplet: contactRaw.nom_complet ?? '',
            email: contactRaw.email ?? '',
            telephone: contactRaw.telephone ?? null,
            isSolde: Boolean(contactRaw.is_solde),
            plafond: Number(contactRaw.plafond ?? 0),
          },
          summary: {
            ordersCount: Number(summaryRaw.orders_count ?? 0),
            soldeTotal: Number(summaryRaw.solde_total ?? 0),
          },
          orders: Array.isArray(ordersRaw) ? ordersRaw.map(mapOrder) : [],
        };
      },
    }),

    // New unified endpoint for solde history: statement (default) or legacy orders view.
    getSoldeOrdersHistory: builder.query<
      SoldeOrdersHistoryResponse,
      {
        view?: 'statement' | 'orders'
        contactId?: number | string
        // statement params
        limit?: number
        offset?: number
        from?: string
        to?: string
        // orders params
        includeItems?: boolean | 0 | 1 | '0' | '1' | 'false' | 'true'
      } | void
    >({
      query: (args) => {
        const url = `${API_CONFIG.ENDPOINTS.ORDERS}/solde`;
        const params: Record<string, any> = {};

        if (args) {
          if (args.view) params.view = args.view;
          if (args.contactId != null && args.contactId !== '') params.contact_id = args.contactId;

          if (args.limit != null) params.limit = args.limit;
          if (args.offset != null) params.offset = args.offset;
          if (args.from) params.from = args.from;
          if (args.to) params.to = args.to;

          if (args.includeItems != null) {
            const raw = args.includeItems;
            const isFalseLike = raw === false || raw === 0 || raw === '0' || raw === 'false';
            if (isFalseLike) params.include_items = 0;
          }
        }

        return { url, params: Object.keys(params).length > 0 ? params : undefined };
      },
      providesTags: ['Orders'],
      transformResponse: (response: any): SoldeOrdersHistoryResponse => {
        const view = (response?.view ?? (Array.isArray(response?.timeline) ? 'statement' : 'orders')) as
          | 'statement'
          | 'orders';

        const contactRaw = response.contact ?? {};

        const contact = {
          id: Number(contactRaw.id ?? 0),
          nomComplet: contactRaw.nom_complet ?? '',
          email: contactRaw.email ?? '',
          telephone: contactRaw.telephone ?? null,
          isSolde: Boolean(contactRaw.is_solde),
          plafond: Number(contactRaw.plafond ?? 0),
        };

        if (view === 'statement') {
          const summaryRaw = response.summary ?? {};
          const timelineRaw = response.timeline ?? [];

          const mapRow = (row: any): SoldeStatementTimelineRow => ({
            source: row.source,
            docId: row.doc_id ?? null,
            ref: row.ref ?? null,
            date: row.date ?? null,
            statut: row.statut ?? null,
            debit: Number(row.debit ?? 0),
            credit: Number(row.credit ?? 0),
            delta: Number(row.delta ?? 0),
            soldeCumule: Number(row.solde_cumule ?? 0),
            linkedId: row.linked_id ?? null,
            modePaiement: row.mode_paiement ?? null,
          });

          const payload: SoldeOrdersStatementResponse = {
            view: 'statement',
            contact,
            summary: {
              initialSolde: Number(summaryRaw.initial_solde ?? 0),
              debitTotal: Number(summaryRaw.debit_total ?? 0),
              creditTotal: Number(summaryRaw.credit_total ?? 0),
              finalSolde: Number(summaryRaw.final_solde ?? 0),
              returned: Number(summaryRaw.returned ?? 0),
              limit: Number(summaryRaw.limit ?? 0),
              offset: Number(summaryRaw.offset ?? 0),
            },
            timeline: Array.isArray(timelineRaw) ? timelineRaw.map(mapRow) : [],
          };

          return payload;
        }

        // legacy orders view
        const summaryRaw = response.summary ?? {};
        const ordersRaw = response.orders ?? [];

        const mapItem = (item: any): SoldeTimelineOrderItem => ({
          productId: Number(item.product_id ?? 0),
          productName: item.product_name ?? '',
          unitPrice: Number(item.unit_price ?? 0),
          quantity: Number(item.quantity ?? 0),
          subtotal: Number(item.subtotal ?? 0),
          discountAmount: item.discount_amount != null ? Number(item.discount_amount) : null,
        });

        const mapOrder = (order: any): SoldeTimelineOrder => ({
          id: Number(order.id ?? 0),
          orderNumber: order.order_number ?? '',
          createdAt: order.created_at,
          status: order.status,
          paymentStatus: order.payment_status,
          paymentMethod: order.payment_method,
          totalAmount: Number(order.total_amount ?? 0),
          remiseUsedAmount: Number(order.remise_used_amount ?? 0),
          isSolde: order.is_solde === 1 || order.is_solde === true,
          soldeAmount: Number(order.solde_amount ?? 0),
          soldeCumule: Number(order.solde_cumule ?? 0),
          deliveryMethod: order.delivery_method ?? 'delivery',
          pickupLocationId: order.pickup_location_id ?? null,
          items: Array.isArray(order.items) ? order.items.map(mapItem) : undefined,
        });

        const legacy: SoldeOrdersLegacyResponse = {
          view: 'orders',
          contact,
          summary: {
            ordersCount: Number(summaryRaw.orders_count ?? 0),
            soldeTotal: Number(summaryRaw.solde_total ?? 0),
          },
          orders: Array.isArray(ordersRaw) ? ordersRaw.map(mapOrder) : [],
        };

        return legacy;
      },
    }),
  }),
});

export const {
  useGetOrdersQuery,
  useGetOrderQuery,
  useCreateOrderMutation,
  useCancelOrderMutation,
  useGetSoldeOrdersTimelineQuery,
  useGetSoldeOrdersHistoryQuery,
} = ordersApi;
