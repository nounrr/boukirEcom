"use client"

import { memo } from "react"
import Image from "next/image"
import { useLocale, useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Package, Lock, ShieldCheck } from "lucide-react"
import { PromoCodeInput } from "./promo-code-input"
import type { CartItem } from "@/state/api/cart-api-slice"
import { getLocalizedCartItemBaseName, getLocalizedCartItemCategory } from "@/lib/localized-fields"

interface OrderCartSummaryProps {
  items: CartItem[]
  subtotal: number
  shippingCost: number
  showShippingDetails?: boolean
  discount?: number
  total: number
  showConfirmButton?: boolean 
  onConfirmOrder?: () => void
  isPending?: boolean
  onPromoApplied?: (discount: number, code: string) => void
  onPromoRemoved?: () => void
}

export function OrderCartSummary({
  items,
  subtotal,
  shippingCost,
  showShippingDetails = true,
  discount = 0,
  total,
  showConfirmButton = false,
  onConfirmOrder,
  isPending = false,
  onPromoApplied,
  onPromoRemoved,
}: OrderCartSummaryProps) {
  const t = useTranslations("checkout")
  const tCommon = useTranslations("common")
  const locale = useLocale()
  const currency = tCommon("currency")

  return (
    <div className="bg-card border border-border/50 rounded-2xl p-6 shadow-sm lg:sticky lg:top-24">
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/50">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
          <Package className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-base font-semibold text-foreground">
            {showConfirmButton ? t("cartSummary.heading.confirm") : t("cartSummary.heading.details")}
          </h3>
          <p className="text-xs text-muted-foreground mt-0.5">
            {t("cartSummary.itemsCount", { count: items.length })}
          </p>
        </div>
      </div>

      {/* Cart Items */}
      <div className="flex flex-col gap-4 max-h-[400px] overflow-y-auto pr-2">
        {items.map((item) => (
          <div key={`${item.productId}-${item.variantId || ""}`} className="flex gap-3">
            <div className="relative w-16 h-16 rounded-lg overflow-hidden bg-muted shrink-0 border border-border/30">
              {item.image ? (
                <Image src={item.image || "/placeholder.svg"} alt={item.name} fill className="object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Package className="w-6 h-6 text-muted-foreground/30" />
                </div>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-1">
                <h4 className="font-medium text-sm text-foreground line-clamp-2 flex-1">{getLocalizedCartItemBaseName(item as any, locale)}</h4>
                {showConfirmButton && (
                  <span className="px-2 py-0.5 rounded-full bg-amber-500 text-white text-xs font-bold shrink-0">
                    x{item.quantity}
                  </span>
                )}
              </div>
              {!showConfirmButton && (
                <p className="text-xs text-muted-foreground mb-2">{getLocalizedCartItemCategory(item as any, locale) || t("cartSummary.categoryFallback")}</p>
              )}
              <div className="flex items-center justify-between">
                {!showConfirmButton && <span className="text-xs font-medium text-muted-foreground">x{item.quantity}</span>}
                <p className="text-sm font-semibold text-primary">
                  {(item.price * item.quantity).toFixed(2)} {currency}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Promo Code */}
      <div className="mt-6 pt-4 border-t border-border/50">
        <PromoCodeInput 
          subtotal={subtotal}
          onPromoApplied={onPromoApplied}
          onPromoRemoved={onPromoRemoved}
        />
      </div>

      {/* Totals */}
      <div className="mt-6 pt-4 border-t border-border/50 flex flex-col gap-3">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">
            {t("cartSummary.subtotalWithCount", { count: items.length })}
          </span>
          <span className="font-medium">{subtotal.toFixed(2)} {currency}</span>
        </div>
        {discount > 0 && (
          <div className="flex justify-between text-sm">
            <span className="text-emerald-600 dark:text-emerald-400 font-medium">{t("cartSummary.discount")}</span>
            <span className="font-semibold text-emerald-600 dark:text-emerald-400">
              -{discount.toFixed(2)} {currency}
            </span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">{t("cartSummary.shipping")}</span>
          <span className={showShippingDetails ? "font-medium text-emerald-600" : "font-medium text-muted-foreground"}>
            {!showShippingDetails ? "—" : shippingCost === 0 ? t("cartSummary.free") : `${shippingCost.toFixed(2)} ${currency}`}
          </span>
        </div>
        <div className="flex justify-between items-center pt-3 border-t border-border/50">
          <div className="flex flex-col">
            <span className="text-base font-semibold text-foreground">{t("cartSummary.total")}</span>
            <span className="text-[11px] text-muted-foreground">{t("cartSummary.taxIncluded")}</span>
          </div>
          <span className="text-2xl font-bold text-primary">{total.toFixed(2)} {currency}</span>
        </div>
      </div>

      {/* Confirmation Button */}
      {showConfirmButton && onConfirmOrder && (
        <div className="mt-6 pt-4 border-t border-border/50">
          <Button
            type="button"
            onClick={onConfirmOrder}
            disabled={isPending}
            className="w-full h-11 bg-linear-to-r from-primary via-primary to-primary/90 hover:from-primary/90 hover:via-primary hover:to-primary text-white shadow-lg shadow-primary/25 font-semibold"
          >
            {isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                {t("cartSummary.confirmProcessing")}
              </>
            ) : (
              <>
                <Lock className="w-4 h-4 mr-2" />
                  {t("cartSummary.confirmCta", { total: total.toFixed(2), currency })}
              </>
            )}
          </Button>

          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground mt-3">
            <ShieldCheck className="w-4 h-4" />
            <span>{t("cartSummary.secureTransaction")}</span>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-3">
            <Image
              src="/payments/visa.svg"
              alt="Visa"
              width={52}
              height={32}
              sizes="52px"
              className="h-7 w-auto opacity-95"
            />
            <Image
              src="/payments/master-card.svg"
              alt="Mastercard"
              width={52}
              height={32}
              sizes="52px"
              className="h-7 w-auto opacity-95"
            />
            <Image
              src="/payments/naps.png"
              alt="NAPS"
              width={52}
              height={32}
              sizes="52px"
              className="h-7 w-auto opacity-95"
            />
          </div>

          <div className="bg-muted/30 border border-border/30 rounded-lg p-3 mt-3">
            <p className="text-xs text-muted-foreground leading-relaxed text-center">
              {t("cartSummary.termsPrefix")}{" "}
              <a href="#" className="text-primary hover:underline font-medium">
                {t("cartSummary.termsLink")}
              </a>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}

export default memo(OrderCartSummary)
