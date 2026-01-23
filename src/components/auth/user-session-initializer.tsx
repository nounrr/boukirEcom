"use client"

import { useEffect } from "react"
import { useAppDispatch, useAppSelector } from "@/state/hooks"
import { clearAuth, selectAccessToken, selectUser, setAuth } from "@/state/slices/user-slice"

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

  useEffect(() => {
    const cookieAccessToken = session?.accessToken ?? null

    // If cookies no longer contain a token but client still does, clear client auth.
    if (!cookieAccessToken && currentAccessToken) {
      dispatch(clearAuth())
      return
    }

    // If token didn't change and we already have user data, don't overwrite it.
    if (cookieAccessToken && cookieAccessToken === currentAccessToken && currentUser) {
      return
    }

    // If token changed (or we have token but no user yet), initialize tokens.
    if (cookieAccessToken) {
      dispatch(
        setAuth({
          user: currentUser ?? null,
          accessToken: cookieAccessToken,
          refreshToken: session?.refreshToken ?? null,
        })
      )
    }
  }, [currentAccessToken, currentUser, dispatch, session])

  return null
}
