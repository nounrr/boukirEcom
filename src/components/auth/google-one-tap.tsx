'use client'

import { useEffect, useState, useCallback, useRef } from 'react'
import { useAppSelector } from '@/state/hooks'
import { useGoogleAuth } from '@/hooks/use-google-auth'
import { usePathname } from 'next/navigation'
import { 
  shouldShowOneTap, 
  markOneTapDismissed,
  GOOGLE_ONE_TAP_CONFIG 
} from '@/lib/google-one-tap-config'

// Global flag to prevent multiple One Tap instances
let isOneTapActive = false
let oneTapTimeout: NodeJS.Timeout | null = null

/**
 * Google One Tap Component
 * Displays Google's automatic sign-in popup for unauthenticated users
 * Appears on all pages except auth pages
 * Respects user dismissal and cooldown periods
 */
export function GoogleOneTap() {
  const { isAuthenticated } = useAppSelector((state) => state.user)
  const pathname = usePathname()
  const [showCount, setShowCount] = useState(0)
  const hasShownRef = useRef(false)
  const isMountedRef = useRef(true)
  
  const { promptOneTap, isReady, cancelOneTap } = useGoogleAuth({
    context: 'signin',
    autoSelect: false,
    onSuccess: () => {
      console.log('[Google One Tap] Sign-in successful')
      isOneTapActive = false
      hasShownRef.current = true
    },
    onError: () => {
      console.log('[Google One Tap] Sign-in error')
      isOneTapActive = false
    },
  })

  const handleShowOneTap = useCallback(() => {
    // Prevent multiple instances
    if (isOneTapActive) {
      console.log('[Google One Tap] Already active, skipping')
      return
    }

    if (hasShownRef.current) {
      console.log('[Google One Tap] Already shown in this session')
      return
    }

    if (!shouldShowOneTap(pathname)) {
      console.log('[Google One Tap] Skipping - on excluded path or in cooldown')
      return
    }

    if (showCount >= GOOGLE_ONE_TAP_CONFIG.MAX_SHOWS_PER_SESSION) {
      console.log('[Google One Tap] Maximum shows per session reached')
      return
    }

    if (!isMountedRef.current) {
      console.log('[Google One Tap] Component unmounted, skipping')
      return
    }

    console.log('[Google One Tap] Showing One Tap prompt')
    isOneTapActive = true
    hasShownRef.current = true
    
    try {
      promptOneTap()
      setShowCount(prev => prev + 1)
      
      // Auto-dismiss after 10 seconds if no action
      oneTapTimeout = setTimeout(() => {
        if (isMountedRef.current && !isAuthenticated) {
          console.log('[Google One Tap] Auto-dismissing after timeout')
          markOneTapDismissed()
          isOneTapActive = false
        }
      }, 10000)
    } catch (error) {
      console.error('[Google One Tap] Error showing prompt:', error)
      isOneTapActive = false
    }
    
  }, [pathname, showCount, promptOneTap, isAuthenticated])

  useEffect(() => {
    isMountedRef.current = true

    return () => {
      // Cleanup on unmount
      isMountedRef.current = false
      
      if (oneTapTimeout) {
        clearTimeout(oneTapTimeout)
        oneTapTimeout = null
      }
      
      // Cancel any active One Tap
      if (isOneTapActive) {
        console.log('[Google One Tap] Cleaning up active One Tap')
        cancelOneTap?.()
        isOneTapActive = false
      }
    }
  }, [cancelOneTap])

  useEffect(() => {
    // Only show for unauthenticated users when Google is ready
    if (!isAuthenticated && isReady && pathname && !hasShownRef.current) {
      // Small delay to ensure the page is loaded
      const timer = setTimeout(() => {
        if (isMountedRef.current) {
          handleShowOneTap()
        }
      }, GOOGLE_ONE_TAP_CONFIG.SHOW_DELAY)

      return () => {
        clearTimeout(timer)
      }
    }
  }, [isAuthenticated, isReady, pathname, handleShowOneTap])

  // This component doesn't render anything visible
  // Google's script handles the UI
  return null
}
