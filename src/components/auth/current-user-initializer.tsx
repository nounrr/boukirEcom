"use client"

import { useEffect } from "react"
import { useAppDispatch, useAppSelector } from "@/state/hooks"
import { setAuth, selectAccessToken, clearAuth } from "@/state/slices/user-slice"
import { useGetCurrentUserQuery } from "@/state/api/auth-api-slice"

/**
 * Client component that fetches and initializes current user data in Redux
 * Only runs when accessToken is present
 * Clears auth state if token is invalid (401/403)
 * Updates tokens in Redux if they were refreshed server-side
 */
export function CurrentUserInitializer() {
  const dispatch = useAppDispatch()
  const accessToken = useAppSelector(selectAccessToken)

  // IMPORTANT:
  // Avoid calling a server action here. Server actions are invoked via `POST /...`
  // and can cause frequent rerenders/re-mounts in dev (and sometimes prod), which
  // looks like “POST / 200” spam. Instead, fetch via an API route (GET) using RTK Query.
  const {
    data: user,
    error,
  } = useGetCurrentUserQuery(undefined, {
    skip: !accessToken,
  })

  useEffect(() => {
    if (!accessToken || !user) return

    dispatch(
      setAuth({
        user,
        accessToken,
        refreshToken: null,
      })
    )
  }, [accessToken, dispatch, user])

  useEffect(() => {
    if (!error) return

    // RTK Query error shapes can vary; handle the common FetchBaseQueryError.
    const status = (error as any)?.status
    if (status === 401 || status === 403) {
      dispatch(clearAuth())
    }
  }, [dispatch, error])

  return null
}
