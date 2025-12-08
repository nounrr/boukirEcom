          import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { Subscription, PointsHistory } from '@/types/subscription';

export const subscriptionApi = createApi({
  reducerPath: 'subscriptionApi',
  baseQuery: fetchBaseQuery({
    baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api',
    prepareHeaders: (headers) => {
      const token = localStorage.getItem('token');
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['Subscription'],
  endpoints: (builder) => ({
    getSubscription: builder.query<Subscription, void>({
      query: () => '/subscription',
      providesTags: ['Subscription'],
    }),
    getPointsHistory: builder.query<PointsHistory[], void>({
      query: () => '/subscription/points-history',
      providesTags: ['Subscription'],
    }),
    redeemPoints: builder.mutation<Subscription, { points: number; orderId: string }>({
      query: (data) => ({
        url: '/subscription/redeem',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Subscription'],
    }),
  }),
});

export const {
  useGetSubscriptionQuery,
  useGetPointsHistoryQuery,
  useRedeemPointsMutation,
} = subscriptionApi;
