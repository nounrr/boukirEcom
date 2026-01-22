import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryPublic } from '@/lib/base-query';
import { API_CONFIG } from '@/lib/api-config';
import type { PickupLocation } from '@/types/order';

/**
 * Map pickup location from API response to frontend type
 */
const mapPickupLocationFromApi = (location: any): PickupLocation | null => {
  if (!location) return null;
  return {
    id: location.id,
    name: location.name,
    address: location.address ?? location.address_line1 ?? '',
    addressLine1: location.address_line1 ?? null,
    addressLine2: location.address_line2 ?? null,
    city: location.city,
    state: location.state ?? null,
    postalCode: location.postal_code ?? null,
    country: location.country ?? 'Morocco',
    phone: location.phone ?? null,
    openingHours: location.opening_hours ?? null,
    isActive: location.is_active ?? true,
  };
};

/**
 * Public E-commerce API slice (no authentication required)
 * Used for endpoints like pickup locations that guests can access
 */
export const ecommercePublicApiSlice = createApi({
  reducerPath: 'ecommercePublicApi',
  baseQuery: baseQueryPublic,
  endpoints: (builder) => ({
    // Get pickup locations (public)
    getPickupLocations: builder.query<PickupLocation[], void>({
      query: () => ({
        url: API_CONFIG.ENDPOINTS.PICKUP_LOCATIONS,
      }),
      transformResponse: (response: any): PickupLocation[] => {
        const locations = response.pickup_locations || response || [];
        const mapped = Array.isArray(locations) 
          ? locations.map(mapPickupLocationFromApi).filter(Boolean) as PickupLocation[]
          : [];
        console.log('[PickupLocations] Fetched:', mapped);
        return mapped;
      },
    }),
  }),
});

export const { useGetPickupLocationsQuery } = ecommercePublicApiSlice;
