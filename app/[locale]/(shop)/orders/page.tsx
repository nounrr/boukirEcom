"use client"

import { ShopPageLayout } from "@/components/layout/shop-page-layout"
import { useGetOrdersQuery } from "@/state/api/orders-api-slice"
import { useAppSelector } from "@/state/hooks"
import { Package, Clock, CheckCircle, XCircle, Truck } from "lucide-react"
import { useLocale } from "next-intl"
import type { OrderStatus, PaymentStatus } from "@/types/order"
import { useCart } from "@/components/layout/cart-context-provider"
import { useToast } from "@/hooks/use-toast"
import { OrderCard } from "@/components/shop/order-card"

// Status configuration
const ORDER_STATUS_CONFIG: Record<OrderStatus, { 
  label: string
  icon: any
  color: string
  bg: string
  border: string
}> = {
  pending: {
    label: "En attente",
    icon: Clock,
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-950/30",
    border: "border-amber-500/50",
  },
  confirmed: {
    label: "Confirmée",
    icon: CheckCircle,
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-500/50",
  },
  shipped: {
    label: "Expédiée",
    icon: Truck,
    color: "text-purple-600",
    bg: "bg-purple-50 dark:bg-purple-950/30",
    border: "border-purple-500/50",
  },
  delivered: {
    label: "Livrée",
    icon: CheckCircle,
    color: "text-green-600",
    bg: "bg-green-50 dark:bg-green-950/30",
    border: "border-green-500/50",
  },
  cancelled: {
    label: "Annulée",
    icon: XCircle,
    color: "text-red-600",
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-500/50",
  },
}

const PAYMENT_STATUS_CONFIG: Record<PaymentStatus, { 
  label: string
  color: string
}> = {
  pending: { label: "En attente", color: "text-amber-600" },
  paid: { label: "Payé", color: "text-green-600" },
  failed: { label: "Échoué", color: "text-red-600" },
  refunded: { label: "Remboursé", color: "text-gray-600" },
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash_on_delivery: "Paiement à la livraison",
  pay_in_store: "Paiement en boutique",
  card: "Carte bancaire",
  bank_transfer: "Virement bancaire",
  mobile_payment: "Paiement mobile",
  solde: "Paiement différé (Solde)",
}

export default function OrdersPage() {
  const locale = useLocale()
  const { isAuthenticated } = useAppSelector((state) => state.user)
  const { cartRef } = useCart()
  const toast = useToast()
  
  const { data: ordersData, isLoading } = useGetOrdersQuery(undefined, {
    skip: !isAuthenticated,
  })

  const orders = ordersData?.orders || []
  const isEmpty = !isLoading && orders.length === 0

  const handleBuyAgain = async (item: any) => {
    if (cartRef?.current) {
      cartRef.current.addItem({
        productId: item.productId,
        variantId: item.variantId,
        name: item.productName,
        price: item.unitPrice,
        quantity: item.quantity,
        image: item.imageUrl || '',
        category: '',
        stock: 999,
      })
      
      toast.success("Ajouté au panier", { description: item.productName })
      
      setTimeout(() => {
        cartRef.current?.open()
      }, 300)
    }
  }

  if (isLoading) {
    return (
      <ShopPageLayout
        title="Mes Commandes"
        subtitle="Chargement..."
        icon="cart"
      >
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-5 animate-pulse">
              <div className="flex gap-4">
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-muted rounded w-1/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                  <div className="h-8 bg-muted rounded w-32" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </ShopPageLayout>
    )
  }

  return (
    <ShopPageLayout
      title="Mes Commandes"
      subtitle="Suivez l'état de vos commandes"
      icon="cart"
      itemCount={orders.length}
      isEmpty={isEmpty}
      emptyState={{
        icon: <Package className="w-10 h-10 text-muted-foreground" />,
        title: "Aucune commande",
        description: "Vous n'avez pas encore passé de commande. Découvrez nos produits et passez votre première commande.",
        actionLabel: "Découvrir les produits",
        actionHref: `/${locale}/shop`,
      }}
    >
      <div className="space-y-3">
        {orders.map((order) => (
          <OrderCard
            key={order.id}
            order={order}
            locale={locale}
            onBuyAgain={handleBuyAgain}
            statusConfig={ORDER_STATUS_CONFIG[order.status]}
            paymentStatusConfig={PAYMENT_STATUS_CONFIG[order.paymentStatus]}
          />
        ))}
      </div>
    </ShopPageLayout>
  )
}