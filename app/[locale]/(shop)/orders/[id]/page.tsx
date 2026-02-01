"use client"

import {
  ArrowLeft,
  Banknote,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Coins,
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
  XCircle,
} from "lucide-react"
import { useLocale } from "next-intl"
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

import { useCart } from "@/components/layout/cart-context-provider"
import { InvoiceDialog } from "@/components/invoice/invoice-dialog"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useGetOrderQuery } from "@/state/api/orders-api-slice"
import { useAppSelector } from "@/state/hooks"
import type { Order, OrderStatus, PaymentStatus } from "@/types/order"

const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "En attente",
  confirmed: "Confirmée",
  shipped: "Expédiée",
  delivered: "Livrée",
  cancelled: "Annulée",
}

const PAYMENT_STATUS_LABELS: Record<PaymentStatus, string> = {
  pending: "En attente",
  paid: "Payé",
  failed: "Échoué",
  refunded: "Remboursé",
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash_on_delivery: "Paiement à la livraison",
  pay_in_store: "Paiement en boutique",
  card: "Carte bancaire",
  bank_transfer: "Virement bancaire",
  mobile_payment: "Paiement mobile",
  solde: "Paiement différé (Solde)",
}

function formatDate(value?: string | null) {
  if (!value) return "—"
  try {
    return new Date(value).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "short",
      day: "numeric",
    })
  } catch {
    return value
  }
}

function formatDateTime(value?: string | null) {
  if (!value) return "—"
  try {
    return new Date(value).toLocaleString("fr-FR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  } catch {
    return value
  }
}

function moneyMAD(value: number) {
  return `${Number(value || 0).toFixed(2)} MAD`
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
        {ORDER_STATUS_LABELS[status]}
      </Badge>
      <span className="text-xs text-muted-foreground">•</span>
      <span className={cn("text-xs font-medium", paymentTone)}>
        {PAYMENT_STATUS_LABELS[paymentStatus]}
      </span>
    </div>
  )
}

function OrderProgressHeader({ order }: { order: Order }) {
  const fulfillmentSteps: Step[] = [
    { key: "pending", label: "Commande", icon: Clock },
    { key: "confirmed", label: "Confirmée", icon: CheckCircle2 },
    { key: "shipped", label: "Expédiée", icon: Truck },
    { key: "delivered", label: "Livrée", icon: Package },
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
                Commande #{order.orderNumber}
              </h2>
              <StatusPill order={order} />
            </div>
            <div className="flex flex-wrap items-center gap-3 mt-1 text-xs text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {formatDateTime(order.createdAt)}
              </span>
              <span className="inline-flex items-center gap-1">
                <Receipt className="w-3.5 h-3.5" />
                {moneyMAD(order.totalAmount)}
              </span>
            </div>
          </div>
        </div>

        {isCancelled ? (
          <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-900 dark:bg-red-950/30 dark:text-red-400">
            Cette commande a été annulée.
          </div>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-foreground">Fulfillment</p>
              <span className="text-xs text-muted-foreground">Statut: {ORDER_STATUS_LABELS[order.status]}</span>
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
  const remiseUsed = Number((order as any).remiseUsedAmount || 0)
  const amountToPay = Math.max(0, Number(order.totalAmount || 0) - remiseUsed)

  return (
    <Card className="p-4 border-border/50">
      <div className="flex items-center gap-2 mb-3">
        <Receipt className="w-4 h-4 text-primary" />
        <h3 className="font-semibold">Récapitulatif</h3>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Sous-total</span>
          <span className="font-medium">{moneyMAD(order.subtotal)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Livraison</span>
          <span className="font-medium">{moneyMAD(order.shippingCost)}</span>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-muted-foreground">Taxes</span>
          <span className="font-medium">{moneyMAD(order.taxAmount)}</span>
        </div>
        {order.discountAmount > 0 && (
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground">Remise</span>
            <span className="font-medium text-green-700 dark:text-green-400">- {moneyMAD(order.discountAmount)}</span>
          </div>
        )}
        <Separator />
        <div className="flex items-center justify-between">
          <span className="font-semibold">Total</span>
          <span className="font-bold text-foreground">{moneyMAD(order.totalAmount)}</span>
        </div>

        {remiseUsed > 0 && (
          <>
            <Separator className="my-2" />
            <div className="rounded-lg border border-emerald-200/60 dark:border-emerald-800/40 bg-emerald-50/50 dark:bg-emerald-950/20 p-3 space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <CreditCard className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-100">Paiement mixte</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5">
                  <Wallet className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-emerald-700/80 dark:text-emerald-300/80">Solde remise utilisé</span>
                </div>
                <span className="font-semibold text-emerald-900 dark:text-emerald-100">-{moneyMAD(remiseUsed)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">Reste à payer</span>
                <span className="text-base font-bold text-emerald-700 dark:text-emerald-300">{moneyMAD(amountToPay)}</span>
              </div>
            </div>
          </>
        )}
      </div>
    </Card>
  )
}

function PaymentCard({ order }: { order: Order }) {
  const methodLabel = PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod
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
            <p className="text-sm font-semibold truncate">Paiement</p>
            {remiseUsed > 0 ? (
              <div className="flex items-center gap-1.5 mt-1">
                <div className="inline-flex items-center gap-1 text-[10px] font-medium rounded-full px-2 py-0.5 border bg-emerald-50/50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-300 border-emerald-200/60 dark:border-emerald-800/40">
                  <Wallet className="w-3 h-3" />
                  <span>Remise</span>
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
          <span className="text-xs text-muted-foreground">Statut</span>
          <Badge variant="secondary" className="text-xs">
            {PAYMENT_STATUS_LABELS[order.paymentStatus]}
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
                <span className="text-emerald-700/80 dark:text-emerald-300/80">Remise utilisée</span>
              </div>
              <span className="font-semibold text-emerald-900 dark:text-emerald-100">-{moneyMAD(remiseUsed)}</span>
            </div>
            <Separator className="bg-emerald-200/40 dark:bg-emerald-800/40" />
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                <paymentConfig.icon className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">À payer ({methodLabel})</span>
              </div>
              <span className="text-base font-bold text-emerald-700 dark:text-emerald-300">{moneyMAD(amountToPay)}</span>
            </div>
            {order.customerNotes && (
              <div className="pt-2 border-t border-emerald-200/40 dark:border-emerald-800/40">
                <p className="text-[10px] text-emerald-700/70 dark:text-emerald-300/70 italic">Note: {order.customerNotes}</p>
              </div>
            )}
          </div>
        </div>
      )}
    </Card>
  )
}

function ShippingCard({ order }: { order: Order }) {
  const addr = order.shippingAddress
  const isPickup = order.deliveryMethod === "pickup"

  return (
    <Card className="p-4 border-border/50">
      <div className="flex items-center gap-2 mb-3">
        {isPickup ? (
          <>
            <Store className="w-4 h-4 text-violet-600" />
            <h3 className="font-semibold">Retrait en boutique</h3>
          </>
        ) : (
          <>
            <MapPin className="w-4 h-4 text-emerald-600" />
            <h3 className="font-semibold">Livraison</h3>
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
              <span className="text-muted-foreground text-sm">{order.customerPhone || "—"}</span>
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
                <span className="text-muted-foreground">{order.customerPhone || "—"}</span>
              </div>
            </div>
          </div>
      )}
    </Card>
  )
}

function HistoryTimeline({ order }: { order: Order }) {
  const history = order.statusHistory ?? []
  if (!history.length) {
    return (
      <div className="text-sm text-muted-foreground">
        Aucun historique disponible pour le moment.
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
                    {ORDER_STATUS_LABELS[entry.newStatus]}
                  </Badge>
                  <span className="text-xs text-muted-foreground">• {entry.changedByType}</span>
                </div>
                {entry.notes && <p className="text-sm mt-1">{entry.notes}</p>}
              </div>
              <span className="text-xs text-muted-foreground whitespace-nowrap">
                {formatDateTime(entry.timestamp)}
              </span>
            </div>
          </Card>
        ))}
    </div>
  )
}

export default function OrderDetailsPage() {
  const locale = useLocale()
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

    toast.success("Ajouté au panier", { description: item.productName })

    setTimeout(() => {
      cartRef.current?.open()
    }, 250)
  }

  if (!isAuthenticated) {
    return (
      <ShopPageLayout title="Détails de la commande" subtitle="Connectez-vous pour consulter votre commande" icon="cart">
        <Card className="p-6 border-border/50">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-muted-foreground mt-0.5" />
            <div className="space-y-2">
              <p className="font-semibold">Session requise</p>
              <p className="text-sm text-muted-foreground">
                Veuillez vous connecter pour accéder aux détails de votre commande.
              </p>
              <div className="flex gap-2">
                <Button onClick={() => router.push(`/${locale}/login`)}>Se connecter</Button>
                <Button variant="outline" onClick={() => router.push(`/${locale}/orders`)}>
                  Retour
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
      <ShopPageLayout title="Détails de la commande" subtitle="Chargement..." icon="cart">
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
      <ShopPageLayout title="Détails de la commande" subtitle="Impossible de charger la commande" icon="cart">
        <Card className="p-6 border-border/50">
          <div className="flex items-start gap-3">
            <XCircle className="w-5 h-5 text-red-600 mt-0.5" />
            <div className="space-y-2">
              <p className="font-semibold">Impossible de charger la commande</p>
              <p className="text-sm text-muted-foreground">Veuillez réessayer dans quelques instants.</p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => router.push(`/${locale}/orders`)}>
                  Retour à mes commandes
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
      title="Détails de la commande"
      subtitle={`Commande #${order.orderNumber} • ${itemsCount} article${itemsCount > 1 ? "s" : ""}`}
      icon="cart"
    >
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <Link href={`/${locale}/orders`} className="inline-flex">
            <Button variant="outline" size="sm" className="gap-2">
              <ArrowLeft className="w-4 h-4" />
              Mes commandes
            </Button>
          </Link>

          <div className="flex items-center gap-2">
            <InvoiceDialog order={order} user={user} triggerText="Facture" />

            <Button variant="ghost" size="sm" onClick={() => router.refresh()} className="gap-2">
              <RefreshCw className="w-4 h-4" />
              Actualiser
            </Button>
          </div>
        </div>

        <OrderProgressHeader order={order} />

        <Tabs value={tab} onValueChange={setTab} className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto">
            <TabsTrigger value="overview">Résumé</TabsTrigger>
            <TabsTrigger value="items">Articles</TabsTrigger>
            <TabsTrigger value="shipping">Livraison</TabsTrigger>
            <TabsTrigger value="payment">Paiement</TabsTrigger>
            <TabsTrigger value="history">Historique</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-3">
            <div className="grid lg:grid-cols-3 gap-4">
              <div className="lg:col-span-2 space-y-4">
                <Card className="p-4 border-border/50">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-sm text-muted-foreground">Commande</p>
                      <p className="font-semibold truncate">#{order.orderNumber}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/${locale}/orders`)}
                      className="gap-2"
                    >
                      Voir la liste
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>

                  <Separator className="my-3" />

                  <div className="grid sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Date</p>
                      <p className="font-medium">{formatDateTime(order.createdAt)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Statut</p>
                      <p className="font-medium">{ORDER_STATUS_LABELS[order.status]}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Paiement</p>
                      <p className="font-medium">{PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Total</p>
                      <p className="font-semibold">{moneyMAD(order.totalAmount)}</p>
                    </div>
                  </div>
                </Card>

                <Card className="p-4 border-border/50">
                  <div className="flex items-center gap-2 mb-3">
                    <Package className="w-4 h-4 text-primary" />
                    <h3 className="font-semibold">Articles</h3>
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
                            Qté: {item.quantity} • {moneyMAD(item.subtotal)}
                          </p>
                        </div>
                      </div>
                    ))}

                    {(order.items?.length ?? 0) > 3 && (
                      <p className="text-xs text-muted-foreground">
                        + {(order.items?.length ?? 0) - 3} autre(s) article(s)
                      </p>
                    )}

                    <div>
                      <Button variant="outline" size="sm" onClick={() => setTab("items")}>
                        Voir tous les articles
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
                  <h3 className="font-semibold">Articles</h3>
                  <p className="text-sm text-muted-foreground">{itemsCount} article(s)</p>
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
                          {item.variantType}: {item.variantName}
                        </p>
                      )}
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
                        <span>Qté: {item.quantity}</span>
                        <span>PU: {moneyMAD(item.unitPrice)}</span>
                        <span className="text-foreground font-semibold">Sous-total: {moneyMAD(item.subtotal)}</span>
                      </div>

                      <div className="flex flex-wrap gap-2 mt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleBuyAgain(item)}
                          className="h-8 text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/5"
                        >
                          <RefreshCw className="w-3.5 h-3.5" />
                          Acheter à nouveau
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/${locale}/product/${item.productId}`)}
                          className="h-8 text-xs gap-1.5"
                        >
                          Voir le produit
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
                    <h3 className="font-semibold">Dates</h3>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Confirmée</p>
                      <p className="font-medium">{formatDateTime(order.confirmedAt)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Expédiée</p>
                      <p className="font-medium">{formatDateTime(order.shippedAt)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Livrée</p>
                      <p className="font-medium">{formatDateTime(order.deliveredAt)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Annulée</p>
                      <p className="font-medium">{formatDateTime(order.cancelledAt)}</p>
                    </div>
                  </div>
                </Card>

                {(order.customerNotes || order.adminNotes) && (
                  <Card className="p-4 border-border/50">
                    <div className="flex items-center gap-2 mb-3">
                      <Mail className="w-4 h-4 text-primary" />
                      <h3 className="font-semibold">Notes</h3>
                    </div>
                    <div className="space-y-3 text-sm">
                      {order.customerNotes && (
                        <div>
                          <p className="text-muted-foreground">Client</p>
                          <p className="font-medium">{order.customerNotes}</p>
                        </div>
                      )}
                      {order.adminNotes && (
                        <div>
                          <p className="text-muted-foreground">Admin</p>
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
                    <h3 className="font-semibold">Détails du paiement</h3>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-muted-foreground">Méthode</p>
                      <p className="font-medium">{PAYMENT_METHOD_LABELS[order.paymentMethod] ?? order.paymentMethod}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Statut</p>
                      <p className="font-medium">{PAYMENT_STATUS_LABELS[order.paymentStatus]}</p>
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
                <h3 className="font-semibold">Historique de statut</h3>
              </div>
              <HistoryTimeline order={order} />
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </ShopPageLayout>
  )
}
