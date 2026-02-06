"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import { useTranslations } from "next-intl"
import type { UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { CreditCard, Check, AlertCircle, Eye, EyeOff, Calendar, User, Shield, Lock } from "lucide-react"
import { cn } from "@/lib/utils"

interface CardPaymentFormProps {
  register: UseFormRegister<any>
  errors: FieldErrors<any>
  watch: UseFormWatch<any>
  setValue?: UseFormSetValue<any>
  onSubmit?: () => void
  isPending?: boolean
}

// Card type detection based on card number
const detectCardType = (number: string): string => {
  const cleaned = number.replace(/\s/g, "")
  const patterns: { [key: string]: RegExp } = {
    visa: /^4/,
    mastercard: /^5[1-5]/,
    amex: /^3[47]/,
  }

  for (const [type, pattern] of Object.entries(patterns)) {
    if (pattern.test(cleaned)) {
      return type
    }
  }
  return ""
}

// Validate full card number
const isValidCardNumber = (number: string): boolean => {
  const cleaned = number.replace(/\s/g, "")
  const patterns: { [key: string]: RegExp } = {
    visa: /^4[0-9]{12}(?:[0-9]{3})?$/,
    mastercard: /^5[1-5][0-9]{14}$/,
    amex: /^3[47][0-9]{13}$/,
  }

  for (const pattern of Object.values(patterns)) {
    if (pattern.test(cleaned)) {
      return true
    }
  }
  return false
}

// Generate months and years for expiry
const MONTHS = [
  { value: "01", label: "01" },
  { value: "02", label: "02" },
  { value: "03", label: "03" },
  { value: "04", label: "04" },
  { value: "05", label: "05" },
  { value: "06", label: "06" },
  { value: "07", label: "07" },
  { value: "08", label: "08" },
  { value: "09", label: "09" },
  { value: "10", label: "10" },
  { value: "11", label: "11" },
  { value: "12", label: "12" },
]

const generateYears = () => {
  const currentYear = new Date().getFullYear()
  const years = []
  for (let i = 0; i < 15; i++) {
    const year = currentYear + i
    years.push({ value: year.toString().slice(-2), label: year.toString() })
  }
  return years
}

export function CardPaymentForm({ 
  register, 
  errors, 
  watch, 
  setValue, 
  onSubmit,
  isPending = false 
}: CardPaymentFormProps) {
  const t = useTranslations("checkout")

  const cardNumber = watch("cardNumber") || ""
  const [showCVV, setShowCVV] = useState(false)
  const [expiryMonth, setExpiryMonth] = useState("")
  const [expiryYear, setExpiryYear] = useState("")

  const cardType = detectCardType(cardNumber)
  const isCardValid = isValidCardNumber(cardNumber)
  const YEARS = generateYears()

  // Update the cardExpiry field when month or year changes
  useEffect(() => {
    if (expiryMonth && expiryYear && setValue) {
      setValue("cardExpiry", `${expiryMonth}/${expiryYear}`)
    }
  }, [expiryMonth, expiryYear, setValue])

  const formatCardNumber = (value: string) => {
    const cleaned = value.replace(/\s/g, "")
    const formatted = cleaned.replace(/(\d{4})/g, "$1 ").trim()
    return formatted
  }

  return (
    <div
      className={cn(
        "flex flex-col gap-4 bg-background border border-border/50 rounded-2xl p-5 shadow-sm",
        "animate-in fade-in slide-in-from-top-4 duration-300",
      )}
    >
      {/* Header */}
      <div className="flex items-center gap-2.5 pb-4 border-b border-border/50">
        <div className="w-10 h-10 rounded-xl bg-blue-600/10 flex items-center justify-center">
          <CreditCard className="w-5 h-5 text-blue-600" />
        </div>
        <div className="flex flex-col gap-0.5">
          <h3 className="text-base font-semibold text-foreground">{t("card.header.title")}</h3>
          <p className="text-xs text-muted-foreground">{t("card.header.subtitle")}</p>
        </div>
        <div className="ml-auto flex items-center gap-2 opacity-95">
          <Image src="/payments/visa.svg" alt="Visa" width={44} height={28} sizes="44px" className="h-5 w-auto" />
          <Image
            src="/payments/master-card.svg"
            alt="Mastercard"
            width={44}
            height={28}
            sizes="44px"
            className="h-5 w-auto"
          />
          <Image src="/payments/naps.png" alt="NAPS" width={44} height={28} sizes="44px" className="h-5 w-auto" />
        </div>
      </div>

      {/* Card Preview */}
      <div className="bg-linear-to-br from-slate-800 to-slate-900 rounded-xl p-5 text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20" />

            <div className="flex justify-between items-start mb-12 relative z-10">
              <div>
            <p className="text-xs font-semibold text-white/60 mb-1">{t("card.preview.cardNumber")}</p>
                <p className="text-lg font-mono tracking-widest">
                  {cardNumber ? formatCardNumber(cardNumber).padEnd(19, "•") : "•••• •••• •••• ••••"}
                </p>
              </div>
              {cardType && (
                <div className="text-sm font-semibold">
                  {cardType === "visa" && "VISA"}
                  {cardType === "mastercard" && "MASTERCARD"}
                  {cardType === "amex" && "AMEX"}
                </div>
              )}
            </div>

            <div className="flex justify-between items-end relative z-10">
              <div>
            <p className="text-xs font-semibold text-white/60 mb-1">{t("card.preview.cardholder")}</p>
                <p className="text-sm font-mono uppercase tracking-wider">
              {watch("cardholderName")?.toUpperCase() || t("card.preview.cardholderPlaceholder")}
                </p>
              </div>
              <div>
            <p className="text-xs font-semibold text-white/60 mb-1">{t("card.preview.expires")}</p>
            <p className="text-sm font-mono">{watch("cardExpiry") || t("card.preview.expiresPlaceholder")}</p>
              </div>
            </div>
          </div>

          {/* Card Input Fields */}
          <div className="flex flex-col gap-4">
            {/* Cardholder Name */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="cardholderName" className="text-sm font-medium text-foreground">
            {t("card.form.cardholderName")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cardholderName"
                type="text"
            placeholder={t("card.form.cardholderPlaceholder")}
                {...register("cardholderName")}
                Icon={User}
                error={errors.cardholderName?.message as string}
                className="h-11 uppercase"
              />
          <p className="text-xs text-muted-foreground">{t("card.form.cardholderHelp")}</p>
            </div>

            {/* Expiry & CVV Row - 3 Column Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Card Number */}
          <div className="flex flex-col gap-2 sm:col-span-2 lg:col-span-2">
                <Label htmlFor="cardNumber" className="text-sm font-medium text-foreground">
              {t("card.form.cardNumber")} <span className="text-destructive">*</span>
                </Label>
                <Input
                  id="cardNumber"
                  type="text"
                  placeholder="1234 5678 9012 3456"
                  maxLength={19}
                  {...register("cardNumber")}
                  Icon={CreditCard}
                  error={errors.cardNumber?.message as string}
                  className="h-11 font-mono tracking-wider"
                />
                {!errors.cardNumber && cardType && (
                  <p className="text-xs text-emerald-600 font-medium flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5" />
                {cardType === "visa" && t("card.form.detectedVisa")}
                {cardType === "mastercard" && t("card.form.detectedMastercard")}
                {cardType === "amex" && t("card.form.detectedAmex")}
                  </p>
                )}
                {!errors.cardNumber && !cardType && (
              <p className="text-xs text-muted-foreground">{t("card.form.cardNumberHelp")}</p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
              {t("card.form.expiryMonth")} <span className="text-destructive">*</span>
                </Label>
                <Select value={expiryMonth} onValueChange={setExpiryMonth}>
                  <SelectTrigger className={cn(
                    "h-[43px]! w-full bg-background border-input",
                    errors.cardExpiry && "border-destructive"
                  )}>
                <SelectValue placeholder={t("card.form.monthPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent className="bg-background max-h-[300px]">
                    {MONTHS.map((month) => (
                      <SelectItem key={month.value} value={month.value}>
                        {month.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.cardExpiry && (
                  <div className="flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0" />
                    <p className="text-xs text-destructive">{errors.cardExpiry.message as string}</p>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-sm font-medium text-foreground">
              {t("card.form.expiryYear")} <span className="text-destructive">*</span>
                </Label>
                <Select value={expiryYear} onValueChange={setExpiryYear}>
                  <SelectTrigger className={cn(
                    "h-[43px]! w-full bg-background border-input",
                    errors.cardExpiry && "border-destructive"
                  )}>
                <SelectValue placeholder={t("card.form.yearPlaceholder")} />
                  </SelectTrigger>
                  <SelectContent className="bg-background max-h-[300px]">
                    {YEARS.map((year) => (
                      <SelectItem key={year.value} value={year.value}>
                        {year.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="cardCVV" className="text-sm font-medium text-foreground">
              {t("card.form.cvv")} <span className="text-destructive">*</span>
                </Label>
                <div className="relative">
                  <Input
                    id="cardCVV"
                    type={showCVV ? "text" : "password"}
                    placeholder="123"
                    maxLength={4}
                    {...register("cardCVV")}
                    Icon={Shield}
                    error={errors.cardCVV?.message as string}
                    className="h-11 font-mono tracking-wider pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowCVV(!showCVV)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors z-10"
                aria-label={showCVV ? t("card.form.hideCvv") : t("card.form.showCvv")}
                  >
                    {showCVV ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {!errors.cardCVV && (
              <p className="text-xs text-muted-foreground">{t("card.form.cvvHelp")}</p>
                )}
              </div>

              {/* Hidden input to store the formatted value for form submission */}
              <input type="hidden" {...register("cardExpiry")} />
            </div>
          </div>

      {/* Security Notice */}
      <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 flex items-start gap-2">
        <div className="w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center shrink-0 mt-0.5">
          <Lock className="w-3 h-3 text-white" />
        </div>
        <p className="text-xs text-emerald-700 dark:text-emerald-300">
          {t("card.form.securityNotice")}
        </p>
      </div>

      {/* Confirm Payment Button */}
      {onSubmit && (
        <Button
          type="button"
          onClick={onSubmit}
          disabled={isPending}
          className="w-full h-12 bg-linear-to-r from-blue-600 via-blue-600 to-blue-700 hover:from-blue-700 hover:via-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-600/25 font-semibold"
        >
          {isPending ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              {t("card.form.processing")}
            </>
          ) : (
            <>
              <Lock className="w-4 h-4 mr-2" />
                {t("card.form.confirmPayment")}
            </>
          )}
        </Button>
      )}
    </div>
  )
}

export default CardPaymentForm
