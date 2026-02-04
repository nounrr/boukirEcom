"use client"

import { useEffect } from "react"
import type { UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue } from "react-hook-form"
import { Label } from "@/components/ui/label"
import { CreditCard, Wallet, Check, AlertCircle, Coins, Sparkles, Clock, ShieldCheck, Store } from "lucide-react"
import { cn } from "@/lib/utils"
import CardPaymentForm from "./card-payment-form"

interface PaymentStepProps {
  register: UseFormRegister<any>
  errors: FieldErrors<any>
  watch: UseFormWatch<any>
  setValue?: UseFormSetValue<any>
  paymentMethod?: string
  deliveryMethod?: string
  orderTotal?: number
  remiseBalance?: number
  isAuthenticated?: boolean
  isSoldeEligible?: boolean
  soldeAvailable?: number | null
  soldeCumule?: number
  plafond?: number | null
  onSubmitPayment?: () => void
  isPending?: boolean
}

const PAYMENT_METHODS = [
  {
    value: "cash_on_delivery",
    label: "Paiement à la livraison",
    description: "Payez en espèces lors de la réception",
    icon: Wallet,
    iconColor: "text-emerald-600",
    iconBg: "bg-emerald-50 dark:bg-emerald-950/30",
    recommended: true,
    deliveryOnly: true, // Only available for delivery
  },
  {
    value: "pay_in_store",
    label: "Paiement en boutique",
    description: "Payez lors du retrait de votre commande",
    icon: Store,
    iconColor: "text-violet-600",
    iconBg: "bg-violet-50 dark:bg-violet-950/30",
    recommended: true,
    pickupOnly: true, // Only available for pickup
  },
  {
    value: "card",
    label: "Carte bancaire",
    description: "Visa, Mastercard, American Express",
    icon: CreditCard,
    iconColor: "text-blue-600",
    iconBg: "bg-blue-50 dark:bg-blue-950/30",
    recommended: false,
  },
]

export function PaymentStep({ 
  register, 
  errors, 
  watch, 
  setValue, 
  paymentMethod: paymentMethodProp,
  deliveryMethod: deliveryMethodProp,
  orderTotal = 0,
  remiseBalance = 0,
  isAuthenticated = false,
  isSoldeEligible = false,
  soldeAvailable = null,
  soldeCumule = 0,
  plafond = null,
  onSubmitPayment,
  isPending = false
}: PaymentStepProps) {
  const paymentMethod = paymentMethodProp || watch("paymentMethod")
  const deliveryMethod = deliveryMethodProp || watch("deliveryMethod") || "delivery"
  const isPickup = deliveryMethod === "pickup"

  const useRemiseBalance = !!watch("useRemiseBalance")
  const remiseToUseRaw = watch("remiseToUse")

  const maxRemiseToUse = Math.max(0, Math.min(Number(remiseBalance || 0), Number(orderTotal || 0)))
  const parsedRequested = typeof remiseToUseRaw === "number" ? remiseToUseRaw : Number(remiseToUseRaw)
  const requestedRemise = Number.isFinite(parsedRequested) ? parsedRequested : undefined

  const effectiveRemise = useRemiseBalance
    ? Math.max(0, Math.min(requestedRemise ?? maxRemiseToUse, maxRemiseToUse))
    : 0
  const remainingToPay = Math.max(0, Number(orderTotal || 0) - effectiveRemise)
  const canUseRemise = isAuthenticated && maxRemiseToUse > 0

  const hasPlafond = typeof plafond === "number" && Number.isFinite(plafond) && plafond > 0
  const hasSoldeAvailable = typeof soldeAvailable === "number" && Number.isFinite(soldeAvailable)
  const soldeRemaining = hasSoldeAvailable ? Math.max(0, soldeAvailable) : null
  const isSoldeLimitExceeded = soldeRemaining !== null && remainingToPay > soldeRemaining
  const soldeProgressPct = hasPlafond
    ? Math.max(0, Math.min(100, (Math.max(0, Number(soldeCumule || 0)) / plafond) * 100))
    : 0

  // If the plafond is exceeded, prevent keeping "solde" selected (better UX)
  useEffect(() => {
    if (!setValue) return
    if (!isSoldeLimitExceeded) return
    if (paymentMethod !== "solde") return

    const fallbackMethod = isPickup ? "pay_in_store" : "cash_on_delivery"
    setValue("paymentMethod", fallbackMethod, { shouldValidate: true, shouldDirty: true })
  }, [isPickup, isSoldeLimitExceeded, paymentMethod, setValue])

  // Filter payment methods based on delivery method
  const availablePaymentMethods = PAYMENT_METHODS.filter((method) => {
    if (isPickup && (method as any).deliveryOnly) return false
    if (!isPickup && (method as any).pickupOnly) return false
    return true
  })

  // Auto-switch payment method when switching delivery method
  useEffect(() => {
    if (!setValue) return

    // If switching to pickup and current method is cash_on_delivery, switch to pay_in_store
    if (isPickup && paymentMethod === "cash_on_delivery") {
      setValue("paymentMethod", "pay_in_store", { shouldValidate: true, shouldDirty: true })
    }
    // If switching to delivery and current method is pay_in_store, switch to cash_on_delivery
    if (!isPickup && paymentMethod === "pay_in_store") {
      setValue("paymentMethod", "cash_on_delivery", { shouldValidate: true, shouldDirty: true })
    }
  }, [isPickup, paymentMethod, setValue])

  useEffect(() => {
    if (!setValue) return

    if (!useRemiseBalance) {
      setValue("remiseToUse", undefined, { shouldValidate: true, shouldDirty: true })
      return
    }

    if (remiseToUseRaw === undefined || remiseToUseRaw === null || remiseToUseRaw === "") {
      setValue("remiseToUse", maxRemiseToUse, { shouldValidate: true, shouldDirty: true })
    }
  }, [maxRemiseToUse, remiseToUseRaw, setValue, useRemiseBalance])

  useEffect(() => {
    if (!setValue) return
    if (useRemiseBalance && remainingToPay === 0 && paymentMethod === "card") {
      const defaultMethod = isPickup ? "pay_in_store" : "cash_on_delivery"
      setValue("paymentMethod", defaultMethod, { shouldValidate: true, shouldDirty: true })
    }
  }, [paymentMethod, remainingToPay, setValue, useRemiseBalance, isPickup])

  const showCardForm = paymentMethod === "card" && remainingToPay > 0

  const isSoldeSelected = paymentMethod === "solde"

  return (
    <div className="flex flex-col gap-3">
      {/* Remise Balance */}
      <div className="flex flex-col gap-3 bg-background border border-border/50 rounded-xl p-4 shadow-sm transition-all duration-300">
        <div className="flex items-center gap-2 pb-3 border-b border-border/50">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Coins className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="flex flex-col">
            <h3 className="text-sm font-semibold text-foreground">Solde remise</h3>
            <p className="text-[11px] text-muted-foreground">Utilisez votre remise pour payer tout ou une partie</p>
          </div>
        </div>

        {!isAuthenticated ? (
          <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
            <p className="text-sm text-muted-foreground">Connectez-vous pour utiliser votre solde remise.</p>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] text-muted-foreground">Disponible:</span>
                <span className="text-sm font-semibold text-foreground">{Number(remiseBalance || 0).toFixed(2)} DH</span>
              </div>
              <span className="text-[11px] text-muted-foreground">Max: {maxRemiseToUse.toFixed(2)} DH</span>
            </div>

            {/* Remise Toggle Card - styled like payment methods */}
            <label className={cn(
              "relative group cursor-pointer transition-all duration-200",
              !canUseRemise && "cursor-not-allowed opacity-50"
            )}>
              <input
                type="checkbox"
                disabled={!canUseRemise || !setValue}
                {...register("useRemiseBalance")}
                className="peer sr-only"
              />
              <div
                className={cn(
                  "flex items-center gap-2.5 p-2.5 rounded-lg border-2 transition-all duration-200",
                  "bg-background hover:bg-accent/30 hover:border-primary/30",
                  "peer-checked:border-primary peer-checked:bg-primary/5",
                  "peer-checked:shadow-sm peer-checked:shadow-primary/10",
                  !canUseRemise && "hover:bg-background hover:border-border/60",
                )}
              >
                <div className="w-9 h-9 rounded-lg bg-amber-50 dark:bg-amber-950/30 flex items-center justify-center shrink-0">
                  <Coins className="w-4 h-4 text-amber-600" />
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="font-semibold text-sm text-foreground">Utiliser ma remise</p>
                    {canUseRemise && maxRemiseToUse >= Number(orderTotal || 0) && (
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                        Couvre tout
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-muted-foreground">
                    Déduire jusqu'à {maxRemiseToUse.toFixed(2)} DH
                  </p>
                </div>

                {/* Custom checkbox indicator */}
                <div
                  className={cn(
                    "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                    "border-border/60 bg-background",
                    "peer-checked:border-primary peer-checked:bg-primary",
                  )}
                >
                  <Check className={cn(
                    "w-3 h-3 text-white transition-opacity",
                    useRemiseBalance ? "opacity-100" : "opacity-0",
                  )} />
                </div>
              </div>
            </label>

            {useRemiseBalance && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2 animate-in fade-in-0 slide-in-from-top-1 duration-150">
                <div className="flex flex-col gap-1 rounded-lg border border-border/60 bg-muted/20 p-2.5">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="remiseToUse" className="text-xs font-medium text-foreground">
                      Montant à utiliser
                    </Label>
                    <button
                      type="button"
                      className="text-[11px] font-semibold text-primary hover:text-primary/80 transition-colors"
                      onClick={() => {
                        if (!setValue) return
                        setValue("remiseToUse", maxRemiseToUse, { shouldValidate: true, shouldDirty: true })
                      }}
                    >
                      Max
                    </button>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      className="h-8 w-8 rounded-md border border-border/60 bg-background hover:bg-accent/50 text-sm font-bold transition-colors shrink-0"
                      onClick={() => {
                        if (!setValue) return
                        const current = typeof requestedRemise === "number" ? requestedRemise : maxRemiseToUse
                        const next = Math.max(0, current - 50)
                        setValue("remiseToUse", next, { shouldValidate: true, shouldDirty: true })
                      }}
                      disabled={!setValue}
                    >
                      −
                    </button>
                    <input
                      id="remiseToUse"
                      type="number"
                      step="0.01"
                      min={0}
                      max={maxRemiseToUse}
                      inputMode="decimal"
                      disabled={!canUseRemise || !setValue}
                      {...register("remiseToUse")}
                      className={cn(
                        "h-8 flex-1 rounded-md border border-input bg-background px-2 text-sm text-center font-semibold shadow-sm",
                        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-transparent",
                        errors.remiseToUse && "border-destructive focus-visible:ring-destructive/50",
                      )}
                      placeholder={maxRemiseToUse.toFixed(2)}
                    />
                    <button
                      type="button"
                      className="h-8 w-8 rounded-md border border-border/60 bg-background hover:bg-accent/50 text-sm font-bold transition-colors shrink-0"
                      onClick={() => {
                        if (!setValue) return
                        const current = typeof requestedRemise === "number" ? requestedRemise : 0
                        const next = Math.min(maxRemiseToUse, current + 50)
                        setValue("remiseToUse", next, { shouldValidate: true, shouldDirty: true })
                      }}
                      disabled={!setValue}
                    >
                      +
                    </button>
                  </div>
                  {errors.remiseToUse?.message && (
                    <p className="text-[11px] text-destructive">{errors.remiseToUse.message as string}</p>
                  )}
                </div>

                <div className="flex flex-col justify-center gap-1.5 rounded-lg border border-border/60 bg-linear-to-br from-emerald-50/50 to-emerald-100/30 dark:from-emerald-950/20 dark:to-emerald-900/10 p-2.5">
                  <div className="flex items-center justify-between text-[11px] text-muted-foreground">
                    <span>Total</span>
                    <span className="font-semibold text-foreground">{Number(orderTotal || 0).toFixed(2)} DH</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px] text-emerald-700 dark:text-emerald-400">
                    <span>Remise</span>
                    <span className="font-semibold">-{effectiveRemise.toFixed(2)} DH</span>
                  </div>
                  <div className="flex items-center justify-between text-sm pt-1.5 border-t border-border/40">
                    <span className="font-medium text-foreground">Reste</span>
                    <span className={cn("font-bold", remainingToPay === 0 ? "text-emerald-600" : "text-foreground")}>
                      {remainingToPay.toFixed(2)} DH
                    </span>
                  </div>
                  {remainingToPay === 0 && (
                    <div className="flex items-center justify-center gap-1.5 text-[10px] text-emerald-700 dark:text-emerald-400 bg-emerald-100/50 dark:bg-emerald-900/30 rounded py-1">
                      <Check className="w-3 h-3" />
                      <span className="font-medium">Couvert par remise</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {!canUseRemise && (
              <p className="text-xs text-muted-foreground">Solde insuffisant pour ce panier.</p>
            )}
          </div>
        )}
      </div>

      {/* Solde (Buy Now, Pay Later) - Only for eligible users */}
      {isSoldeEligible && (
        <div className="flex flex-col gap-3 bg-linear-to-br from-violet-50/60 via-background to-purple-50/40 dark:from-violet-950/25 dark:via-background dark:to-purple-950/15 border border-violet-200/70 dark:border-violet-800/40 rounded-xl p-4 shadow-sm transition-all duration-300">
          <div className="flex items-center gap-2 pb-3 border-b border-violet-200/50 dark:border-violet-800/30">
            <div className="w-7 h-7 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center">
              <Clock className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-semibold text-foreground">Solde — Achetez maintenant, payez plus tard</h3>
                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold bg-violet-100 dark:bg-violet-900/50 text-violet-700 dark:text-violet-300 border border-violet-200 dark:border-violet-700">
                  Exclusif
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">Vous êtes éligible au paiement différé</p>
            </div>
          </div>

          {/* Plafond / available summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="rounded-lg border border-violet-200/60 dark:border-violet-800/40 bg-background/80 p-2.5">
              <p className="text-[10px] text-muted-foreground">Plafond</p>
              <p className="text-sm font-bold text-foreground">
                {hasPlafond ? `${plafond.toFixed(2)} DH` : "Non limité"}
              </p>
            </div>
            <div className="rounded-lg border border-violet-200/60 dark:border-violet-800/40 bg-background/80 p-2.5">
              <p className="text-[10px] text-muted-foreground">Solde cumulé</p>
              <p className="text-sm font-bold text-foreground">{Number(soldeCumule || 0).toFixed(2)} DH</p>
            </div>
            <div className="rounded-lg border border-violet-200/60 dark:border-violet-800/40 bg-background/80 p-2.5">
              <p className="text-[10px] text-muted-foreground">Disponible</p>
              <p className={cn("text-sm font-bold", soldeRemaining !== null && soldeRemaining <= 0 ? "text-destructive" : "text-foreground")}>
                {soldeRemaining === null ? "—" : `${soldeRemaining.toFixed(2)} DH`}
              </p>
            </div>
          </div>

          {hasPlafond && (
            <div className="rounded-lg border border-violet-200/60 dark:border-violet-800/40 bg-background/70 p-2.5">
              <div className="flex items-center justify-between text-[10px] text-muted-foreground mb-1">
                <span>Utilisation</span>
                <span className="font-semibold text-foreground">{soldeProgressPct.toFixed(0)}%</span>
              </div>
              <div className="h-2 rounded-full bg-muted/60 overflow-hidden">
                <div className="h-2 rounded-full bg-linear-to-r from-violet-500 to-purple-600" style={{ width: `${soldeProgressPct}%` }} />
              </div>
            </div>
          )}

          {/* If plafond exceeded, hide Solde selection and only show the red warning */}
          {isSoldeLimitExceeded ? (
            <div className="flex items-start gap-2.5 p-2.5 rounded-lg border bg-destructive/10 border-destructive/25">
              <div className="w-7 h-7 rounded-md bg-destructive/15 flex items-center justify-center shrink-0">
                <AlertCircle className="w-3.5 h-3.5 text-destructive" />
              </div>
              <div className="flex-1">
                <p className="text-xs font-medium text-destructive">Plafond solde insuffisant</p>
                <p className="text-xl font-bold text-destructive">{remainingToPay.toFixed(2)} DH</p>
                <p className="text-[11px] text-destructive/90 mt-1">
                  Votre solde disponible est de {soldeRemaining?.toFixed(2)} DH. Réduisez le panier ou choisissez un autre mode de paiement.
                </p>
              </div>
            </div>
          ) : (
            <>
                <label className="relative group cursor-pointer transition-all duration-200">
                  <input
                    type="radio"
                    value="solde"
                    {...register("paymentMethod")}
                    className="peer sr-only"
                    disabled={remainingToPay === 0 || isPending}
                  />
                  <div
                    className={cn(
                      "flex items-center gap-2.5 p-3 rounded-lg border-2 transition-all duration-200",
                      "bg-background hover:bg-violet-50/50 dark:hover:bg-violet-950/20 hover:border-violet-300 dark:hover:border-violet-700",
                      "peer-checked:border-violet-500 peer-checked:bg-violet-50 dark:peer-checked:bg-violet-950/30",
                      "peer-checked:shadow-md peer-checked:shadow-violet-500/15",
                    remainingToPay === 0 && "opacity-60 cursor-not-allowed",
                    )}
                  >
                    <div className="w-10 h-10 rounded-lg bg-linear-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0 shadow-sm shadow-violet-500/25">
                      <Clock className="w-5 h-5 text-white" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="font-semibold text-sm text-foreground">Payer plus tard (Solde)</p>
                        {soldeRemaining !== null && (
                          <span className="px-1.5 py-0.5 rounded-full text-[9px] font-semibold border bg-violet-100/70 dark:bg-violet-900/40 text-violet-700 dark:text-violet-300 border-violet-200/70 dark:border-violet-700/50">
                            Restant: {soldeRemaining.toFixed(2)} DH
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-muted-foreground mb-1">
                        Recevez votre commande maintenant et payez ultérieurement
                      </p>
                      <div className="flex items-center gap-2 text-[10px]">
                        <span className="flex items-center gap-0.5 text-violet-600 dark:text-violet-400">
                          <ShieldCheck className="w-3 h-3" />
                          Compte vérifié
                        </span>
                        <span className="flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400">
                          <Check className="w-3 h-3" />
                          Sans frais
                        </span>
                      </div>
                    </div>

                    {/* Custom radio indicator */}
                    <div
                      className={cn(
                        "w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0",
                        "border-border/60 bg-background",
                        isSoldeSelected && "border-violet-500 bg-violet-500",
                      )}
                    >
                      <Check className={cn(
                        "w-3 h-3 text-white transition-opacity",
                        isSoldeSelected ? "opacity-100" : "opacity-0",
                      )} />
                    </div>
                  </div>
                </label>

                {isSoldeSelected && (
                  <div className="flex items-start gap-2.5 p-2.5 rounded-lg border bg-violet-100/50 dark:bg-violet-900/20 border-violet-200/60 dark:border-violet-800/40 animate-in fade-in-0 slide-in-from-top-1 duration-150">
                    <div className="w-7 h-7 rounded-md bg-violet-200/50 dark:bg-violet-800/30 flex items-center justify-center shrink-0">
                      <AlertCircle className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-medium text-violet-900 dark:text-violet-100">
                        Montant à régler ultérieurement
                      </p>
                      <p className="text-xl font-bold text-violet-700 dark:text-violet-300">
                        {remainingToPay.toFixed(2)} DH
                      </p>
                      <p className="text-[11px] text-violet-600/80 dark:text-violet-400/80 mt-1">
                        Votre commande sera traitée après validation. Paiement selon conditions convenues.
                      </p>
                    </div>
                  </div>
                )}
              </>
          )}
        </div>
      )}

      {/* Payment Method Selection */}
      <div className="flex flex-col gap-3 bg-background border border-border/50 rounded-xl p-4 shadow-sm transition-all duration-300">
        <div className="flex items-center gap-2 pb-3 border-b border-border/50">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <CreditCard className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="flex flex-col">
            <h3 className="text-sm font-semibold text-foreground">
              {isSoldeEligible ? "Ou choisissez un autre mode de paiement" : "Méthode de paiement"}
            </h3>
            <p className="text-[11px] text-muted-foreground">Choisissez comment vous souhaitez régler</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 transition-all duration-200">
          {availablePaymentMethods.map((method) => {
            const Icon = method.icon
            const isSelected = paymentMethod === method.value
            return (
              <label
                key={method.value}
                className="relative group cursor-pointer transition-all duration-200"
              >
                <input
                  type="radio"
                  value={method.value}
                  {...register("paymentMethod")}
                  className="peer sr-only"
                />

                <div
                  className={cn(
                    "flex items-center gap-2.5 p-2.5 rounded-lg border-2 transition-all duration-200",
                    "bg-background hover:bg-accent/30 hover:border-primary/30",
                    "peer-checked:border-primary peer-checked:bg-primary/5",
                    "peer-checked:shadow-sm peer-checked:shadow-primary/10",
                    isSelected && "scale-[1.02]"
                  )}
                >
                  <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", method.iconBg)}>
                    <Icon className={cn("w-4 h-4", method.iconColor)} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-sm text-foreground">{method.label}</p>
                      {method.recommended && (
                        <span className="px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-primary/10 text-primary">
                          Recommandé
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-muted-foreground">{method.description}</p>
                  </div>
                </div>
              </label>
            )
          })}
        </div>

        {errors.paymentMethod && (
          <div className="flex items-center gap-1.5 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertCircle className="w-4 h-4 text-destructive shrink-0" />
            <p className="text-sm text-destructive">{errors.paymentMethod.message as string}</p>
          </div>
        )}
      </div>

      {showCardForm && (
        <CardPaymentForm
          register={register}
          errors={errors}
          watch={watch}
          setValue={setValue}
          onSubmit={onSubmitPayment}
          isPending={isPending}
        />
      )}

      <div className="flex flex-col gap-3 bg-background border border-border/50 rounded-xl p-4 shadow-sm">
        <div className="flex items-center gap-2 pb-3 border-b border-border/50">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <Wallet className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="flex flex-col">
            <h3 className="text-sm font-semibold text-foreground">
              Notes de livraison <span className="text-[11px] font-normal text-muted-foreground">(optionnel)</span>
            </h3>
            <p className="text-[11px] text-muted-foreground">Informations complémentaires pour la livraison</p>
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <Label htmlFor="notes" className="text-xs font-medium text-foreground">
            Messages spéciaux
          </Label>
          <textarea
            id="notes"
            {...register("notes")}
            rows={2}
            className={cn(
              "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-transparent resize-none transition-all",
              errors.notes && "border-destructive focus-visible:ring-destructive/50",
            )}
            placeholder="Ex: Appelez-moi 30 min avant, 3ème étage, code: 1234..."
          />
          {errors.notes && (
            <div className="flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-destructive shrink-0" />
              <p className="text-xs text-destructive">{errors.notes.message as string}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PaymentStep
