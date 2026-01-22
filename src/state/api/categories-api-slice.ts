import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryPublic } from '@/lib/base-query';
import { API_CONFIG } from '@/lib/api-config';
import type { Category } from '@/types/category';

export const categoriesApi = createApi({
  reducerPath: 'categoriesApi',
  baseQuery: baseQueryPublic,
  tagTypes: ['Categories'],
  endpoints: (builder) => ({
    getCategories: builder.query<Category[], void>({
      query: () => API_CONFIG.ENDPOINTS.CATEGORIES,
      providesTags: ['Categories'],
    }),
    getCategory: builder.query<Category, string>({
      query: (id) => `${API_CONFIG.ENDPOINTS.CATEGORIES}/${id}`,
      providesTags: (result, error, id) => [{ type: 'Categories', id }],
    }),
  }),
});

export const {
  useGetCategoriesQuery,
  useGetCategoryQuery,
} = categoriesApi;
