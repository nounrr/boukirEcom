import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryPublic } from '@/lib/base-query';
import type { User } from '@/state/slices/user-slice';
import type { LoginCredentials, RegisterData, AuthResponse } from '@/types/auth';

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: baseQueryPublic,
  tagTypes: ['Auth'],
  endpoints: (builder) => ({
    login: builder.mutation<AuthResponse, LoginCredentials>({
      query: (credentials) => ({
        url: '/api/users/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    register: builder.mutation<AuthResponse, RegisterData>({
      query: (data) => ({
        url: '/api/users/auth/register',
        method: 'POST',
        body: data,
      }),
    }),
    logout: builder.mutation<void, void>({
      query: () => ({
        url: '/api/users/auth/logout',
        method: 'POST',
      }),
    }),
    getCurrentUser: builder.query<User, void>({
      query: () => '/api/users/auth/me',
      transformResponse: (response: unknown): User => {
        // Backend commonly returns { user: {...}, ... }.
        // Keep backward compatibility if it ever returns the user directly.
        const maybeEnvelope = response as any
        return (maybeEnvelope?.user ?? maybeEnvelope) as User
      },
      providesTags: ['Auth'],
    }),
    updateProfile: builder.mutation<User, Partial<User>>({
      query: (data) => ({
        url: '/api/users/auth/me',
        method: 'PUT',
        body: data,
      }),
      transformResponse: (response: { message: string; user: User }) => response.user,
      invalidatesTags: ['Auth'],
    }),

    requestArtisan: builder.mutation<
      { message: string; status?: string; user?: Partial<User> },
      void
    >({
      query: () => ({
        url: '/api/users/auth/request-artisan',
        method: 'POST',
      }),
      invalidatesTags: ['Auth'],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useLogoutMutation,
  useGetCurrentUserQuery,
  useUpdateProfileMutation,
  useRequestArtisanMutation,
} = authApi;
