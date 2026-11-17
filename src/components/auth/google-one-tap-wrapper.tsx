'use client'

import { usePathname } from 'next/navigation'
import { GoogleOneTap } from './google-one-tap'
import { GOOGLE_ONE_TAP_CONFIG } from '@/lib/google-one-tap-config'
import { isGoogleAuthConfigured } from '@/hooks/use-google-auth'

/**
 * Conditional wrapper for Google One Tap
 * Only renders on non-auth pages
 */
export function GoogleOneTapWrapper() {
  const pathname = usePathname()
  
  // Check if on auth page
  const isAuthPage = GOOGLE_ONE_TAP_CONFIG.EXCLUDED_PATHS.some(path => 
    pathname?.includes(path)
  )
  
  // Don't render on auth pages to prevent conflicts with login form, nor when Google sign-in is not set up
  if (isAuthPage || !isGoogleAuthConfigured) {
    return null
  }
  
  return <GoogleOneTap />
}
