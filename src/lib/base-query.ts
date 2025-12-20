import { fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type { RootState } from '@/state/store';
import { API_CONFIG } from './api-config';

/**
 * Shared base query configuration for all API slices
 * Handles authentication and common headers
 */
export const baseQueryWithAuth = fetchBaseQuery({
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
