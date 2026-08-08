import { API_CONFIG } from "@/lib/api-config"

/**
 * Normalizes backend-provided image URLs.
 * - Accepts absolute http(s) URLs
 * - Converts relative paths (e.g. `/uploads/...` or `uploads/...`) to absolute URLs using `API_CONFIG.BASE_URL`
 * - Returns null for empty/invalid placeholders
 */
export function toAbsoluteImageUrl(imageUrl?: string | null): string | null {
  const raw = String(imageUrl ?? "").trim()
  if (!raw) return null
  if (raw === "null" || raw === "undefined") return null

  if (/^https?:\/\//i.test(raw)) return raw

  // Project-owned editorial fallbacks live in Next's public directory and
  // must not be rewritten to the commerce API host.
  if (raw.startsWith('/product-fallbacks/')) return raw

  const base = String(API_CONFIG.BASE_URL || "").replace(/\/+$/, "")
  const path = raw.startsWith("/") ? raw : `/${raw}`

  return base ? `${base}${path}` : path
}
