/**
 * API Configuration
 * Centralized configuration for all API endpoints
 */

export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  ENDPOINTS: {
    PRODUCTS: '/api/ecommerce/products',
    FEATURED_PROMO: '/api/ecommerce/products/featured/promo',
    NEW_ARRIVALS: '/api/ecommerce/products/featured/new',
    AUTH: '/users/auth',
    CART: '/api/ecommerce/cart',
    ORDERS: '/api/ecommerce/orders',
    WISHLIST: '/api/ecommerce/wishlist',
    PROMO_VALIDATE: '/api/ecommerce/promo/validate',
  },
  TIMEOUT: 30000, // 30 seconds
} as const;

export default API_CONFIG;
