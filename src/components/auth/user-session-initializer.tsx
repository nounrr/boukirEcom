"use client"

import { useEffect } from "react"
import { useAppDispatch } from "@/state/hooks"
import { setAuth } from "@/state/slices/user-slice"

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

  useEffect(() => {
    if (session?.accessToken) {
      dispatch(setAuth({
        user: null, // Will be set by CurrentUserInitializer
        accessToken: session.accessToken,
        refreshToken: session.refreshToken,
      }))
    }
  }, [session, dispatch])

  return null
}
