# Base Query Configuration

This project uses RTK Query with a shared base configuration to avoid code duplication and maintain consistency across all API slices.

## Architecture

### Shared Base Queries (`src/lib/base-query.ts`)

We have two base query configurations:

#### 1. `baseQueryWithAuth`
Used for **authenticated endpoints** that require a logged-in user.

**Features:**
- Automatically adds `Authorization: Bearer <token>` header from Redux state
- Gets token from `state.user.accessToken`
- Includes common headers (Content-Type, Platform)

**Used by:**
- `cart-api-slice.ts` - Cart operations
- `orders-api-slice.ts` - Order management
- `subscription-api-slice.ts` - Subscription/points

#### 2. `baseQueryPublic`
Used for **public endpoints** that don't require authentication.

**Features:**
- Optionally adds auth token if available (for personalization)
- Falls back to localStorage for SSR compatibility
- Includes common headers

**Used by:**
- `products-api-slice.ts` - Product listings
- `categories-api-slice.ts` - Categories
- `auth-api-slice.ts` - Login/Register

## Why This Approach?

### ✅ Benefits

1. **DRY (Don't Repeat Yourself)**
   - Authentication logic in one place
   - Common headers defined once
   - Easy to update globally

2. **Type Safety**
   - TypeScript infers RootState correctly
   - Shared types across all slices

3. **Consistency**
   - All APIs use same header format
   - Predictable authentication flow

4. **Professional Pattern**
   - Industry-standard approach
   - Used by major projects (Redux Toolkit docs)
   - Easy for team collaboration

### ❌ Anti-patterns We Avoided

- ❌ Duplicating `fetchBaseQuery` in every slice
- ❌ Using `localStorage.getItem('token')` directly
- ❌ Mixing authentication patterns
- ❌ Hardcoding baseUrl in multiple places

## How It Works

### Authentication Flow

```typescript
// 1. User logs in
dispatch(setAuth({ 
  user, 
  accessToken: "jwt-token", 
  refreshToken: "..." 
}))

// 2. Token stored in Redux state
state.user.accessToken = "jwt-token"

// 3. All API calls automatically include token
baseQueryWithAuth → prepareHeaders → headers.set('Authorization', 'Bearer jwt-token')
```

### Example API Slice

```typescript
import { createApi } from '@reduxjs/toolkit/query/react';
import { baseQueryWithAuth } from '@/lib/base-query';

export const myApi = createApi({
  reducerPath: 'myApi',
  baseQuery: baseQueryWithAuth, // 👈 That's it!
  endpoints: (builder) => ({
    // Your endpoints here
  }),
});
```

## Configuration

### Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

### Common Headers

All requests include:
- `Content-Type: application/json`
- `Platform: web`
- `Authorization: Bearer <token>` (when authenticated)

## Usage Examples

### Authenticated Endpoint (Cart)

```typescript
// Automatically includes auth token from Redux state
const { data: cart } = useGetCartQuery();
```

### Public Endpoint (Products)

```typescript
// Works without auth, but includes token if available
const { data: products } = useGetProductsQuery(filters);
```

## Best Practices

1. **Always use base queries** - Never create custom `fetchBaseQuery`
2. **Choose the right base** - `baseQueryWithAuth` for protected, `baseQueryPublic` for public
3. **Trust the state** - Don't access `localStorage` directly in slices
4. **Keep it simple** - Let the base query handle authentication

## Troubleshooting

### "Network request failed" or 401 Unauthorized

**Check:**
1. Is `state.user.accessToken` set? 
   ```typescript
   console.log(store.getState().user.accessToken)
   ```
2. Is the API slice using correct base query?
3. Is the token expired?

### Token not included in headers

**Solution:**
- Make sure you're using `baseQueryWithAuth` (not `baseQueryPublic`)
- Verify user is authenticated: `state.user.isAuthenticated === true`

## Future Enhancements

Possible improvements:
- Add token refresh logic
- Add retry mechanism
- Add request/response interceptors
- Add request queueing during refresh
