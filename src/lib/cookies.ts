import { cookies } from 'next/headers'

export interface AuthCookies {
  accessToken: string | null
  refreshToken: string | null
}

/**
 * Server-side function to read auth cookies
 * Used in layout to initialize Redux store
 */
export async function getAuthCookies(): Promise<AuthCookies> {
  const cookieStore = await cookies()
  
  return {
    accessToken: cookieStore.get('accessToken')?.value || null,
    refreshToken: cookieStore.get('refreshToken')?.value || null,
  }
}
