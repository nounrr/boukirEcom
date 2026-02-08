import { createApi } from "@reduxjs/toolkit/query/react"
import { baseQueryWithAuth } from "@/lib/base-query"
import { API_CONFIG } from "@/lib/api-config"

export interface ValidatePromoRequest {
  code: string
  subtotal: number
}

export interface ValidatePromoResponse {
  valid: boolean
  message?: string
  code_masked?: string
  discount_type?: "percentage" | "fixed"
  discount_value?: number
  discount_amount?: number
}

export const promoApiSlice = createApi({
  reducerPath: "promoApi",
  baseQuery: baseQueryWithAuth,
  tagTypes: ["Promo"],
  endpoints: (builder) => ({
    validatePromo: builder.mutation<ValidatePromoResponse, ValidatePromoRequest>({
      query: (data) => ({
        url: API_CONFIG.ENDPOINTS.PROMO_VALIDATE,
        method: "POST",
        body: data,
        // Avoid any CDN/browser caching edge-cases (especially when a code is activated after being inactive)
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
          Pragma: "no-cache",
          Expires: "0",
        },
        // fetch() RequestInit hint (supported by fetchBaseQuery) — keep as any to avoid TS lib mismatches
        cache: "no-store" as any,
      }),
    }),
  }),
})

export const { useValidatePromoMutation } = promoApiSlice
