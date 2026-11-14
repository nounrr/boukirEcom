import { NextResponse } from "next/server"
import { clearAuthCookies } from "@/lib/cookies"

export async function POST() {
  // JWT logout is cookie removal; it must not wait for an optional backend call.
  await clearAuthCookies()
  return NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } })
}
