"use client"

import { memo } from "react"
import { MapPin, Mail, CreditCard, FileText, ShieldCheck, RefreshCw, MessageCircle, Truck } from "lucide-react"

interface OrderSummaryStepProps {
  formValues: {
    shippingAddress: {
      firstName: string
      lastName: string
      phone: string
      address: string
      city: string
      postalCode: string
    }
    email: string
    paymentMethod: string
    notes: string
    cardholderName?: string
    cardNumber?: string
  }
}

const PAYMENT_METHOD_LABELS: Record<string, string> = {
  cash_on_delivery: "Paiement à la livraison",
  card: "Carte bancaire",
  bank_transfer: "Virement bancaire",
  mobile_payment: "Paiement mobile",
}

const maskCardNumber = (cardNumber: string): string => {
  const cleaned = cardNumber.replace(/\s/g, "")
  if (cleaned.length < 4) return "•••• " + cleaned
  return "•••• •••• •••• " + cleaned.slice(-4)
}

// Card brand logos
const VisaIcon = () => (
  <svg className="h-6 w-auto" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 32">
    <rect width="48" height="32" rx="4" fill="#1434CB" />
    <path
      d="M20.5 11h-2.7l-1.7 10h2.7l1.7-10zm7.4 6.5l1.4-3.9.8 3.9h-2.2zm3 3.5h2.5l-2.2-10h-2.3c-.5 0-.9.3-1.1.7l-3.8 9.3h2.8l.6-1.5h3.4l.3 1.5zm-6.8-3.3c0-2.6-3.6-2.7-3.6-3.9 0-.3.3-.7 1.1-.8.4 0 1.4-.1 2.6.5l.5-2.2c-.6-.2-1.5-.5-2.5-.5-2.7 0-4.5 1.4-4.5 3.4 0 1.5 1.3 2.3 2.3 2.8 1 .5 1.4.8 1.4 1.3 0 .7-.8 1-1.6 1-1.3 0-2.1-.3-2.7-.6l-.5 2.3c.6.3 1.8.5 3 .5 2.8.1 4.6-1.3 4.6-3.4zm-12.2-6.7l-4.4 10h-2.8l-2.2-8.3c-.1-.5-.3-.7-.7-.9-.7-.3-1.9-.6-2.9-.8l.1-.3h5c.6 0 1.2.4 1.3 1.1l1.2 6.2 3-7.3h2.8z"
      fill="white"
    />
  </svg>
)

const MastercardIcon = () => (
  <svg className="h-6 w-auto" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 32">
    <rect width="48" height="32" rx="4" fill="#000" />
    <circle cx="18" cy="16" r="8" fill="#EB001B" />
    <circle cx="30" cy="16" r="8" fill="#F79E1B" />
    <path d="M24 10.4c1.5 1.3 2.5 3.3 2.5 5.6s-1 4.3-2.5 5.6c-1.5-1.3-2.5-3.3-2.5-5.6s1-4.3 2.5-5.6z" fill="#FF5F00" />
  </svg>
)

export function OrderSummaryStep({ formValues }: OrderSummaryStepProps) {
  const { shippingAddress, email, paymentMethod, notes, cardholderName, cardNumber } = formValues

  return (
    <div className="flex flex-col gap-4 max-w-3xl">
      {/* Shipping & Contact - Combined Card */}
      <div className="bg-background border border-border/50 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2.5 pb-3 mb-3 border-b border-border/50">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
            <Truck className="w-4 h-4 text-emerald-600" />
          </div>
          <h3 className="text-sm font-semibold text-foreground">Informations de livraison</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {/* Shipping Address */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2 mb-1">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Adresse</p>
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
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Contact</p>
            </div>
            <p className="text-sm text-foreground break-all">{email}</p>
          </div>
        </div>
      </div>

      {/* Payment Method */}
      <div className="bg-background border border-border/50 rounded-2xl p-5 shadow-sm">
        <div className="flex items-center gap-2.5 pb-3 mb-3 border-b border-border/50">
          <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
            <CreditCard className="w-4 h-4 text-blue-600" />
          </div>
          <h3 className="text-base font-semibold text-foreground">Méthode de paiement</h3>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <p className="text-base font-medium text-foreground">
              {PAYMENT_METHOD_LABELS[paymentMethod] || paymentMethod}
            </p>
            {/* Show card brand icons for card payment */}
            {paymentMethod === "card" && (
              <div className="flex items-center gap-2">
                <VisaIcon />
                <MastercardIcon />
              </div>
            )}
          </div>

          {/* Card Details - Discreet Mode */}
          {paymentMethod === "card" && cardNumber && (
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800 rounded-lg p-4 mt-2 border border-border/50">
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
        </div>
      </div>

      {/* Special Instructions */}
      {notes && (
        <div className="bg-background border border-border/50 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-2.5 pb-3 mb-3 border-b border-border/50">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="w-4 h-4 text-primary" />
            </div>
            <h3 className="text-sm font-semibold text-foreground">Instructions spéciales</h3>
          </div>
          <p className="text-sm text-muted-foreground leading-relaxed">{notes}</p>
        </div>
      )}

      {/* Trust Badges */}
      <div className="bg-gradient-to-br from-primary/5 via-primary/3 to-transparent border border-primary/10 rounded-2xl p-5">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <ShieldCheck className="w-4 h-4 text-primary" />
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-semibold text-foreground">Paiement sécurisé</p>
              <p className="text-xs text-muted-foreground">Protection SSL</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <RefreshCw className="w-4 h-4 text-primary" />
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-semibold text-foreground">Retour 14 jours</p>
              <p className="text-xs text-muted-foreground">Satisfait ou remboursé</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <MessageCircle className="w-4 h-4 text-primary" />
            </div>
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-semibold text-foreground">Support 24/7</p>
              <p className="text-xs text-muted-foreground">Assistance dédiée</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default memo(OrderSummaryStep)
