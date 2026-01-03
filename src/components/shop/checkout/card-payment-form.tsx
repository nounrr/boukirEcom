"use client"

import { useState, useEffect } from "react"
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

// Card brand logo components
const VisaLogo = ({ className }: { className?: string }) => (
  <svg 
    className={className}
    xmlns="http://www.w3.org/2000/svg" 
    viewBox="0 0 46.875 29.438" 
    xmlSpace="preserve"
  >
    <title>Visa</title>
    <path 
      fill="#0e4595" 
      d="m17.387 20.889 2.085 -12.235h3.335l-2.087 12.235zm15.382 -11.971c-0.661 -0.248 -1.696 -0.514 -2.989 -0.514 -3.295 0 -5.616 1.659 -5.636 4.038 -0.019 1.758 1.657 2.739 2.922 3.324 1.298 0.6 1.734 0.982 1.728 1.518 -0.008 0.82 -1.037 1.195 -1.995 1.195 -1.335 0 -2.044 -0.185 -3.139 -0.642l-0.43 -0.195 -0.468 2.739c0.779 0.342 2.219 0.637 3.715 0.653 3.506 0 5.781 -1.641 5.807 -4.18 0.012 -1.392 -0.876 -2.451 -2.8 -3.324 -1.166 -0.566 -1.879 -0.944 -1.872 -1.517 0 -0.509 0.604 -1.052 1.91 -1.052 1.09 -0.017 1.881 0.221 2.496 0.469l0.299 0.141zm8.582 -0.264h-2.577c-0.798 0 -1.396 0.218 -1.746 1.015L32.075 20.881h3.502s0.573 -1.508 0.702 -1.839c0.383 0 3.785 0.005 4.271 0.005 0.1 0.428 0.406 1.833 0.406 1.833h3.095zm-4.089 7.901c0.276 -0.705 1.329 -3.42 1.329 -3.42 -0.02 0.033 0.274 -0.708 0.442 -1.168l0.225 1.055s0.639 2.921 0.772 3.533h-2.768z"
    />
    <path 
      d="m2.867 8.654 -0.043 0.255c1.318 0.319 2.496 0.781 3.527 1.356l2.959 10.605 3.528 -0.004 5.25 -12.212h-3.533L11.291 16.997l-0.348 -1.696a5.5 5.5 0 0 0 -0.052 -0.158l-1.135 -5.457c-0.202 -0.775 -0.787 -1.006 -1.512 -1.033z" 
      fill="#0e4595"
      fillOpacity={1}
    />
  </svg>
)

const MastercardLogo = ({ className }: { className?: string }) => (
  <svg 
    className={className}
    viewBox="0 -3.391 30.157 30.157" 
    xmlns="http://www.w3.org/2000/svg"
  >
    <title>Mastercard</title>
    <path d="M5.462 23.323V21.77c0-.596-.362-.984-.958-.984-.313 0-.647.104-.88.438-.181-.285-.438-.438-.828-.438a.88.88 0 0 0-.75.362v-.313h-.492v2.485h.492v-1.422c0-.438.259-.647.621-.647s.569.233.569.647v1.424h.492v-1.424c0-.438.259-.647.621-.647s.569.233.569.647v1.424Zm8.076-2.459h-.906v-.75h-.491v.75h-.517v.438h.517v1.167c0 .569.207.906.828.906a1.45 1.45 0 0 0 .672-.181l-.156-.438a.85.85 0 0 1-.466.129c-.259 0-.388-.156-.388-.414v-1.19h.906v-.414Zm4.607-.077a.77.77 0 0 0-.673.362v-.313h-.492v2.485h.492v-1.396c0-.414.207-.673.544-.673a1.5 1.5 0 0 1 .336.052l.156-.466a2 2 0 0 0-.362-.052m-6.963.259c-.259-.181-.621-.259-1.009-.259-.621 0-1.009.285-1.009.777 0 .414.285.647.828.725l.259.026c.285.052.466.156.466.285 0 .181-.207.313-.596.313a1.37 1.37 0 0 1-.828-.259l-.259.388c.362.259.802.313 1.063.313.725 0 1.113-.336 1.113-.802 0-.438-.313-.647-.854-.725l-.259-.026c-.233-.026-.438-.104-.438-.259 0-.181.207-.313.492-.313.313 0 .621.129.777.207Zm7.507 1.036c0 .75.492 1.294 1.294 1.294.362 0 .621-.077.88-.285l-.259-.388a1.05 1.05 0 0 1-.647.233c-.438 0-.777-.336-.777-.828s.335-.826.777-.826a1.05 1.05 0 0 1 .647.233l.259-.388c-.259-.207-.517-.285-.88-.285-.777-.052-1.294.492-1.294 1.242Zm-3.469-1.294c-.725 0-1.217.517-1.217 1.294s.517 1.294 1.268 1.294a1.58 1.58 0 0 0 1.009-.336l-.259-.362a1.24 1.24 0 0 1-.725.259c-.336 0-.699-.207-.75-.647h1.838v-.207c0-.777-.466-1.294-1.165-1.294Zm-.026.466c.362 0 .621.233.647.621h-1.346c.077-.362.313-.621.699-.621m-6.704.828v-1.242h-.492v.313c-.181-.233-.438-.362-.802-.362-.699 0-1.217.544-1.217 1.294s.517 1.294 1.217 1.294c.362 0 .621-.129.802-.362v.313h.492zm-1.993 0c0-.466.285-.828.777-.828.466 0 .75.362.75.828 0 .492-.313.828-.75.828-.492.026-.777-.362-.777-.828m19.13-1.294a.77.77 0 0 0-.673.362v-.313h-.492v2.485h.491v-1.396c0-.414.207-.673.544-.673a1.5 1.5 0 0 1 .336.052l.156-.466a2 2 0 0 0-.362-.052Zm-1.916 1.294v-1.242h-.492v.313c-.181-.233-.438-.362-.802-.362-.699 0-1.217.544-1.217 1.294s.517 1.294 1.217 1.294c.362 0 .621-.129.802-.362v.313h.492zm-1.993 0c0-.466.285-.828.777-.828.466 0 .75.362.75.828 0 .492-.313.828-.75.828-.492.026-.777-.362-.777-.828m6.989 0v-2.226h-.492v1.294c-.181-.233-.438-.362-.802-.362-.699 0-1.217.544-1.217 1.294s.517 1.294 1.217 1.294c.362 0 .621-.129.802-.362v.313h.492zm-1.993 0c0-.466.285-.828.777-.828.466 0 .75.362.75.828 0 .492-.313.828-.75.828-.492.026-.777-.362-.777-.828"/>
    <path fill="#ff5f00" d="M10.613 1.993h8.983v14.651h-8.983z"/>
    <path d="M11.519 9.319a9.34 9.34 0 0 1 3.546-7.326 9.319 9.319 0 1 0 0 14.651 9.34 9.34 0 0 1-3.546-7.326" fill="#eb001b"/>
    <path d="M30.157 9.319a9.309 9.309 0 0 1-15.063 7.326 9.34 9.34 0 0 0 0-14.651A9.309 9.309 0 0 1 30.157 9.32" fill="#f79e1b"/>
  </svg>
)


export function CardPaymentForm({ 
  register, 
  errors, 
  watch, 
  setValue, 
  onSubmit,
  isPending = false 
}: CardPaymentFormProps) {
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
          <h3 className="text-base font-semibold text-foreground">Détails de la carte</h3>
          <p className="text-xs text-muted-foreground">Paiement sécurisé par SSL 256-bit</p>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <VisaLogo className="h-6 w-auto" />
          <MastercardLogo className="h-6 w-auto" />
        </div>
      </div>

      {/* Card Preview */}
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-xl p-5 text-white shadow-lg relative overflow-hidden">
            <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20" />

            <div className="flex justify-between items-start mb-12 relative z-10">
              <div>
                <p className="text-xs font-semibold text-white/60 mb-1">CARD NUMBER</p>
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
                <p className="text-xs font-semibold text-white/60 mb-1">CARDHOLDER</p>
                <p className="text-sm font-mono uppercase tracking-wider">
                  {watch("cardholderName")?.toUpperCase() || "CARDHOLDER NAME"}
                </p>
              </div>
              <div>
                <p className="text-xs font-semibold text-white/60 mb-1">EXPIRES</p>
                <p className="text-sm font-mono">{watch("cardExpiry") || "MM/YY"}</p>
              </div>
            </div>
          </div>

          {/* Card Input Fields */}
          <div className="flex flex-col gap-4">
            {/* Cardholder Name */}
            <div className="flex flex-col gap-2">
              <Label htmlFor="cardholderName" className="text-sm font-medium text-foreground">
                Nom du titulaire <span className="text-destructive">*</span>
              </Label>
              <Input
                id="cardholderName"
                type="text"
                placeholder="JEAN DUPONT (comme indiqué sur la carte)"
                {...register("cardholderName")}
                Icon={User}
                error={errors.cardholderName?.message as string}
                className="h-11 uppercase"
              />
              <p className="text-xs text-muted-foreground">Entrez le nom exactement comme il apparaît sur votre carte</p>
            </div>

            {/* Expiry & CVV Row - 3 Column Grid */}
            <div className="grid grid-cols-[1fr_100px_100px_1fr] gap-4">
              {/* Card Number */}
              <div className="flex flex-col gap-2">
                <Label htmlFor="cardNumber" className="text-sm font-medium text-foreground">
                  Numéro de carte <span className="text-destructive">*</span>
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
                    {cardType === "visa" && "Visa détectée"}
                    {cardType === "mastercard" && "Mastercard détectée"}
                    {cardType === "amex" && "American Express détectée"}
                  </p>
                )}
                {!errors.cardNumber && !cardType && (
                  <p className="text-xs text-muted-foreground">Entrez les 16 chiffres sans espaces</p>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-sm font-medium text-foreground flex items-center gap-2">
                  <Calendar className="w-4 h-4" />
                  Mois <span className="text-destructive">*</span>
                </Label>
                <Select value={expiryMonth} onValueChange={setExpiryMonth}>
                  <SelectTrigger className={cn(
                    "!h-[43px] w-full bg-background border-input",
                    errors.cardExpiry && "border-destructive"
                  )}>
                    <SelectValue placeholder="Mois" />
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
                    <AlertCircle className="w-3.5 h-3.5 text-destructive flex-shrink-0" />
                    <p className="text-xs text-destructive">{errors.cardExpiry.message as string}</p>
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-2">
                <Label className="text-sm font-medium text-foreground">
                  Année <span className="text-destructive">*</span>
                </Label>
                <Select value={expiryYear} onValueChange={setExpiryYear}>
                  <SelectTrigger className={cn(
                    "!h-[43px] w-full bg-background border-input",
                    errors.cardExpiry && "border-destructive"
                  )}>
                    <SelectValue placeholder="Année" />
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
                  CVV <span className="text-destructive">*</span>
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
                    aria-label={showCVV ? "Masquer CVV" : "Afficher CVV"}
                  >
                    {showCVV ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                {!errors.cardCVV && (
                  <p className="text-xs text-muted-foreground">3 chiffres au dos (4 pour Amex)</p>
                )}
              </div>

              {/* Hidden input to store the formatted value for form submission */}
              <input type="hidden" {...register("cardExpiry")} />
            </div>
          </div>

      {/* Security Notice */}
      <div className="bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-lg p-3 flex items-start gap-2">
        <div className="w-5 h-5 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0 mt-0.5">
          <Lock className="w-3 h-3 text-white" />
        </div>
        <p className="text-xs text-emerald-700 dark:text-emerald-300">
          Vos données sont chiffrées et sécurisées. Nous ne stockons jamais vos informations de carte.
        </p>
      </div>

      {/* Confirm Payment Button */}
      {onSubmit && (
        <Button
          type="button"
          onClick={onSubmit}
          disabled={isPending}
          className="w-full h-12 bg-gradient-to-r from-blue-600 via-blue-600 to-blue-700 hover:from-blue-700 hover:via-blue-700 hover:to-blue-800 text-white shadow-lg shadow-blue-600/25 font-semibold"
        >
          {isPending ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              Traitement en cours...
            </>
          ) : (
            <>
              <Lock className="w-4 h-4 mr-2" />
              Confirmer le paiement
            </>
          )}
        </Button>
      )}
    </div>
  )
}

export default CardPaymentForm
