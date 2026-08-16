import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryPublic } from '@/lib/base-query';
import type { User } from '@/state/slices/user-slice';
import type { LoginCredentials, RegisterData, AuthResponse } from '@/types/auth';
import type {
  MaalemProfile,
  MaalemProfileCategory,
  MaalemProfessionalData,
  MaalemNotification,
} from '@/types/maalem-profile';
import type { MaalemAccessDecision } from '@/types/maalem-access';

export const authApi = createApi({
  reducerPath: 'authApi',
  baseQuery: baseQueryPublic,
  tagTypes: ['Auth', 'MaalemProfile', 'MaalemCategories', 'MaalemAccess', 'MaalemNotifications'],
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
    activateAccount: builder.mutation<
      { message: string },
      { token: string; password: string; confirm_password: string }
    >({
      query: (body) => ({
        url: '/api/users/auth/activate',
        method: 'POST',
        body,
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
    getMaalemProfile: builder.query<MaalemProfile | null, void>({
      query: () => '/api/maalem-profiles/me',
      transformResponse: (response: { profile: MaalemProfile | null }) => response.profile,
      providesTags: ['MaalemProfile'],
    }),
    getMaalemNotifications: builder.query<MaalemNotification[], void>({
      query: () => '/api/maalem-profiles/me/notifications',
      transformResponse: (response: { notifications: MaalemNotification[] }) => response.notifications || [],
      providesTags: ['MaalemNotifications'],
    }),
    markMaalemNotificationRead: builder.mutation<void, number>({
      query: (id) => ({ url: `/api/maalem-profiles/me/notifications/${id}/read`, method: 'POST' }),
      invalidatesTags: ['MaalemNotifications'],
    }),
    getMaalemAccess: builder.query<MaalemAccessDecision, void>({
      query: () => '/api/maalem-access/me',
      providesTags: ['MaalemAccess'],
      keepUnusedDataFor: 0,
    }),
    joinMaalemProgram: builder.mutation<
      { profile: MaalemProfile; created: boolean },
      void
    >({
      query: () => ({
        url: '/api/maalem-profiles/me/join',
        method: 'POST',
      }),
      invalidatesTags: ['MaalemProfile', 'MaalemAccess', 'Auth'],
    }),
    getActiveMaalemCategories: builder.query<MaalemProfileCategory[], void>({
      query: () => '/api/maalem-categories/active',
      transformResponse: (
        response: MaalemProfileCategory[] | { categories: MaalemProfileCategory[] }
      ) => (Array.isArray(response) ? response : response.categories).map((category) => ({
        ...category,
        is_active: true,
      })),
      providesTags: ['MaalemCategories'],
    }),
    saveMaalemDraft: builder.mutation<
      MaalemProfile,
      { category_id: number | null; professional_data?: MaalemProfessionalData | null }
    >({
      query: (body) => ({
        url: '/api/maalem-profiles/me',
        method: 'PUT',
        body,
      }),
      transformResponse: (response: { profile: MaalemProfile }) => response.profile,
      invalidatesTags: ['MaalemProfile', 'MaalemAccess', 'Auth'],
    }),
    submitMaalemProfile: builder.mutation<MaalemProfile, void>({
      query: () => ({
        url: '/api/maalem-profiles/me/submit',
        method: 'POST',
      }),
      transformResponse: (response: { profile: MaalemProfile }) => response.profile,
      invalidatesTags: ['MaalemProfile', 'MaalemAccess', 'Auth'],
    }),
  }),
});

export const {
  useLoginMutation,
  useRegisterMutation,
  useActivateAccountMutation,
  useLogoutMutation,
  useGetCurrentUserQuery,
  useUpdateProfileMutation,
  useRequestArtisanMutation,
  useGetMaalemProfileQuery,
  useGetMaalemNotificationsQuery,
  useMarkMaalemNotificationReadMutation,
  useGetMaalemAccessQuery,
  useJoinMaalemProgramMutation,
  useGetActiveMaalemCategoriesQuery,
  useSaveMaalemDraftMutation,
  useSubmitMaalemProfileMutation,
} = authApi;
