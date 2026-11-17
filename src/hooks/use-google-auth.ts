"use client"

import { useEffect, useCallback, useRef, useState } from "react"
import { useRouter } from "next/navigation"
import { googleAuth } from "@/actions/auth/oauth"
import { useToast } from "@/hooks/use-toast"
import { useTranslations } from "next-intl"
import { useAppDispatch } from "@/state/hooks"
import { setAuth } from "@/state/slices/user-slice"

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: GoogleIdConfig) => void
          prompt: (callback?: (notification: PromptNotification) => void) => void
          renderButton: (
            parent: HTMLElement,
            options: GoogleButtonConfig
          ) => void
          disableAutoSelect: () => void
          cancel: () => void
        }
      }
    }
  }
}

interface GoogleIdConfig {
  client_id: string
  callback: (response: GoogleCredentialResponse) => void
  auto_select?: boolean
  cancel_on_tap_outside?: boolean
  context?: "signin" | "signup" | "use"
  ux_mode?: "popup" | "redirect"
  login_uri?: string
  native_callback?: (response: GoogleCredentialResponse) => void
  itp_support?: boolean
}

interface GoogleCredentialResponse {
  credential: string
  select_by?: string
  clientId?: string
}

interface GoogleButtonConfig {
  type?: "standard" | "icon"
  theme?: "outline" | "filled_blue" | "filled_black"
  size?: "large" | "medium" | "small"
  text?: "signin_with" | "signup_with" | "continue_with" | "signin"
  shape?: "rectangular" | "pill" | "circle" | "square"
  logo_alignment?: "left" | "center"
  width?: string | number
  locale?: string
}

interface PromptNotification {
  isDisplayMoment: () => boolean
  isDisplayed: () => boolean
  isNotDisplayed: () => boolean
  getNotDisplayedReason: () => string
  isSkippedMoment: () => boolean
  isDismissedMoment: () => boolean
  getMomentType: () => string
}

interface UseGoogleAuthOptions {
  onSuccess?: (user: any) => void
  onError?: (error: string, field?: string) => void
  role?: "client" | "artisan-promoter" | "promoter"
  artisanPath?: 'ecommerce' | 'maalem'
  maalemCategoryId?: number | null
  maalemRedirectTo?: string
  redirectTo?: string
  autoSelect?: boolean
  context?: "signin" | "signup" | "use"
  skipRedirect?: boolean
}

/** Google sign-in needs this public id; without it (e.g. a local copy) the Google buttons and One Tap stay hidden. */
const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || ""
export const isGoogleAuthConfigured = GOOGLE_CLIENT_ID.length > 0

const isDev = process.env.NODE_ENV !== "production"
/** Development-only trace. Never pass tokens, credentials or server answers to it. */
const debug = (...args: unknown[]) => {
  if (isDev) console.debug("[Google Auth]", ...args)
}
let warnedMissingClientId = false

export function useGoogleAuth(options: UseGoogleAuthOptions = {}) {
  const {
    onSuccess,
    onError,
    role = "client",
    artisanPath = 'ecommerce',
    maalemCategoryId = null,
    maalemRedirectTo = '/profile/maalem',
    redirectTo = "/",
    autoSelect = false,
    context = "signin",
    skipRedirect = false,
  } = options

  const router = useRouter()
  const toast = useToast()
  const t = useTranslations("toast.auth")
  const dispatch = useAppDispatch()
  const [isLoading, setIsLoading] = useState(false)
  const [isScriptLoaded, setIsScriptLoaded] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const credentialInFlightRef = useRef(false)
  const signInInFlightRef = useRef(false)

  // Load Google Identity Services script
  useEffect(() => {
    if (isScriptLoaded || typeof window === "undefined") return
    if (!isGoogleAuthConfigured) {
      // Said once, quietly: the site works without Google sign-in (email / password stay available).
      if (isDev && !warnedMissingClientId) {
        warnedMissingClientId = true
        console.warn("[Google Auth] NEXT_PUBLIC_GOOGLE_CLIENT_ID is not set: Google sign-in is hidden.")
      }
      return
    }
    // Already on the page (another component loaded it): reuse it.
    if (window.google?.accounts?.id) {
      setIsScriptLoaded(true)
      return
    }

    const script = document.createElement("script")
    script.src = "https://accounts.google.com/gsi/client"
    script.async = true
    script.defer = true
    script.onload = () => {
      debug("script loaded")
      setIsScriptLoaded(true)
    }
    script.onerror = () => {
      console.warn("[Google Auth] Google Identity Services could not be loaded")
      toast.error(t("googleLoadError"), { description: t("googleLoadErrorDesc") })
    }

    document.body.appendChild(script)

    return () => {
      // Cleanup script on unmount
      if (script.parentNode) {
        script.parentNode.removeChild(script)
      }
    }
  }, [isScriptLoaded, toast, t])

  // Handle Google credential response
  const handleCredentialResponse = useCallback(
    async (response: GoogleCredentialResponse) => {
      if (credentialInFlightRef.current) return
      credentialInFlightRef.current = true
      debug("credential received")
      setIsLoading(true)

      try {
        if (!response.credential) {
          toast.error(t("googleError"), { description: t("missingTokenDesc") })
          setIsLoading(false)
          return
        }

        const result = await googleAuth(response.credential, role, artisanPath, maalemCategoryId)

        if (result.success) {
          debug("signed in")

          // Dispatch to Redux store
          if (result.accessToken) {
            dispatch(setAuth({
              user: result.user ?? null,
              accessToken: result.accessToken,
              refreshToken: null
            }))
          }
          
          // Show success toast
          const firstName = result.user?.prenom || result.user?.nom || result.user?.email || t("fallbackName")
          if (result.isNewUser) {
            toast.success(t("registerSuccess"), { description: t("registerSuccessDesc", { name: firstName }) })
          } else {
            toast.success(t("loginSuccess"), { description: t("loginSuccessDesc", { name: firstName }) })
          }

          // Call success callback
          if (onSuccess) {
            onSuccess(result.user)
          }

          // A newly-created Maalem draft must always continue to KAN-5, including
          // registrations started from an AuthDialog.
          if (result.nextPath && result.isNewUser) {
            setTimeout(() => {
              router.push(maalemRedirectTo)
              router.refresh()
            }, 300)
          } else if (!skipRedirect) {
            setTimeout(() => {
              router.push(redirectTo)
              router.refresh()
            }, 500)
          }
        } else {
          debug("sign-in refused by the server")

          // Friendlier guidance for common backend responses
          const msg = (result.error || '').toLowerCase()
          const needsOriginHelp = msg.includes('token manquant') || msg.includes('token google invalide')
          const description = needsOriginHelp
            ? t("originNotAllowedDesc", { origin: "http://localhost:3002" })
            : result.error

          toast.error(t("googleError"), { description })
          
          if (onError) {
            onError(description, result.field)
          }
        }
      } catch (error) {
        debug("unexpected error", error instanceof Error ? error.message : "unknown")
        const errorMessage = error instanceof Error ? error.message : t("unexpectedErrorDesc")
        toast.error(t("googleError"), { description: errorMessage })
        
        if (onError) {
          onError(errorMessage)
        }
      } finally {
        credentialInFlightRef.current = false
        setIsLoading(false)
      }
    },
    [role, artisanPath, maalemCategoryId, maalemRedirectTo, router, redirectTo, toast, t, dispatch, onSuccess, onError, skipRedirect]
  )

  // Initialize Google Identity Services
  useEffect(() => {
    if (!isGoogleAuthConfigured || !isScriptLoaded || typeof window === "undefined" || !window.google) return

    try {
      window.google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse,
        auto_select: autoSelect,
        cancel_on_tap_outside: false,
        context: context,
        ux_mode: "popup",
        itp_support: true,
      })

      setIsInitialized(true)
      debug("initialized")
    } catch (error) {
      console.warn("[Google Auth] Initialization failed", error instanceof Error ? error.message : "")
    }
  }, [isScriptLoaded, handleCredentialResponse, autoSelect, context])

  // Render Google Sign-In button
  const renderButton = useCallback(
    (element: HTMLElement, config: Partial<GoogleButtonConfig> = {}) => {
      if (!isInitialized || !window.google) return

      const defaultConfig: GoogleButtonConfig = {
        type: "standard",
        theme: "outline",
        size: "large",
        text: context === "signup" ? "signup_with" : "signin_with",
        shape: "rectangular",
        logo_alignment: "left",
        width: "100%",
      }

      try {
        window.google.accounts.id.renderButton(element, {
          ...defaultConfig,
          ...config,
        })
      } catch (error) {
        console.warn("[Google Auth] Button could not be rendered", error instanceof Error ? error.message : "")
      }
    },
    [isInitialized, context]
  )

  // Trigger One Tap prompt
  const promptOneTap = useCallback(() => {
    if (!isInitialized || !window.google) return

    try {
      window.google.accounts.id.prompt((notification) => {
        if (notification.isNotDisplayed()) debug("One Tap not shown:", notification.getNotDisplayedReason())
      })
    } catch (error) {
      console.warn("[Google Auth] One Tap failed", error instanceof Error ? error.message : "")
    }
  }, [isInitialized])

  // Programmatically trigger Google Sign-In (for custom buttons)
  const signIn = useCallback(() => {
    if (signInInFlightRef.current) return
    if (!isInitialized || !window.google) {
      toast.error(t("googleLoadError"), { description: t("googleLoadErrorDesc") })
      return
    }

    signInInFlightRef.current = true
    setIsLoading(true)

    try {
      // Create a hidden container for the Google button
      const hiddenContainer = document.createElement('div')
      hiddenContainer.style.position = 'absolute'
      hiddenContainer.style.top = '-9999px'
      hiddenContainer.style.left = '-9999px'
      document.body.appendChild(hiddenContainer)

      // Render the actual Google button in the hidden container
      window.google.accounts.id.renderButton(hiddenContainer, {
        type: "standard",
        theme: "outline",
        size: "large",
        text: context === "signup" ? "signup_with" : "signin_with",
      })

      // Find and click the Google button
      setTimeout(() => {
        const googleButton = hiddenContainer.querySelector('div[role="button"]') as HTMLElement
        if (googleButton) {
          googleButton.click()
          
          // Clean up after a delay
          setTimeout(() => {
            if (hiddenContainer.parentNode) {
              hiddenContainer.parentNode.removeChild(hiddenContainer)
            }
            signInInFlightRef.current = false
            setIsLoading(false)
          }, 1000)
        } else {
          if (hiddenContainer.parentNode) {
            hiddenContainer.parentNode.removeChild(hiddenContainer)
          }
          signInInFlightRef.current = false
          setIsLoading(false)
          toast.error(t("googleError"), { description: t("initFailedDesc") })
        }
      }, 100)
    } catch (error) {
      debug("sign-in trigger failed", error instanceof Error ? error.message : "")
      signInInFlightRef.current = false
      setIsLoading(false)
      toast.error(t("googleError"), { description: t("initFailedDesc") })
    }
  }, [isInitialized, toast, t, context])

  // Cancel One Tap
  const cancelOneTap = useCallback(() => {
    if (window.google) {
      window.google.accounts.id.cancel()
    }
  }, [])

  return {
    isLoading,
    /** Google is loaded and set up: One Tap and the button can be used. */
    isReady: isInitialized,
    /** False when the site has no Google client id: hide every Google button. */
    isConfigured: isGoogleAuthConfigured,
    renderButton,
    signIn,
    promptOneTap,
    cancelOneTap,
  }
}
