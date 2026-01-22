import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST() {
  const cookieStore = await cookies()
  const token = cookieStore.get("accessToken")?.value

  // Best-effort backend logout (optional)
  try {
    if (token) {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"
      const base = apiUrl.endsWith("/api") ? apiUrl : `${apiUrl}/api`

      await fetch(`${base}/users/auth/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })
    }
  } catch {
    // ignore backend logout failures; still clear cookies
  }

  cookieStore.delete("accessToken")
  cookieStore.delete("refreshToken")

  return NextResponse.json({ success: true })
}
