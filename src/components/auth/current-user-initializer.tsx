"use client"

import { useEffect } from "react"
import { useAppDispatch, useAppSelector } from "@/state/hooks"
import { setAuth, setUser, selectAccessToken, selectRefreshToken, clearAuth } from "@/state/slices/user-slice"
import { getCurrentUser } from "@/actions/auth/get-current-user"

/**
 * Client component that fetches and initializes current user data in Redux
 * Only runs when accessToken is present
 * Clears auth state if token is invalid (401/403)
 */
export function CurrentUserInitializer() {
  const dispatch = useAppDispatch()
  const accessToken = useAppSelector(selectAccessToken)
  const refreshToken = useAppSelector(selectRefreshToken)

  useEffect(() => {
    if (!accessToken) return

    const fetchCurrentUser = async () => {
      console.log('[CurrentUserInitializer] Fetching current user with token')
      const result = await getCurrentUser()
      
      if (result.success) {
        console.log('[CurrentUserInitializer] User fetched successfully:', result.user.email)

        // Persist full user details together with tokens in the slice
        if (accessToken) {
          dispatch(setAuth({
            user: result.user,
            accessToken,
            refreshToken: refreshToken || null,
          }))
        } else {
        // Fallback: update just the user info
          dispatch(setUser(result.user))
        }
      } else {
        console.error('[CurrentUserInitializer] Failed to fetch user:', result.error)

        const errorMessage = result.error.toLowerCase()

        // If error is authentication related, clear the invalid token
        const isAuthError =
          errorMessage.includes('authentifi') || // "Non authentifié"
          errorMessage.includes('401') ||
          errorMessage.includes('403') ||
          errorMessage.includes('session expir')

        if (isAuthError) {
          console.log('[CurrentUserInitializer] Clearing invalid authentication')
          dispatch(clearAuth())
        }
      }
    }

    fetchCurrentUser()
  }, [accessToken, dispatch])

  return null
}
