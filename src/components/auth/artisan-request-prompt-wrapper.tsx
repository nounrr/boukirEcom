"use client"

import { usePathname } from "next/navigation"

import { ARTISAN_REQUEST_PROMPT_CONFIG } from "@/lib/artisan-request-prompt-config"
import { ArtisanRequestPrompt } from "./artisan-request-prompt"

/**
 * Conditional wrapper for the Artisan request prompt.
 * Keeps behavior consistent with Google One Tap: exclude auth pages.
 */
export function ArtisanRequestPromptWrapper() {
  const pathname = usePathname()

  const isExcludedPath = ARTISAN_REQUEST_PROMPT_CONFIG.EXCLUDED_PATHS.some((p) =>
    (pathname || "").includes(p)
  )

  if (isExcludedPath) return null
  return <ArtisanRequestPrompt />
}
