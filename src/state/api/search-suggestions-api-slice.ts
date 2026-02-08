import { createApi } from '@reduxjs/toolkit/query/react'

import { baseQueryPublic } from '@/lib/base-query'
import { API_CONFIG } from '@/lib/api-config'
import type { SearchSuggestionsRequest, SearchSuggestionsResponse } from '@/types/api/search-suggestions'

export const searchSuggestionsApi = createApi({
  reducerPath: 'searchSuggestionsApi',
  baseQuery: baseQueryPublic,
  keepUnusedDataFor: 60,
  endpoints: (builder) => ({
    getSearchSuggestions: builder.query<SearchSuggestionsResponse, SearchSuggestionsRequest>({
      query: ({ q, limit_products = 10, limit_categories = 6, limit_brands = 6, in_stock_only = true }) => ({
        url: API_CONFIG.ENDPOINTS.SEARCH_SUGGESTIONS,
        params: {
          q,
          limit_products,
          limit_categories,
          limit_brands,
          in_stock_only,
        },
      }),
    }),
  }),
})

export const { useGetSearchSuggestionsQuery } = searchSuggestionsApi
