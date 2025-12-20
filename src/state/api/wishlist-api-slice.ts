import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithAuth } from '@/lib/base-query';
import { API_CONFIG } from '@/lib/api-config';

export interface WishlistItem {
  id: number; // Wishlist item ID
  productId: number;
  variantId?: number;
  name: string;
  price: number;
  priceAfterPromo?: number;
  hasPromo: boolean;
  image?: string;
  category?: string;
  stock: number;
  inStock: boolean;
  isAvailable: boolean;
  createdAt: string;
}

export interface Wishlist {
  items: WishlistItem[];
  summary: {
    totalItems: number;
    availableItems: number;
    inStockItems: number;
    unavailableItems: number;
  };
}

export const wishlistApi = createApi({
  reducerPath: 'wishlistApi',
  baseQuery: baseQueryWithAuth,
  tagTypes: ['Wishlist', 'Products', 'Cart'],
  endpoints: (builder) => ({
    // GET wishlist from backend
    getWishlist: builder.query<Wishlist, void>({
      query: () => API_CONFIG.ENDPOINTS.WISHLIST,
      providesTags: ['Wishlist'],
      transformResponse: (response: any) => {
        const items: WishlistItem[] = response.items?.map((item: any) => {
          const price = parseFloat(item.pricing?.effective_price || item.pricing?.base_price || 0);
          const priceAfterPromo = parseFloat(item.pricing?.price_after_promo || price);
          
          return {
            id: item.id,
            productId: item.product_id,
            variantId: item.variant_id || undefined,
            name: item.product?.designation || item.product?.designation_en || 'Unknown Product',
            price: isNaN(price) ? 0 : price,
            priceAfterPromo: isNaN(priceAfterPromo) ? price : priceAfterPromo,
            hasPromo: item.pricing?.has_promo || false,
            image: item.product?.image_url || undefined,
            category: item.product?.base_unit || undefined,
            stock: item.stock?.available || 0,
            inStock: item.stock?.in_stock || false,
            isAvailable: item.product?.is_available || false,
            createdAt: item.created_at,
          };
        }) || [];

        return {
          items,
          summary: {
            totalItems: response.summary?.total_items || 0,
            availableItems: response.summary?.available_items || 0,
            inStockItems: response.summary?.in_stock_items || 0,
            unavailableItems: response.summary?.unavailable_items || 0,
          },
        };
      },
    }),

    // POST add item to wishlist
    addToWishlist: builder.mutation<{ message: string; wishlistItemId: number }, { productId: number; variantId?: number }>({
      query: (data) => ({
        url: `${API_CONFIG.ENDPOINTS.WISHLIST}/items`,
        method: 'POST',
        body: {
          product_id: data.productId,
          variant_id: data.variantId,
        },
      }),
      invalidatesTags: (result, error, arg) => [
        'Wishlist',
        { type: 'Products', id: 'LIST' },
        { type: 'Products', id: arg.productId },
      ],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          // Force refetch by resetting the cache time
          setTimeout(() => {
            dispatch(
              wishlistApi.util.invalidateTags(['Wishlist', { type: 'Products', id: 'LIST' }])
            );
          }, 100);
        } catch {}
      },
      transformResponse: (response: any) => ({
        message: response.message,
        wishlistItemId: response.wishlist_item_id,
      }),
    }),

    // DELETE remove item from wishlist by ID
    removeFromWishlist: builder.mutation<{ message: string }, { id: number }>({
      query: ({ id }) => ({
        url: `${API_CONFIG.ENDPOINTS.WISHLIST}/items/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Wishlist', 'Products'],
    }),

    // DELETE remove item by product ID
    removeFromWishlistByProduct: builder.mutation<{ message: string }, { productId: number; variantId?: number }>({
      query: ({ productId, variantId }) => ({
        url: `${API_CONFIG.ENDPOINTS.WISHLIST}/products/${productId}${variantId ? `?variant_id=${variantId}` : ''}`,
        method: 'DELETE',
      }),
      invalidatesTags: (result, error, arg) => [
        'Wishlist',
        { type: 'Products', id: 'LIST' },
        { type: 'Products', id: arg.productId },
      ],
      async onQueryStarted(arg, { dispatch, queryFulfilled }) {
        try {
          await queryFulfilled;
          // Force refetch by resetting the cache time
          setTimeout(() => {
            dispatch(
              wishlistApi.util.invalidateTags(['Wishlist', { type: 'Products', id: 'LIST' }])
            );
          }, 100);
        } catch {}
      },
    }),

    // GET check if product in wishlist
    checkWishlist: builder.query<{ inWishlist: boolean; wishlistItemId: number | null }, { productId: number; variantId?: number }>({
      query: ({ productId, variantId }) => 
        `${API_CONFIG.ENDPOINTS.WISHLIST}/check/${productId}${variantId ? `?variant_id=${variantId}` : ''}`,
      providesTags: (result, error, arg) => [{ type: 'Wishlist', id: `${arg.productId}-${arg.variantId || 'base'}` }],
      transformResponse: (response: any) => ({
        inWishlist: response.in_wishlist,
        wishlistItemId: response.wishlist_item_id,
      }),
    }),

    // DELETE clear wishlist
    clearWishlist: builder.mutation<{ message: string; itemsRemoved: number }, void>({
      query: () => ({
        url: API_CONFIG.ENDPOINTS.WISHLIST,
        method: 'DELETE',
      }),
      invalidatesTags: ['Wishlist'],
      transformResponse: (response: any) => ({
        message: response.message,
        itemsRemoved: response.items_removed,
      }),
    }),

    // POST move item to cart
    moveToCart: builder.mutation<{ message: string; cartItemId: number; action: string }, { id: number; quantity?: number; unitId?: number }>({
      query: ({ id, quantity, unitId }) => ({
        url: `${API_CONFIG.ENDPOINTS.WISHLIST}/items/${id}/move-to-cart`,
        method: 'POST',
        body: {
          quantity: quantity || 1,
          unit_id: unitId,
        },
      }),
      invalidatesTags: ['Wishlist', 'Cart'],
      transformResponse: (response: any) => ({
        message: response.message,
        cartItemId: response.cart_item_id,
        action: response.action,
      }),
    }),
  }),
});

export const {
  useGetWishlistQuery,
  useAddToWishlistMutation,
  useRemoveFromWishlistMutation,
  useRemoveFromWishlistByProductMutation,
  useCheckWishlistQuery,
  useClearWishlistMutation,
  useMoveToCartMutation,
} = wishlistApi;
