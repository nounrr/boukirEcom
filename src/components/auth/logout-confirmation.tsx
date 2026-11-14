"use client"

import { useRef } from "react"
import { useTranslations } from "next-intl"
import { Loader2, LogOut } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"

export function LogoutConfirmation({ open, busy, onOpenChange, onConfirm }: {
  open: boolean
  busy: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}) {
  const t = useTranslations("header")
  const cancel = useRef<HTMLButtonElement>(null)
  return (
    <Dialog open={open} onOpenChange={value => { if (!busy) onOpenChange(value) }}>
      <DialogContent showCloseButton={!busy} className="sm:max-w-md"
        onOpenAutoFocus={event => { event.preventDefault(); cancel.current?.focus() }}>
        <DialogHeader>
          <DialogTitle>{t("logoutConfirmTitle")}</DialogTitle>
          <DialogDescription>{t("logoutConfirmDescription")}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button ref={cancel} type="button" variant="outline" disabled={busy} onClick={() => onOpenChange(false)}>{t("logoutCancel")}</Button>
          <Button type="button" variant="destructive" disabled={busy} onClick={onConfirm} className="gap-2">
            {busy ? <Loader2 className="size-4 animate-spin" aria-hidden="true" /> : <LogOut className="size-4" aria-hidden="true" />}
            {busy ? t("logoutPending") : t("logoutConfirmAction")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
