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
 */
export const baseQueryPublic = fetchBaseQuery({
  baseUrl: API_CONFIG.BASE_URL,
  prepareHeaders: (headers) => {
    // Optional: Add token if available for personalization
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('token');
      if (token) {
        headers.set('Authorization', `Bearer ${token}`);
      }
    }

    headers.set('Content-Type', 'application/json');
    headers.set('Platform', 'web');

    return headers;
  },
});
