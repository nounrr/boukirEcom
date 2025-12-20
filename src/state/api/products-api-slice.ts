import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryPublic } from '@/lib/base-query';
import { API_CONFIG } from '@/lib/api-config';
import type {
  ProductFiltersRequest,
  ProductsListResponse,
  ProductDetail,
  ProductListItem,
} from '@/types/api/products';

export const productsApi = createApi({
  reducerPath: 'productsApi',
  baseQuery: baseQueryPublic,
  tagTypes: ['Products'],
  endpoints: (builder) => ({
    // GET All Products with comprehensive filters and pagination
    getProducts: builder.query<ProductsListResponse, ProductFiltersRequest | void>({
      query: (filters) => {
        const params: Record<string, any> = {};

        // Handle void case
        if (!filters) {
          return { url: API_CONFIG.ENDPOINTS.PRODUCTS };
        }

        // Pagination
        if (filters.page) params.page = filters.page;
        if (filters.per_page) params.per_page = filters.per_page;
        if (filters.limit) params.limit = filters.limit;

        // Filters
        if (filters.category_id) {
          params.category_id = Array.isArray(filters.category_id)
            ? filters.category_id.join(',')
            : filters.category_id;
        }
        if (filters.brand_id) {
          params.brand_id = Array.isArray(filters.brand_id)
            ? filters.brand_id.join(',')
            : filters.brand_id;
        }
        if (filters.color) {
          params.color = Array.isArray(filters.color)
            ? filters.color.join(',')
            : filters.color;
        }
        if (filters.unit) {
          params.unit = Array.isArray(filters.unit)
            ? filters.unit.join(',')
            : filters.unit;
        }
        if (filters.search) params.search = filters.search;
        if (filters.min_price !== undefined) params.min_price = filters.min_price;
        if (filters.max_price !== undefined) params.max_price = filters.max_price;
        if (filters.in_stock_only !== undefined) params.in_stock_only = filters.in_stock_only;
        if (filters.sort) params.sort = filters.sort;

        return {
          url: API_CONFIG.ENDPOINTS.PRODUCTS,
          params,
        };
      },
      keepUnusedDataFor: 0,
      providesTags: (result) =>
        result
          ? [
            ...result.products.map(({ id }) => ({ type: 'Products' as const, id })),
            { type: 'Products', id: 'LIST' },
          ]
          : [{ type: 'Products', id: 'LIST' }],
    }),

    // GET Single Product with full details
    getProduct: builder.query<ProductDetail, string | number>({
      query: (id) => `${API_CONFIG.ENDPOINTS.PRODUCTS}/${id}`,
      providesTags: (result, error, id) => [{ type: 'Products', id }],
    }),

    // GET Featured Promo Products
    getFeaturedPromo: builder.query<ProductListItem[], number | void>({
      query: (limit = 12) => ({
        url: API_CONFIG.ENDPOINTS.FEATURED_PROMO,
        params: { limit },
      }),
      providesTags: [{ type: 'Products', id: 'FEATURED_PROMO' }],
    }),

    // GET New Arrivals
    getNewArrivals: builder.query<ProductListItem[], number | void>({
      query: (limit = 12) => ({
        url: API_CONFIG.ENDPOINTS.NEW_ARRIVALS,
        params: { limit },
      }),
      providesTags: [{ type: 'Products', id: 'NEW_ARRIVALS' }],
    }),
  }),
});

export const {
  useGetProductsQuery,
  useGetProductQuery,
  useGetFeaturedPromoQuery,
  useGetNewArrivalsQuery,
} = productsApi;
