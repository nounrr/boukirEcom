# Cart Authentication & API Integration

## How Authentication is Checked

Authentication state is managed in Redux store via `user-slice.ts`:

```typescript
// User is authenticated when:
const { isAuthenticated } = useAppSelector((state) => state.user)
// OR
const isAuthenticated = state.user.isAuthenticated && !!state.user.accessToken
```

### Authentication Criteria
A user is considered **authenticated** when:
1. ✅ `state.user.isAuthenticated === true`
2. ✅ `state.user.accessToken !== null`

### Where Authentication is Set
```typescript
// After login/register success
dispatch(setAuth({
  user: userData,
  accessToken: "jwt-token-here",
  refreshToken: "refresh-token-here"
}))
```

## Cart Behavior Based on Authentication

### Guest Users (Not Authenticated)
- ✅ Cart stored in `localStorage`
- ✅ No API calls to backend
- ✅ Cart persists across sessions
- ✅ Fast and offline-capable

**Flow:**
```
Add Item → Redux Store → localStorage
         └─> (No API call)
```

### Authenticated Users
- ✅ Cart stored in backend database
- ✅ All cart operations sync to API
- ✅ Cart available across devices
- ✅ Optimistic updates for better UX

**Flow:**
```
Add Item → Redux Store (optimistic update)
         ├─> localStorage (backup)
         └─> API POST /api/ecommerce/cart/items
```

## API Endpoints Used

### 1. Fetch Cart (GET)
```typescript
GET /api/ecommerce/cart
Headers: { Authorization: "Bearer <token>" }

Response: {
  items: [
    {
      product_id: 5287,
      variant_id: null,
      product_name: "Product Name",
      price: 70.2,
      quantity: 2,
      image: "https://...",
      category: "Category",
      stock: 400
    }
  ]
}
```

### 2. Add to Cart (POST)
```typescript
POST /api/ecommerce/cart/items
Headers: { Authorization: "Bearer <token>" }
Body: {
  product_id: 5287,
  variant_id: null, // optional
  quantity: 1
}
```

### 3. Update Quantity (PATCH)
```typescript
PATCH /api/ecommerce/cart/items/:productId/:variantId?
Headers: { Authorization: "Bearer <token>" }
Body: { quantity: 3 }
```

### 4. Remove Item (DELETE)
```typescript
DELETE /api/ecommerce/cart/items/:productId/:variantId?
Headers: { Authorization: "Bearer <token>" }
```

## Implementation Details

### Cart Slice Actions

#### For Guest Users (localStorage only)
```typescript
// Synchronous actions
dispatch(addItem(cartItem))        // Adds to Redux + localStorage
dispatch(updateQuantity(...))      // Updates Redux + localStorage
dispatch(removeItem(...))          // Removes from Redux + localStorage
```

#### For Authenticated Users (API + localStorage)
```typescript
// Optimistic update + API sync
dispatch(addItem(cartItem))           // Immediate Redux update
dispatch(addItemToCart(cartItem))     // Async API call

dispatch(updateQuantity(...))              // Immediate Redux update
dispatch(updateCartItemQuantity(...))      // Async API call

dispatch(removeItem(...))                  // Immediate Redux update
dispatch(removeCartItem(...))              // Async API call
```

### Console Logs for Debugging

When adding items to cart, you'll see:
```
🔐 User authenticated, syncing to backend...
✅ Cart item added to backend: {...}
✅ Cart item synced to backend
```

Or for guests:
```
👤 Guest user, saved to localStorage only
```

## Components Integration

### product-card.tsx
```typescript
const { isAuthenticated } = useAppSelector((state) => state.user)

const handleAddToCart = () => {
  // Optimistic update (immediate UI feedback)
  dispatch(addItem(cartItem))
  
  // Sync to backend if authenticated
  if (isAuthenticated) {
    dispatch(addItemToCart(cartItem))
  }
}
```

### cart-initializer.tsx
```typescript
useEffect(() => {
  if (!isLoaded) {
    if (isAuthenticated) {
      // Fetch from backend
      dispatch(fetchCartFromBackend())
    } else {
      // Load from localStorage
      dispatch(loadCart())
    }
  }
}, [isAuthenticated])
```

### cart-popover.tsx
```typescript
const handleRemoveItem = (productId, variantId) => {
  dispatch(removeItem({ productId, variantId }))
  
  if (isAuthenticated) {
    dispatch(removeCartItem({ productId, variantId }))
  }
}
```

## Network Requests Verification

To verify API calls are being made:

### 1. Open Browser DevTools
- Press `F12` or `Ctrl+Shift+I`
- Go to **Network** tab
- Filter: `Fetch/XHR`

### 2. Add Item to Cart
You should see:
```
POST http://localhost:3001/api/ecommerce/cart/items
Status: 200 OK
Request Headers: Authorization: Bearer eyJ...
Request Body: {"product_id": 5287, "quantity": 1}
```

### 3. Check Console Logs
```
🔐 User authenticated, syncing to backend...
✅ Cart item added to backend: {...}
```

## Troubleshooting

### Issue: "No API requests being made"

**Check:**
1. ✅ User is authenticated: `console.log(isAuthenticated)` in component
2. ✅ Token exists: Check `localStorage.getItem('token')` or Redux state
3. ✅ API URL configured: Check `.env.local` for `NEXT_PUBLIC_API_URL`
4. ✅ Network tab shows requests going out
5. ✅ Console shows "🔐 User authenticated" message

### Issue: "Still loading guest cart when authenticated"

**Fix:** Make sure `isAuthenticated` is `true` BEFORE cart initializes.
- Check login action sets `isAuthenticated: true`
- Verify token is stored in Redux: `state.user.accessToken`

### Issue: "Cart not persisting across devices"

**Reason:** Backend cart not being fetched on login.
**Fix:** Ensure `fetchCartFromBackend()` is called after successful login.

## Best Practices

1. **Always dispatch both actions for authenticated users:**
   ```typescript
   dispatch(addItem(item))        // Optimistic update
   dispatch(addItemToCart(item))  // Backend sync
   ```

2. **Check authentication in every cart operation:**
   ```typescript
   if (isAuthenticated) {
     // Sync to backend
   }
   ```

3. **Handle API errors gracefully:**
   - Cart slice logs errors but doesn't revert optimistic updates
   - User sees immediate feedback even if API fails
   - Backend will eventually sync when network recovers

4. **Clear localStorage on logout:**
   ```typescript
   dispatch(clearAuth())
   dispatch(clearCart())
   ```
