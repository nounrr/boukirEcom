"use server"

import { cookies } from "next/headers"
import { apiClient, getErrorMessage } from "@/lib/axios"

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
  }
} | {
  success: false
  error: string
}

/**
 * Get current authenticated user from backend
 * Requires valid accessToken in cookies
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

    const response = await apiClient.get('/users/me')

    const data = response.data

    if (!data.user) {
      return {
        success: false,
        error: "Réponse invalide du serveur",
      }
    }

    return {
      success: true,
      user: data.user,
    }
  } catch (error) {
    console.error('[GET CURRENT USER] Error:', error)
    return {
      success: false,
      error: getErrorMessage(error),
    }
  }
}
