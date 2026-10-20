"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useLocale, useTranslations } from "next-intl"
import { AlertCircle, CheckCircle2, Clock, CreditCard, RotateCcw, XCircle } from "lucide-react"

import CmiSecurityLogos from "@/components/shop/checkout/cmi-security-logos"
import { Button } from "@/components/ui/button"
import { redirectToCmiPayment } from "@/lib/cmi-payment"
import { useGetCmiPaymentStatusQuery, useRetryCmiPaymentMutation } from "@/state/api/orders-api-slice"
import { useAppSelector } from "@/state/hooks"

type Props = {
  status: string | null
  orderNumber: string | null
  token: string | null
}

type View = "success" | "pending" | "failed" | "cancel" | "error"

export default function PaymentResultClient({ status, orderNumber, token }: Props) {
  const t = useTranslations("checkout.paymentResult")
  const tCommon = useTranslations("common")
  const locale = useLocale()
  const currency = tCommon("currency")
  const isAuthenticated = useAppSelector((state) => state.user.isAuthenticated)

  // After a successful return, poll briefly in case the CMI callback has not been processed yet.
  const [poll, setPoll] = useState(status === "success")
  const { data, isLoading } = useGetCmiPaymentStatusQuery(
    { orderNumber: orderNumber || "", token },
    { skip: !orderNumber, pollingInterval: poll ? 3000 : 0 }
  )
  const [retryPayment, { isLoading: isRetrying }] = useRetryCmiPaymentMutation()
  const [retryError, setRetryError] = useState<string | null>(null)

  // The order's payment status (set by the CMI callback) wins over the URL status.
  const paid = data?.order.paymentStatus === "paid"
  useEffect(() => {
    if (!poll) return
    if (paid) {
      setPoll(false)
      return
    }
    const timer = setTimeout(() => setPoll(false), 30000)
    return () => clearTimeout(timer)
  }, [paid, poll])
  let view: View
  if (paid) view = "success"
  else if (status === "success") view = "pending"
  else if (status === "failed" || status === "cancel") view = status
  else view = "error"

  const tx = data?.transaction
  const canRetry = !paid && (data?.order.canRetry ?? false)

  const handleRetry = async () => {
    if (!orderNumber) return
    setRetryError(null)
    try {
      const payment = await retryPayment({ orderNumber, token, locale }).unwrap()
      if (!redirectToCmiPayment(payment)) setRetryError(t("retryFailed"))
    } catch (error: any) {
      setRetryError(error?.data?.message || t("retryFailed"))
    }
  }

  const icon = {
    success: <CheckCircle2 className="w-14 h-14 text-emerald-600" />,
    pending: <Clock className="w-14 h-14 text-amber-500" />,
    failed: <XCircle className="w-14 h-14 text-destructive" />,
    cancel: <AlertCircle className="w-14 h-14 text-amber-500" />,
    error: <AlertCircle className="w-14 h-14 text-destructive" />,
  }[view]

  return (
    <div className="max-w-xl mx-auto px-4 py-12 sm:py-16">
      <div className="bg-card border border-border/50 rounded-2xl p-6 sm:p-8 shadow-sm text-center">
        <div className="flex justify-center mb-4">{icon}</div>
        <h1 className="text-xl sm:text-2xl font-bold text-foreground">{t(`${view}.title`)}</h1>
        <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{t(`${view}.description`)}</p>

        {orderNumber && (
          <dl className="mt-6 text-start text-sm divide-y divide-border/50 border border-border/50 rounded-xl overflow-hidden">
            <Row label={t("details.orderNumber")} value={orderNumber} />
            {isLoading && <Row label={t("details.status")} value="…" />}
            {data && (
              <>
                <Row
                  label={t("details.amount")}
                  value={`${(tx?.amount ?? data.order.amountToPay).toFixed(2)} ${currency}`}
                />
                <Row label={t("details.status")} value={t(`paymentStatus.${data.order.paymentStatus}`)} />
              </>
            )}
            {tx?.transId && <Row label={t("details.transactionId")} value={tx.transId} />}
            {paid && tx?.authCode && <Row label={t("details.authCode")} value={tx.authCode} />}
            {tx?.maskedPan && (
              <Row label={t("details.card")} value={[tx.cardBrand, tx.maskedPan].filter(Boolean).join(" · ")} />
            )}
            {tx?.trxDate && <Row label={t("details.date")} value={tx.trxDate} />}
          </dl>
        )}

        {retryError && <p className="mt-4 text-sm text-destructive">{retryError}</p>}

        <div className="mt-6 flex flex-col sm:flex-row gap-3 justify-center">
          {canRetry && view !== "success" && (
            <Button type="button" onClick={handleRetry} disabled={isRetrying} className="text-white">
              {isRetrying ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin me-2" />
              ) : view === "cancel" ? (
                <CreditCard className="w-4 h-4 me-2" />
              ) : (
                <RotateCcw className="w-4 h-4 me-2" />
              )}
              {view === "cancel" ? t("payNow") : t("retry")}
            </Button>
          )}
          {isAuthenticated ? (
            <Button asChild variant="outline">
              <Link href={`/${locale}/orders`}>{t("viewOrders")}</Link>
            </Button>
          ) : null}
          <Button asChild variant="outline">
            <Link href={`/${locale}/shop`}>{t("continueShopping")}</Link>
          </Button>
        </div>

        <CmiSecurityLogos className="mt-8" />
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 px-4 py-2.5">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="font-medium text-foreground text-end break-all">{value}</dd>
    </div>
  )
}
