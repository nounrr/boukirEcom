import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryPublic } from '@/lib/base-query';
import { API_CONFIG } from '@/lib/api-config';
import type { Brand } from '@/types/brand';

export const brandsApi = createApi({
  reducerPath: 'brandsApi',
  baseQuery: baseQueryPublic,
  tagTypes: ['Brands'],
  endpoints: (builder) => ({
    getBrands: builder.query<Brand[], void>({
      query: () => API_CONFIG.ENDPOINTS.BRANDS,
      providesTags: ['Brands'],
    }),
    getBrand: builder.query<Brand, string>({
      query: (id) => `${API_CONFIG.ENDPOINTS.BRANDS}/${id}`,
      providesTags: (result, error, id) => [{ type: 'Brands', id }],
    }),
  }),
});

export const { useGetBrandsQuery, useGetBrandQuery } = brandsApi;
