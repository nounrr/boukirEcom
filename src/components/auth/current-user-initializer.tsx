"use client"

import { useEffect } from "react"
import { useAppDispatch, useAppSelector } from "@/state/hooks"
import { setUser, selectAccessToken } from "@/state/slices/user-slice"
import { getCurrentUser } from "@/actions/auth/get-current-user"

/**
 * Client component that fetches and initializes current user data in Redux
 * Only runs when accessToken is present
 */
export function CurrentUserInitializer() {
  const dispatch = useAppDispatch()
  const accessToken = useAppSelector(selectAccessToken)

  useEffect(() => {
    if (!accessToken) return

    const fetchCurrentUser = async () => {
      const result = await getCurrentUser()
      
      if (result.success) {
        dispatch(setUser(result.user))
      }
    }

    fetchCurrentUser()
  }, [accessToken, dispatch])

  return null
}
