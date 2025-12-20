import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithAuth } from '@/lib/base-query';
import type { Subscription, PointsHistory } from '@/types/subscription';

export const subscriptionApi = createApi({
  reducerPath: 'subscriptionApi',
  baseQuery: baseQueryWithAuth,
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
