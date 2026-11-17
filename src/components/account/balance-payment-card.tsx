"use client"

import { useRef, useState, type FormEvent } from "react"
import { useLocale, useTranslations } from "next-intl"
import { CreditCard, LockKeyhole } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { redirectToCmiPayment } from "@/lib/cmi-payment"
import { useCreateSoldeCmiPaymentMutation } from "@/state/api/orders-api-slice"

export function BalancePaymentCard({ balance, ready, refresh }: { balance: number; ready: boolean; refresh: () => void }) {
  const t = useTranslations("balancePayment")
  const locale = useLocale()
  const [open, setOpen] = useState(false)
  const [amount, setAmount] = useState("")
  const [error, setError] = useState("")
  const [redirecting, setRedirecting] = useState(false)
  const locked = useRef(false)
  const [createPayment, paymentState] = useCreateSoldeCmiPaymentMutation()
  const due = Math.max(0, Number.isFinite(balance) ? balance : 0)
  const minimum = Math.min(1, due)
  const normalizedAmount = amount.trim().replace(",", ".")
  const value = Number(normalizedAmount)
  const valid = /^\d+(?:\.\d{1,2})?$/.test(normalizedAmount) && Number.isFinite(value) && value >= minimum && value <= due && value > 0
  const busy = paymentState.isLoading || redirecting
  const money = (value: number) => new Intl.NumberFormat(locale, { style: "currency", currency: "MAD" }).format(value)

  async function pay(event: FormEvent) {
    event.preventDefault()
    if (!ready || !valid || busy || locked.current || due <= 0) return
    locked.current = true
    setError("")
    try {
      const result = await createPayment({ amount: value, locale: ["fr", "ar", "en", "zh"].includes(locale) ? locale : "fr" }).unwrap()
      setRedirecting(true)
      if (!redirectToCmiPayment(result.cmi_payment)) throw new Error("REDIRECT_FAILED")
    } catch (failure: unknown) {
      setRedirecting(false)
      const status = (failure as { status?: number }).status
      setError(t(status === 401 ? "loginRequired" : status === 403 ? "notEligible" : status === 503 ? "unavailable" : status === 400 || status === 409 || status === 422 ? "balanceChanged" : "paymentError"))
      refresh()
      locked.current = false
    }
  }

  return <section className="mb-6 rounded-2xl border border-primary/20 bg-primary/5 p-5 sm:p-6" aria-label={t("title")}>
    <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
      <div><p className="text-sm font-medium text-muted-foreground">{t("amountDue")}</p><p className="mt-2 text-3xl font-bold tabular-nums tracking-tight">{ready ? money(due) : "—"}</p><p className="mt-2 max-w-lg text-sm leading-6 text-muted-foreground">{!ready ? t("checking") : due > 0 ? t("paymentHint") : t("nothingDue")}</p></div>
      {ready && due > 0 && !open && <Button type="button" className="min-h-11 shrink-0 gap-2" onClick={() => { setAmount(due.toFixed(2)); setError(""); setOpen(true) }}><CreditCard className="size-4" />{t("payBalance")}</Button>}
    </div>
    {open && due > 0 && <form onSubmit={pay} className="mt-5 space-y-4 border-t border-primary/15 pt-5">
      <div className="max-w-sm"><label htmlFor="balance-payment-amount" className="text-sm font-semibold">{t("amountLabel")}</label><Input id="balance-payment-amount" className="mt-2 min-h-11" type="number" inputMode="decimal" step="0.01" min={minimum} max={due} value={amount} disabled={!ready || busy} onChange={(event) => { setAmount(event.target.value); setError("") }} aria-describedby="balance-payment-range" required /><p id="balance-payment-range" className="mt-2 text-xs leading-5 text-muted-foreground">{t("amountRange", { min: money(minimum), max: money(due) })}</p></div>
      {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
      <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground"><LockKeyhole className="mt-0.5 size-4 shrink-0" />{t("secureHint")}</p>
      <div className="flex flex-col gap-3 sm:flex-row"><Button type="submit" disabled={!ready || !valid || busy} className="min-h-11">{busy ? t("redirecting") : t("continuePayment")}</Button><Button type="button" variant="outline" disabled={busy} onClick={() => setOpen(false)} className="min-h-11">{t("cancel")}</Button></div>
    </form>}
    {error && !open && <p role="alert" className="mt-3 text-sm text-destructive">{error}</p>}
  </section>
}
