"use server"

import { cookies } from "next/headers"
import { apiClient, getErrorMessage } from "@/lib/axios"

type LoginResponse = {
  success: true
  accessToken: string
  refreshToken: string
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
} | {
  success: false
  error: string
}

export async function login(formData: FormData): Promise<LoginResponse> {
  try {
    const email = formData.get('email') as string
    const password = formData.get('password') as string
    
    console.log('[LOGIN] Action called')
    console.log('[LOGIN] Email:', email)
    
    const response = await apiClient.post('/users/auth/login', {
      email: email.toLowerCase().trim(),
      password: password,
    })

    const data = response.data
    console.log('[LOGIN] Response:', { status: response.status, hasToken: !!data.token })

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
    
    // Store refresh token if provided
    if (data.refreshToken) {
      cookieStore.set("refreshToken", data.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: "/",
      })
    }

    console.log('[LOGIN] Success! Token set in cookies')
    
    // Note: Redux dispatch will be handled in the component
    // Cookies are already set above for SSR
    return {
      success: true,
      accessToken: data.token,
      refreshToken: data.refreshToken || data.token,
      user: data.user,
    }
  } catch (error) {
    console.error('[LOGIN] Error:', error)
    return {
      success: false,
      error: getErrorMessage(error),
    }
  }
}

export async function logout(): Promise<{ success: boolean }> {
  try {
    const cookieStore = await cookies()
    
    // Remove auth cookies
    cookieStore.delete("accessToken")
    cookieStore.delete("refreshToken")

    // Optional: Call backend logout endpoint
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
    const token = cookieStore.get("accessToken")?.value

    if (token) {
      await fetch(`${apiUrl}/api/users/auth/logout`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
    }

    return { success: true }
  } catch (error) {
    console.error("Logout error:", error)
    return { success: true } // Still return success as cookies are cleared
  }
}
