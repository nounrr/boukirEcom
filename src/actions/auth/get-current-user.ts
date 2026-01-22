"use server"

import { cookies } from "next/headers"
import { apiClient, getErrorMessage } from "@/lib/axios"
import axios from "axios"

type GetCurrentUserResponse = {
  success: true
  user: {
    id: number
    prenom: string
    nom: string
    email: string
    telephone: string | null
    type_compte: string
    auth_provider?: string
    email_verified?: boolean
    avatar_url: string | null
    locale: string
    last_login_at?: string
    created_at?: string
    demande_artisan?: boolean
    artisan_approuve?: boolean
    remise_balance?: number
    is_solde?: boolean | number
  }
  newAccessToken?: string
} | {
  success: false
  error: string
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
const BASE_URL = API_URL.endsWith('/api') ? API_URL : `${API_URL}/api`

/**
 * Try to refresh the access token using the refresh token
 */
async function tryRefreshToken(refreshToken: string): Promise<string | null> {
  try {
    const response = await axios.post(`${BASE_URL}/users/auth/refresh`, {
      refreshToken,
    })

    if (response.data?.token) {
      return response.data.token
    }
    return null
  } catch (error) {
    console.error('[GET CURRENT USER] Token refresh failed:', error)
    return null
  }
}

/**
 * Get current authenticated user from backend
 * Requires valid accessToken in cookies
 * Will attempt to refresh token if expired
 */
export async function getCurrentUser(): Promise<GetCurrentUserResponse> {
  try {
    const cookieStore = await cookies()
    let accessToken = cookieStore.get('accessToken')?.value
    const refreshToken = cookieStore.get('refreshToken')?.value

    if (!accessToken) {
      // No access token - try to use refresh token
      if (refreshToken) {
        console.log('[GET CURRENT USER] No access token, trying refresh token')
        const newToken = await tryRefreshToken(refreshToken)
        if (newToken) {
          accessToken = newToken
          // Update the cookie with new token
          cookieStore.set('accessToken', newToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7,
            path: '/',
          })
        } else {
          // Refresh failed, clear invalid refresh token
          cookieStore.delete('refreshToken')
          return {
            success: false,
            error: "Session expirée - veuillez vous reconnecter",
          }
        }
      } else {
        return {
          success: false,
          error: "Non authentifié",
        }
      }
    }

    // Make request with access token
    const response = await axios.get(`${BASE_URL}/users/auth/me`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    })

    const data = response.data

    if (!data.user) {
      return {
        success: false,
        error: "Réponse invalide du serveur",
      }
    }

    console.log('[GET CURRENT USER] Success:', data.user.email)
    return {
      success: true,
      user: data.user,
    }
  } catch (error: any) {
    console.error('[GET CURRENT USER] Error:', error?.response?.status, error?.message)

    // If 401, try to refresh the token
    if (error.response?.status === 401) {
      const cookieStore = await cookies()
      const refreshToken = cookieStore.get('refreshToken')?.value

      if (refreshToken) {
        console.log('[GET CURRENT USER] Got 401, attempting token refresh')
        const newToken = await tryRefreshToken(refreshToken)

        if (newToken) {
          // Update cookie
          cookieStore.set('accessToken', newToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax',
            maxAge: 60 * 60 * 24 * 7,
            path: '/',
          })

          // Retry the request with new token
          try {
            const retryResponse = await axios.get(`${BASE_URL}/users/auth/me`, {
              headers: {
                Authorization: `Bearer ${newToken}`,
                'Content-Type': 'application/json',
              },
            })

            if (retryResponse.data?.user) {
              console.log('[GET CURRENT USER] Retry successful after token refresh')
              return {
                success: true,
                user: retryResponse.data.user,
                newAccessToken: newToken,
              }
            }
          } catch (retryError) {
            console.error('[GET CURRENT USER] Retry failed:', retryError)
          }
        }
      }

      // Refresh failed or no refresh token, clear cookies
      console.log('[GET CURRENT USER] Authentication failed, clearing cookies')
      cookieStore.delete('accessToken')
      cookieStore.delete('refreshToken')

      return {
        success: false,
        error: "Session expirée - veuillez vous reconnecter",
      }
    }

    // For 403 or other errors
    if (error.response?.status === 403) {
      const cookieStore = await cookies()
      cookieStore.delete('accessToken')
      cookieStore.delete('refreshToken')

      return {
        success: false,
        error: "Accès refusé - veuillez vous reconnecter",
      }
    }

    return {
      success: false,
      error: getErrorMessage(error),
    }
  }
}
