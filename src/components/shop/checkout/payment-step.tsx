"use client"

import { useState, useEffect, memo } from "react"
import type { UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue } from "react-hook-form"
import { Label } from "@/components/ui/label"
import { CreditCard, Wallet, Check, AlertCircle } from "lucide-react"
import { cn } from "@/lib/utils"
import CardPaymentForm from "./card-payment-form"

interface PaymentStepProps {
  register: UseFormRegister<any>
  errors: FieldErrors<any>
  watch: UseFormWatch<any>
  setValue?: UseFormSetValue<any>
  paymentMethod?: string
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
  onSubmitPayment,
  isPending = false
}: PaymentStepProps) {
  const paymentMethod = paymentMethodProp || watch("paymentMethod")

  return (
    <div className="flex flex-col gap-5">
      {/* Payment Method Selection */}
      <div className="flex flex-col gap-4 bg-background border border-border/50 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2.5 pb-4 border-b border-border/50">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <CreditCard className="w-4 h-4 text-primary" />
          </div>
          <div className="flex flex-col gap-0.5">
            <h3 className="text-sm font-semibold text-foreground">Méthode de paiement</h3>
            <p className="text-xs text-muted-foreground">Choisissez comment vous souhaitez régler</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {PAYMENT_METHODS.map((method) => {
            const Icon = method.icon
            return (
              <label key={method.value} className="relative group cursor-pointer">
                <input type="radio" value={method.value} {...register("paymentMethod")} className="peer sr-only" />

                <div
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl border-2 transition-all duration-200",
                    "bg-background hover:bg-accent/30 hover:border-primary/30",
                    "peer-checked:border-primary peer-checked:bg-primary/5",
                    "peer-checked:shadow-md peer-checked:shadow-primary/10",
                  )}
                >
                  <div
                    className={cn("w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0", method.iconBg)}
                  >
                    <Icon className={cn("w-5 h-5", method.iconColor)} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-semibold text-sm text-foreground">{method.label}</p>
                      {method.recommended && (
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-primary/10 text-primary">
                          Recommandé
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{method.description}</p>
                  </div>
                </div>
              </label>
            )
          })}
        </div>

        {errors.paymentMethod && (
          <div className="flex items-center gap-1.5 p-3 rounded-lg bg-destructive/10 border border-destructive/20">
            <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
            <p className="text-sm text-destructive">{errors.paymentMethod.message as string}</p>
          </div>
        )}
      </div>

      {paymentMethod === "card" && (
        <CardPaymentForm
          register={register}
          errors={errors}
          watch={watch}
          setValue={setValue}
          onSubmit={onSubmitPayment}
          isPending={isPending}
        />
      )}

      <div className="flex flex-col gap-4 bg-background border border-border/50 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2.5 pb-4 border-b border-border/50">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Wallet className="w-4 h-4 text-primary" />
          </div>
          <div className="flex flex-col gap-0.5">
            <h3 className="text-sm font-semibold text-foreground">
              Notes de livraison <span className="text-xs font-normal text-muted-foreground">(optionnel)</span>
            </h3>
            <p className="text-xs text-muted-foreground">Informations complémentaires pour la livraison</p>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="notes" className="text-sm font-medium text-foreground">
            Messages spéciaux
          </Label>
          <textarea
            id="notes"
            {...register("notes")}
            rows={3}
            className={cn(
              "w-full rounded-xl border border-input bg-background px-4 py-3 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-transparent resize-none transition-all",
              errors.notes && "border-destructive focus-visible:ring-destructive/50",
            )}
            placeholder="Ex: Appelez-moi 30 minutes avant la livraison, livraison au 3ème étage, code d'accès: 1234..."
          />
          {errors.notes && (
            <div className="flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-destructive flex-shrink-0" />
              <p className="text-xs text-destructive">{errors.notes.message as string}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PaymentStep
