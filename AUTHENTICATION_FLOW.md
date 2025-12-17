# Authentication Flow Documentation

## Overview
This document explains how authentication works in the boukir-ecom application, following the same pattern as your immo-bo project.

## Architecture Components

### 1. **Cookies Management** (`src/lib/cookies.ts`)
- **getAuthCookies()**: Server-side function to read accessToken and refreshToken from HTTP-only cookies
- **clearAuthCookies()**: Server-side function to delete authentication cookies

### 2. **Axios Instance** (`src/lib/axios.ts`)
- **Base URL**: Configured from `NEXT_PUBLIC_API_URL` environment variable
- **Request Interceptor**: Automatically adds `Authorization: Bearer {token}` header for server-side requests
- **Response Interceptor**: 
  - Handles 401 errors by attempting token refresh
  - Clears cookies if refresh fails
  - Automatically retries failed requests with new token

### 3. **Redux State** (`src/state/slices/user-slice.ts`)
```typescript
interface UserState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  isAuthenticated: boolean
  isLoading: boolean
}
```

**Actions:**
- `setAuth()`: Sets user + tokens (used after login/register)
- `setUser()`: Updates user data only (used after /me fetch)
- `clearAuth()`: Clears all auth state (logout or invalid token)
- `setTokens()`: Updates tokens after refresh

### 4. **Authentication Initializers**

#### UserSessionInitializer (`src/components/auth/user-session-initializer.tsx`)
- Runs on **every page load** (server-side)
- Reads cookies via `getAuthCookies()`
- Initializes Redux with `accessToken` and `refreshToken`
- Sets user to `null` (will be filled by CurrentUserInitializer)

#### CurrentUserInitializer (`src/components/auth/current-user-initializer.tsx`)
- Runs **client-side** when accessToken exists
- Calls `/users/me` endpoint to fetch current user data
- Updates Redux with full user object
- **Important**: Clears auth if 401/403 error occurs

## Authentication Flow

### Initial Page Load
```
1. Server: getAuthCookies() reads cookies
2. Server: Passes session to UserSessionInitializer
3. Client: UserSessionInitializer dispatches setAuth({ user: null, accessToken, refreshToken })
4. Client: CurrentUserInitializer sees accessToken
5. Client: Fetches /users/me
6. Client: Dispatches setUser(userData) on success
7. Client: Dispatches clearAuth() on 401/403 error
```

### Login/Register Flow
```
1. User submits form
2. Server action calls backend API
3. Backend returns { token, refreshToken, user }
4. Server sets HTTP-only cookies
5. Client component receives response
6. Client dispatches setAuth({ user, accessToken, refreshToken })
7. Redirect to home page
8. UserSessionInitializer reads cookies on next load
```

### Token Refresh (Automatic)
```
1. API request fails with 401
2. Axios interceptor catches error
3. Attempts refresh with refreshToken
4. Updates accessToken cookie
5. Retries original request
6. If refresh fails: clears cookies
```

### Logout Flow
```
1. User clicks logout
2. Calls logout() server action
3. Server deletes cookies
4. Server calls backend /logout endpoint
5. Client dispatches clearAuth()
6. Redirect to login
```

## Key Files

### Layout Integration (`app/[locale]/layout.tsx`)
```tsx
const session = await getAuthCookies()

<StoreProvider>
  <UserSessionInitializer session={session} />
  <CurrentUserInitializer />
  {children}
</StoreProvider>
```

### Header Component (`src/components/layout/header.tsx`)
```tsx
const { user, isAuthenticated } = useAppSelector((state) => state.user)

{isAuthenticated && user ? (
  <UserDropdownMenu user={user} />
) : (
  <LoginRegisterButtons />
)}
```

## API Endpoints

### Authentication Endpoints
- **POST** `/users/auth/login` - Email/password login
- **POST** `/users/auth/register` - User registration
- **POST** `/users/auth/google` - Google OAuth
- **POST** `/users/auth/facebook` - Facebook OAuth
- **POST** `/users/auth/refresh` - Token refresh
- **POST** `/users/auth/logout` - Logout
- **GET** `/users/me` - Get current user (requires auth)

## Environment Variables

```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

**Note**: The `/api` suffix is automatically added in axios config:
```typescript
const API_URL = RAW_API_URL.endsWith('/api') 
  ? RAW_API_URL 
  : `${RAW_API_URL}/api`
```

## Error Handling

### 401 Unauthorized
- Axios interceptor attempts token refresh
- If refresh succeeds: request is retried
- If refresh fails: cookies cleared
- CurrentUserInitializer clears Redux state

### 403 Forbidden
- CurrentUserInitializer clears Redux state
- Cookies cleared by getCurrentUser()

### Network Errors
- Displayed via toast notifications
- User remains in current state
- Retry possible

## Security Features

1. **HTTP-only cookies**: Tokens not accessible via JavaScript
2. **Secure flag**: Cookies only sent over HTTPS in production
3. **SameSite**: CSRF protection
4. **Token expiration**: 
   - accessToken: 7 days
   - refreshToken: 30 days
5. **Server-side validation**: All auth checks happen server-side

## Debugging

Enable debug logs by checking console for:
- `[UserSessionInitializer]` - Session initialization
- `[CurrentUserInitializer]` - User data fetching
- `[GET CURRENT USER]` - /me endpoint calls
- `[API Client]` - API requests/responses
- `[LOGIN]`, `[REGISTER]`, etc. - Auth actions

## Common Issues

### User Profile Not Showing
**Symptoms**: Login succeeds but profile doesn't appear in header
**Causes**: 
1. `/users/me` endpoint returning 401/403
2. Token mismatch between cookies and Redux
3. Backend server not running

**Solutions**:
1. Check browser console for errors
2. Verify backend is running on port 3001
3. Check Network tab for /users/me response
4. Verify token in cookies matches what backend expects

### Token Expired
**Symptoms**: Automatic logout after some time
**Causes**: accessToken expired, refresh failed
**Solutions**:
1. Check if refreshToken is valid
2. Verify backend refresh endpoint works
3. Check cookie expiration settings

### CORS Errors
**Symptoms**: API calls fail with CORS errors
**Causes**: Backend not configured for frontend origin
**Solutions**:
1. Add frontend URL to backend CORS config
2. Verify NEXT_PUBLIC_API_URL is correct

