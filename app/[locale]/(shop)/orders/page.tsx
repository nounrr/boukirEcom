"use client"

import { ShopPageLayout } from "@/components/layout/shop-page-layout"
import { AccountSidebar } from "@/components/account/account-sidebar"
import { useGetOrdersQuery, useGetSoldeOrdersHistoryQuery } from "@/state/api/orders-api-slice"
import { useAppSelector } from "@/state/hooks"
import { Package, Clock, CheckCircle, XCircle, Truck, CalendarIcon, ChevronLeft, ChevronRight, Filter, X, CreditCard } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import type { OrderStatus, PaymentStatus } from "@/types/order"
import { useCart } from "@/components/layout/cart-context-provider"
import { useToast } from "@/hooks/use-toast"
import { OrderCard } from "@/components/shop/order-card"
import { SoldeHistoryTable } from "@/components/shop/solde-history-table"
import { useMemo, useState } from "react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { isOutOfStockLike } from "@/lib/stock"
import { endOfDay, format, startOfDay, startOfMonth, startOfWeek } from "date-fns"
import { arSA, enUS, fr, zhCN } from "date-fns/locale"
import { type DateRange } from "react-day-picker"

export default function OrdersPage() {
  const locale = useLocale()
  const t = useTranslations("ordersPage")
  const tCommon = useTranslations("common")
  const tProductCard = useTranslations("productCard")
  const { isAuthenticated, user } = useAppSelector((state) => state.user)
  const { cartRef } = useCart()
  const toast = useToast()

  const dateFnsLocale = useMemo(() => {
    switch (locale) {
      case "fr":
        return fr
      case "ar":
        return arSA
      case "zh":
        return zhCN
      case "en":
      default:
        return enUS
    }
  }, [locale])

  const formatCalendarDate = (date: Date) => {
    return new Intl.DateTimeFormat(locale, {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(date)
  }

  const canUseSolde = user?.is_solde === 1 || user?.is_solde === true

  const [view, setView] = useState<"orders" | "solde">("orders")
  const isSoldeView = view === "solde"

  // Pagination and filter state
  const [page, setPage] = useState(1)
  const [limit] = useState(10)
  const [period, setPeriod] = useState<'this_week' | 'this_month' | 'custom' | ''>('')
  const [dateRange, setDateRange] = useState<DateRange | undefined>()
  const [status, setStatus] = useState<OrderStatus | ''>('')
  const [paymentStatus, setPaymentStatus] = useState<PaymentStatus | ''>('')
  const [paymentMethod, setPaymentMethod] = useState<string>('')
  const [deliveryMethod, setDeliveryMethod] = useState<'delivery' | 'pickup' | ''>('')

  const { data: ordersData, isLoading: isOrdersLoading } = useGetOrdersQuery(
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
      skip: !isAuthenticated || isSoldeView,
    }
  )

  const { fromIso, toIso } = (() => {
    if (!isSoldeView) return { fromIso: undefined as string | undefined, toIso: undefined as string | undefined }

    const now = new Date()
    if (period === 'this_week') {
      return {
        fromIso: startOfWeek(now, { weekStartsOn: 1 }).toISOString(),
        toIso: endOfDay(now).toISOString(),
      }
    }

    if (period === 'this_month') {
      return {
        fromIso: startOfMonth(now).toISOString(),
        toIso: endOfDay(now).toISOString(),
      }
    }

    if (period === 'custom' && dateRange?.from) {
      const from = startOfDay(dateRange.from)
      const to = endOfDay(dateRange.to ?? dateRange.from)
      return {
        fromIso: from.toISOString(),
        toIso: to.toISOString(),
      }
    }

    return { fromIso: undefined, toIso: undefined }
  })()

  const {
    data: soldeHistory,
    isLoading: isSoldeLoading,
  } = useGetSoldeOrdersHistoryQuery(
    isSoldeView
      ? {
        view: 'statement',
        limit: 500,
        offset: 0,
        from: fromIso,
        to: toIso,
      }
      : undefined,
    {
      skip: !isAuthenticated || !isSoldeView || !canUseSolde,
    }
  )

  const orders = ordersData?.orders || []
  const total = ordersData?.total || 0
  const totalPages = Math.ceil(total / limit)
  const isEmpty = !isOrdersLoading && orders.length === 0

  const soldeStatement = soldeHistory && soldeHistory.view === 'statement' ? soldeHistory : undefined
  const soldeMovementsCount = Math.max(0, (soldeStatement?.timeline?.length ?? 0) - 1)
  const isSoldeEmpty = !isSoldeLoading && isSoldeView && canUseSolde && (soldeStatement?.timeline?.length ?? 0) === 0

  const isLoading = isSoldeView ? isSoldeLoading : isOrdersLoading

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

  const hasActiveFilters = isSoldeView
    ? period !== '' || dateRange?.from || dateRange?.to
    : period !== '' ||
    dateRange?.from ||
    dateRange?.to ||
    status !== '' ||
    paymentStatus !== '' ||
    paymentMethod !== '' ||
    deliveryMethod !== ''
  const isFilteredEmpty = isEmpty && hasActiveFilters
  const isTrulyEmpty = isEmpty && !hasActiveFilters

  const handleBuyAgain = async (item: any) => {
    if (!cartRef?.current) return

    if (isOutOfStockLike(item)) {
      toast.error(tCommon("error"), { description: tProductCard("outOfStock") })
      return
    }

    try {
      await cartRef.current.addItem({
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
      })

      toast.success(t("toast.addedToCartTitle"), { description: item.productName })

      setTimeout(() => {
        cartRef.current?.open()
      }, 300)
    } catch (error) {
      const data = (error as any)?.data
      const code = data?.code || data?.error
      const message = data?.message
      if (code === "out_of_stock" || message === "out_of_stock") {
        toast.error(tCommon("error"), { description: tProductCard("outOfStock") })
      } else {
        toast.error(tCommon("error"), { description: tProductCard("genericErrorDesc") })
      }
    }
  }

  const ORDER_STATUS_CONFIG = useMemo(
    () =>
      ({
        pending: {
          label: t("status.pending"),
          icon: Clock,
          color: "text-amber-600",
          bg: "bg-amber-50 dark:bg-amber-950/30",
          border: "border-amber-500/50",
        },
        confirmed: {
          label: t("status.confirmed"),
          icon: CheckCircle,
          color: "text-blue-600",
          bg: "bg-blue-50 dark:bg-blue-950/30",
          border: "border-blue-500/50",
        },
        shipped: {
          label: t("status.shipped"),
          icon: Truck,
          color: "text-purple-600",
          bg: "bg-purple-50 dark:bg-purple-950/30",
          border: "border-purple-500/50",
        },
        delivered: {
          label: t("status.delivered"),
          icon: CheckCircle,
          color: "text-green-600",
          bg: "bg-green-50 dark:bg-green-950/30",
          border: "border-green-500/50",
        },
        cancelled: {
          label: t("status.cancelled"),
          icon: XCircle,
          color: "text-red-600",
          bg: "bg-red-50 dark:bg-red-950/30",
          border: "border-red-500/50",
        },
      }) as const,
    [t],
  )

  const PAYMENT_STATUS_CONFIG = useMemo(
    () =>
      ({
        pending: { label: t("paymentStatus.pending"), color: "text-amber-600" },
        paid: { label: t("paymentStatus.paid"), color: "text-green-600" },
        failed: { label: t("paymentStatus.failed"), color: "text-red-600" },
        refunded: { label: t("paymentStatus.refunded"), color: "text-gray-600" },
      }) as const,
    [t],
  )

  if (isLoading) {
    return (
      <ShopPageLayout
        title={t("title.orders")}
        subtitle={t("loading")}
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
      title={isSoldeView ? t("title.solde") : t("title.orders")}
      subtitle={
        isSoldeView
          ? soldeMovementsCount > 0
            ? t("subtitle.soldeWithCount", { count: soldeMovementsCount })
            : isFilteredEmpty
              ? t("subtitle.noResultsPeriod")
              : t("subtitle.soldeIntro")
          : total > 0
            ? t("subtitle.ordersWithCount", {
              count: total,
              hasPagination: totalPages > 1 ? "yes" : "no",
              page,
              totalPages,
            })
            : isFilteredEmpty
              ? t("subtitle.noResultsFilters")
              : t("subtitle.ordersIntro")
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
              <h1 className="text-2xl font-bold text-foreground">
                {isSoldeView ? t("title.solde") : t("title.orders")}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isSoldeView ? (
                  soldeMovementsCount > 0 ? (
                    <>
                      {t("soldeMovementsInline", { count: soldeMovementsCount })}
                    </>
                  ) : isFilteredEmpty ? (
                      t("subtitle.noResultsPeriod")
                  ) : (
                        t("soldeStatementHint")
                  )
                ) : total > 0 ? (
                  <>
                      {t("ordersCountInline", {
                        count: total,
                        hasPagination: totalPages > 1 ? "yes" : "no",
                        page,
                        totalPages,
                      })}
                  </>
                ) : isFilteredEmpty ? (
                      t("subtitle.noResultsFilters")
                ) : (
                        t("subtitle.ordersIntro")
                )}
              </p>
            </div>

            <div className="ml-auto">
              <Tabs
                value={view}
                onValueChange={(v) => {
                  setView(v as any)
                  setPage(1)
                }}
              >
                <TabsList className="h-9">
                  <TabsTrigger value="orders" className="text-xs">
                    {t("tabs.orders")}
                  </TabsTrigger>
                  <TabsTrigger value="solde" className="text-xs">
                    {t("tabs.solde")}
                  </TabsTrigger>
                </TabsList>
              </Tabs>
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
                    <span className="truncate text-xs"><SelectValue placeholder={t("filters.period.placeholder")} /></span>
                </div>
              </SelectTrigger>
              <SelectContent className="bg-background/98 backdrop-blur-xl border-border/60">
                <SelectItem value="all" className="text-xs cursor-pointer">
                    {t("filters.period.all")}
                </SelectItem>
                <SelectItem value="this_week" className="text-xs cursor-pointer">
                    {t("filters.period.thisWeek")}
                </SelectItem>
                <SelectItem value="this_month" className="text-xs cursor-pointer">
                    {t("filters.period.thisMonth")}
                </SelectItem>
                <SelectItem value="custom" className="text-xs cursor-pointer">
                  <div className="flex items-center gap-1.5">
                    <CalendarIcon className="w-3 h-3" />
                      {t("filters.period.custom")}
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>

              {!isSoldeView && (
                <>
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
                        <span className="truncate text-xs"><SelectValue placeholder={t("filters.status.placeholder")} /></span>
                      </div>
                    </SelectTrigger>
                    <SelectContent className="bg-background/98 backdrop-blur-xl border-border/60">
                      <SelectItem value="all_status" className="text-xs cursor-pointer">
                        {t("filters.status.all")}
                      </SelectItem>
                      <SelectItem value="pending" className="text-xs cursor-pointer">
                        {t("status.pending")}
                      </SelectItem>
                      <SelectItem value="confirmed" className="text-xs cursor-pointer">
                        {t("status.confirmed")}
                      </SelectItem>
                      <SelectItem value="shipped" className="text-xs cursor-pointer">
                        {t("status.shipped")}
                      </SelectItem>
                      <SelectItem value="delivered" className="text-xs cursor-pointer">
                        {t("status.delivered")}
                      </SelectItem>
                      <SelectItem value="cancelled" className="text-xs cursor-pointer">
                        {t("status.cancelled")}
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
                        <span className="truncate text-xs"><SelectValue placeholder={t("filters.paymentStatus.placeholder")} /></span>
                      </div>
                    </SelectTrigger>
                    <SelectContent className="bg-background/98 backdrop-blur-xl border-border/60">
                      <SelectItem value="all_payment_status" className="text-xs cursor-pointer">
                        {t("filters.paymentStatus.all")}
                      </SelectItem>
                      <SelectItem value="pending" className="text-xs cursor-pointer">
                        {t("paymentStatus.pending")}
                      </SelectItem>
                      <SelectItem value="paid" className="text-xs cursor-pointer">
                        {t("paymentStatus.paid")}
                      </SelectItem>
                      <SelectItem value="failed" className="text-xs cursor-pointer">
                        {t("paymentStatus.failed")}
                      </SelectItem>
                      <SelectItem value="refunded" className="text-xs cursor-pointer">
                        {t("paymentStatus.refunded")}
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
                        <span className="truncate text-xs"><SelectValue placeholder={t("filters.paymentMethod.placeholder")} /></span>
                      </div>
                    </SelectTrigger>
                    <SelectContent className="bg-background/98 backdrop-blur-xl border-border/60">
                      <SelectItem value="all_payment_method" className="text-xs cursor-pointer">
                        {t("filters.paymentMethod.all")}
                      </SelectItem>
                      <SelectItem value="cash_on_delivery" className="text-xs cursor-pointer">
                        {t("filters.paymentMethod.cashOnDelivery")}
                      </SelectItem>
                      <SelectItem value="card" className="text-xs cursor-pointer">
                        {t("filters.paymentMethod.card")}
                      </SelectItem>
                      <SelectItem value="pay_in_store" className="text-xs cursor-pointer">
                        {t("filters.paymentMethod.payInStore")}
                      </SelectItem>
                      <SelectItem value="solde" className="text-xs cursor-pointer">
                        {t("filters.paymentMethod.solde")}
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
                        <span className="truncate text-xs"><SelectValue placeholder={t("filters.deliveryMethod.placeholder")} /></span>
                      </div>
                    </SelectTrigger>
                    <SelectContent className="bg-background/98 backdrop-blur-xl border-border/60">
                      <SelectItem value="all_delivery" className="text-xs cursor-pointer">
                        {t("filters.deliveryMethod.all")}
                      </SelectItem>
                      <SelectItem value="delivery" className="text-xs cursor-pointer">
                        {t("filters.deliveryMethod.delivery")}
                      </SelectItem>
                      <SelectItem value="pickup" className="text-xs cursor-pointer">
                        {t("filters.deliveryMethod.pickup")}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </>
              )}

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
                                {formatCalendarDate(dateRange.from)} - {formatCalendarDate(dateRange.to)}
                            </>
                          ) : (
                                formatCalendarDate(dateRange.from)
                          )
                        ) : (
                              t("filters.dateRange.placeholder")
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
                        locale={dateFnsLocale}
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
                    {t("filters.reset")}
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
                  <h3 className="text-base font-semibold text-foreground mb-2">{t("empty.filtered.title")}</h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                    {isSoldeView
                      ? t("empty.filtered.descSolde")
                      : t("empty.filtered.descOrders")}
                  </p>
                  <div className="flex items-center justify-center gap-2">
                    <Button variant="outline" onClick={clearFilters} className="h-9 px-3 text-xs cursor-pointer">
                      {t("empty.filtered.resetCta")}
                    </Button>
                    <Button onClick={() => window.location.href = `/${locale}/shop`} className="h-9 px-3 text-xs cursor-pointer">
                      {t("empty.filtered.discoverCta")}
                    </Button>
                  </div>
                </>
              ) : (
                <>
                    <h3 className="text-base font-semibold text-foreground mb-2">
                      {isSoldeView ? t("empty.none.soldeTitle") : t("empty.none.ordersTitle")}
                    </h3>
                  <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                      {isSoldeView ? t("empty.none.soldeDesc") : t("empty.none.ordersDesc")}
                  </p>
                  <Button onClick={() => window.location.href = `/${locale}/shop`} className="h-9 px-3 text-xs cursor-pointer">
                      {t("empty.none.discoverCta")}
                  </Button>
                </>
              )}
            </div>
          )}

          {/* Solde statement empty / not eligible */}
          {isSoldeView && isAuthenticated && !canUseSolde && !isLoading && (
            <div className="text-center py-14">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                <Package className="w-7 h-7 text-muted-foreground" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-2">{t("soldeNotAllowed.title")}</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                {t("soldeNotAllowed.desc")}
              </p>
            </div>
          )}

          {isSoldeView && isSoldeEmpty && !isLoading && canUseSolde && (
            <div className="text-center py-14">
              <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
                <Package className="w-7 h-7 text-muted-foreground" />
              </div>
              <h3 className="text-base font-semibold text-foreground mb-2">{t("soldeEmpty.title")}</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                {t("soldeEmpty.desc")}
              </p>
            </div>
          )}

        {/* Orders List */}
          {!isSoldeView && !isEmpty && !isLoading && (
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

          {isSoldeView && !isLoading && canUseSolde && soldeStatement && soldeStatement.timeline.length > 0 && (
            <SoldeHistoryTable statement={soldeStatement} locale={locale} />
          )}
        </section>
      </div>
    </ShopPageLayout>
  )
}