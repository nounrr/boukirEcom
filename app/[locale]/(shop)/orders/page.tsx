"use client"

import { ShopPageLayout } from "@/components/layout/shop-page-layout"
import { AccountSidebar } from "@/components/account/account-sidebar"
import { useGetOrdersQuery } from "@/state/api/orders-api-slice"
import { useAppSelector } from "@/state/hooks"
import { Package, Clock, CheckCircle, XCircle, Truck, CalendarIcon, ChevronLeft, ChevronRight, Filter, X, CreditCard } from "lucide-react"
import { useLocale } from "next-intl"
import type { OrderStatus, PaymentStatus } from "@/types/order"
import { useCart } from "@/components/layout/cart-context-provider"
import { useToast } from "@/hooks/use-toast"
import { OrderCard } from "@/components/shop/order-card"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { fr } from "date-fns/locale"
import { type DateRange } from "react-day-picker"

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
  
  // Pagination and filter state
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [period, setPeriod] = useState<'this_week' | 'this_month' | 'custom' | ''>('')
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [status, setStatus] = useState<OrderStatus | ''>('')
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | ''>('')
  const [paymentMethod, setPaymentMethod] = useState<string>('')
  const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'pickup' | ''>('')

  const { data: ordersData, isLoading } = useGetOrdersQuery(
    {
      page,
      limit,
      period: period && period !== 'custom' ? period : undefined,
      startDate: period === 'custom' && dateRange?.from ? format(dateRange.from, 'yyyy-MM-dd') : undefined,
      endDate: period === 'custom' && dateRange?.to ? format(dateRange.to, 'yyyy-MM-dd') : undefined,
      status: status || undefined,
      paymentStatus: paymentStatus || undefined,
      paymentMethod: paymentMethod || undefined,
      deliveryMethod: deliveryMethod || undefined,
    },
    {
      skip: !isAuthenticated,
    }
  )

  const orders = ordersData?.orders || []
  const total = ordersData?.total || 0
  const totalPages = Math.ceil(total / limit)
  const isEmpty = !isLoading && orders.length === 0

  // Reset to page 1 when filters change
  const handlePeriodChange = (value: string) => {
    const nextPeriod = value === 'all' ? '' : (value as any)
    setPeriod(nextPeriod)
    if (nextPeriod !== 'custom') {
      setDateRange(undefined)
    }
    setPage(1)
  }

  const clearFilters = () => {
    setPeriod('')
    setDateRange(undefined)
    setStatus('')
    setPaymentStatus('')
    setPaymentMethod('')
    setDeliveryMethod('')
    setPage(1)
  }

  const hasActiveFilters =
    period !== '' ||
    dateRange?.from ||
    dateRange?.to ||
    status !== '' ||
    paymentStatus !== '' ||
    paymentMethod !== '' ||
    deliveryMethod !== ''
  const isFilteredEmpty = isEmpty && hasActiveFilters
  const isTrulyEmpty = isEmpty && !hasActiveFilters

  const handleBuyAgain = async (item: any) => {
    if (cartRef?.current) {
      cartRef.current.addItem({
        productId: item.productId,
        variantId: item.variantId,
        unitId: item.unitId ?? item.unit_id,
        unitName: item.unitName ?? item.unit_name,
        variantName: item.variantName ?? item.variant_name,
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
      subtitle={
        total > 0
          ? `${total} commande${total > 1 ? 's' : ''}${totalPages > 1 ? ` • Page ${page}/${totalPages}` : ''}`
          : isFilteredEmpty
            ? "Aucun résultat pour ces filtres"
            : "Suivez l'état de vos commandes"
      }
      icon="cart"
      showHeader={false}
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <AccountSidebar active="orders" />
        <section className="lg:col-span-3">
          <div className="mb-4 flex items-center gap-3 pb-4 border-b border-border/60">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Mes Commandes</h1>
              <p className="text-sm text-muted-foreground">
                {total > 0 ? (
                  <>
                    <span className="font-semibold text-foreground">{total}</span> commande{total > 1 ? 's' : ''}
                    {totalPages > 1 && ` • Page ${page}/${totalPages}`}
                  </>
                ) : isFilteredEmpty ? (
                  "Aucun résultat pour ces filtres"
                ) : (
                  "Suivez l'état de vos commandes"
                )}
              </p>
            </div>
          </div>

          {/* Filters Bar */}
          {isAuthenticated && (
            <div className="mb-6 flex flex-wrap items-center gap-2">
            {/* Period Selector */}
            <Select value={period || 'all'} onValueChange={handlePeriodChange}>
              <SelectTrigger className="w-44 h-9 bg-background/95 backdrop-blur-sm border-border/60 hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-2 min-w-0">
                  <Clock className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate text-xs"><SelectValue placeholder="Toutes les périodes" /></span>
                </div>
              </SelectTrigger>
              <SelectContent className="bg-background/98 backdrop-blur-xl border-border/60">
                <SelectItem value="all" className="text-xs cursor-pointer">
                  Toutes les périodes
                </SelectItem>
                <SelectItem value="this_week" className="text-xs cursor-pointer">
                  Cette semaine
                </SelectItem>
                <SelectItem value="this_month" className="text-xs cursor-pointer">
                  Ce mois-ci
                </SelectItem>
                <SelectItem value="custom" className="text-xs cursor-pointer">
                  <div className="flex items-center gap-1.5">
                    <CalendarIcon className="w-3 h-3" />
                    Période personnalisée
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Status */}
            <Select
              value={status || 'all_status'}
              onValueChange={(v) => {
                setStatus(v === 'all_status' ? '' : (v as OrderStatus))
                setPage(1)
              }}
            >
              <SelectTrigger className="w-36 h-9 bg-background/95 backdrop-blur-sm border-border/60 hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-2 min-w-0">
                  <Filter className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate text-xs"><SelectValue placeholder="Statut" /></span>
                </div>
              </SelectTrigger>
              <SelectContent className="bg-background/98 backdrop-blur-xl border-border/60">
                <SelectItem value="all_status" className="text-xs cursor-pointer">
                  Tous statuts
                </SelectItem>
                <SelectItem value="pending" className="text-xs cursor-pointer">
                  En attente
                </SelectItem>
                <SelectItem value="confirmed" className="text-xs cursor-pointer">
                  Confirmée
                </SelectItem>
                <SelectItem value="shipped" className="text-xs cursor-pointer">
                  Expédiée
                </SelectItem>
                <SelectItem value="delivered" className="text-xs cursor-pointer">
                  Livrée
                </SelectItem>
                <SelectItem value="cancelled" className="text-xs cursor-pointer">
                  Annulée
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Payment Status */}
            <Select
              value={paymentStatus || 'all_payment_status'}
              onValueChange={(v) => {
                setPaymentStatus(v === 'all_payment_status' ? '' : (v as PaymentStatus))
                setPage(1)
              }}
            >
              <SelectTrigger className="w-36 h-9 bg-background/95 backdrop-blur-sm border-border/60 hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-2 min-w-0">
                  <CheckCircle className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate text-xs"><SelectValue placeholder="Paiement" /></span>
                </div>
              </SelectTrigger>
              <SelectContent className="bg-background/98 backdrop-blur-xl border-border/60">
                <SelectItem value="all_payment_status" className="text-xs cursor-pointer">
                  Tous paiements
                </SelectItem>
                <SelectItem value="pending" className="text-xs cursor-pointer">
                  En attente
                </SelectItem>
                <SelectItem value="paid" className="text-xs cursor-pointer">
                  Payé
                </SelectItem>
                <SelectItem value="failed" className="text-xs cursor-pointer">
                  Échoué
                </SelectItem>
                <SelectItem value="refunded" className="text-xs cursor-pointer">
                  Remboursé
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Payment Method */}
            <Select
              value={paymentMethod || 'all_payment_method'}
              onValueChange={(v) => {
                setPaymentMethod(v === 'all_payment_method' ? '' : v)
                setPage(1)
              }}
            >
              <SelectTrigger className="w-44 h-9 bg-background/95 backdrop-blur-sm border-border/60 hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-2 min-w-0">
                  <CreditCard className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate text-xs"><SelectValue placeholder="Méthode" /></span>
                </div>
              </SelectTrigger>
              <SelectContent className="bg-background/98 backdrop-blur-xl border-border/60">
                <SelectItem value="all_payment_method" className="text-xs cursor-pointer">
                  Toutes méthodes
                </SelectItem>
                <SelectItem value="cash_on_delivery" className="text-xs cursor-pointer">
                  Paiement à la livraison
                </SelectItem>
                <SelectItem value="card" className="text-xs cursor-pointer">
                  Carte bancaire
                </SelectItem>
                <SelectItem value="pay_in_store" className="text-xs cursor-pointer">
                  Paiement en boutique
                </SelectItem>
                <SelectItem value="solde" className="text-xs cursor-pointer">
                  Paiement différé (Solde)
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Delivery Method */}
            <Select
              value={deliveryMethod || 'all_delivery'}
              onValueChange={(v) => {
                setDeliveryMethod(v === 'all_delivery' ? '' : (v as any))
                setPage(1)
              }}
            >
              <SelectTrigger className="w-32 h-9 bg-background/95 backdrop-blur-sm border-border/60 hover:bg-muted/50 transition-colors cursor-pointer">
                <div className="flex items-center gap-2 min-w-0">
                  <Truck className="w-3.5 h-3.5 shrink-0 text-muted-foreground" />
                  <span className="truncate text-xs"><SelectValue placeholder="Livraison" /></span>
                </div>
              </SelectTrigger>
              <SelectContent className="bg-background/98 backdrop-blur-xl border-border/60">
                <SelectItem value="all_delivery" className="text-xs cursor-pointer">
                  Toutes
                </SelectItem>
                <SelectItem value="delivery" className="text-xs cursor-pointer">
                  Livraison
                </SelectItem>
                <SelectItem value="pickup" className="text-xs cursor-pointer">
                  Retrait
                </SelectItem>
              </SelectContent>
            </Select>

            {/* Custom Date Range Picker - Only show when custom period selected */}
            {period === 'custom' && (
              <>
                <div className="hidden sm:block h-6 w-px bg-border/60" />

                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-60 justify-start text-left font-normal h-9 bg-background/95 backdrop-blur-sm border-border/60 hover:bg-muted/50 transition-colors cursor-pointer",
                        !dateRange?.from && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-3.5 w-3.5" />
                      <span className="text-xs">
                        {dateRange?.from ? (
                          dateRange.to ? (
                            <>
                              {format(dateRange.from, "d MMM yyyy", { locale: fr })} - {format(dateRange.to, "d MMM yyyy", { locale: fr })}
                            </>
                          ) : (
                            format(dateRange.from, "d MMM yyyy", { locale: fr })
                          )
                        ) : (
                          "Sélectionner une période"
                        )}
                      </span>
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0 bg-background/98 backdrop-blur-xl border-border/60" align="start">
                    <Calendar
                      mode="range"
                      defaultMonth={dateRange?.from}
                      selected={dateRange}
                      onSelect={(range) => {
                        setDateRange(range)
                        if (range?.from || range?.to) {
                          setPage(1)
                        }
                      }}
                      numberOfMonths={2}
                      locale={fr}
                    />
                  </PopoverContent>
                </Popover>
              </>
            )}

            {/* Clear Filters Button */}
            {hasActiveFilters && (
              <>
                <div className="hidden sm:block h-6 w-px bg-border/60" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearFilters}
                  className="h-9 px-3 text-xs text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors cursor-pointer"
                >
                  <X className="w-3.5 h-3.5 mr-1.5" />
                  Réinitialiser
                </Button>
              </>
            )}
          </div>
          )}
          {isLoading && (
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
          )}

        {/* Empty State */}
          {isEmpty && !isLoading && (
            <div className="text-center py-14">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                <Package className="w-7 h-7 text-muted-foreground" />
              </div>
              {isFilteredEmpty ? (
                <>
                  <h3 className="text-base font-semibold text-foreground mb-2">Aucun résultat</h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                    Aucune commande ne correspond à ces filtres. Modifiez la période ou réinitialisez les filtres.
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <Button variant="outline" onClick={clearFilters} className="h-9 px-3 text-xs cursor-pointer">
                      Réinitialiser les filtres
                    </Button>
                    <Button onClick={() => window.location.href = `/${locale}/shop`} className="h-9 px-3 text-xs cursor-pointer">
                      Découvrir les produits
                    </Button>
                  </div>
                </>
              ) : (
                <>
                  <h3 className="text-base font-semibold text-foreground mb-2">Aucune commande</h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                    Vous n'avez pas encore passé de commande. Découvrez nos produits et passez votre première commande.
                  </p>
                  <Button onClick={() => window.location.href = `/${locale}/shop`} className="h-9 px-3 text-xs cursor-pointer">
                    Découvrir les produits
                  </Button>
                </>
              )}
            </div>
          )}

        {/* Orders List */}
          {!isEmpty && !isLoading && (
            <>
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

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="h-9 w-9 p-0"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </Button>

                  <div className="flex items-center gap-1">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                      let pageNumber: number

                      if (totalPages <= 5) {
                        pageNumber = i + 1
                      } else if (page <= 3) {
                        pageNumber = i + 1
                      } else if (page >= totalPages - 2) {
                        pageNumber = totalPages - 4 + i
                      } else {
                        pageNumber = page - 2 + i
                      }

                      return (
                        <Button
                          key={pageNumber}
                          variant={page === pageNumber ? "default" : "outline"}
                          size="sm"
                          onClick={() => setPage(pageNumber)}
                          className="h-9 w-9 p-0"
                        >
                          {pageNumber}
                        </Button>
                      )
                    })}
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="h-9 w-9 p-0"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </>
          )}
        </section>
      </div>
    </ShopPageLayout>
  )
}