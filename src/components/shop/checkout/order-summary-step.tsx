"use client"

import { memo } from "react"
import { useTranslations } from "next-intl"
import { MapPin, Mail, CreditCard, FileText, ShieldCheck, RefreshCw, MessageCircle, Truck, Banknote, Clock, Building2, Smartphone, Store } from "lucide-react"
import Image from "next/image"
import { cn } from "@/lib/utils"
import { useGetPickupLocationsQuery } from "@/state/api/ecommerce-public-api-slice"

interface OrderSummaryStepProps {
  formValues: {
    deliveryMethod?: string
    pickupLocationId?: number
    shippingAddress: {
      firstName: string
      lastName: string
      phone: string
      address?: string
      city?: string
      postalCode?: string
    }
    email: string
    paymentMethod: string
    notes: string
    cardholderName?: string
    cardNumber?: string
  }
}

const PAYMENT_METHODS_CONFIG: Record<
  string,
  {
    labelKey: string
  icon: any
  iconBg: string
  iconColor: string
  cardBg: string
  borderColor: string
    descriptionKey: string
}> = {
  cash_on_delivery: {
    labelKey: "payment.methods.cash_on_delivery.label",
    icon: Banknote,
    iconBg: "bg-amber-100 dark:bg-amber-900/40",
    iconColor: "text-amber-600 dark:text-amber-400",
    cardBg: "bg-linear-to-br from-amber-50 to-orange-50/50 dark:from-amber-950/30 dark:to-orange-950/20",
    borderColor: "border-amber-200/60 dark:border-amber-800/40",
    descriptionKey: "payment.methods.cash_on_delivery.description",
  },
  pay_in_store: {
    labelKey: "payment.methods.pay_in_store.label",
    icon: Store,
    iconBg: "bg-violet-100 dark:bg-violet-900/40",
    iconColor: "text-violet-600 dark:text-violet-400",
    cardBg: "bg-linear-to-br from-violet-50 to-purple-50/50 dark:from-violet-950/30 dark:to-purple-950/20",
    borderColor: "border-violet-200/60 dark:border-violet-800/40",
    descriptionKey: "payment.methods.pay_in_store.description",
  },
  card: {
    labelKey: "payment.methods.card.label",
    icon: CreditCard,
    iconBg: "bg-blue-100 dark:bg-blue-900/40",
    iconColor: "text-blue-600 dark:text-blue-400",
    cardBg: "bg-linear-to-br from-blue-50 to-indigo-50/50 dark:from-blue-950/30 dark:to-indigo-950/20",
    borderColor: "border-blue-200/60 dark:border-blue-800/40",
    descriptionKey: "payment.methods.card.description",
  },
  solde: {
    labelKey: "payment.methods.solde.label",
    icon: Clock,
    iconBg: "bg-violet-100 dark:bg-violet-900/40",
    iconColor: "text-violet-600 dark:text-violet-400",
    cardBg: "bg-linear-to-br from-violet-50 to-purple-50/50 dark:from-violet-950/30 dark:to-purple-950/20",
    borderColor: "border-violet-200/60 dark:border-violet-800/40",
    descriptionKey: "payment.methods.solde.description",
  },
  bank_transfer: {
    labelKey: "payment.methods.bank_transfer.label",
    icon: Building2,
    iconBg: "bg-emerald-100 dark:bg-emerald-900/40",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    cardBg: "bg-linear-to-br from-emerald-50 to-teal-50/50 dark:from-emerald-950/30 dark:to-teal-950/20",
    borderColor: "border-emerald-200/60 dark:border-emerald-800/40",
    descriptionKey: "payment.methods.bank_transfer.description",
  },
  mobile_payment: {
    labelKey: "payment.methods.mobile_payment.label",
    icon: Smartphone,
    iconBg: "bg-pink-100 dark:bg-pink-900/40",
    iconColor: "text-pink-600 dark:text-pink-400",
    cardBg: "bg-linear-to-br from-pink-50 to-rose-50/50 dark:from-pink-950/30 dark:to-rose-950/20",
    borderColor: "border-pink-200/60 dark:border-pink-800/40",
    descriptionKey: "payment.methods.mobile_payment.description",
  },
}

const maskCardNumber = (cardNumber: string): string => {
  const cleaned = cardNumber.replace(/\s/g, "")
  if (cleaned.length < 4) return "•••• " + cleaned
  return "•••• •••• •••• " + cleaned.slice(-4)
}

export function OrderSummaryStep({ formValues }: OrderSummaryStepProps) {
  const t = useTranslations("checkout")

  const { deliveryMethod, pickupLocationId, shippingAddress, email, paymentMethod, notes, cardholderName, cardNumber } = formValues
  const isPickup = deliveryMethod === "pickup"

  // Fetch pickup locations to get the selected one
  const { data: pickupLocations = [] } = useGetPickupLocationsQuery(undefined, {
    skip: !isPickup,
  })

  const selectedPickupLocation = pickupLocations.find((loc) => loc.id === pickupLocationId)

  return (
    <div className="flex flex-col gap-4 max-w-3xl">
      {/* Delivery Method & Info */}
      <div className="bg-background border border-border/50 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2.5 pb-3 mb-3 border-b border-border/50">
          <div className={cn(
            "w-8 h-8 rounded-lg flex items-center justify-center",
            isPickup ? "bg-violet-500/10" : "bg-emerald-500/10"
          )}>
            {isPickup ? (
              <Store className="w-4 h-4 text-violet-600" />
            ) : (
              <Truck className="w-4 h-4 text-emerald-600" />
            )}
          </div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-foreground">
              {isPickup ? t("storePickup") : t("homeDelivery")}
            </h3>
            <span className={cn(
              "px-2 py-0.5 rounded-full text-[10px] font-medium",
              isPickup
                ? "bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400"
                : "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400"
            )}>
              {isPickup ? t("orderSummary.badge.pickup") : t("orderSummary.badge.delivery")}
            </span>
          </div>
        </div>

        {isPickup ? (
          // Pickup Location Info
          <div className="flex flex-col gap-3">
            {selectedPickupLocation ? (
              <div className={cn(
                "flex items-start gap-3 p-3 rounded-xl border",
                "bg-violet-50/50 dark:bg-violet-950/20 border-violet-200/60 dark:border-violet-800/40"
              )}>
                <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center shrink-0">
                  <Store className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{selectedPickupLocation.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {selectedPickupLocation.address}, {selectedPickupLocation.city}
                    {selectedPickupLocation.postalCode && `, ${selectedPickupLocation.postalCode}`}
                  </p>
                  {selectedPickupLocation.phone && (
                    <p className="text-xs text-muted-foreground mt-1">{selectedPickupLocation.phone}</p>
                  )}
                  {selectedPickupLocation.openingHours && (
                    <p className="text-xs text-muted-foreground mt-1">
                      <Clock className="w-3 h-3 inline mr-1" />
                      {selectedPickupLocation.openingHours}
                    </p>
                  )}
                </div>
              </div>
            ) : (
                <p className="text-sm text-muted-foreground">{t("orderSummary.pickupSelected")}</p>
            )}

            {/* Customer Contact for Pickup */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-border/40">
              <div className="flex flex-col gap-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("orderSummary.pickedUpBy")}</p>
                <p className="text-sm font-semibold text-foreground">
                  {shippingAddress.firstName} {shippingAddress.lastName}
                </p>
                <p className="text-xs text-muted-foreground">{shippingAddress.phone}</p>
              </div>
              <div className="flex flex-col gap-1">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("orderSummary.contact")}</p>
                <p className="text-sm text-foreground break-all">{email}</p>
              </div>
            </div>
          </div>
        ) : (
        // Delivery Address Info
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {/* Shipping Address */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 mb-1">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("orderSummary.address")}</p>
                </div>
                <p className="text-sm font-semibold text-foreground">
                  {shippingAddress.firstName} {shippingAddress.lastName}
                </p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {shippingAddress.address}
                  <br />
                  {shippingAddress.city}
                  {shippingAddress.postalCode && `, ${shippingAddress.postalCode}`}
                </p>
                <p className="text-sm text-muted-foreground mt-1">{shippingAddress.phone}</p>
              </div>

              {/* Contact */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2 mb-1">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{t("orderSummary.contact")}</p>
                </div>
                <p className="text-sm text-foreground break-all">{email}</p>
              </div>
            </div>
        )}
      </div>

      {/* Payment Method */}
      <div className="bg-background border border-border/50 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2.5 pb-3 mb-3 border-b border-border/50">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <CreditCard className="w-4 h-4 text-blue-600" />
          </div>
          <h3 className="text-base font-semibold text-foreground">{t("orderSummary.paymentMethod")}</h3>
        </div>

        {(() => {
          const config = PAYMENT_METHODS_CONFIG[paymentMethod]
          if (!config) {
            return (
              <p className="text-sm text-muted-foreground">{paymentMethod}</p>
            )
          }
          const Icon = config.icon
          return (
            <div className="flex flex-col gap-3">
              {/* Payment Method Card */}
              <div className={cn(
                "flex items-center gap-3 p-3 rounded-xl border transition-all",
                config.cardBg,
                config.borderColor
              )}>
                <div className={cn(
                  "w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm",
                  config.iconBg
                )}>
                  <Icon className={cn("w-6 h-6", config.iconColor)} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground">{t(config.labelKey)}</p>
                  <p className="text-xs text-muted-foreground">{t(config.descriptionKey)}</p>
                </div>
                {/* Show card brand icons for card payment */}
                {paymentMethod === "card" && (
                  <div className="flex items-center gap-1.5">
                    <Image src="/payments/visa.svg" alt="Visa" width={36} height={24} sizes="36px" className="h-5 w-auto opacity-80" />
                    <Image src="/payments/master-card.svg" alt="Mastercard" width={36} height={24} sizes="36px" className="h-5 w-auto opacity-80" />
                  </div>
                )}
                {/* Show solde badge */}
                {paymentMethod === "solde" && (
                  <span className="px-2 py-1 rounded-full text-[10px] font-semibold bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-700">
                    {t("payment.solde.badgeExclusive")}
                  </span>
                )}
              </div>

              {/* Card Details - Discreet Mode */}
              {paymentMethod === "card" && cardNumber && (
                <div className="bg-linear-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-lg p-4 border border-border/50">
                  <div className="flex items-center justify-between">
                    <div className="flex flex-col gap-1">
                      {cardholderName && (
                        <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">{cardholderName}</p>
                      )}
                      <p className="text-sm font-mono font-bold text-foreground tracking-wider">{maskCardNumber(cardNumber)}</p>
                    </div>
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <CreditCard className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                </div>
              )}

              {/* Solde info */}
              {paymentMethod === "solde" && (
                <div className="flex items-center gap-2 p-2.5 rounded-lg bg-violet-50/50 dark:bg-violet-950/20 border border-violet-100 dark:border-violet-900/40">
                  <ShieldCheck className="w-4 h-4 text-violet-600 dark:text-violet-400 shrink-0" />
                  <p className="text-xs text-violet-700 dark:text-violet-300">
                    {t("payment.solde.amountDueLaterDesc")}
                  </p>
                </div>
              )}
            </div>
          )
        })()}
      </div>

      {/* Special Instructions */}
      {notes && (
        <div className="bg-background border border-border/50 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2.5 pb-3 mb-3 border-b border-border/50">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">{t("orderSummary.specialInstructions")}</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{notes}</p>
        </div>
      )}

      {/* Trust Badges */}
      <div className="bg-linear-to-br from-primary/5 via-primary/3 to-transparent border border-primary/10 rounded-2xl p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <ShieldCheck className="w-4 h-4 text-primary" />
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-semibold text-foreground">{t("orderSummary.trust.securePaymentTitle")}</p>
              <p className="text-xs text-muted-foreground">{t("orderSummary.trust.securePaymentDesc")}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <RefreshCw className="w-4 h-4 text-primary" />
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-semibold text-foreground">{t("orderSummary.trust.returnsTitle")}</p>
              <p className="text-xs text-muted-foreground">{t("orderSummary.trust.returnsDesc")}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <MessageCircle className="w-4 h-4 text-primary" />
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-semibold text-foreground">{t("orderSummary.trust.supportTitle")}</p>
              <p className="text-xs text-muted-foreground">{t("orderSummary.trust.supportDesc")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default memo(OrderSummaryStep)
