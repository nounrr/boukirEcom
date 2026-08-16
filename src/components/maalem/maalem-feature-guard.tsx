"use client"

import type { ReactNode } from 'react'
import { useMaalemAccess } from '@/hooks/use-maalem-access'

interface MaalemFeatureGuardProps {
  children: ReactNode
  fallback?: ReactNode
  loadingFallback?: ReactNode
}

// UI boundary for future Maalem pages. It complements, but never replaces,
// requireApprovedMaalem on the corresponding backend endpoint.
export function MaalemFeatureGuard({
  children,
  fallback = null,
  loadingFallback = null,
}: MaalemFeatureGuardProps) {
  const { canAccessMaalemFeatures, isLoading, isFetching } = useMaalemAccess()

  if (isLoading || (isFetching && !canAccessMaalemFeatures)) return loadingFallback
  if (!canAccessMaalemFeatures) return fallback
  return children
}

