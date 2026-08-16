"use client"

import { useGetMaalemAccessQuery } from '@/state/api/auth-api-slice'
import { useAppSelector } from '@/state/hooks'

const LIVE_ACCESS_POLL_INTERVAL_MS = 30_000

export function useMaalemAccess() {
  const isAuthenticated = useAppSelector((state) => state.user.isAuthenticated)
  const query = useGetMaalemAccessQuery(undefined, {
    skip: !isAuthenticated,
    pollingInterval: LIVE_ACCESS_POLL_INTERVAL_MS,
    refetchOnFocus: true,
    refetchOnReconnect: true,
    refetchOnMountOrArgChange: true,
  })

  const allowed = Boolean(isAuthenticated && query.data?.allowed)

  return {
    ...query,
    access: query.data ?? null,
    canAccessMaalemFeatures: allowed,
    isApprovedMaalem: allowed,
    canReceiveServiceAssignments: Boolean(
      allowed && query.data?.capabilities.service_assignments
    ),
  }
}

