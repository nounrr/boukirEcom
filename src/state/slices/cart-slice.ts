import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import { cartStorage } from '@/lib/cart-storage';
import type { RootState } from '../store';
import API_CONFIG from '@/lib/api-config';

export interface CartItem {
  productId: number;
  variantId?: number;
  name: string;
  price: number;
  quantity: number;
  image?: string;
  category?: string;
  stock?: number;
}

interface CartState {
  items: CartItem[];
  total: number;
  isLoaded: boolean;
}

// Load initial state from localStorage
const loadInitialState = (): CartState => {
  const items = cartStorage.getCart() as CartItem[]
  const total = items.reduce((sum: number, item: CartItem) => sum + item.price * item.quantity, 0)

  return {
    items,
    total,
    isLoaded: true,
  }
}

const initialState: CartState = {
  items: [],
  total: 0,
  isLoaded: false,
};

const calculateTotal = (items: CartItem[]): number => {
  return items.reduce((sum: number, item: CartItem) => sum + item.price * item.quantity, 0)
}

// Helper to check if user is authenticated
const isAuthenticated = (state: RootState): boolean => {
  return !!state.user.accessToken && state.user.isAuthenticated
}

// Helper to get auth token
const getAuthToken = (state: RootState): string | null => {
  return state.user.accessToken
}

// Async thunk to add item to backend cart
export const addItemToCart = createAsyncThunk(
  'cart/addItemToCart',
  async (item: CartItem, { getState, rejectWithValue }) => {
    const state = getState() as RootState
    const token = getAuthToken(state)

    if (!token) {
      // Guest user - just return the item to be added locally
      return item
    }

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CART}/items`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          product_id: item.productId,
          variant_id: item.variantId,
          quantity: item.quantity,
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to add item to cart')
      }

      const data = await response.json()
      console.log('✅ Cart item added to backend:', data)
      return item
    } catch (error) {
      console.error('❌ Failed to add item to backend cart:', error)
      return rejectWithValue(error)
    }
  }
)

// Async thunk to update quantity in backend
export const updateCartItemQuantity = createAsyncThunk(
  'cart/updateCartItemQuantity',
  async ({ productId, variantId, quantity }: { productId: number; variantId?: number; quantity: number }, { getState, rejectWithValue }) => {
    const state = getState() as RootState
    const token = getAuthToken(state)

    if (!token) {
      return { productId, variantId, quantity }
    }

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CART}/items/${productId}${variantId ? `/${variantId}` : ''}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ quantity }),
      })

      if (!response.ok) {
        throw new Error('Failed to update cart item')
      }

      const data = await response.json()
      console.log('✅ Cart item updated in backend:', data)
      return { productId, variantId, quantity }
    } catch (error) {
      console.error('❌ Failed to update cart item in backend:', error)
      return rejectWithValue(error)
    }
  }
)

// Async thunk to remove item from backend
export const removeCartItem = createAsyncThunk(
  'cart/removeCartItem',
  async ({ productId, variantId }: { productId: number; variantId?: number }, { getState, rejectWithValue }) => {
    const state = getState() as RootState
    const token = getAuthToken(state)

    if (!token) {
      return { productId, variantId }
    }

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CART}/items/${productId}${variantId ? `/${variantId}` : ''}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to remove cart item')
      }

      console.log('✅ Cart item removed from backend')
      return { productId, variantId }
    } catch (error) {
      console.error('❌ Failed to remove cart item from backend:', error)
      return rejectWithValue(error)
    }
  }
)

// Async thunk to fetch cart from backend
export const fetchCartFromBackend = createAsyncThunk(
  'cart/fetchFromBackend',
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as RootState
    const token = getAuthToken(state)

    if (!token) {
      return []
    }

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.CART}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch cart')
      }

      const data = await response.json()
      console.log('✅ Cart fetched from backend:', data)

      // Transform backend response to CartItem format
      const items: CartItem[] = data.items?.map((item: any) => ({
        productId: item.product_id,
        variantId: item.variant_id,
        name: item.product_name || item.name,
        price: parseFloat(item.price),
        quantity: item.quantity,
        image: item.image,
        category: item.category,
        stock: item.stock,
      })) || []

      return items
    } catch (error) {
      console.error('❌ Failed to fetch cart from backend:', error)
      return rejectWithValue(error)
    }
  }
)

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    // Load cart from localStorage
    loadCart: (state) => {
      const loadedState = loadInitialState()
      state.items = loadedState.items
      state.total = loadedState.total
      state.isLoaded = true
    },
    addItem: (state, action: PayloadAction<CartItem>) => {
      const itemKey = action.payload.variantId
        ? `${action.payload.productId}-${action.payload.variantId}`
        : `${action.payload.productId}`;

      const existingItem = state.items.find(
        (item) => {
          const existingKey = item.variantId
            ? `${item.productId}-${item.variantId}`
            : `${item.productId}`;
          return existingKey === itemKey;
        }
      );

      if (existingItem) {
        existingItem.quantity += action.payload.quantity;
      } else {
        state.items.push(action.payload);
      }

      state.total = calculateTotal(state.items)

      // Save to localStorage (for guest users)
      cartStorage.saveCart(state.items)
      // Note: API call is handled by addItemToCart thunk
    },
    removeItem: (state, action: PayloadAction<{ productId: number; variantId?: number }>) => {
      const itemKey = action.payload.variantId
        ? `${action.payload.productId}-${action.payload.variantId}`
        : `${action.payload.productId}`;

      state.items = state.items.filter(
        (item) => {
          const existingKey = item.variantId
            ? `${item.productId}-${item.variantId}`
            : `${item.productId}`;
          return existingKey !== itemKey;
        }
      );
      state.total = calculateTotal(state.items)

      // Save to localStorage
      cartStorage.saveCart(state.items)
    },
    updateQuantity: (
      state,
      action: PayloadAction<{ productId: number; variantId?: number; quantity: number }>
    ) => {
      const itemKey = action.payload.variantId
        ? `${action.payload.productId}-${action.payload.variantId}`
        : `${action.payload.productId}`;

      const item = state.items.find(
        (item) => {
          const existingKey = item.variantId
            ? `${item.productId}-${item.variantId}`
            : `${item.productId}`;
          return existingKey === itemKey;
        }
      );
      if (item) {
        item.quantity = action.payload.quantity;
        state.total = calculateTotal(state.items)

        // Save to localStorage
        cartStorage.saveCart(state.items)
      }
    },
    clearCart: (state) => {
      state.items = [];
      state.total = 0;

      // Clear from localStorage
      cartStorage.clearCart()
    },
    // Replace entire cart (used when syncing with server)
    replaceCart: (state, action: PayloadAction<CartItem[]>) => {
      state.items = action.payload
      state.total = calculateTotal(action.payload)
      state.isLoaded = true

      // Save to localStorage
      cartStorage.saveCart(state.items)
    },
  },
  extraReducers: (builder) => {
    // Handle addItemToCart thunk
    builder.addCase(addItemToCart.fulfilled, (state, action) => {
      // Item already added in optimistic update via addItem reducer
      console.log('✅ Cart item synced to backend')
    })
    builder.addCase(addItemToCart.rejected, (state, action) => {
      console.error('❌ Failed to sync cart item to backend:', action.payload)
    })

    // Handle updateCartItemQuantity thunk
    builder.addCase(updateCartItemQuantity.fulfilled, (state) => {
      console.log('✅ Cart quantity synced to backend')
    })
    builder.addCase(updateCartItemQuantity.rejected, (state, action) => {
      console.error('❌ Failed to sync quantity to backend:', action.payload)
    })

    // Handle removeCartItem thunk
    builder.addCase(removeCartItem.fulfilled, (state) => {
      console.log('✅ Cart item removal synced to backend')
    })
    builder.addCase(removeCartItem.rejected, (state, action) => {
      console.error('❌ Failed to sync removal to backend:', action.payload)
    })

    // Handle fetchCartFromBackend thunk
    builder.addCase(fetchCartFromBackend.fulfilled, (state, action) => {
      state.items = action.payload
      state.total = calculateTotal(action.payload)
      state.isLoaded = true
      // Don't save to localStorage - this is server data
      console.log('✅ Cart loaded from backend')
    })
    builder.addCase(fetchCartFromBackend.rejected, (state, action) => {
      console.error('❌ Failed to load cart from backend:', action.payload)
      state.isLoaded = true
    })
  },
});

export const { loadCart, addItem, removeItem, updateQuantity, clearCart, replaceCart } = cartSlice.actions;
export default cartSlice.reducer;
