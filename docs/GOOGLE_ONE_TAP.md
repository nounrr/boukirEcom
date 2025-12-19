# Google One Tap Authentication

## Overview
Google One Tap is implemented across the entire application to provide seamless authentication for unauthenticated users. The popup appears automatically on pages where users are not logged in.

## How It Works

### 1. **GoogleOneTap Component**
Located: `src/components/auth/google-one-tap.tsx`

This component:
- Monitors authentication state via Redux
- Shows Google One Tap prompt for unauthenticated users
- Respects cooldown periods and user dismissals
- Excludes auth pages (login, register, etc.)

### 2. **Configuration**
Located: `src/lib/google-one-tap-config.ts`

Configurable options:
```typescript
{
  SHOW_DELAY: 1500,              // Wait 1.5s after page load
  EXCLUDED_PATHS: [...],         // Pages to exclude
  COOLDOWN_PERIOD: 24h,          // Don't show again for 24h after dismissal
  MAX_SHOWS_PER_SESSION: 2,      // Max shows per browser session
}
```

### 3. **Integration**
The component is added to the root layout (`app/[locale]/layout.tsx`), making it available on all pages.

## Features

✅ **Automatic Display**: Shows 1.5 seconds after page load
✅ **Smart Exclusions**: Doesn't show on login/register pages
✅ **Cooldown Management**: Respects 24-hour cooldown after dismissal
✅ **Session Limits**: Shows maximum 2 times per session
✅ **Redux Integration**: Automatically updates user state on successful sign-in
✅ **Toast Notifications**: Shows success/error messages
✅ **Auto-redirect**: Redirects to homepage after successful authentication

## User Flow

1. **User visits shop page** (or any page) without being logged in
2. **After 1.5 seconds**, Google One Tap popup appears
3. **User can**:
   - Click their Google account to sign in instantly
   - Dismiss the popup (won't see it again for 24 hours)
   - Ignore it (will disappear after 10 seconds)
4. **On successful sign-in**:
   - User data saved to Redux store
   - Success toast notification
   - Auto-redirect to homepage
   - Tokens saved in cookies

## Customization

### Change Delay Time
Edit `SHOW_DELAY` in `src/lib/google-one-tap-config.ts`:
```typescript
SHOW_DELAY: 3000, // 3 seconds
```

### Add More Excluded Paths
```typescript
EXCLUDED_PATHS: [
  '/login',
  '/register',
  '/checkout', // Add new exclusions
],
```

### Disable Completely
Remove `<GoogleOneTap />` from `app/[locale]/layout.tsx`

### Show Only on Specific Pages
Replace the component in root layout with conditional rendering in specific pages.

## Technical Details

### Dependencies
- `@/hooks/use-google-auth`: Handles Google OAuth integration
- `@/state/hooks`: Redux hooks for auth state
- Google Identity Services SDK (loaded via script)

### Environment Variables Required
```env
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_google_client_id
```

### How One Tap Works
1. Google Identity Services script loads on page
2. `useGoogleAuth` hook initializes Google SDK
3. `promptOneTap()` triggers the One Tap UI
4. Google handles authentication UI
5. Credential returned to `handleCredentialResponse`
6. Backend validates Google token
7. User session established

## Testing

### Test One Tap Appearance
1. Log out of the application
2. Visit any page (shop, products, etc.)
3. Wait 1.5 seconds
4. One Tap prompt should appear

### Test Cooldown
1. Dismiss the One Tap prompt
2. Navigate to different pages
3. Prompt should not reappear for 24 hours

### Clear Cooldown (for testing)
Open browser console:
```javascript
localStorage.removeItem('google_one_tap_dismissed')
```

## Troubleshooting

### One Tap Not Appearing

**Check console logs**:
- Should see: `[Google One Tap] Showing One Tap prompt`
- Should see: `[Google Auth] Script loaded successfully`

**Common issues**:
1. Already authenticated (check Redux state)
2. On excluded path (check pathname)
3. In cooldown period (check localStorage)
4. Google Client ID not configured
5. Origin not authorized in Google Cloud Console

### Configure Google Cloud Console

1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Select your project
3. Navigate to **APIs & Services > Credentials**
4. Edit your OAuth 2.0 Client ID
5. Add authorized JavaScript origins:
   ```
   http://localhost:3002
   http://localhost:3000
   https://yourdomain.com
   ```
6. Add authorized redirect URIs:
   ```
   http://localhost:3002
   http://localhost:3000
   https://yourdomain.com
   ```

### Debug Mode
Enable detailed logging:
```typescript
// In google-one-tap.tsx
useEffect(() => {
  console.log('Auth State:', { isAuthenticated, isReady, pathname })
  console.log('Should show?', shouldShowOneTap(pathname))
  // ...
}, [isAuthenticated, isReady, pathname])
```

## Best Practices

1. **Don't show too frequently**: Respect user dismissals
2. **Exclude checkout flows**: Don't interrupt purchases
3. **Test thoroughly**: Verify on all page types
4. **Monitor analytics**: Track sign-in conversion rates
5. **Provide alternatives**: Always have manual login option

## Related Files

- `src/hooks/use-google-auth.ts` - Google OAuth hook
- `src/actions/auth/oauth.ts` - Backend integration
- `src/components/auth/login-form.tsx` - Manual login with Google button
- `src/state/slices/user-slice.ts` - User state management
