"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { AlertCircle, CheckCircle2, Clock3, LockKeyhole } from "lucide-react"
import { LoginForm } from "@/components/auth/login-form"
import { Button } from "@/components/ui/button"
import { authApi } from "@/state/api/auth-api-slice"
import { ordersApi, useGetSoldeCmiPaymentStatusQuery } from "@/state/api/orders-api-slice"
import { useAppDispatch, useAppSelector } from "@/state/hooks"
import { setUser } from "@/state/slices/user-slice"

export default function SoldePaymentResultClient({ oid, returnStatus }: { oid: string | null; returnStatus: string | null }) {
  const t = useTranslations("balancePayment")
  const locale = useLocale()
  const dispatch = useAppDispatch()
  const { isAuthenticated, user, accessToken, isLoading: authLoading } = useAppSelector((state) => state.user)
  const [poll, setPoll] = useState(true)
  const [showLogin, setShowLogin] = useState(false)
  const refreshed = useRef("")
  const canVerify = Boolean(isAuthenticated && accessToken && user && oid)
  const query = useGetSoldeCmiPaymentStatusQuery({ oid: oid || "", customerId: user?.id || 0 }, {
    skip: !canVerify,
    pollingInterval: poll ? 3000 : 0,
    refetchOnMountOrArgChange: true,
    refetchOnFocus: true,
  })
  const attempt = query.currentData
  // A URL return flag never establishes that money has been booked.
  const paid = canVerify && attempt?.paid === true
  const terminal = paid || attempt?.status === "declined" || attempt?.status === "error"

  useEffect(() => {
    if (!canVerify) return
    setPoll(true)
    const timer = window.setTimeout(() => setPoll(false), 30_000)
    return () => window.clearTimeout(timer)
  }, [canVerify, oid, user?.id])
  useEffect(() => { if (terminal || query.isError) setPoll(false) }, [terminal, query.isError])
  useEffect(() => {
    if (!paid || !oid || !user) return
    const key = `${user.id}:${oid}`
    if (refreshed.current === key) return
    refreshed.current = key
    dispatch(ordersApi.util.invalidateTags(["Orders"]))
    const request = dispatch(authApi.endpoints.getCurrentUser.initiate(undefined, { forceRefetch: true }))
    let active = true
    void request.unwrap().then((updated) => { if (active && updated.id === user.id) dispatch(setUser(updated)) }).catch(() => {})
    return () => { active = false; request.unsubscribe() }
  }, [paid, oid, user?.id, dispatch])

  const loadingSession = authLoading || Boolean(accessToken && !user)
  const view = loadingSession ? "checking" : !canVerify ? (isAuthenticated ? "verificationError" : "loginRequired") : paid ? "paid" : query.isError || !oid ? "verificationError" : attempt?.status === "declined" ? "declined" : attempt?.status === "error" ? "failed" : returnStatus === "cancel" ? "cancelled" : "pending"
  const Icon = paid ? CheckCircle2 : view === "pending" || view === "checking" ? Clock3 : view === "loginRequired" ? LockKeyhole : AlertCircle

  return <main className="mx-auto max-w-xl px-4 py-12 sm:py-16" dir={locale === "ar" ? "rtl" : "ltr"}>
    <section className="rounded-2xl border border-border bg-card p-6 text-center shadow-sm sm:p-8">
      <Icon className={`mx-auto size-12 ${paid ? "text-emerald-600" : "text-amber-600"}`} />
      <h1 className="mt-4 text-2xl font-bold">{t(`result.${view}.title`)}</h1>
      <p role="status" className="mt-3 text-sm leading-6 text-muted-foreground">{t(`result.${view}.description`)}</p>
      {attempt && canVerify && !query.isError && <dl className="mt-5 space-y-3 rounded-xl bg-muted/30 p-4 text-sm"><div className="flex justify-between gap-4"><dt>{t("amountLabel")}</dt><dd className="font-semibold">{new Intl.NumberFormat(locale, { style: "currency", currency: "MAD" }).format(Number(attempt.amount))}</dd></div><div className="text-start"><dt className="text-xs text-muted-foreground">{t("reference")}</dt><dd className="mt-1 break-all font-mono text-xs" dir="ltr">{attempt.oid}</dd></div></dl>}
      <div className="mt-6 flex flex-col gap-3">
        {!isAuthenticated && !loadingSession && <Button type="button" className="min-h-11" onClick={() => setShowLogin(true)}>{t("signInToVerify")}</Button>}
        {canVerify && !paid && !query.isFetching && (!poll || query.isError) && <Button type="button" variant="outline" className="min-h-11" onClick={() => void query.refetch()}>{t("verifyAgain")}</Button>}
        <Button asChild className="min-h-11" variant={paid ? "default" : "outline"}><Link href={`/${locale}/solde-historique`}>{t("backToBalance")}</Link></Button>
      </div>
    </section>
    {!isAuthenticated && showLogin && <section className="mt-5 rounded-2xl border border-border bg-card p-6"><LoginForm skipRedirect onSuccess={() => setShowLogin(false)} /></section>}
  </main>
}
