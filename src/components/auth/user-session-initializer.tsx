"use client"

import { useEffect, useRef } from "react"
import { useAppDispatch, useAppSelector } from "@/state/hooks"
import { selectAccessToken, selectUser, setAuth } from "@/state/slices/user-slice"

interface UserSessionInitializerProps {
  session: {
    accessToken: string | null
    refreshToken: string | null
  } | null
}

/**
 * Client component that initializes Redux auth state from server-side cookies
 * Must be rendered inside StoreProvider
 */
export function UserSessionInitializer({ session }: UserSessionInitializerProps) {
  const dispatch = useAppDispatch()
  const currentAccessToken = useAppSelector(selectAccessToken)
  const currentUser = useAppSelector(selectUser)
  const initializedToken = useRef<string | null>(null)

  useEffect(() => {
    const cookieAccessToken = session?.accessToken ?? null

    // If cookies don't contain a token, avoid clearing client auth here.
    // The server-side user fetch will invalidate and clear tokens if needed.
    if (!cookieAccessToken) {
      initializedToken.current = null
      return
    }

    // Server layout props can remain stale while logout/navigation is pending.
    // Never restore that same token after clearAuth has deliberately removed it.
    if (initializedToken.current === cookieAccessToken) return
    initializedToken.current = cookieAccessToken

    // If token didn't change and we already have user data, don't overwrite it.
    if (cookieAccessToken && cookieAccessToken === currentAccessToken && currentUser) {
      console.log('[UserSessionInitializer] Token unchanged and user exists - skipping')
      return
    }

    // If token changed, initialize tokens only (user will be fetched separately).
    if (cookieAccessToken && cookieAccessToken !== currentAccessToken) {
      console.log('[UserSessionInitializer] Setting token in Redux (token changed)')
      dispatch(
        setAuth({
          user: null, // Don't pass currentUser to avoid triggering re-render loop
          accessToken: cookieAccessToken,
          refreshToken: session?.refreshToken ?? null,
        })
      )
    }
  }, [currentAccessToken, dispatch, session]) // Removed currentUser from dependencies

  return null
}
