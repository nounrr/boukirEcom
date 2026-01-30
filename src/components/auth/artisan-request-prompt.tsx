"use client"

import { useCallback, useEffect, useMemo, useRef, useState } from "react"
import { usePathname } from "next/navigation"
import { X, BadgePercent, ShieldCheck, Sparkles } from "lucide-react"
import { toast } from "sonner"

import { useAppSelector } from "@/state/hooks"
import { useRequestArtisanMutation } from "@/state/api/auth-api-slice"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cn } from "@/lib/utils"
import { RemiseBalance } from "@/components/ui/remise-balance"
import {
  ARTISAN_REQUEST_PROMPT_CONFIG,
  incrementSessionShowCount,
  markArtisanPromptDismissed,
  markArtisanPromptRequested,
  markArtisanPromptSeen,
  shouldShowArtisanRequestPrompt,
} from "@/lib/artisan-request-prompt-config"

type Timers = {
  showTimer: ReturnType<typeof setTimeout> | null
  hideTimer: ReturnType<typeof setTimeout> | null
  repeatTimer: ReturnType<typeof setTimeout> | null
}

function clearTimers(timers: Timers) {
  if (timers.showTimer) clearTimeout(timers.showTimer)
  if (timers.hideTimer) clearTimeout(timers.hideTimer)
  if (timers.repeatTimer) clearTimeout(timers.repeatTimer)
  timers.showTimer = null
  timers.hideTimer = null
  timers.repeatTimer = null
}

export function ArtisanRequestPrompt() {
  const pathname = usePathname()
  const { user, isAuthenticated } = useAppSelector((s) => s.user)
  const [open, setOpen] = useState(false)

  const timersRef = useRef<Timers>({ showTimer: null, hideTimer: null, repeatTimer: null })
  const mountedRef = useRef(true)

  const [requestArtisan, requestState] = useRequestArtisanMutation()

  const remiseBalance = useMemo(() => {
    const raw = (user as any)?.remise_balance
    const parsed = typeof raw === "number" ? raw : Number(raw)
    return Number.isFinite(parsed) ? parsed : 0
  }, [user])

  const canRun = useMemo(() => {
    return shouldShowArtisanRequestPrompt(pathname, user, isAuthenticated)
  }, [pathname, user, isAuthenticated])

  const closeAndRepeatLater = useCallback(() => {
    setOpen(false)

    if (!user) return

    clearTimers(timersRef.current)

    timersRef.current.repeatTimer = setTimeout(() => {
      if (!mountedRef.current) return
      if (!shouldShowArtisanRequestPrompt(pathname, user, isAuthenticated)) return

      const showCount = incrementSessionShowCount(user.id)
      if (showCount > ARTISAN_REQUEST_PROMPT_CONFIG.MAX_SHOWS_PER_SESSION) return

      markArtisanPromptSeen(user.id)
      setOpen(true)

      timersRef.current.hideTimer = setTimeout(() => {
        if (!mountedRef.current) return
        closeAndRepeatLater()
      }, ARTISAN_REQUEST_PROMPT_CONFIG.AUTO_HIDE_AFTER)
    }, ARTISAN_REQUEST_PROMPT_CONFIG.REPEAT_INTERVAL)
  }, [isAuthenticated, pathname, user])

  const scheduleInitialShow = useCallback(() => {
    if (!user) return

    clearTimers(timersRef.current)

    timersRef.current.showTimer = setTimeout(() => {
      if (!mountedRef.current) return
      if (!shouldShowArtisanRequestPrompt(pathname, user, isAuthenticated)) return

      const showCount = incrementSessionShowCount(user.id)
      if (showCount > ARTISAN_REQUEST_PROMPT_CONFIG.MAX_SHOWS_PER_SESSION) return

      markArtisanPromptSeen(user.id)
      setOpen(true)

      timersRef.current.hideTimer = setTimeout(() => {
        if (!mountedRef.current) return
        closeAndRepeatLater()
      }, ARTISAN_REQUEST_PROMPT_CONFIG.AUTO_HIDE_AFTER)
    }, ARTISAN_REQUEST_PROMPT_CONFIG.SHOW_DELAY)
  }, [closeAndRepeatLater, isAuthenticated, pathname, user])

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
      clearTimers(timersRef.current)
    }
  }, [])

  useEffect(() => {
    // If user becomes ineligible, close and stop.
    if (!canRun) {
      setOpen(false)
      clearTimers(timersRef.current)
      return
    }

    // Don’t stack multiple schedules while open.
    if (!open) {
      scheduleInitialShow()
    }

    return () => {
      // Re-scheduling happens in the next effect run.
      clearTimers(timersRef.current)
    }
  }, [canRun, open, scheduleInitialShow])

  const onDismiss = useCallback(() => {
    if (user) markArtisanPromptDismissed(user.id)
    setOpen(false)
    clearTimers(timersRef.current)
  }, [user])

  const onRequest = useCallback(async () => {
    if (!user) return

    try {
      const result = await requestArtisan()

      let res: any = (result as any)?.data

      // Some proxies/backends can return 200 with a body that fails JSON parsing.
      // RTK Query then reports a PARSING_ERROR even though the request succeeded.
      // Treat 2xx originalStatus as success and try to recover the message.
      if (!res && (result as any)?.error) {
        const err = (result as any).error
        const originalStatus = err?.originalStatus
        if (err?.status === "PARSING_ERROR" && typeof originalStatus === "number" && originalStatus >= 200 && originalStatus < 300) {
          const raw = err?.data
          if (typeof raw === "string") {
            try {
              res = JSON.parse(raw)
            } catch {
              res = { message: "Demande envoyée avec succès.", status: "requested" }
            }
          } else {
            res = { message: "Demande envoyée avec succès.", status: "requested" }
          }
        }
      }

      if (!res) {
        const err: any = (result as any)?.error
        throw err
      }

      markArtisanPromptRequested(user.id)

      const status = String(res?.status || "requested")
      if (status === "pending") {
        toast.success("Demande déjà en attente", {
          description: "Votre demande Artisan est déjà enregistrée.",
        })
      } else if (status === "already_artisan") {
        toast.info("Vous êtes déjà Artisan", {
          description: "Votre compte est déjà Artisan/Promoteur.",
        })
      } else {
        toast.success("Demande envoyée", {
          description: "Elle sera validée par un administrateur.",
        })
      }

      setOpen(false)
      clearTimers(timersRef.current)
    } catch (e: any) {
      const messageFromServer = e?.data?.message || e?.error?.message
      const message = messageFromServer || e?.message
      toast.error("Impossible d'envoyer la demande", {
        description: message || "Réessayez dans un instant.",
      })
    }
  }, [requestArtisan, user])

  if (!canRun) return null
  if (!open) return null

  return (
    <div className="fixed bottom-4 right-4 z-60 w-[min(420px,calc(100vw-2rem))]">
      <Card className={cn("relative border-border/60 bg-background/95 backdrop-blur shadow-lg")}> 
        <button
          type="button"
          aria-label="Fermer"
          onClick={onDismiss}
          className="absolute right-3 top-3 rounded-md p-1 text-muted-foreground hover:text-foreground hover:bg-muted/60"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="p-5">
          <div className="flex items-start gap-3">
            <div className="mt-0.5 inline-flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10">
              <BadgePercent className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1">
              <div className="text-sm font-semibold">Devenez Artisan / Pro</div>
              <div className="mt-1 text-xs text-muted-foreground">
                Accédez à plus d’avantages et augmentez vos gains de remise.
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-2">
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <Sparkles className="mt-0.5 h-4 w-4 text-amber-500" />
              <span>Tarifs & offres plus avantageux pour les achats réguliers</span>
            </div>
            <div className="flex items-start gap-2 text-xs text-muted-foreground">
              <ShieldCheck className="mt-0.5 h-4 w-4 text-emerald-600" />
              <span>Accès à des remises dédiées Artisan / Pro</span>
            </div>
          </div>

          <div className="mt-4">
            <RemiseBalance balance={remiseBalance} size="sm" />
            <div className="mt-1 text-[11px] text-muted-foreground">
              Votre solde actuel. En mode Artisan, vous pouvez gagner plus.
            </div>
          </div>

          <div className="mt-5 flex items-center gap-2">
            <Button
              className="flex-1"
              onClick={onRequest}
              disabled={requestState.isLoading}
            >
              {requestState.isLoading ? "Envoi..." : "Demander le statut Artisan"}
            </Button>
            <Button type="button" variant="outline" onClick={onDismiss}>
              Plus tard
            </Button>
          </div>
        </div>
      </Card>
    </div>
  )
}
