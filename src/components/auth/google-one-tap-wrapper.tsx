'use client'

import { usePathname } from 'next/navigation'
import { GoogleOneTap } from './google-one-tap'
import { GOOGLE_ONE_TAP_CONFIG } from '@/lib/google-one-tap-config'

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
  
  console.log('[Google One Tap Wrapper] Pathname:', pathname)
  console.log('[Google One Tap Wrapper] Is Auth Page:', isAuthPage)
  console.log('[Google One Tap Wrapper] Excluded Paths:', GOOGLE_ONE_TAP_CONFIG.EXCLUDED_PATHS)
  
  // Don't render on auth pages to prevent conflicts with login form
  if (isAuthPage) {
    console.log('[Google One Tap Wrapper] Skipping - on auth page:', pathname)
    return null
  }
  
  console.log('[Google One Tap Wrapper] Rendering GoogleOneTap component')
  return <GoogleOneTap />
}
