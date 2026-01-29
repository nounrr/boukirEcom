"use client"

import { useMemo } from "react"
import { useAppSelector } from "@/state/hooks"
import { useGetCurrentUserQuery } from "@/state/api/auth-api-slice"

function safePreviewUser(user: unknown) {
  if (!user || typeof user !== "object") return user
  const u = user as Record<string, unknown>

  // Avoid dumping huge objects; show shape + a few key fields.
  return {
    keys: Object.keys(u).sort(),
    id: u.id,
    email: u.email,
    prenom: u.prenom,
    nom: u.nom,
    avatar_url: u.avatar_url,
    type_compte: u.type_compte,
    locale: u.locale,
  }
}

/**
 * Dev-only auth diagnostics panel.
 * Enable by setting NEXT_PUBLIC_AUTH_DEBUG=1.
 */
export function AuthDebugPanel() {
  const enabled = process.env.NEXT_PUBLIC_AUTH_DEBUG === "1"
  const { user, accessToken, refreshToken, isAuthenticated } = useAppSelector((s) => s.user)

  const query = useGetCurrentUserQuery(undefined, {
    skip: !enabled || !accessToken,
  })

  const snapshot = useMemo(() => {
    return {
      redux: {
        isAuthenticated,
        hasAccessToken: !!accessToken,
        hasRefreshToken: !!refreshToken,
        userPreview: safePreviewUser(user),
      },
      rtkQuery: enabled
        ? {
            status: {
              isUninitialized: query.isUninitialized,
              isLoading: query.isLoading,
              isFetching: query.isFetching,
              isSuccess: query.isSuccess,
              isError: query.isError,
            },
            error: query.error ?? null,
            dataPreview: safePreviewUser(query.data),
          }
        : { enabled: false },
    }
  }, [accessToken, enabled, isAuthenticated, query, refreshToken, user])

  if (!enabled) return null

  return (
    <div className="fixed bottom-3 right-3 z-9999 max-w-[520px]">
      <details className="rounded-xl border border-border bg-background/95 backdrop-blur shadow-lg">
        <summary className="cursor-pointer px-3 py-2 text-xs font-semibold text-foreground">
          Auth Debug
        </summary>
        <pre className="max-h-[60vh] overflow-auto p-3 text-[11px] leading-relaxed text-foreground">
{JSON.stringify(snapshot, null, 2)}
        </pre>
      </details>
    </div>
  )
}
