import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithAuth } from '@/lib/base-query';
import { API_CONFIG } from '@/lib/api-config';

export interface CartItem {
  id?: number; // Cart item ID (for updates/deletes)
  productId: number;
  variantId?: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  category?: string;
  stock?: number;
}

export interface Cart {
  items: CartItem[];
  total: number;
}

export const cartApi = createApi({
  reducerPath: 'cartApi',
  baseQuery: baseQueryWithAuth,
  tagTypes: ['Cart'],
  endpoints: (builder) => ({
    // GET cart from backend
    getCart: builder.query<Cart, void>({
      query: () => API_CONFIG.ENDPOINTS.CART,
      providesTags: ['Cart'],
      transformResponse: (response: any) => {
        console.log('🔍 Backend cart response:', response);

        // Transform backend response to our format
        const items: CartItem[] = response.items?.map((item: any) => {
          // Extract price from nested pricing object
          const price = parseFloat(
            item.pricing?.price_after_promo ||
            item.pricing?.effective_price ||
            item.pricing?.base_price ||
            0
          );

          const quantity = parseInt(item.quantity || 1, 10);

          const transformedItem = {
            id: item.id, // Cart item ID
            productId: item.product_id,
            variantId: item.variant_id || undefined,
            name: item.product?.designation || item.product?.designation_en || 'Unknown Product',
            price: isNaN(price) ? 0 : price,
            quantity: isNaN(quantity) ? 1 : quantity,
            image: item.product?.image_url || undefined,
            category: item.product?.base_unit || undefined,
            stock: item.stock?.available || 0,
          };

          console.log('📦 Transformed item:', transformedItem);
          return transformedItem;
        }) || [];

        const total = response.summary?.subtotal || items.reduce((sum, item) => sum + item.price * item.quantity, 0);

        console.log('✅ Final cart:', { itemCount: items.length, total });
        return { items, total };
      },
    }),

    // POST add item to cart
    addToCart: builder.mutation<Cart, { productId: number; variantId?: number; quantity: number }>({
      query: (data) => ({
        url: `${API_CONFIG.ENDPOINTS.CART}/items`,
        method: 'POST',
        body: {
          product_id: data.productId,
          variant_id: data.variantId,
          quantity: data.quantity,
        },
      }),
      invalidatesTags: ['Cart'],
    }),

    // PUT update cart item quantity
    updateCartItem: builder.mutation<Cart, { id: number; quantity: number }>({
      query: ({ id, quantity }) => ({
        url: `${API_CONFIG.ENDPOINTS.CART}/items/${id}`,
        method: 'PUT',
        body: { quantity },
      }),
      invalidatesTags: ['Cart'],
    }),

    // DELETE remove item from cart
    removeFromCart: builder.mutation<Cart, { id: number }>({
      query: ({ id }) => ({
        url: `${API_CONFIG.ENDPOINTS.CART}/items/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Cart'],
    }),

    // DELETE clear entire cart
    clearCart: builder.mutation<void, void>({
      query: () => ({
        url: API_CONFIG.ENDPOINTS.CART,
        method: 'DELETE',
      }),
      invalidatesTags: ['Cart'],
    }),
  }),
});

export const {
  useGetCartQuery,
  useAddToCartMutation,
  useUpdateCartItemMutation,
  useRemoveFromCartMutation,
  useClearCartMutation,
} = cartApi;
