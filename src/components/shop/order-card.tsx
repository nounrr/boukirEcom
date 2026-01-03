"use client"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Package, Clock, CheckCircle, XCircle, Truck, ChevronRight, Eye, RotateCcw } from "lucide-react"
import Image from "next/image"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import type { Order, OrderStatus, PaymentStatus } from "@/types/order"

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
    if (order.status === 'delivered' && order.deliveredAt) {
      return {
        label: `Livrée ${formatShortDate(order.deliveredAt)}`,
        color: 'text-green-600',
        bg: 'bg-green-50',
      }
    }
    if (order.status === 'shipped' && order.shippedAt) {
      return {
        label: `Expédiée ${formatShortDate(order.shippedAt)}`,
        color: 'text-purple-600',
        bg: 'bg-purple-50',
      }
    }
    if (order.status === 'confirmed' && order.confirmedAt) {
      return {
        label: `Confirmée ${formatShortDate(order.confirmedAt)}`,
        color: 'text-blue-600',
        bg: 'bg-blue-50',
      }
    }
    if (order.status === 'cancelled') {
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

  return (
    <div className="bg-card border border-border/40 rounded-2xl overflow-hidden hover:shadow-lg transition-all duration-300">
      {/* Header */}
      <div className="bg-muted/30 px-5 py-3 border-b border-border/40">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-4">
            <div className="flex flex-col">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs text-muted-foreground">Commande passée</span>
                <span className="text-xs font-medium">{formatDate(order.createdAt)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Total</span>
                <span className="text-sm font-bold text-foreground">{order.totalAmount.toFixed(2)} MAD</span>
              </div>
            </div>
            
            <div className="h-10 w-px bg-border/40" />
            
            <div className="flex flex-col">
              <span className="text-xs text-muted-foreground mb-1">Livrer à</span>
              <span className="text-xs font-medium">{order.customerName}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground">N° {order.orderNumber}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push(`/${locale}/orders/${order.id}`)}
              className="h-8 text-xs hover:text-primary"
            >
              Voir les détails
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
        </div>
      </div>

      {/* Delivery Status */}
      <div className={cn("px-5 py-2.5 border-b border-border/40", deliveryStatus.bg)}>
        <p className={cn("text-sm font-semibold", deliveryStatus.color)}>
          {deliveryStatus.label}
        </p>
        {order.status === 'delivered' && order.deliveredAt && (
          <p className="text-xs text-muted-foreground mt-0.5">
            Votre colis a été livré. Il a été remis directement à un résident.
          </p>
        )}
      </div>

      {/* Items */}
      <div className="p-5 space-y-4">
        {order.items?.map((item) => (
          <div key={item.id} className="flex gap-4 pb-4 border-b border-border/20 last:border-0 last:pb-0">
            {/* Product Image */}
            <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-muted flex-shrink-0 border border-border/30">
              {item.imageUrl ? (
                <Image
                  src={item.imageUrl}
                  alt={item.productName}
                  fill
                  className="object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-8 h-8 text-muted-foreground/30" />
                </div>
              )}
            </div>

            {/* Product Details */}
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm text-foreground mb-1 line-clamp-2">
                {item.productName}
              </h4>
              {item.variantName && (
                <p className="text-xs text-muted-foreground mb-2">
                  {item.variantType}: {item.variantName}
                </p>
              )}
              {order.status === 'delivered' && order.deliveredAt && (
                <p className="text-xs text-muted-foreground mb-2">
                  Retourner ou remplacer les articles: Éligible jusqu'au {formatDate(new Date(new Date(order.deliveredAt).getTime() + 30 * 24 * 60 * 60 * 1000).toISOString())}
                </p>
              )}

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
                {(order.status === 'shipped' || order.status === 'delivered') && (
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

            {/* Quantity & Price */}
            <div className="text-right flex-shrink-0">
              <p className="text-sm font-semibold text-foreground">
                {item.subtotal.toFixed(2)} MAD
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Qté: {item.quantity}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Footer Actions */}
      <div className="bg-muted/20 px-5 py-3 border-t border-border/40">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={cn("text-xs", statusConfig.border, statusConfig.color, statusConfig.bg)}>
              {statusConfig.label}
            </Badge>
            <span className="text-xs text-muted-foreground">•</span>
            <span className={cn("text-xs font-medium", paymentStatusConfig.color)}>
              {paymentStatusConfig.label}
            </span>
          </div>
          <Button
            variant="link"
            size="sm"
            onClick={() => router.push(`/${locale}/orders/${order.id}`)}
            className="h-auto p-0 text-xs text-primary hover:underline"
          >
            Voir la facture
          </Button>
        </div>
      </div>
    </div>
  )
}
