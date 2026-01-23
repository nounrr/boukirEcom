"use server"

import { cookies } from "next/headers"
import { getErrorMessage } from "@/lib/axios"
import { clearAuthCookies } from "@/lib/cookies"
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
 * Get current authenticated user from backend
 * Requires valid accessToken in cookies
 * No refresh-token flow (single access token)
 */
export async function getCurrentUser(): Promise<GetCurrentUserResponse> {
  try {
    const cookieStore = await cookies()
    const accessToken = cookieStore.get('accessToken')?.value

    if (!accessToken) {
      return {
        success: false,
        error: "Non authentifié",
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

    console.log(data.user);

    return {
      success: true,
      user: data.user,
    }
  } catch (error: any) {
    // If 401, clear cookies and return auth error
    if (error.response?.status === 401) {
      await clearAuthCookies()

      return {
        success: false,
        error: "Session expirée - veuillez vous reconnecter",
      }
    }

    // For 403 or other errors
    if (error.response?.status === 403) {
      await clearAuthCookies()

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
