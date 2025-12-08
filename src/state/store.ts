import { configureStore } from '@reduxjs/toolkit';
import { setupListeners } from '@reduxjs/toolkit/query';
import { productsApi } from './api/products-api-slice';
import { categoriesApi } from './api/categories-api-slice';
import { authApi } from './api/auth-api-slice';
import { ordersApi } from './api/orders-api-slice';
import { subscriptionApi } from './api/subscription-api-slice';
import { cartApi } from './api/cart-api-slice';
import cartReducer from './slices/cart-slice';
import userReducer from './slices/user-slice';

export const makeStore = () => {
  const store = configureStore({
    reducer: {
      // API slices
      [productsApi.reducerPath]: productsApi.reducer,
      [categoriesApi.reducerPath]: categoriesApi.reducer,
      [authApi.reducerPath]: authApi.reducer,
      [ordersApi.reducerPath]: ordersApi.reducer,
      [subscriptionApi.reducerPath]: subscriptionApi.reducer,
      [cartApi.reducerPath]: cartApi.reducer,
      
      // Regular slices
      cart: cartReducer,
      user: userReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware()
        .concat(productsApi.middleware)
        .concat(categoriesApi.middleware)
        .concat(authApi.middleware)
        .concat(ordersApi.middleware)
        .concat(subscriptionApi.middleware)
        .concat(cartApi.middleware),
  });

  setupListeners(store.dispatch);
  return store;
};

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore['getState']>;
export type AppDispatch = AppStore['dispatch'];
