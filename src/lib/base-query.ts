import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import type { RootState } from '@/state/store';
import { API_CONFIG } from './api-config';
import { clearAuth } from '@/state/slices/user-slice';

/**
 * Base fetch query with auth headers
 */
const baseQuery = fetchBaseQuery({
  baseUrl: API_CONFIG.BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as RootState;
    const accessToken = state.user.accessToken;

    // Add authentication token if available
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }

    // Add common headers
    headers.set('Content-Type', 'application/json');
    headers.set('Platform', 'web');

    return headers;
  },
});

/**
 * Base query with authentication error handling (no refresh tokens)
 */
export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  // If we get a 401, clear auth state
  if (result.error && result.error.status === 401) {
    console.log('[BaseQuery] Unauthorized, clearing auth');
    api.dispatch(clearAuth());

    // Best-effort cookie cleanup on the server
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch (e) {
      console.warn('[BaseQuery] Failed to clear cookies:', e);
    }
  }

  return result;
};

/**
 * Shared base query configuration for all API slices
 * Handles authentication and automatic token refresh
 */
export const baseQueryWithAuth = baseQueryWithReauth;

/**
 * Base query without authentication requirement
 * Used for public endpoints (products, categories, etc.)
 * Optionally includes auth token if user is authenticated for personalization
 */
export const baseQueryPublic = fetchBaseQuery({
  baseUrl: API_CONFIG.BASE_URL,
  prepareHeaders: (headers, { getState }) => {
    const state = getState() as RootState;
    const accessToken = state.user.accessToken;

    // Optionally add token if user is authenticated (for personalization like is_wishlisted)
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }

    headers.set('Content-Type', 'application/json');
    headers.set('Platform', 'web');

    return headers;
  },
});
