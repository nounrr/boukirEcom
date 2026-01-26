"use client"

import { createContext, useCallback, useContext, useMemo, useState } from "react"
import { AuthDialog, AuthDialogMode } from "@/components/auth/auth-dialog"
import { normalizeLocale } from "@/i18n/locale"

interface AuthDialogContextValue {
  openAuthDialog: (mode?: AuthDialogMode) => void
  closeAuthDialog: () => void
}

const AuthDialogContext = createContext<AuthDialogContextValue | undefined>(undefined)

export function AuthDialogProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [mode, setMode] = useState<AuthDialogMode>("login")

  const openAuthDialog = useCallback((m: AuthDialogMode = "login") => {
    setMode(m)
    setOpen(true)
  }, [])

  const closeAuthDialog = useCallback(() => setOpen(false), [])

  const value = useMemo(
    () => ({ openAuthDialog, closeAuthDialog }),
    [openAuthDialog, closeAuthDialog]
  )

  return (
    <AuthDialogContext.Provider value={value}>
      {/* Mounted once at root so any child can open it */}
      <AuthDialog open={open} onOpenChange={setOpen} defaultMode={mode} />
      {children}
    </AuthDialogContext.Provider>
  )
}

export function useAuthDialog() {
  const ctx = useContext(AuthDialogContext)
  if (ctx) return ctx

  // Fallback: don't crash the whole UI if a component is rendered outside the provider.
  // Redirect user to login page instead.
  const openAuthDialog = () => {
    if (typeof window === 'undefined') return
    const seg = window.location.pathname.split('/').filter(Boolean)
    const maybeLocale = seg[0]
    const locale = normalizeLocale(maybeLocale)
    window.location.assign(`/${locale}/login`)
  }

  return {
    openAuthDialog,
    closeAuthDialog: () => { },
  }
}
