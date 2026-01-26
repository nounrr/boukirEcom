/**
 * API Configuration
 * Centralized configuration for all API endpoints
 */

export const API_CONFIG = {
  BASE_URL: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  ENDPOINTS: {
    PRODUCTS: '/api/ecommerce/products',
    CATEGORIES: '/api/categories',
    BRANDS: '/api/brands',
    HERO_SLIDES: '/api/hero-slides',
    FEATURED_PROMO: '/api/ecommerce/products/featured/promo',
    NEW_ARRIVALS: '/api/ecommerce/products/featured/new',
    AUTH: '/users/auth',
    CART: '/api/ecommerce/cart',
    ORDERS: '/api/ecommerce/orders',
    PICKUP_LOCATIONS: '/api/ecommerce/pickup-locations',
    WISHLIST: '/api/ecommerce/wishlist',
    PROMO_VALIDATE: '/api/ecommerce/promo/validate',
  },
  TIMEOUT: 30000, // 30 seconds
} as const;

export default API_CONFIG;
