/**
 * Google One Tap Configuration
 * Control when and where the Google One Tap prompt appears
 */

export const GOOGLE_ONE_TAP_CONFIG = {
  // Delay before showing (milliseconds)
  SHOW_DELAY: 2000, // Increased from 1500 to 2000 for better stability
  
  // Pages where One Tap should NOT appear
  EXCLUDED_PATHS: [
    '/login',
    '/register',
    '/forgot-password',
    '/reset-password',
    '/auth', // Exclude all auth routes
  ],
  
  // Cooldown period (milliseconds) - don't show again after user dismisses
  COOLDOWN_PERIOD: 5 * 60 * 1000, // 5 minutes (change to 24 * 60 * 60 * 1000 for production)
  
  // Local storage key for tracking dismissals
  STORAGE_KEY: 'google_one_tap_dismissed',
  
  // Maximum number of times to show per session
  MAX_SHOWS_PER_SESSION: 1, // Reduced from 2 to 1 to prevent conflicts
}

/**
 * Check if One Tap should be shown
 */
export function shouldShowOneTap(pathname: string): boolean {
  console.log('[Google One Tap Config] Checking shouldShowOneTap for:', pathname)
  
  // Check if on excluded path
  const isExcludedPath = GOOGLE_ONE_TAP_CONFIG.EXCLUDED_PATHS.some(path => 
    pathname?.includes(path)
  )
  
  console.log('[Google One Tap Config] Is excluded path:', isExcludedPath)
  
  if (isExcludedPath) {
    return false
  }
  
  // Check cooldown period
  try {
    const dismissed = localStorage.getItem(GOOGLE_ONE_TAP_CONFIG.STORAGE_KEY)
    console.log('[Google One Tap Config] Dismissed timestamp:', dismissed)
    
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10)
      const now = Date.now()
      const timeSinceDismissed = now - dismissedTime
      const cooldownRemaining = GOOGLE_ONE_TAP_CONFIG.COOLDOWN_PERIOD - timeSinceDismissed
      
      console.log('[Google One Tap Config] Time since dismissed:', timeSinceDismissed, 'ms')
      console.log('[Google One Tap Config] Cooldown remaining:', cooldownRemaining, 'ms')
      
      if (now - dismissedTime < GOOGLE_ONE_TAP_CONFIG.COOLDOWN_PERIOD) {
        console.log('[Google One Tap Config] Still in cooldown period')
        return false
      }
    }
  } catch (error) {
    // localStorage not available
    console.warn('[Google One Tap] LocalStorage not available:', error)
  }
  
  console.log('[Google One Tap Config] Should show: true')
  return true
}

/**
 * Mark One Tap as dismissed
 */
export function markOneTapDismissed(): void {
  try {
    localStorage.setItem(
      GOOGLE_ONE_TAP_CONFIG.STORAGE_KEY,
      Date.now().toString()
    )
  } catch (error) {
    console.warn('[Google One Tap] Failed to save dismissal state')
  }
}

/**
 * Clear One Tap dismissal state
 */
export function clearOneTapDismissal(): void {
  try {
    localStorage.removeItem(GOOGLE_ONE_TAP_CONFIG.STORAGE_KEY)
  } catch (error) {
    console.warn('[Google One Tap] Failed to clear dismissal state')
  }
}
