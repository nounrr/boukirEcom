"use client"

import { useEffect } from "react"
import { useAppDispatch, useAppSelector } from "@/state/hooks"
import { setUser, selectAccessToken, clearAuth } from "@/state/slices/user-slice"
import { getCurrentUser } from "@/actions/auth/get-current-user"

/**
 * Client component that fetches and initializes current user data in Redux
 * Only runs when accessToken is present
 * Clears auth state if token is invalid (401/403)
 */
export function CurrentUserInitializer() {
  const dispatch = useAppDispatch()
  const accessToken = useAppSelector(selectAccessToken)

  useEffect(() => {
    if (!accessToken) return

    const fetchCurrentUser = async () => {
      console.log('[CurrentUserInitializer] Fetching current user with token')
      const result = await getCurrentUser()
      
      if (result.success) {
        console.log('[CurrentUserInitializer] User fetched successfully:', result.user.email)
        dispatch(setUser(result.user))
      } else {
        console.error('[CurrentUserInitializer] Failed to fetch user:', result.error)
        // If error is authentication related, clear the invalid token
        if (result.error.includes('authentifié') || result.error.includes('401') || result.error.includes('403')) {
          console.log('[CurrentUserInitializer] Clearing invalid authentication')
          dispatch(clearAuth())
        }
      }
    }

    fetchCurrentUser()
  }, [accessToken, dispatch])

  return null
}
