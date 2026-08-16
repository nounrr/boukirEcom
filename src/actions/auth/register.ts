"use server"

import { cookies } from "next/headers"
import { apiClient, axios, getErrorMessage } from "@/lib/axios"
import type { User } from "@/state/slices/user-slice"

type RegisterField =
  | 'firstName'
  | 'lastName'
  | 'email'
  | 'phone'
  | 'password'
  | 'confirmPassword'
  | 'role'
  | 'artisanPath'
  | 'maalemCategoryId'
  | 'companyName'
  | 'ice'

const BACKEND_FIELD_MAP: Record<string, RegisterField> = {
  prenom: 'firstName',
  nom: 'lastName',
  email: 'email',
  telephone: 'phone',
  password: 'password',
  confirm_password: 'confirmPassword',
  type_compte: 'role',
  artisan_path: 'artisanPath',
  maalem_category_id: 'maalemCategoryId',
  societe: 'companyName',
  ice: 'ice',
}

type RegisterResponse = {
  success: true
  accessToken: string
  refreshToken: string | null
  user: User
  nextPath: string | null
} | {
  success: false
  error: string
  field?: RegisterField
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
    const artisanPath = formData.get('artisanPath') === 'maalem' ? 'maalem' : 'ecommerce'
    const maalemCategoryValue = formData.get('maalemCategoryId')
    const maalemCategoryId = typeof maalemCategoryValue === 'string' && maalemCategoryValue
      ? Number(maalemCategoryValue)
      : null

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

    if (typeCompte === 'Artisan/Promoteur') {
      payload.artisan_path = artisanPath
      if (artisanPath === 'maalem' && Number.isInteger(maalemCategoryId) && maalemCategoryId! > 0) {
        payload.maalem_category_id = maalemCategoryId
      }
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
      nextPath: typeof data.next_path === 'string' ? data.next_path : null,
    }
  } catch (error) {
    console.error('[REGISTER] Error:', error)
    const backendField = axios.isAxiosError(error) && typeof error.response?.data?.field === 'string'
      ? BACKEND_FIELD_MAP[error.response.data.field]
      : undefined
    return {
      success: false,
      error: getErrorMessage(error),
      field: backendField,
    }
  }
}
