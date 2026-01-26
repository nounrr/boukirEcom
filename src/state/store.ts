import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { productsApi } from './api/products-api-slice';
import { categoriesApi } from './api/categories-api-slice';
import { brandsApi } from './api/brands-api-slice';
import { authApi } from './api/auth-api-slice';
import { ordersApi } from './api/orders-api-slice';
import { ecommercePublicApiSlice } from './api/ecommerce-public-api-slice';
import { subscriptionApi } from './api/subscription-api-slice';
import { cartApi } from './api/cart-api-slice';
import { wishlistApi } from './api/wishlist-api-slice';
import { promoApiSlice } from './api/promo-api-slice';
import { heroSlidesApi } from './api/hero-slides-api-slice';
import userReducer from './slices/user-slice';
import cartReducer from './slices/cart-slice';

export const makeStore = () => {
  const store = configureStore({
    reducer: {
      // API slices
      [productsApi.reducerPath]: productsApi.reducer,
      [categoriesApi.reducerPath]: categoriesApi.reducer,
      [brandsApi.reducerPath]: brandsApi.reducer,
      [authApi.reducerPath]: authApi.reducer,
      [ordersApi.reducerPath]: ordersApi.reducer,
      [ecommercePublicApiSlice.reducerPath]: ecommercePublicApiSlice.reducer,
      [subscriptionApi.reducerPath]: subscriptionApi.reducer,
      [cartApi.reducerPath]: cartApi.reducer,
      [wishlistApi.reducerPath]: wishlistApi.reducer,
      [promoApiSlice.reducerPath]: promoApiSlice.reducer,
      [heroSlidesApi.reducerPath]: heroSlidesApi.reducer,
      
      // Regular slices
      user: userReducer,
      cart: cartReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware()
        .concat(productsApi.middleware)
        .concat(categoriesApi.middleware)
        .concat(brandsApi.middleware)
        .concat(authApi.middleware)
        .concat(ordersApi.middleware)
        .concat(ecommercePublicApiSlice.middleware)
        .concat(subscriptionApi.middleware)
        .concat(cartApi.middleware)
        .concat(wishlistApi.middleware)
        .concat(promoApiSlice.middleware)
        .concat(heroSlidesApi.middleware),
  });

  setupListeners(store.dispatch);
  return store;
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
