"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { AlertCircle, CheckCircle2, Clock3, LockKeyhole } from "lucide-react"
import { LoginForm } from "@/components/auth/login-form"
import { Button } from "@/components/ui/button"
import { getServicePaymentAttempt, requestIdFromOid, type ServicePaymentAttempt } from "@/lib/service-payments"
import { useAppSelector } from "@/state/hooks"

/** The bank's answer for a service request paid by card: checked on the server, never trusted from the URL. */
export default function ServicePaymentResultClient({ oid, returnStatus }: { oid: string | null; returnStatus: string | null }) {
  const t = useTranslations("servicePayment")
  const locale = useLocale()
  const { isAuthenticated, accessToken, isLoading: authLoading } = useAppSelector((state) => state.user)
  const [attempt, setAttempt] = useState<ServicePaymentAttempt | null>(null)
  const [failed, setFailed] = useState(false)
  const [tries, setTries] = useState(0)
  const [showLogin, setShowLogin] = useState(false)
  const requestId = attempt?.service_request_id ?? requestIdFromOid(oid)

  useEffect(() => {
    if (!accessToken || !oid) return
    let cancelled = false
    getServicePaymentAttempt(oid, accessToken)
      .then((value) => { if (!cancelled) { setAttempt(value); setFailed(false) } })
      .catch(() => { if (!cancelled) setFailed(true) })
    return () => { cancelled = true }
  }, [accessToken, oid, tries])

  // The bank's server call can land a few seconds after the browser: ask again for 30 s.
  useEffect(() => {
    if (!accessToken || !oid || attempt?.paid || attempt?.status === "declined" || attempt?.status === "error" || tries >= 10) return
    const timer = window.setTimeout(() => setTries((n) => n + 1), 3000)
    return () => window.clearTimeout(timer)
  }, [accessToken, oid, attempt, tries])

  const paid = attempt?.paid === true
  const view = authLoading ? "checking" : !accessToken ? "loginRequired" : !oid || failed ? "verificationError" : paid ? "paid" : attempt?.status === "declined" ? "declined" : attempt?.status === "error" ? "failed" : returnStatus === "cancel" ? "cancelled" : "pending"
  const Icon = paid ? CheckCircle2 : view === "pending" || view === "checking" ? Clock3 : view === "loginRequired" ? LockKeyhole : AlertCircle

  return <main className="mx-auto max-w-xl px-4 py-12 sm:py-16" dir={locale === "ar" ? "rtl" : "ltr"}>
    <section className="rounded-2xl border border-border bg-card p-6 text-center shadow-sm sm:p-8">
      <Icon className={`mx-auto size-12 ${paid ? "text-emerald-600" : "text-amber-600"}`} />
      <h1 className="mt-4 text-2xl font-bold">{t(`result.${view}.title`)}</h1>
      <p role="status" className="mt-3 text-sm leading-6 text-muted-foreground">{t(`result.${view}.description`)}</p>
      {attempt && <dl className="mt-5 space-y-3 rounded-xl bg-muted/30 p-4 text-sm"><div className="flex justify-between gap-4"><dt>{t("amountLabel")}</dt><dd className="font-semibold">{new Intl.NumberFormat(locale, { style: "currency", currency: "MAD" }).format(Number(attempt.amount))}</dd></div><div className="text-start"><dt className="text-xs text-muted-foreground">{t("reference")}</dt><dd className="mt-1 break-all font-mono text-xs" dir="ltr">{attempt.oid}</dd></div></dl>}
      <div className="mt-6 flex flex-col gap-3">
        {!isAuthenticated && !authLoading && <Button type="button" className="min-h-11" onClick={() => setShowLogin(true)}>{t("signInToVerify")}</Button>}
        {accessToken && !paid && tries >= 10 && <Button type="button" variant="outline" className="min-h-11" onClick={() => setTries(0)}>{t("verifyAgain")}</Button>}
        <Button asChild className="min-h-11" variant={paid ? "default" : "outline"}><Link href={requestId ? `/${locale}/profile/requests/${requestId}` : `/${locale}/profile/requests`}>{t("backToRequest")}</Link></Button>
      </div>
    </section>
    {!isAuthenticated && showLogin && <section className="mt-5 rounded-2xl border border-border bg-card p-6"><LoginForm skipRedirect onSuccess={() => setShowLogin(false)} /></section>}
  </main>
}
