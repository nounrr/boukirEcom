"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Package, Truck, ChevronRight, Eye, RotateCcw, ChevronDown, Clock, Store, CreditCard, Wallet, MapPin, Home } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import type { Order, OrderStatus, PaymentStatus, PaymentMethod } from "@/types/order"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { useMemo, useState } from "react"
import { useGetOrderQuery } from "@/state/api/orders-api-slice"

interface OrderCardProps {
  order: Order
  locale: string
  onBuyAgain: (item: any) => void
  statusConfig: {
    label: string
    icon: any
    color: string
    bg: string
    border: string
  }
  paymentStatusConfig: {
    label: string
    color: string
  }
}

export function OrderCard({ order, locale, onBuyAgain, statusConfig, paymentStatusConfig }: OrderCardProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const hasId = typeof order.id === "number" ? order.id > 0 : Boolean(order.id)
  const shouldFetchDetails = open && hasId && !(order.items && order.items.length > 0)
  const { data: detailedOrder, isFetching: isFetchingDetails } = useGetOrderQuery(
    { id: order.id },
    { skip: !shouldFetchDetails }
  )

  const displayOrder = detailedOrder ?? order

  const remiseUsedAmount = useMemo(() => {
    const raw = (displayOrder as any)?.remiseUsedAmount
    const parsed = typeof raw === "number" ? raw : Number(raw)
    return Number.isFinite(parsed) ? parsed : 0
  }, [displayOrder])

  const soldeAmount = useMemo(() => {
    const raw = (displayOrder as any)?.soldeAmount
    const parsed = typeof raw === "number" ? raw : Number(raw)
    return Number.isFinite(parsed) ? parsed : 0
  }, [displayOrder])

  const isSolde = useMemo(() => {
    return (displayOrder as any)?.isSolde === true || (displayOrder as any)?.isSolde === 1
  }, [displayOrder])

  const amountToPay = useMemo(() => {
    // For solde orders, show solde_amount as the amount to pay
    if (displayOrder.paymentMethod === 'solde' && soldeAmount > 0) {
      return soldeAmount
    }
    // For other orders with remise, calculate remaining amount
    return Math.max(0, Number(displayOrder.totalAmount || 0) - remiseUsedAmount)
  }, [displayOrder.totalAmount, displayOrder.paymentMethod, remiseUsedAmount, soldeAmount])

  const itemsCount = useMemo(() => {
    if (typeof displayOrder.itemsCount === "number") return displayOrder.itemsCount
    return displayOrder.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) ?? 0
  }, [displayOrder.items, displayOrder.itemsCount])

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(date)
  }

  const formatShortDate = (dateString: string | null) => {
    if (!dateString) return null
    const date = new Date(dateString)
    return new Intl.DateTimeFormat('fr-FR', {
      day: 'numeric',
      month: 'short',
    }).format(date)
  }

  const getDeliveryStatus = () => {
    if (displayOrder.status === 'delivered' && displayOrder.deliveredAt) {
      return {
        label: `Livrée ${formatShortDate(displayOrder.deliveredAt)}`,
        color: 'text-green-600',
        bg: 'bg-green-50',
      }
    }
    if (displayOrder.status === 'shipped' && displayOrder.shippedAt) {
      return {
        label: `Expédiée ${formatShortDate(displayOrder.shippedAt)}`,
        color: 'text-purple-600',
        bg: 'bg-purple-50',
      }
    }
    if (displayOrder.status === 'confirmed' && displayOrder.confirmedAt) {
      return {
        label: `Confirmée ${formatShortDate(displayOrder.confirmedAt)}`,
        color: 'text-blue-600',
        bg: 'bg-blue-50',
      }
    }
    if (displayOrder.status === 'cancelled') {
      return {
        label: 'Annulée',
        color: 'text-red-600',
        bg: 'bg-red-50',
      }
    }
    return {
      label: 'En attente',
      color: 'text-amber-600',
      bg: 'bg-amber-50',
    }
  }

  const deliveryStatus = getDeliveryStatus()

  const getDeliveryMethodConfig = () => {
    if (displayOrder.deliveryMethod === "pickup") {
      return {
        label: "Retrait en boutique",
        icon: Store,
        color: "text-violet-700 dark:text-violet-300",
        bg: "bg-violet-50 dark:bg-violet-950/30",
        border: "border-violet-200 dark:border-violet-800",
      }
    }
    return {
      label: "Livraison à domicile",
      icon: Truck,
      color: "text-emerald-700 dark:text-emerald-300",
      bg: "bg-emerald-50 dark:bg-emerald-950/30",
      border: "border-emerald-200 dark:border-emerald-800",
    }
  }

  const getPaymentMethodConfig = () => {
    switch (displayOrder.paymentMethod) {
      case "solde":
        return {
          label: "Paiement différé",
          icon: Clock,
          color: "text-violet-700 dark:text-violet-300",
          bg: "bg-violet-50 dark:bg-violet-950/30",
          border: "border-violet-200 dark:border-violet-800",
        }
      case "pay_in_store":
        return {
          label: "Paiement en boutique",
          icon: Store,
          color: "text-violet-700 dark:text-violet-300",
          bg: "bg-violet-50 dark:bg-violet-950/30",
          border: "border-violet-200 dark:border-violet-800",
        }
      case "cash_on_delivery":
        return {
          label: "Paiement à la livraison",
          icon: Wallet,
          color: "text-emerald-700 dark:text-emerald-300",
          bg: "bg-emerald-50 dark:bg-emerald-950/30",
          border: "border-emerald-200 dark:border-emerald-800",
        }
      case "card":
        return {
          label: "Carte bancaire",
          icon: CreditCard,
          color: "text-blue-700 dark:text-blue-300",
          bg: "bg-blue-50 dark:bg-blue-950/30",
          border: "border-blue-200 dark:border-blue-800",
        }
      default:
        return {
          label: displayOrder.paymentMethod,
          icon: CreditCard,
          color: "text-muted-foreground",
          bg: "bg-muted/50",
          border: "border-border",
        }
    }
  }

  const deliveryMethodConfig = getDeliveryMethodConfig()
  const paymentMethodConfig = getPaymentMethodConfig()

  return (
    <div className="bg-card border border-border/40 rounded-2xl overflow-hidden hover:shadow-md transition-all duration-200">
      <Collapsible open={open} onOpenChange={setOpen}>
        {/* Header */}
        <div className="bg-muted/30 px-4 sm:px-5 py-3 border-b border-border/40">
          <div className="flex flex-col gap-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-4">
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Commande</span>
                    <span className="text-xs font-medium">{formatDate(order.createdAt)}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">Total</span>
                    <span className="text-sm font-bold text-foreground">{order.totalAmount.toFixed(2)} MAD</span>
                    {remiseUsedAmount > 0 && (
                      <span className="text-xs text-emerald-700 dark:text-emerald-400">
                        • Remise: -{remiseUsedAmount.toFixed(2)}
                      </span>
                    )}
                    {displayOrder.paymentMethod === 'solde' && soldeAmount > 0 ? (
                      <span className="text-xs text-violet-700 dark:text-violet-400">
                        • À payer en solde: <span className="font-semibold">{soldeAmount.toFixed(2)} MAD</span>
                      </span>
                    ) : remiseUsedAmount > 0 && (
                      <span className="text-xs text-muted-foreground">
                        • À payer: <span className="font-semibold text-foreground">{amountToPay.toFixed(2)} MAD</span>
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground">• {itemsCount} article{itemsCount > 1 ? "s" : ""}</span>
                  </div>
                </div>

                <div className="hidden sm:block h-10 w-px bg-border/40" />

                <div className="hidden sm:flex flex-col">
                  <span className="text-xs text-muted-foreground">Livrer à</span>
                  <span className="text-xs font-medium">{order.customerName}</span>
                </div>
              </div>

              <div className="flex items-center justify-between sm:justify-end gap-2">
                <span className="text-xs text-muted-foreground">N° {displayOrder.orderNumber}</span>

                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (!hasId) return
                      router.push(`/${locale}/orders/${order.id}`)
                    }}
                    className="h-8 text-xs hover:text-primary"
                  >
                    Détails
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>

                  <CollapsibleTrigger asChild>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      aria-label={open ? "Réduire la commande" : "Afficher les articles"}
                      className="h-8 w-8 hover:bg-muted/60"
                    >
                      <ChevronDown className={cn("w-4 h-4 transition-transform duration-200", open && "rotate-180")} />
                    </Button>
                  </CollapsibleTrigger>
                </div>
              </div>
            </div>

            {/* Status row (always visible) */}
            <div className={cn("flex flex-wrap items-center justify-between gap-2 rounded-lg px-3 py-2 border border-border/40", deliveryStatus.bg)}>
              <div className="flex items-center gap-2 min-w-0">
                <p className={cn("text-xs sm:text-sm font-semibold truncate", deliveryStatus.color)}>{deliveryStatus.label}</p>
                {displayOrder.status === "delivered" && displayOrder.deliveredAt && (
                  <span className="hidden sm:inline text-xs text-muted-foreground truncate">Colis livré.</span>
                )}
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className={cn("text-[11px]", statusConfig.border, statusConfig.color, statusConfig.bg)}>
                  {statusConfig.label}
                </Badge>
                <span className="text-xs text-muted-foreground">•</span>
                <Badge variant="outline" className={cn("text-[10px] gap-1", deliveryMethodConfig.bg, deliveryMethodConfig.color, deliveryMethodConfig.border)}>
                  <deliveryMethodConfig.icon className="w-3 h-3" />
                  {deliveryMethodConfig.label}
                </Badge>
                <span className="text-xs text-muted-foreground">•</span>
                {remiseUsedAmount > 0 ? (
                  <>
                    <Badge variant="outline" className="text-[10px] gap-1 bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800">
                      <CreditCard className="w-3 h-3" />
                      Remise + {paymentMethodConfig.label}
                    </Badge>
                  </>
                ) : (
                  <Badge variant="outline" className={cn("text-[10px] gap-1", paymentMethodConfig.bg, paymentMethodConfig.color, paymentMethodConfig.border)}>
                    <paymentMethodConfig.icon className="w-3 h-3" />
                    {paymentMethodConfig.label}
                  </Badge>
                )}
                <span className="text-xs text-muted-foreground">•</span>
                <span className={cn("text-xs font-medium", paymentStatusConfig.color)}>
                  {paymentStatusConfig.label}
                </span>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => {
                    if (!hasId) return
                    router.push(`/${locale}/orders/${order.id}`)
                  }}
                  className="h-auto p-0 text-xs text-primary hover:underline"
                >
                  Facture
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Collapsible content */}
        <CollapsibleContent>
          <div className="p-4 sm:p-5 space-y-3">
            {isFetchingDetails && (!displayOrder.items || displayOrder.items.length === 0) ? (
              <div className="text-sm text-muted-foreground">Chargement des détails...</div>
            ) : null}

            {/* Pickup Location Info */}
            {displayOrder.deliveryMethod === "pickup" && displayOrder.pickupLocation && (
              <div className="rounded-lg border border-violet-200/60 dark:border-violet-800/40 bg-violet-50/50 dark:bg-violet-950/20 p-3 mb-3">
                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-violet-600 dark:text-violet-400 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-violet-900 dark:text-violet-100">{displayOrder.pickupLocation.name}</p>
                    <p className="text-xs text-violet-700/80 dark:text-violet-300/80 mt-0.5">
                      {displayOrder.pickupLocation.addressLine1}
                      {displayOrder.pickupLocation.addressLine2 && `, ${displayOrder.pickupLocation.addressLine2}`}
                    </p>
                    <p className="text-xs text-violet-700/80 dark:text-violet-300/80">
                      {displayOrder.pickupLocation.city}
                      {displayOrder.pickupLocation.postalCode && `, ${displayOrder.pickupLocation.postalCode}`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Delivery Address Info */}
            {displayOrder.deliveryMethod === "delivery" && displayOrder.shippingAddress && (
              <div className="rounded-lg border border-emerald-200/60 dark:border-emerald-800/40 bg-emerald-50/50 dark:bg-emerald-950/20 p-3 mb-3">
                <div className="flex items-start gap-2">
                  <Home className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-100">Adresse de livraison</p>
                    <p className="text-xs text-emerald-700/80 dark:text-emerald-300/80 mt-0.5">
                      {displayOrder.shippingAddress.line1}
                      {displayOrder.shippingAddress.line2 && `, ${displayOrder.shippingAddress.line2}`}
                    </p>
                    <p className="text-xs text-emerald-700/80 dark:text-emerald-300/80">
                      {displayOrder.shippingAddress.city}
                      {displayOrder.shippingAddress.postalCode && `, ${displayOrder.shippingAddress.postalCode}`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {displayOrder.items?.map((item) => (
              <div key={item.id} className="flex gap-3 pb-3 border-b border-border/20 last:border-0 last:pb-0">
                {/* Product Image */}
                <div className="relative w-20 h-20 rounded-lg overflow-hidden bg-muted shrink-0 border border-border/30">
                  {item.imageUrl ? (
                    <Image
                      src={item.imageUrl}
                      alt={item.productName}
                      fill
                      className="object-cover"
                      unoptimized={item.imageUrl.includes('picsum') || item.imageUrl.includes('unsplash')}
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-7 h-7 text-muted-foreground/30" />
                    </div>
                  )}
                </div>

                {/* Product Details */}
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm text-foreground line-clamp-2">
                    {item.productName}
                  </h4>
                  {item.variantName && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {item.variantType}: {item.variantName}
                    </p>
                  )}

                  <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-2 text-xs text-muted-foreground">
                    <span>Qté: {item.quantity}</span>
                    <span className="text-foreground font-semibold">{item.subtotal.toFixed(2)} MAD</span>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex flex-wrap gap-2 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onBuyAgain(item)}
                      className="h-8 text-xs gap-1.5 border-primary/30 text-primary hover:bg-primary/5"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Acheter à nouveau
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => router.push(`/${locale}/product/${item.productId}`)}
                      className="h-8 text-xs gap-1.5"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      Voir le produit
                    </Button>
                    {(displayOrder.status === "shipped" || displayOrder.status === "delivered") && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/${locale}/orders/${order.id}/track`)}
                        className="h-8 text-xs gap-1.5"
                      >
                        <Truck className="w-3.5 h-3.5" />
                        Suivre le colis
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CollapsibleContent>
      </Collapsible>
    </div>
  )
}
