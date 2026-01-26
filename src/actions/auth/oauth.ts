"use server"

import { cookies } from "next/headers"
import { apiClient, getErrorMessage } from "@/lib/axios"

type GoogleAuthResponse = {
  success: true
  accessToken: string
  refreshToken: string | null
  user: {
    id: number
    prenom: string
    nom: string
    email: string
    telephone: string | null
    type_compte: string
    avatar_url: string | null
    locale: string
  }
  isNewUser: boolean
} | {
  success: false
  error: string
}

/**
 * Authenticate user with Google OAuth
 * @param credential - JWT credential token from Google Identity Services
 * @param role - Optional role for new users ("client" | "artisan-promoter")
 */
export async function googleAuth(
  credential: string,
  role?: "client" | "artisan-promoter"
): Promise<GoogleAuthResponse> {
  try {
    console.log('[GOOGLE AUTH] Action called')
    console.log('[GOOGLE AUTH] Credential preview:', credential.substring(0, 50) + '...')
    console.log('[GOOGLE AUTH] Credential length:', credential.length)
    console.log('[GOOGLE AUTH] Role:', role)
    
    if (!credential || credential.trim() === '') {
      console.error('[GOOGLE AUTH] Empty credential received!')
      return {
        success: false,
        error: "Token manquant",
      }
    }
    
    // Map frontend role to backend type_compte
    const typeCompte = role === "artisan-promoter" ? "Artisan/Promoteur" : "Client"
    
    // Backend expects 'credential' field (the JWT from Google)
    const requestBody = {
      credential: credential,
      type_compte: typeCompte,
    }
    
    console.log('[GOOGLE AUTH] Sending to:', '/users/auth/google')
    console.log('[GOOGLE AUTH] Request body:', JSON.stringify(requestBody, null, 2))
    
    const response = await apiClient.post('/users/auth/google', requestBody)

    const data = response.data
    const token = data.token || data.accessToken
    console.log('[GOOGLE AUTH] Response:', {
      status: response.status,
      hasToken: !!token,
      isNewUser: data.isNewUser,
      dataKeys: Object.keys(data)
    })

    if (!token) {
      return {
        success: false,
        error: "Réponse invalide du serveur",
      }
    }

    // Set authentication tokens in cookies
    const cookieStore = await cookies()
    cookieStore.set("accessToken", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    })
    
    // Refresh tokens are not used in this project

    console.log('[GOOGLE AUTH] Success! Token set in cookies')
    return {
      success: true,
      accessToken: token,
      refreshToken: null,
      user: data.user,
      isNewUser: data.isNewUser || false,
    }
  } catch (error) {
    console.error('[GOOGLE AUTH] Error details:', error)
    
    // Log more details about axios errors
    if (error && typeof error === 'object' && 'response' in error) {
      const axiosError = error as any
      console.error('[GOOGLE AUTH] Response status:', axiosError.response?.status)
      console.error('[GOOGLE AUTH] Response data:', axiosError.response?.data)
      console.error('[GOOGLE AUTH] Response headers:', axiosError.response?.headers)
    }
    
    return {
      success: false,
      error: getErrorMessage(error),
    }
  }
}

/**
 * Authenticate user with Facebook OAuth
 * @param accessToken - Access token from Facebook SDK
 * @param role - Optional role for new users ("client" | "artisan-promoter")
 */
export async function facebookAuth(
  accessToken: string,
  role?: "client" | "artisan-promoter"
): Promise<GoogleAuthResponse> {
  try {
    console.log('[FACEBOOK AUTH] Action called')
    console.log('[FACEBOOK AUTH] Access token length:', accessToken.length)
    console.log('[FACEBOOK AUTH] Role:', role)
    
    // Map frontend role to backend type_compte
    const typeCompte = role === "artisan-promoter" ? "Artisan/Promoteur" : "Client"
    
    const response = await apiClient.post('/users/auth/facebook', {
      accessToken,
      type_compte: typeCompte,
    })

    const data = response.data
    console.log('[FACEBOOK AUTH] Response:', {
      status: response.status,
      hasToken: !!data.token,
      isNewUser: data.isNewUser
    })

    if (!data.token) {
      return {
        success: false,
        error: "Réponse invalide du serveur",
      }
    }

    // Set authentication tokens in cookies
    const cookieStore = await cookies()
    cookieStore.set("accessToken", data.token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    })
    
    // Refresh tokens are not used in this project

    console.log('[FACEBOOK AUTH] Success! Token set in cookies')
    return {
      success: true,
      accessToken: data.token,
      refreshToken: null,
      user: data.user,
      isNewUser: data.isNewUser || false,
    }
  } catch (error) {
    console.error('[FACEBOOK AUTH] Error:', error)
    return {
      success: false,
      error: getErrorMessage(error),
    }
  }
}
