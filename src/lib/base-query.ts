import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { BaseQueryFn, FetchArgs, FetchBaseQueryError } from '@reduxjs/toolkit/query';
import type { RootState } from '@/state/store';
import { API_CONFIG } from './api-config';
import { setTokens, clearAuth } from '@/state/slices/user-slice';

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
 * Base query with automatic token refresh on 401 errors
 * This wraps the base query and handles token expiration
 */
export const baseQueryWithReauth: BaseQueryFn<
  string | FetchArgs,
  unknown,
  FetchBaseQueryError
> = async (args, api, extraOptions) => {
  let result = await baseQuery(args, api, extraOptions);

  // If we get a 401, try to refresh the token
  if (result.error && result.error.status === 401) {
    const state = api.getState() as RootState;
    const refreshToken = state.user.refreshToken;

    if (refreshToken) {
      console.log('[BaseQuery] Token expired, attempting refresh...');

      // Try to refresh the token
      const refreshResult = await baseQuery(
        {
          url: '/users/auth/refresh',
          method: 'POST',
          body: { refreshToken },
        },
        api,
        extraOptions
      );

      if (refreshResult.data) {
        const data = refreshResult.data as { token?: string; refreshToken?: string };

        if (data.token) {
          console.log('[BaseQuery] Token refreshed successfully');

          // Store the new tokens in Redux
          api.dispatch(setTokens({
            accessToken: data.token,
            refreshToken: data.refreshToken || refreshToken,
          }));

          // Also update cookies via API route
          try {
            await fetch('/api/auth/refresh-cookies', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                accessToken: data.token,
                refreshToken: data.refreshToken || refreshToken,
              }),
            });
          } catch (cookieError) {
            console.warn('[BaseQuery] Failed to update cookies:', cookieError);
          }

          // Retry the original query with new token
          result = await baseQuery(args, api, extraOptions);
        } else {
          console.log('[BaseQuery] Refresh failed - no token in response');
          api.dispatch(clearAuth());
        }
      } else {
        console.log('[BaseQuery] Refresh request failed:', refreshResult.error);
        api.dispatch(clearAuth());

        // Clear cookies via API route
        try {
          await fetch('/api/auth/logout', { method: 'POST' });
        } catch (e) {
          console.warn('[BaseQuery] Failed to clear cookies:', e);
        }
      }
    } else {
      console.log('[BaseQuery] No refresh token available, clearing auth');
      api.dispatch(clearAuth());
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
