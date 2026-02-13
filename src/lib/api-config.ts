/**
 * API Configuration
 * Centralized configuration for all API endpoints
 */

const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
// Many endpoints already include the `/api/...` prefix.
// If NEXT_PUBLIC_API_URL is configured as `https://host.tld/api`, avoid generating `/api/api/...`.
const BASE_URL = RAW_API_URL.replace(/\/+$/, '').endsWith('/api')
  ? RAW_API_URL.replace(/\/+$/, '').slice(0, -4)
  : RAW_API_URL

export const API_CONFIG = {
  BASE_URL: BASE_URL.replace(/\/+$/, ''),
  ENDPOINTS: {
    PRODUCTS: '/api/ecommerce/products',
    SEARCH_SUGGESTIONS: '/api/ecommerce/search/suggestions',
    CATEGORIES: '/api/categories',
    BRANDS: '/api/brands',
    HERO_SLIDES: '/api/hero-slides',
    FEATURED_PROMO: '/api/ecommerce/products/featured/promo',
    NEW_ARRIVALS: '/api/ecommerce/products/featured/new',
    AUTH: '/users/auth',
    CART: '/api/ecommerce/cart',
    ORDERS: '/api/ecommerce/orders',
    ORDERS_QUOTE: '/api/ecommerce/orders/quote',
    PICKUP_LOCATIONS: '/api/ecommerce/pickup-locations',
    WISHLIST: '/api/ecommerce/wishlist',
    PROMO_VALIDATE: '/api/ecommerce/promo/validate',
  },
  TIMEOUT: 30000, // 30 seconds
} as const;

export default API_CONFIG;
