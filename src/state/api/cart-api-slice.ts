import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithAuth } from '@/lib/base-query';
import { API_CONFIG } from '@/lib/api-config';

export interface CartItem {
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
        // Transform backend response to our format
        const items: CartItem[] = response.items?.map((item: any) => ({
          productId: item.product_id,
          variantId: item.variant_id,
          name: item.product_name || item.name,
          price: parseFloat(item.price),
          quantity: item.quantity,
          image: item.image,
          category: item.category,
          stock: item.stock,
        })) || [];

        const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

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

    // PATCH update cart item quantity
    updateCartItem: builder.mutation<Cart, { productId: number; variantId?: number; quantity: number }>({
      query: ({ productId, variantId, quantity }) => ({
        url: `${API_CONFIG.ENDPOINTS.CART}/items/${productId}${variantId ? `/${variantId}` : ''}`,
        method: 'PATCH',
        body: { quantity },
      }),
      invalidatesTags: ['Cart'],
    }),

    // DELETE remove item from cart
    removeFromCart: builder.mutation<Cart, { productId: number; variantId?: number }>({
      query: ({ productId, variantId }) => ({
        url: `${API_CONFIG.ENDPOINTS.CART}/items/${productId}${variantId ? `/${variantId}` : ''}`,
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
