import type { User } from "@/state/slices/user-slice"

export const ARTISAN_REQUEST_PROMPT_CONFIG = {
  // First time delay before showing (ms)
  SHOW_DELAY: 10_000,

  // If user ignores it, show again after this interval (ms)
  REPEAT_INTERVAL: 20_000,

  // Auto-hide after a short time (ms)
  AUTO_HIDE_AFTER: 12_000,

  // Don't spam within a single page session
  MAX_SHOWS_PER_SESSION: 3,

  // Pages where the prompt should not appear
  EXCLUDED_PATHS: ["/login", "/register", "/forgot-password", "/reset-password", "/auth"],

  STORAGE_KEY_PREFIX: "boukir_artisan_request_prompt_v1",
} as const

function keyFor(userId: number, name: string) {
  return `${ARTISAN_REQUEST_PROMPT_CONFIG.STORAGE_KEY_PREFIX}:${userId}:${name}`
}

function sessionKeyFor(userId: number, name: string) {
  return `${ARTISAN_REQUEST_PROMPT_CONFIG.STORAGE_KEY_PREFIX}:session:${userId}:${name}`
}

export function isArtisanPromptDismissed(userId: number): boolean {
  try {
    return localStorage.getItem(keyFor(userId, "dismissed")) === "1"
  } catch {
    return false
  }
}

export function markArtisanPromptDismissed(userId: number): void {
  try {
    localStorage.setItem(keyFor(userId, "dismissed"), "1")
    localStorage.setItem(keyFor(userId, "dismissed_at"), Date.now().toString())
  } catch {
    // ignore
  }
}

export function isArtisanPromptRequested(userId: number): boolean {
  try {
    return localStorage.getItem(keyFor(userId, "requested")) === "1"
  } catch {
    return false
  }
}

export function markArtisanPromptRequested(userId: number): void {
  try {
    localStorage.setItem(keyFor(userId, "requested"), "1")
    localStorage.setItem(keyFor(userId, "requested_at"), Date.now().toString())
  } catch {
    // ignore
  }
}

export function markArtisanPromptSeen(userId: number): void {
  try {
    const countKey = keyFor(userId, "seen_count")
    const prev = Number(localStorage.getItem(countKey) || "0")
    localStorage.setItem(countKey, String(prev + 1))
    localStorage.setItem(keyFor(userId, "last_seen_at"), Date.now().toString())
  } catch {
    // ignore
  }
}

export function getSessionShowCount(userId: number): number {
  try {
    return Number(sessionStorage.getItem(sessionKeyFor(userId, "shows")) || "0")
  } catch {
    return 0
  }
}

export function incrementSessionShowCount(userId: number): number {
  try {
    const next = getSessionShowCount(userId) + 1
    sessionStorage.setItem(sessionKeyFor(userId, "shows"), String(next))
    return next
  } catch {
    return 0
  }
}

export function shouldShowArtisanRequestPrompt(pathname: string | null | undefined, user: User | null, isAuthenticated: boolean): boolean {
  if (!isAuthenticated || !user) return false

  const isExcludedPath = ARTISAN_REQUEST_PROMPT_CONFIG.EXCLUDED_PATHS.some((p) =>
    (pathname || "").includes(p)
  )
  if (isExcludedPath) return false

  const type = String(user.type_compte || "").toLowerCase()
  const isClientOrContact = type.includes("client") || type.includes("contact")
  const isArtisan = type.includes("artisan") || type.includes("promoteur")

  if (!isClientOrContact || isArtisan) return false
  if (user.demande_artisan) return false
  if (user.artisan_approuve) return false

  if (isArtisanPromptDismissed(user.id)) return false
  if (isArtisanPromptRequested(user.id)) return false

  return true
}
