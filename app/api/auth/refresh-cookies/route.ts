import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

/**
 * API route to update auth cookies after token refresh
 * Called from client-side when RTK Query refreshes the token
 */
export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { accessToken, refreshToken } = body

    if (!accessToken) {
      return NextResponse.json(
        { error: 'Access token required' },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()

    // Update access token
    cookieStore.set('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: '/',
    })

    // Update refresh token if provided
    if (refreshToken) {
      cookieStore.set('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('[REFRESH-COOKIES] Error:', error)
    return NextResponse.json(
      { error: 'Failed to update cookies' },
      { status: 500 }
    )
  }
}
