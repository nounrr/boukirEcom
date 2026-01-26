"use client"

import { useEffect, useCallback, useState } from "react"
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
  onError?: (error: string) => void
  role?: "client" | "artisan-promoter"
  redirectTo?: string
  autoSelect?: boolean
  context?: "signin" | "signup" | "use"
  skipRedirect?: boolean
}

export function useGoogleAuth(options: UseGoogleAuthOptions = {}) {
  const {
    onSuccess,
    onError,
    role = "client",
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

  // Load Google Identity Services script
  useEffect(() => {
    if (isScriptLoaded || typeof window === "undefined") return

    const script = document.createElement("script")
    script.src = "https://accounts.google.com/gsi/client"
    script.async = true
    script.defer = true
    script.onload = () => {
      console.log("[Google Auth] Script loaded successfully")
      setIsScriptLoaded(true)
    }
    script.onerror = () => {
      console.error("[Google Auth] Failed to load Google Identity Services script")
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
      console.log("[Google Auth] Credential received")
      console.log("[Google Auth] Response object:", response)
      console.log("[Google Auth] Credential exists:", !!response.credential)
      console.log("[Google Auth] Credential preview:", response.credential?.substring(0, 50))
      setIsLoading(true)

      try {
        if (!response.credential) {
          console.error("[Google Auth] No credential in response!")
          toast.error(t("googleError"), { description: "Token manquant" })
          setIsLoading(false)
          return
        }

        const result = await googleAuth(response.credential, role)
        console.log("[Google Auth] Backend response:", result)

        if (result.success) {
          console.log("[Google Auth] Authentication successful")
          
          // Dispatch to Redux store
          if (result.accessToken) {
            dispatch(setAuth({
              user: result.user ?? null,
              accessToken: result.accessToken,
              refreshToken: null
            }))
            console.log("[Google Auth] User data dispatched to Redux store")
          } else {
            console.warn("[Google Auth] Missing accessToken in response")
          }
          
          // Show success toast
          const firstName = result.user?.prenom || result.user?.nom || result.user?.email || "Utilisateur"
          if (result.isNewUser) {
            toast.success(t("registerSuccess"), { description: t("registerSuccessDesc", { name: firstName }) })
          } else {
            toast.success(t("loginSuccess"), { description: t("loginSuccessDesc", { name: firstName }) })
          }

          // Call success callback
          if (onSuccess) {
            onSuccess(result.user)
          }

          // Redirect after short delay (unless skipRedirect is true)
          if (!skipRedirect) {
            setTimeout(() => {
              router.push(redirectTo)
              router.refresh()
            }, 500)
          }
        } else {
          console.error("[Google Auth] Authentication failed:", result.error)

          // Friendlier guidance for common backend responses
          const msg = (result.error || '').toLowerCase()
          const needsOriginHelp = msg.includes('token manquant') || msg.includes('token google invalide')
          const description = needsOriginHelp
            ? "Impossible de vérifier le jeton Google. Vérifiez que l'origine http://localhost:3002 est autorisée dans Google Cloud Console et réessayez après 5–10 minutes."
            : result.error

          toast.error(t("googleError"), { description })
          
          if (onError) {
            onError(description)
          }
        }
      } catch (error) {
        console.error("[Google Auth] Unexpected error:", error)
        const errorMessage = error instanceof Error ? error.message : "Une erreur inattendue s'est produite"
        toast.error(t("googleError"), { description: errorMessage })
        
        if (onError) {
          onError(errorMessage)
        }
      } finally {
        setIsLoading(false)
      }
    },
    [role, router, redirectTo, toast, t, dispatch, onSuccess, onError, skipRedirect]
  )

  // Initialize Google Identity Services
  useEffect(() => {
    if (!isScriptLoaded || !window.google || typeof window === "undefined") return

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
    
    if (!clientId) {
      console.error("[Google Auth] Missing NEXT_PUBLIC_GOOGLE_CLIENT_ID")
      return
    }

    console.log("[Google Auth] Initializing with client ID:", clientId.substring(0, 20) + "...")

    try {
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: handleCredentialResponse,
        auto_select: autoSelect,
        cancel_on_tap_outside: false,
        context: context,
        ux_mode: "popup",
        itp_support: true,
      })

      console.log("[Google Auth] Initialized successfully")
    } catch (error) {
      console.error("[Google Auth] Initialization error:", error)
    }
  }, [isScriptLoaded, handleCredentialResponse, autoSelect, context])

  // Render Google Sign-In button
  const renderButton = useCallback(
    (element: HTMLElement, config: Partial<GoogleButtonConfig> = {}) => {
      if (!isScriptLoaded || !window.google) {
        console.warn("[Google Auth] Cannot render button - Google not loaded")
        return
      }

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
        console.log("[Google Auth] Button rendered successfully")
      } catch (error) {
        console.error("[Google Auth] Failed to render button:", error)
      }
    },
    [isScriptLoaded, context]
  )

  // Trigger One Tap prompt
  const promptOneTap = useCallback(() => {
    if (!isScriptLoaded || !window.google) {
      console.warn("[Google Auth] Cannot show One Tap - Google not loaded")
      return
    }

    try {
      window.google.accounts.id.prompt((notification) => {
        console.log("[Google Auth] One Tap notification:", {
          isDisplayed: notification.isDisplayed(),
          isNotDisplayed: notification.isNotDisplayed(),
          reason: notification.isNotDisplayed() ? notification.getNotDisplayedReason() : null,
        })
      })
    } catch (error) {
      console.error("[Google Auth] One Tap error:", error)
    }
  }, [isScriptLoaded])

  // Programmatically trigger Google Sign-In (for custom buttons)
  const signIn = useCallback(() => {
    if (!isScriptLoaded || !window.google) {
      console.warn("[Google Auth] Cannot sign in - Google not loaded")
      toast.error(t("googleLoadError"), { description: t("googleLoadErrorDesc") })
      return
    }

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
          console.log("[Google Auth] Triggering Google Sign-In click")
          googleButton.click()
          
          // Clean up after a delay
          setTimeout(() => {
            if (hiddenContainer.parentNode) {
              hiddenContainer.parentNode.removeChild(hiddenContainer)
            }
            setIsLoading(false)
          }, 1000)
        } else {
          console.error("[Google Auth] Could not find Google button")
          if (hiddenContainer.parentNode) {
            hiddenContainer.parentNode.removeChild(hiddenContainer)
          }
          setIsLoading(false)
          toast.error(t("googleError"), { description: "Failed to initiate Google Sign-In" })
        }
      }, 100)
    } catch (error) {
      console.error("[Google Auth] Sign-in trigger error:", error)
      setIsLoading(false)
      toast.error(t("googleError"), { description: "Failed to initiate Google Sign-In" })
    }
  }, [isScriptLoaded, toast, t, context])

  // Cancel One Tap
  const cancelOneTap = useCallback(() => {
    if (window.google) {
      window.google.accounts.id.cancel()
    }
  }, [])

  return {
    isLoading,
    isReady: isScriptLoaded,
    renderButton,
    signIn,
    promptOneTap,
    cancelOneTap,
  }
}
