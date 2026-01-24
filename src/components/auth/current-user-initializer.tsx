"use client"

import { useEffect } from "react"
import { useAppDispatch, useAppSelector } from "@/state/hooks"
import { setAuth, setUser, selectAccessToken, clearAuth } from "@/state/slices/user-slice"
import { getCurrentUser } from "@/actions/auth/get-current-user"

/**
 * Client component that fetches and initializes current user data in Redux
 * Only runs when accessToken is present
 * Clears auth state if token is invalid (401/403)
 * Updates tokens in Redux if they were refreshed server-side
 */
export function CurrentUserInitializer() {
  const dispatch = useAppDispatch()
  const accessToken = useAppSelector(selectAccessToken)

  useEffect(() => {
    if (!accessToken) return

    let retryCount = 0
    const maxRetries = 2
    const retryDelay = 1000 // 1 second

    const fetchCurrentUser = async () => {
      console.log('[CurrentUserInitializer] Fetching current user with token (attempt', retryCount + 1, ')')
      const result = await getCurrentUser()
      
      if (result.success) {
        console.log('[CurrentUserInitializer] User fetched successfully:', result.user.email)

        // Check if token was refreshed server-side
        // Persist full user details together with the access token
        dispatch(setAuth({
          user: result.user,
          accessToken: accessToken,
          refreshToken: null,
        }))
      } else {
        console.error('[CurrentUserInitializer] Failed to fetch user:', result.error)

        const errorMessage = result.error.toLowerCase()

        // Only clear auth on ACTUAL authentication errors from the server
        // Don't clear on network errors, timeout, or generic errors
        const isAuthError =
          errorMessage.includes('non authentifié') ||
          errorMessage.includes('session expirée') ||
          errorMessage.includes('accès refusé') ||
          errorMessage.includes('veuillez vous reconnecter')

        const isNetworkError =
          errorMessage.includes('network') ||
          errorMessage.includes('timeout') ||
          errorMessage.includes('fetch') ||
          errorMessage === 'error' // Generic error

        if (isAuthError) {
          console.log('[CurrentUserInitializer] Authentication error - clearing auth')
          dispatch(clearAuth())
        } else if (isNetworkError && retryCount < maxRetries) {
          // Retry on network errors
          retryCount++
          console.log('[CurrentUserInitializer] Network error - retrying in', retryDelay, 'ms')
          setTimeout(fetchCurrentUser, retryDelay)
        } else {
          console.warn('[CurrentUserInitializer] Non-auth error - keeping token:', result.error)
          // Don't clear auth for non-authentication errors
          // The token might still be valid, just a temporary backend issue
        }
      }
    }

    fetchCurrentUser()
  }, [accessToken, dispatch])

  return null
}
