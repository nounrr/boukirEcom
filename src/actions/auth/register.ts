"use server"

import { cookies } from "next/headers"
import { apiClient, getErrorMessage } from "@/lib/axios"

type RegisterResponse = {
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
} | {
  success: false
  error: string
}

export async function register(formData: FormData): Promise<RegisterResponse> {
  try {
    const firstName = formData.get('firstName') as string
    const lastName = formData.get('lastName') as string
    const email = formData.get('email') as string
    const phone = formData.get('phone') as string
    const password = formData.get('password') as string
    const confirmPassword = formData.get('confirmPassword') as string

    const role = formData.get('role') as string

    const isCompanyRaw = formData.get('isCompany')
    const isCompany = typeof isCompanyRaw === 'string' ? isCompanyRaw === 'true' : false
    const companyName = (formData.get('companyName') as string | null) ?? ''
    const ice = (formData.get('ice') as string | null) ?? ''

    console.log('[REGISTER] Action called')
    console.log('[REGISTER] Email:', email)
    console.log('[REGISTER] Role:', role)
    
    // Map frontend role to backend type_compte
    const typeCompte = role === "artisan-promoter" ? "Artisan/Promoteur" : "Client"

    const payload: Record<string, any> = {
      prenom: firstName.trim(),
      nom: lastName.trim(),
      email: email.toLowerCase().trim(),
      telephone: phone.trim(),
      type_compte: typeCompte,
      password: password,
      confirm_password: confirmPassword,
    }

    // Client profile details (required by backend)
    if (typeCompte === 'Client') {
      payload.profil_client = isCompany ? 'societe' : 'particulier'

      if (isCompany) {
        const cleanedIce = ice.replace(/\D+/g, '')
        if (companyName.trim()) payload.societe = companyName.trim()
        if (cleanedIce) payload.ice = cleanedIce
      }
    }

    const response = await apiClient.post('/users/auth/register', payload)

    const data = response.data
    console.log('[REGISTER] Response:', { status: response.status, hasToken: !!data.token })

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

    console.log('[REGISTER] Success! Token set in cookies')
    return {
      success: true,
      accessToken: data.token,
      refreshToken: null,
      user: data.user,
    }
  } catch (error) {
    console.error('[REGISTER] Error:', error)
    return {
      success: false,
      error: getErrorMessage(error),
    }
  }
}
