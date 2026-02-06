"use client"

import {
  ArrowLeft,
  Banknote,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  CreditCard,
  Mail,
  MapPin,
  Package,
  Phone,
  Receipt, 
  RefreshCw,
  Store,
  Truck,
  Wallet,
  XCircle
} from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import Image from "next/image"
import Link from "next/link"
import { notFound, useParams, useRouter } from "next/navigation"
import { useMemo, useState } from "react"

import { ShopPageLayout } from "@/components/layout/shop-page-layout"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import { InvoiceDialog } from "@/components/invoice/invoice-dialog"
import { useCart } from "@/components/layout/cart-context-provider"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useGetOrderQuery } from "@/state/api/orders-api-slice"
import { useAppSelector } from "@/state/hooks"
import type { Order, OrderStatus, PaymentStatus } from "@/types/order"

function formatDate(locale: string, value?: string | null, emptyPlaceholder = "—") {
  if (!value) return emptyPlaceholder
  try {
    return new Intl.DateTimeFormat(locale, { year: "numeric", month: "short", day: "numeric" }).format(new Date(value))
  } catch {
    return value
  }
}

function formatDateTime(locale: string, value?: string | null, emptyPlaceholder = "—") {
  if (!value) return emptyPlaceholder
  try {
    return new Intl.DateTimeFormat(locale, {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(value))
  } catch {
    return value
  }
}

function formatMoney(value: number, currency: string) {
  return `${Number(value || 0).toFixed(2)} ${currency}`
}

function getOrderStatusLabel(t: ReturnType<typeof useTranslations>, status: OrderStatus) {
  switch (status) {
    case "pending":
      return t("status.pending")
    case "confirmed":
      return t("status.confirmed")
    case "shipped":
      return t("status.shipped")
    case "delivered":
      return t("status.delivered")
    case "cancelled":
      return t("status.cancelled")
  }
}

function getPaymentStatusLabel(t: ReturnType<typeof useTranslations>, status: PaymentStatus) {
  switch (status) {
    case "pending":
      return t("paymentStatus.pending")
    case "paid":
      return t("paymentStatus.paid")
    case "failed":
      return t("paymentStatus.failed")
    case "refunded":
      return t("paymentStatus.refunded")
  }
}

function getPaymentMethodLabel(t: ReturnType<typeof useTranslations>, method?: string | null) {
  switch (method) {
    case "cash_on_delivery":
      return t("paymentMethod.cash_on_delivery")
    case "pay_in_store":
      return t("paymentMethod.pay_in_store")
    case "card":
      return t("paymentMethod.card")
    case "bank_transfer":
      return t("paymentMethod.bank_transfer")
    case "mobile_payment":
      return t("paymentMethod.mobile_payment")
    case "solde":
      return t("paymentMethod.solde")
    default:
      return method ? String(method) : t("placeholder")
  }
}

function getHistoryActorLabel(t: ReturnType<typeof useTranslations>, type: "customer" | "admin") {
  switch (type) {
    case "customer":
      return t("history.actor.customer")
    case "admin":
      return t("history.actor.admin")
  }
}

function getStepIndex(status: OrderStatus) {
  switch (status) {
    case "pending":
      return 0
    case "confirmed":
      return 1
    case "shipped":
      return 2
    case "delivered":
      return 3
    case "cancelled":
      return 0
    default:
      return 0
  }
}

function getProgressValue(status: OrderStatus) {
  if (status === "cancelled") return 0
  const idx = getStepIndex(status)
  return (idx / 3) * 100
}

type Step = { key: string; label: string; icon: any }

function Stepper({
  steps,
  currentIndex,
  progress,
  accent,
  tone = "primary",
}: {
  steps: Step[]
  currentIndex: number
  progress: number
  accent?: { lineFg: string; doneDot: string; currentDot: string }
  tone?: "primary" | "danger" | "muted"
}) {
  const lineBg = tone === "danger" ? "bg-red-200 dark:bg-red-900" : "bg-muted"
  const lineFg =
    tone === "danger"
      ? "bg-red-600"
      : tone === "muted"
        ? "bg-muted-foreground/40"
        : accent?.lineFg ?? "bg-primary"

  // Dots are centered inside equal-width grid columns.
  // To align the bar with the dot centers, inset the line by half a column.
  const insetPercent = 50 / Math.max(steps.length, 1)

  return (
    <div className="relative">
      <div
        className="absolute top-[18px] h-1 rounded-full overflow-hidden"
        style={{ left: `${insetPercent}%`, right: `${insetPercent}%` }}
      >
        <div className={cn("h-full w-full", lineBg)} />
        <div className={cn("absolute left-0 top-0 h-full rounded-full", lineFg)} style={{ width: `${progress}%` }} />
      </div>

      <div className={cn("grid gap-2", steps.length === 2 ? "grid-cols-2" : "grid-cols-4")}>
        {steps.map((step, idx) => {
          const Icon = step.icon
          const isDone = idx < currentIndex
          const isCurrent = idx === currentIndex
          const dotTone =
            tone === "danger"
              ? isDone || isCurrent
                ? "bg-red-600 text-white border-red-600"
                : "bg-background text-muted-foreground border-border"
              : isDone
                ? accent?.doneDot ?? "bg-primary text-primary-foreground border-primary"
                : isCurrent
                  ? accent?.currentDot ?? "bg-background text-primary border-primary"
                  : "bg-background text-muted-foreground border-border"

          return (
            <div key={step.key} className="flex flex-col items-center text-center gap-1">
              <div className={cn("relative z-10 flex items-center justify-center w-9 h-9 rounded-full border", dotTone)}>
                <Icon className="w-4 h-4" />
              </div>
              <span
                className={cn(
                  "text-[11px] sm:text-xs",
                  isDone || isCurrent ? "text-foreground" : "text-muted-foreground"
                )}
              >
                {step.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function StatusPill({ order }: { order: Order }) {
  const t = useTranslations("orderDetailsPage")
  const status = order.status
  const paymentStatus = order.paymentStatus

  const statusTone =
    status === "delivered"
      ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-950/30 dark:text-green-400 dark:border-green-900"
      : status === "shipped"
        ? "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/30 dark:text-purple-400 dark:border-purple-900"
        : status === "confirmed"
          ? "bg-yellow-50 text-yellow-800 border-yellow-200 dark:bg-yellow-950/30 dark:text-yellow-400 dark:border-yellow-900"
          : status === "cancelled"
            ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-900"
            : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-900"

  const paymentTone =
    paymentStatus === "paid"
      ? "text-green-700 dark:text-green-400"
      : paymentStatus === "failed"
        ? "text-red-700 dark:text-red-400"
        : paymentStatus === "refunded"
          ? "text-muted-foreground"
          : "text-amber-700 dark:text-amber-400"

  return (
    <div className="flex flex-wrap items-center gap-2">
      <Badge variant="outline" className={cn("text-xs", statusTone)}>
        {getOrderStatusLabel(t, status)}
      </Badge>
      <span className="text-xs text-muted-foreground">•</span>
      <span className={cn("text-xs font-medium", paymentTone)}>
        {getPaymentStatusLabel(t, paymentStatus)}
      </span>
    </div>
  )
}

function OrderProgressHeader({ order }: { order: Order }) {
  const locale = useLocale()
  const t = useTranslations("orderDetailsPage")
  const tCommon = useTranslations("common")
  const currency = tCommon("currency")
  const empty = t("placeholder")

  const fulfillmentSteps: Step[] = [
    { key: "pending", label: t("steps.pending"), icon: Clock },
    { key: "confirmed", label: t("steps.confirmed"), icon: CheckCircle2 },
    { key: "shipped", label: t("steps.shipped"), icon: Truck },
    { key: "delivered", label: t("steps.delivered"), icon: Package },
  ]

  const fulfillmentIndex = getStepIndex(order.status)
  const fulfillmentProgress = getProgressValue(order.status)

  const isCancelled = order.status === "cancelled"

  const fulfillmentAccent =
    order.status === "delivered"
      ? {
          lineFg: "bg-green-500",
          doneDot: "bg-green-500 text-white border-green-500",
          currentDot: "bg-green-500 text-white border-green-500",
        }
      : order.status === "shipped"
        ? {
            lineFg: "bg-purple-500",
            doneDot: "bg-purple-500 text-white border-purple-500",
            currentDot: "bg-purple-500 text-white border-purple-500",
          }
        : order.status === "confirmed"
          ? {
              lineFg: "bg-yellow-500",
              doneDot: "bg-yellow-500 text-white border-yellow-500",
              currentDot: "bg-yellow-500 text-white border-yellow-500",
            }
          : {
              lineFg: "bg-amber-500",
              doneDot: "bg-amber-500 text-white border-amber-500",
              currentDot: "bg-amber-500 text-white border-amber-500",
            }

  return (
    <Card className="p-4 sm:p-5 border-border/50">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-base sm:text-lg font-semibold text-foreground truncate">
                {t("header.orderNumber", { number: order.orderNumber })}
              </h2>
              <StatusPill order={order} />
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatDateTime(locale, order.createdAt, empty)}
              </span>
              <span className="inline-flex items-center gap-1">
                <Receipt className="w-3.5 h-3.5" />
                {formatMoney(order.totalAmount, currency)}
              </span>
            </div>
          </div>
        </div>

        {isCancelled ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
            {t("cancelledNotice")}
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">{t("progress.title")}</p>
              <span className="text-xs text-muted-foreground">{t("progress.status", { status: getOrderStatusLabel(t, order.status) })}</span>
            </div>
            <Stepper
              steps={fulfillmentSteps}
              currentIndex={fulfillmentIndex}
              progress={fulfillmentProgress}
              accent={fulfillmentAccent}
            />
          </div>
        )}
      </div>
    </Card>
  )
}

function TotalsCard({ order }: { order: Order }) {
  const t = useTranslations("orderDetailsPage")
  const tCommon = useTranslations("common")
  const currency = tCommon("currency")

  const remiseUsed = Number((order as any).remiseUsedAmount || 0)
  const amountToPay = Math.max(0, Number(order.totalAmount || 0) - remiseUsed)

  return (
    <Card className="p-4 border-border/50">
      <div className="flex items-center gap-2 mb-3">
        <Receipt className="w-4 h-4 text-primary" />
        <h3 className="font-semibold">{t("totals.title")}</h3>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">{t("totals.subtotal")}</span>
          <span className="font-medium">{formatMoney(order.subtotal, currency)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">{t("totals.shipping")}</span>
          <span className="font-medium">{formatMoney(order.shippingCost, currency)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">{t("totals.taxes")}</span>
          <span className="font-medium">{formatMoney(order.taxAmount, currency)}</span>
        </div>
        {order.discountAmount > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">{t("totals.discount")}</span>
            <span className="font-medium text-green-700 dark:text-green-400">- {formatMoney(order.discountAmount, currency)}</span>
          </div>
        )}
        <Separator />
        <div className="flex items-center justify-between">
          <span className="font-semibold">{t("totals.total")}</span>
          <span className="font-bold text-foreground">{formatMoney(order.totalAmount, currency)}</span>
        </div>

        {remiseUsed > 0 && (
          <>
            <Separator className="my-2" />
            <div className="rounded-lg border border-emerald-200/60 dark:border-emerald-800/40 bg-emerald-50/50 dark:bg-emerald-950/20 p-3 space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-100">{t("totals.mixedPayment")}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-700/80 dark:text-emerald-300/80">{t("totals.discountBalanceUsed")}</span>
                </div>
                <span className="font-semibold text-emerald-900 dark:text-emerald-100">-{formatMoney(remiseUsed, currency)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">{t("totals.remainingToPay")}</span>
                <span className="text-base font-bold text-emerald-700 dark:text-emerald-300">{formatMoney(amountToPay, currency)}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </Card>
  )
}

function PaymentCard({ order }: { order: Order }) {
  const t = useTranslations("orderDetailsPage")
  const tCommon = useTranslations("common")
  const currency = tCommon("currency")

  const methodLabel = getPaymentMethodLabel(t, order.paymentMethod)
  const remiseUsed = Number((order as any).remiseUsedAmount || 0)
  const amountToPay = Math.max(0, Number(order.totalAmount || 0) - remiseUsed)

  const getPaymentMethodConfig = () => {
    switch (order.paymentMethod) {
      case "solde":
        return {
          icon: Clock,
          color: "text-violet-700 dark:text-violet-300",
          bg: "bg-violet-50/50 dark:bg-violet-950/20",
          border: "border-violet-200/60 dark:border-violet-800/40",
        }
      case "pay_in_store":
        return {
          icon: Store,
          color: "text-violet-700 dark:text-violet-300",
          bg: "bg-violet-50/50 dark:bg-violet-950/20",
          border: "border-violet-200/60 dark:border-violet-800/40",
        }
      case "cash_on_delivery":
        return {
          icon: Banknote,
          color: "text-emerald-700 dark:text-emerald-300",
          bg: "bg-emerald-50/50 dark:bg-emerald-950/20",
          border: "border-emerald-200/60 dark:border-emerald-800/40",
        }
      case "card":
        return {
          icon: CreditCard,
          color: "text-blue-700 dark:text-blue-300",
          bg: "bg-blue-50/50 dark:bg-blue-950/20",
          border: "border-blue-200/60 dark:border-blue-800/40",
        }
      default:
        return {
          icon: CreditCard,
          color: "text-muted-foreground",
          bg: "bg-muted/30",
          border: "border-border/40",
        }
    }
  }

  const paymentConfig = getPaymentMethodConfig()

  return (
    <Card className="p-4 border-border/50">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2 min-w-0">
          <CreditCard className="w-4 h-4 text-primary" />
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">{t("payment.title")}</p>
            {remiseUsed > 0 ? (
              <div className="flex items-center gap-1.5 mt-1">
                <div className="inline-flex items-center gap-1 text-[10px] font-medium rounded-full px-2 py-0.5 border bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/40">
                  <Wallet className="w-3 h-3" />
                  <span>{t("payment.discountChip")}</span>
                </div>
                <span className="text-xs text-muted-foreground">+</span>
                <div className={cn("inline-flex items-center gap-1 text-[10px] font-medium rounded-full px-2 py-0.5 border", paymentConfig.bg, paymentConfig.color, paymentConfig.border)}>
                  <paymentConfig.icon className="w-3 h-3" />
                  <span>{methodLabel}</span>
                </div>
              </div>
            ) : (
              <div className={cn("inline-flex items-center gap-1.5 text-xs font-medium rounded-full px-2 py-0.5 mt-1 border", paymentConfig.bg, paymentConfig.color, paymentConfig.border)}>
                <paymentConfig.icon className="w-3 h-3" />
                <span>{methodLabel}</span>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{t("payment.statusLabel")}</span>
          <Badge variant="secondary" className="text-xs">
            {getPaymentStatusLabel(t, order.paymentStatus)}
          </Badge>
        </div>
      </div>

      {(order.paymentMethod === "card" || order.paymentMethod === "cash_on_delivery") && (
        <div className="mt-3 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Image src="/payments/visa.svg" alt="Visa" width={36} height={24} className="h-5 w-auto opacity-90" />
            <Image
              src="/payments/master-card.svg"
              alt="Mastercard"
              width={36}
              height={24}
              className="h-5 w-auto opacity-90"
            />
            <Image src="/payments/naps.png" alt="NAPS" width={36} height={24} className="h-5 w-auto opacity-90" />
          </div>
        </div>
      )}

      {remiseUsed > 0 && (
        <div className="mt-3 rounded-lg border border-emerald-200/60 dark:border-emerald-800/40 bg-emerald-50/50 dark:bg-emerald-950/20 p-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5">
                <Wallet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-emerald-700/80 dark:text-emerald-300/80">{t("payment.discountUsed")}</span>
              </div>
              <span className="font-semibold text-emerald-900 dark:text-emerald-100">-{formatMoney(remiseUsed, currency)}</span>
            </div>
            <Separator className="bg-emerald-200/40 dark:bg-emerald-800/40" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <paymentConfig.icon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">{t("payment.toPay", { method: methodLabel })}</span>
              </div>
              <span className="text-base font-bold text-emerald-700 dark:text-emerald-300">{formatMoney(amountToPay, currency)}</span>
            </div>
            {order.customerNotes && (
              <div className="pt-2 border-t border-emerald-200/40 dark:border-emerald-800/40">
                <p className="text-[10px] text-emerald-700/70 dark:text-emerald-300/70 italic">{t("payment.note", { note: order.customerNotes })}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}

function ShippingCard({ order }: { order: Order }) {
  const t = useTranslations("orderDetailsPage")
  const addr = order.shippingAddress
  const isPickup = order.deliveryMethod === "pickup"
  const empty = t("placeholder")

  return (
    <Card className="p-4 border-border/50">
      <div className="flex items-center gap-2 mb-3">
        {isPickup ? (
          <>
            <Store className="w-4 h-4 text-violet-600" />
            <h3 className="font-semibold">{t("shipping.pickupTitle")}</h3>
          </>
        ) : (
          <>
            <MapPin className="w-4 h-4 text-emerald-600" />
            <h3 className="font-semibold">{t("shipping.deliveryTitle")}</h3>
          </>
        )}
      </div>

      {isPickup && order.pickupLocation ? (
        <div className="space-y-3">
          <div className="rounded-lg border border-violet-200/60 dark:border-violet-800/40 bg-violet-50/50 dark:bg-violet-950/20 p-3">
            <div className="flex items-start gap-2">
              <Store className="w-4 h-4 text-violet-600 dark:text-violet-400 mt-0.5 shrink-0" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-violet-900 dark:text-violet-100">{order.pickupLocation.name}</p>
                <p className="text-xs text-violet-700/80 dark:text-violet-300/80 mt-1">
                  {order.pickupLocation.addressLine1 || order.pickupLocation.address}
                  {order.pickupLocation.addressLine2 && `, ${order.pickupLocation.addressLine2}`}
                </p>
                <p className="text-xs text-violet-700/80 dark:text-violet-300/80">
                  {order.pickupLocation.city}
                  {order.pickupLocation.postalCode && `, ${order.pickupLocation.postalCode}`}
                  {order.pickupLocation.country && ` • ${order.pickupLocation.country}`}
                </p>
                {order.pickupLocation.phone && (
                  <p className="text-xs text-violet-700/80 dark:text-violet-300/80 mt-1">
                    📞 {order.pickupLocation.phone}
                  </p>
                )}
                {order.pickupLocation.openingHours && (
                  <p className="text-xs text-violet-700/80 dark:text-violet-300/80 mt-1">
                    🕒 {order.pickupLocation.openingHours}
                  </p>
                )}
              </div>
            </div>
          </div>

          <Separator />

          <div className="grid sm:grid-cols-2 gap-2">
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground text-sm">{order.customerEmail}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground text-sm">{order.customerPhone || empty}</span>
            </div>
          </div>
        </div>
      ) : (
          <div className="space-y-2 text-sm">
            <div className="flex items-start gap-2">
              <Truck className="w-4 h-4 text-muted-foreground mt-0.5" />
              <div>
                <p className="font-medium">{order.customerName}</p>
                <p className="text-muted-foreground">
                  {addr.line1}
                  {addr.line2 ? `, ${addr.line2}` : ""}
                </p>
                <p className="text-muted-foreground">
                  {addr.city}
                  {addr.postalCode ? `, ${addr.postalCode}` : ""}
                  {addr.country ? ` • ${addr.country}` : ""}
                </p>
              </div>
            </div>

            <Separator />

            <div className="grid sm:grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">{order.customerEmail}</span>
              </div>
              <div className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">{order.customerPhone || empty}</span>
              </div>
            </div>
          </div>
      )}
    </Card>
  )
}

function HistoryTimeline({ order }: { order: Order }) {
  const locale = useLocale()
  const t = useTranslations("orderDetailsPage")
  const empty = t("placeholder")
  const history = order.statusHistory ?? []
  if (!history.length) {
    return (
      <div className="text-sm text-muted-foreground">
        {t("history.empty")}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {history
        .slice()
        .sort((a, b) => (a.timestamp > b.timestamp ? -1 : 1))
        .map((entry, idx) => (
          <Card key={`${entry.timestamp}-${idx}`} className="p-3 border-border/50">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="text-xs">
                    {getOrderStatusLabel(t, entry.newStatus)}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    • {t("history.changedBy", { who: getHistoryActorLabel(t, entry.changedByType) })}
                  </span>
                </div>
                {entry.notes && <p className="text-sm mt-1">{entry.notes}</p>}
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formatDateTime(locale, entry.timestamp, empty)}
              </span>
            </div>
          </Card>
        ))}
    </div>
  )
}

export default function OrderDetailsPage() {
  const locale = useLocale()
  const t = useTranslations("orderDetailsPage")
  const tCommon = useTranslations("common")
  const currency = tCommon("currency")
  const empty = t("placeholder")

  const router = useRouter()
  const routeParams = useParams<{ id?: string | string[] }>()
  const { isAuthenticated, user } = useAppSelector((state) => state.user)
  const orderId = Array.isArray(routeParams?.id) ? routeParams?.id?.[0] : routeParams?.id
  const [tab, setTab] = useState("overview")

  const { cartRef } = useCart()
  const toast = useToast()

  const { data: order, isLoading, isError, error } = useGetOrderQuery(
    { id: orderId ?? "" },
    { skip: !isAuthenticated || !orderId }
  )

  const itemsCount = useMemo(() => {
    if (!order) return 0
    if (typeof order.itemsCount === "number") return order.itemsCount
    return order.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) ?? 0
  }, [order])

  const handleBuyAgain = async (item: any) => {
    if (!cartRef?.current) return

    cartRef.current.addItem({
      productId: item.productId,
      variantId: item.variantId,
      unitId: item.unitId ?? item.unit_id,
      unitName: item.unitName ?? item.unit_name,
      variantName: item.variantName ?? item.variant_name,
      name: item.productName,
      price: item.unitPrice,
      quantity: item.quantity,
      image: item.imageUrl || "",
      category: "",
      stock: 999,
    })

    toast.success(t("toast.addedToCartTitle"), { description: item.productName })

    setTimeout(() => {
      cartRef.current?.open()
    }, 250)
  }

  if (!isAuthenticated) {
    return (
      <ShopPageLayout title={t("pageTitle")} subtitle={t("authRequired.subtitle")} icon="cart">
        <Card className="p-6 border-border/50">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div className="space-y-2">
              <p className="font-semibold">{t("authRequired.title")}</p>
              <p className="text-sm text-muted-foreground">
                {t("authRequired.description")}
              </p>
              <div className="flex gap-2">
                <Button onClick={() => router.push(`/${locale}/login`)}>{tCommon("login")}</Button>
                <Button variant="outline" onClick={() => router.push(`/${locale}/orders`)}>
                  {tCommon("back")}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </ShopPageLayout>
    )
  }

  if (isLoading) {
    return (
      <ShopPageLayout title={t("pageTitle")} subtitle={tCommon("loading")} icon="cart">
        <div className="space-y-4">
          <div className="bg-card border border-border rounded-xl p-5 animate-pulse">
            <div className="h-4 bg-muted rounded w-1/3" />
            <div className="h-3 bg-muted rounded w-1/2 mt-2" />
            <div className="h-2 bg-muted rounded w-full mt-4" />
            <div className="grid grid-cols-4 gap-2 mt-4">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-14 bg-muted rounded" />
              ))}
            </div>
          </div>
          <div className="bg-card border border-border rounded-xl p-5 animate-pulse">
            <div className="h-9 bg-muted rounded w-80" />
            <div className="h-40 bg-muted rounded w-full mt-4" />
          </div>
        </div>
      </ShopPageLayout>
    )
  }

  if (isError) {
    const status = (error as any)?.status
    if (status === 404 || status === 400) {
      notFound()
    }
    return (
      <ShopPageLayout title={t("pageTitle")} subtitle={t("error.subtitle")} icon="cart">
        <Card className="p-6 border-border/50">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="space-y-2">
              <p className="font-semibold">{t("error.title")}</p>
              <p className="text-sm text-muted-foreground">{t("error.description")}</p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => router.push(`/${locale}/orders`)}>
                  {t("actions.backToOrders")}
                </Button>
              </div>
            </div>
          </div>
        </Card>
      </ShopPageLayout>
    )
  }

  if (!order) {
    notFound()
  }

  return (
    <ShopPageLayout
      title={t("pageTitle")}
      subtitle={t("subtitle", { orderNumber: order.orderNumber, count: itemsCount })}
      icon="cart"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <Link href={`/${locale}/orders`} className="inline-flex">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              {t("actions.backToOrders")}
            </Button>
          </Link>

          <div className="flex items-center gap-2">
            <InvoiceDialog order={order} user={user} triggerText={t("actions.invoice")} />

            <Button variant="ghost" size="sm" onClick={() => router.refresh()} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              {t("actions.refresh")}
            </Button>
          </div>
        </div>

        <OrderProgressHeader order={order} />

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="overview">{t("tabs.overview")}</TabsTrigger>
            <TabsTrigger value="items">{t("tabs.items")}</TabsTrigger>
            <TabsTrigger value="shipping">{t("tabs.shipping")}</TabsTrigger>
            <TabsTrigger value="payment">{t("tabs.payment")}</TabsTrigger>
            <TabsTrigger value="history">{t("tabs.history")}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-3">
            <div className="grid lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 space-y-4">
                <Card className="p-4 border-border/50">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm text-muted-foreground">{t("overview.orderLabel")}</p>
                      <p className="font-semibold truncate">#{order.orderNumber}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/${locale}/orders`)}
                      className="gap-2"
                    >
                      {t("overview.viewListCta")}
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>

                  <Separator className="my-3" />

                  <div className="grid sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">{t("overview.date")}</p>
                      <p className="font-medium">{formatDateTime(locale, order.createdAt, empty)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t("overview.status")}</p>
                      <p className="font-medium">{getOrderStatusLabel(t, order.status)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t("overview.payment")}</p>
                      <p className="font-medium">{getPaymentMethodLabel(t, order.paymentMethod)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t("overview.total")}</p>
                      <p className="font-semibold">{formatMoney(order.totalAmount, currency)}</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 border-border/50">
                  <div className="flex items-center gap-2 mb-3">
                    <Package className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold">{t("itemsPreview.title")}</h3>
                  </div>

                  <div className="space-y-3">
                    {(order.items ?? []).slice(0, 3).map((item) => (
                      <div key={item.id} className="flex gap-3">
                        <div className="relative w-14 h-14 rounded-md overflow-hidden bg-muted shrink-0 border border-border/40">
                          {item.imageUrl ? (
                            <Image src={item.imageUrl} alt={item.productName} fill className="object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-5 h-5 text-muted-foreground/40" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{item.productName}</p>
                          <p className="text-xs text-muted-foreground">
                            {t("itemsPreview.line", { quantity: item.quantity, subtotal: formatMoney(item.subtotal, currency) })}
                          </p>
                        </div>
                      </div>
                    ))}

                    {(order.items?.length ?? 0) > 3 && (
                      <p className="text-xs text-muted-foreground">
                        {t("itemsPreview.more", { count: (order.items?.length ?? 0) - 3 })}
                      </p>
                    )}

                    <div>
                      <Button variant="outline" size="sm" onClick={() => setTab("items")}>
                        {t("itemsPreview.viewAll")}
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="space-y-4">
                <TotalsCard order={order} />
                <PaymentCard order={order} />
                <ShippingCard order={order} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="items" className="mt-3" id="items">
            <Card className="p-4 border-border/50">
              <div className="flex items-center justify-between gap-3 mb-3">
                <div className="min-w-0">
                  <h3 className="font-semibold">{t("itemsTab.title")}</h3>
                  <p className="text-sm text-muted-foreground">{t("itemsTab.count", { count: itemsCount })}</p>
                </div>
              </div>

              <div className="space-y-3">
                {(order.items ?? []).map((item) => (
                  <div key={item.id} className="flex gap-3 py-3 border-b border-border/30 last:border-0">
                    <div className="relative w-16 h-16 rounded-md overflow-hidden bg-muted shrink-0 border border-border/40">
                      {item.imageUrl ? (
                        <Image src={item.imageUrl} alt={item.productName} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-6 h-6 text-muted-foreground/40" />
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium line-clamp-2">{item.productName}</p>
                      {item.variantName && (
                        <p className="text-xs text-muted-foreground mt-1">
                          {t("itemsTab.variantLine", {
                            type: item.variantType ?? t("itemsTab.variantType"),
                            name: item.variantName,
                          })}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
                        <span>{t("itemsTab.qty", { quantity: item.quantity })}</span>
                        <span>{t("itemsTab.unitPrice", { price: formatMoney(item.unitPrice, currency) })}</span>
                        <span className="text-foreground font-semibold">{t("itemsTab.subtotal", { subtotal: formatMoney(item.subtotal, currency) })}</span>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleBuyAgain(item)}
                          className="h-8 text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/5"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          {t("actions.buyAgain")}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/${locale}/product/${item.productId}`)}
                          className="h-8 text-xs gap-1.5"
                        >
                          {t("actions.viewProduct")}
                          <ChevronRight className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="shipping" className="mt-3">
            <div className="grid lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 space-y-4">
                <ShippingCard order={order} />

                <Card className="p-4 border-border/50">
                  <div className="flex items-center gap-2 mb-3">
                    <Truck className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold">{t("shippingDates.title")}</h3>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">{t("shippingDates.confirmed")}</p>
                      <p className="font-medium">{formatDateTime(locale, order.confirmedAt, empty)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t("shippingDates.shipped")}</p>
                      <p className="font-medium">{formatDateTime(locale, order.shippedAt, empty)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t("shippingDates.delivered")}</p>
                      <p className="font-medium">{formatDateTime(locale, order.deliveredAt, empty)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t("shippingDates.cancelled")}</p>
                      <p className="font-medium">{formatDateTime(locale, order.cancelledAt, empty)}</p>
                    </div>
                  </div>
                </Card>

                {(order.customerNotes || order.adminNotes) && (
                  <Card className="p-4 border-border/50">
                    <div className="flex items-center gap-2 mb-3">
                      <Mail className="w-4 h-4 text-primary" />
                      <h3 className="font-semibold">{t("notes.title")}</h3>
                    </div>
                    <div className="space-y-3 text-sm">
                      {order.customerNotes && (
                        <div>
                          <p className="text-muted-foreground">{t("notes.customer")}</p>
                          <p className="font-medium">{order.customerNotes}</p>
                        </div>
                      )}
                      {order.adminNotes && (
                        <div>
                          <p className="text-muted-foreground">{t("notes.admin")}</p>
                          <p className="font-medium">{order.adminNotes}</p>
                        </div>
                      )}
                    </div>
                  </Card>
                )}
              </div>

              <div className="space-y-4">
                <TotalsCard order={order} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="payment" className="mt-3">
            <div className="grid lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 space-y-4">
                <PaymentCard order={order} />

                <Card className="p-4 border-border/50">
                  <div className="flex items-center gap-2 mb-3">
                    <CreditCard className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold">{t("paymentDetails.title")}</h3>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">{t("paymentDetails.method")}</p>
                      <p className="font-medium">{getPaymentMethodLabel(t, order.paymentMethod)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">{t("paymentDetails.status")}</p>
                      <p className="font-medium">{getPaymentStatusLabel(t, order.paymentStatus)}</p>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="space-y-4">
                <TotalsCard order={order} />
              </div>
            </div>
          </TabsContent>

          <TabsContent value="history" className="mt-3">
            <Card className="p-4 border-border/50">
              <div className="flex items-center gap-2 mb-3">
                <Clock className="w-4 h-4 text-primary" />
                <h3 className="font-semibold">{t("history.title")}</h3>
              </div>
              <HistoryTimeline order={order} />
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ShopPageLayout>
  )
}
