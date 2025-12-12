import axios, { AxiosError, AxiosInstance, InternalAxiosRequestConfig } from 'axios'
import { cookies } from 'next/headers'

// API base URL
const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'
const API_URL = RAW_API_URL.endsWith('/api') ? RAW_API_URL : `${RAW_API_URL}/api`

// Create axios instance
export const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    // Add auth token if available (for server-side requests)
    if (typeof window === 'undefined') {
      try {
        const cookieStore = await cookies()
        const token = cookieStore.get('accessToken')?.value
        
        if (token && config.headers) {
          config.headers.Authorization = `Bearer ${token}`
        }
      } catch (error) {
        // Cookie access might fail in some contexts, continue without token
        console.warn('[API Client] Failed to access cookies:', error)
      }
    }
    
    return config
  },
  (error) => {
    console.error('[API Client] Request error:', error)
    return Promise.reject(error)
  }
)

// Response interceptor
apiClient.interceptors.response.use(
  (response) => {
    console.log(`[API Client] ${response.config.method?.toUpperCase()} ${response.config.url} - ${response.status}`)
    return response
  },
  async (error: AxiosError) => {
    const originalRequest = error.config

    console.error('[API Client] Response error:', {
      url: originalRequest?.url,
      status: error.response?.status,
      message: error.message,
    })

    // Handle 401 Unauthorized - Token expired
    if (error.response?.status === 401 && originalRequest && typeof window === 'undefined') {
      try {
        const cookieStore = await cookies()
        const refreshToken = cookieStore.get('refreshToken')?.value

        if (refreshToken) {
          // Try to refresh the token
          const response = await axios.post(`${API_URL}/users/auth/refresh`, {
            refreshToken,
          })

          if (response.data.token) {
            // Update the access token
            cookieStore.set('accessToken', response.data.token, {
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              maxAge: 60 * 60 * 24 * 7,
              path: '/',
            })

            // Retry the original request with new token
            if (originalRequest.headers) {
              originalRequest.headers.Authorization = `Bearer ${response.data.token}`
            }
            return apiClient(originalRequest)
          }
        }
      } catch (refreshError) {
        console.error('[API Client] Token refresh failed:', refreshError)
        // Clear invalid tokens
        const cookieStore = await cookies()
        cookieStore.delete('accessToken')
        cookieStore.delete('refreshToken')
      }
    }

    return Promise.reject(error)
  }
)

// Helper function to handle API errors
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    // Server responded with error
    if (error.response?.data?.message) {
      return error.response.data.message
    }
    
    // Network error
    if (error.code === 'ECONNABORTED') {
      return 'La requête a expiré. Vérifiez que le serveur backend est démarré.'
    }
    
    if (error.code === 'ERR_NETWORK') {
      return 'Erreur de connexion au serveur. Vérifiez que le backend est en cours d\'exécution.'
    }
    
    // Default axios error message
    return error.message
  }
  
  // Generic error
  if (error instanceof Error) {
    return error.message
  }
  
  return 'Une erreur inattendue s\'est produite'
}

// Export axios for advanced usage
export { axios }
