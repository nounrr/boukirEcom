"use client"

import { useState, memo, useEffect } from "react"
import { useTranslations } from "next-intl"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Tag, Check, AlertCircle } from "lucide-react"
import { useValidatePromoMutation } from "@/state/api/promo-api-slice"

interface PromoCodeInputProps {
  subtotal: number
  onPromoApplied?: (discount: number, code: string) => void
  onPromoRemoved?: () => void
}

export function PromoCodeInput({ subtotal, onPromoApplied, onPromoRemoved }: PromoCodeInputProps) {
  const t = useTranslations("checkout")
  const tCommon = useTranslations("common")
  const currency = tCommon("currency")

  const [promoCode, setPromoCode] = useState("")
  const [appliedCode, setAppliedCode] = useState("")
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle")
  const [message, setMessage] = useState("")
  const [discountAmount, setDiscountAmount] = useState(0)

  const [validatePromo, { isLoading }] = useValidatePromoMutation()

  // Reset when subtotal changes (cart updated)
  useEffect(() => {
    if (appliedCode && subtotal > 0) {
      // Revalidate the applied code with new subtotal
      handleRevalidate()
    }
  }, [subtotal])

  const handleRevalidate = async () => {
    if (!appliedCode) return

    try {
      const result = await validatePromo({
        code: appliedCode,
        subtotal,
      }).unwrap()

      if (result.valid && result.discount_amount) {
        setDiscountAmount(result.discount_amount)
        if (onPromoApplied) {
          onPromoApplied(result.discount_amount, appliedCode)
        }
      }
    } catch (error: any) {
      // Silently revalidate, don't show error unless user tries to apply again
    }
  }

  const handleApply = async () => {
    if (!promoCode.trim()) {
      setStatus("error")
      setMessage(t("promo.invalid"))
      return
    }

    setStatus("idle")
    setMessage("")

    try {
      const result = await validatePromo({
        code: promoCode.trim(),
        subtotal,
      }).unwrap()

      if (result.valid) {
        setStatus("success")
        setMessage(t("promo.appliedSuccess"))
        setAppliedCode(promoCode.trim())
        setDiscountAmount(result.discount_amount || 0)
        
        if (onPromoApplied && result.discount_amount) {
          onPromoApplied(result.discount_amount, promoCode.trim())
        }
      } else {
        setStatus("error")
        setMessage(t("promo.invalid"))
        setAppliedCode("")
        setDiscountAmount(0)
      }
    } catch (error: any) {
      setStatus("error")
      setMessage(t("promo.invalid"))
      setAppliedCode("")
      setDiscountAmount(0)
    }
  }

  const handleRemove = () => {
    setPromoCode("")
    setAppliedCode("")
    setStatus("idle")
    setMessage("")
    setDiscountAmount(0)
    if (onPromoRemoved) {
      onPromoRemoved()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleApply()
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Input
            type="text"
            placeholder={t("promo.placeholder")}
            value={promoCode}
            onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
            onKeyPress={handleKeyPress}
            disabled={isLoading || status === "success"}
            className={`flex-1 h-10 pr-8 ${
              status === "success" ? "border-emerald-500 bg-emerald-50 dark:bg-emerald-950/20" : ""
            } ${status === "error" ? "border-destructive" : ""}`}
          />
          {status === "success" && (
            <Check className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-600" />
          )}
        </div>
        {status === "success" ? (
          <Button
            type="button"
            onClick={handleRemove}
            variant="outline"
            className="px-6 h-10"
          >
            {t("promo.remove")}
          </Button>
        ) : (
          <Button
            type="button"
            onClick={handleApply}
            disabled={isLoading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white px-6 h-10"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
                  t("promo.apply")
            )}
          </Button>
        )}
      </div>

      {/* Status Message */}
      {message && (
        <div
          className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${
            status === "success"
              ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800"
              : "bg-destructive/10 text-destructive border border-destructive/20"
          }`}
        >
          {status === "success" ? (
            <Tag className="w-3.5 h-3.5 shrink-0" />
          ) : (
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
          )}
          <span className="font-medium">{message}</span>
          {status === "success" && discountAmount > 0 && (
            <span className="ml-auto font-bold text-emerald-700 dark:text-emerald-400">
              -{discountAmount.toFixed(2)} {currency}
            </span>
          )}
        </div>
      )}
    </div>
  )
}

export default memo(PromoCodeInput)
