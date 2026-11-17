"use client"

import { useState } from "react"
import { useTranslations } from "next-intl"
import type { FieldErrors, UseFormRegister, UseFormSetValue, UseFormWatch } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { User, Mail, Phone, MapPin, Building2, CreditCard, MessageSquare, Coins } from "lucide-react"

interface CheckoutFormSectionProps {
  register: UseFormRegister<any>
  errors: FieldErrors<any>
  watch?: UseFormWatch<any>
  setValue?: UseFormSetValue<any>
  orderTotal?: number
  remiseBalance?: number
  isAuthenticated?: boolean
}

const PHONE_COUNTRIES = [
  { code: "MA", name: "Maroc", dialCode: "+212", flag: "🇲🇦" },
  { code: "FR", name: "France", dialCode: "+33", flag: "🇫🇷" },
  { code: "ES", name: "Espagne", dialCode: "+34", flag: "🇪🇸" },
  { code: "DE", name: "Allemagne", dialCode: "+49", flag: "🇩🇪" },
  { code: "IT", name: "Italie", dialCode: "+39", flag: "🇮🇹" },
  { code: "GB", name: "Royaume-Uni", dialCode: "+44", flag: "🇬🇧" },
  { code: "BE", name: "Belgique", dialCode: "+32", flag: "🇧🇪" },
  { code: "NL", name: "Pays-Bas", dialCode: "+31", flag: "🇳🇱" },
  { code: "CH", name: "Suisse", dialCode: "+41", flag: "🇨🇭" },
  { code: "PT", name: "Portugal", dialCode: "+351", flag: "🇵🇹" },
  { code: "DZ", name: "Algérie", dialCode: "+213", flag: "🇩🇿" },
  { code: "TN", name: "Tunisie", dialCode: "+216", flag: "🇹🇳" },
  { code: "EG", name: "Égypte", dialCode: "+20", flag: "🇪🇬" },
  { code: "SA", name: "Arabie Saoudite", dialCode: "+966", flag: "🇸🇦" },
  { code: "AE", name: "Émirats arabes unis", dialCode: "+971", flag: "🇦🇪" },
  { code: "US", name: "États-Unis", dialCode: "+1", flag: "🇺🇸" },
  { code: "CA", name: "Canada", dialCode: "+1", flag: "🇨🇦" },
  { code: "TR", name: "Turquie", dialCode: "+90", flag: "🇹🇷" },
  { code: "SE", name: "Suède", dialCode: "+46", flag: "🇸🇪" },
  { code: "NO", name: "Norvège", dialCode: "+47", flag: "🇳🇴" },
]

export function CheckoutFormSection({
  register,
  errors,
  watch,
  setValue,
  orderTotal,
  remiseBalance,
  isAuthenticated,
}: CheckoutFormSectionProps) {
  const wallet = useTranslations("checkout.payment.remise")
  const [selectedCountry, setSelectedCountry] = useState(PHONE_COUNTRIES[0])

  const paymentMethodError = errors?.paymentMethod?.message
  const phoneError = (errors as any)?.shippingAddress?.phone?.message
  const canShowRemise = typeof remiseBalance === "number" || typeof orderTotal === "number"
  const useRemiseBalance = watch ? !!watch("useRemiseBalance") : false

  return (
    <div className="space-y-6">
      {/* Shipping information */}
      <div className="bg-linear-to-br from-card via-card to-card/95 border border-border/60 rounded-xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center gap-2 pb-3 border-b border-border/40">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <MapPin className="w-3.5 h-3.5 text-primary" />
          </div>
          <h2 className="text-sm font-semibold text-foreground">Informations de livraison</h2>
        </div>

        <div className="flex flex-col gap-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-muted-foreground" />
                Prénom <span className="text-destructive">*</span>
              </Label>
              <Input
                {...register("shippingAddress.firstName")}
                placeholder="Votre prénom"
                className="h-9"
                error={(errors as any)?.shippingAddress?.firstName?.message as string | undefined}
              />
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-medium flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-muted-foreground" />
                Nom <span className="text-destructive">*</span>
              </Label>
              <Input
                {...register("shippingAddress.lastName")}
                placeholder="Votre nom"
                className="h-9"
                error={(errors as any)?.shippingAddress?.lastName?.message as string | undefined}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-muted-foreground" />
              Email <span className="text-destructive">*</span>
            </Label>
            <Input
              {...register("email")}
              type="email"
              placeholder="vous@example.com"
              className="h-9"
              error={(errors as any)?.email?.message as string | undefined}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-muted-foreground" />
              Téléphone <span className="text-destructive">*</span>
            </Label>
            <div className="flex gap-3">
              <Select
                value={selectedCountry.code}
                onValueChange={(code) => {
                  const found = PHONE_COUNTRIES.find((c) => c.code === code)
                  if (found) setSelectedCountry(found)
                }}
              >
                <SelectTrigger className="w-[140px] h-[41px]! bg-linear-to-br from-background via-muted/20 to-muted/40 border-border/60 shadow-sm rounded-md">
                  <SelectValue>
                    <span className="flex items-center gap-1.5">
                      <span>{selectedCountry.flag}</span>
                      <span className="text-xs">{selectedCountry.dialCode}</span>
                    </span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent className="bg-card/95 border border-border/60 shadow-lg rounded-md">
                  {PHONE_COUNTRIES.map((country) => (
                    <SelectItem key={country.code} value={country.code}>
                      <span className="flex items-center gap-2">
                        <span>{country.flag}</span>
                        <span className="text-xs">{country.name}</span>
                        <span className="text-[10px] text-muted-foreground">
                          {country.dialCode}
                        </span>
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input
                {...register("shippingAddress.phone")}
                placeholder="612345678"
                maxLength={15}
                className="flex-1 h-10"
                error={phoneError as string | undefined}
              />
            </div>

            {phoneError && (
              <p className="text-[10px] text-destructive mt-1">
                {String(phoneError)}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-medium flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
              Adresse <span className="text-destructive">*</span>
            </Label>
            <Input
              {...register("shippingAddress.address")}
              placeholder="Adresse complète de livraison"
              className="h-9"
              error={(errors as any)?.shippingAddress?.address?.message as string | undefined}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <Label className="text-xs font-medium flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-muted-foreground" />
              Ville <span className="text-destructive">*</span>
            </Label>
            <Input
              {...register("shippingAddress.city")}
              placeholder="Ville"
              className="h-9"
              error={(errors as any)?.shippingAddress?.city?.message as string | undefined}
            />
          </div>
          <div className="space-y-3">
            <Label className="text-xs font-medium text-muted-foreground">
              Code postal (optionnel)
            </Label>
            <Input
              {...register("shippingAddress.postalCode")}
              placeholder="Code postal"
              className="h-9"
            />
          </div>
        </div>
      </div>

      {/* Payment & notes */}
      <div className="bg-linear-to-br from-card via-card to-card/95 border border-border/60 rounded-xl p-6 space-y-4 shadow-sm">
        <div className="flex items-center gap-2 pb-3 border-b border-border/40">
          <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
            <CreditCard className="w-3.5 h-3.5 text-primary" />
          </div>
          <div className="flex flex-col">
            <h2 className="text-sm font-semibold text-foreground">Paiement</h2>
            <p className="text-[11px] text-muted-foreground">Prix TTC (TVA incluse)</p>
          </div>
        </div>

        {canShowRemise && (
          <div className="rounded-lg border border-border/60 bg-background p-4">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Coins className="w-3.5 h-3.5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">{wallet("title")}</p>
                <p className="text-[11px] text-muted-foreground">{wallet("subtitle")}</p>
              </div>
            </div>

            {!isAuthenticated ? (
              <p className="text-[11px] text-muted-foreground">{wallet("loginToUse")}</p>
            ) : (
              <div className="space-y-3">
                {typeof remiseBalance === "number" && (
                  <p className="text-[11px] text-muted-foreground">
                    {wallet("availableLabel")} <span className="font-semibold text-foreground">{remiseBalance.toFixed(2)} DH</span>
                  </p>
                )}

                <label className="flex items-center gap-2 text-xs">
                  <input
                    type="checkbox"
                    {...register("useRemiseBalance")}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                  />
                  <span className="font-medium">{wallet("useMyRemise")}</span>
                </label>

                {useRemiseBalance && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label className="text-xs font-medium">{wallet("amountToUse")} (DH)</Label>
                      <Input
                        {...register("remiseToUse")}
                        type="number"
                        step="0.01"
                        min={0}
                        className="h-9"
                        error={(errors as any)?.remiseToUse?.message as string | undefined}
                      />
                    </div>

                    <div className="flex items-end justify-end">
                      <button
                        type="button"
                        className="h-9 px-3 rounded-md bg-primary/10 text-primary text-xs font-semibold hover:bg-primary/15"
                        onClick={() => {
                          if (!setValue) return
                          if (typeof remiseBalance !== "number" || typeof orderTotal !== "number") return
                          const max = Math.max(0, Math.min(remiseBalance, orderTotal))
                          setValue("remiseToUse", max, { shouldValidate: true, shouldDirty: true })
                        }}
                        disabled={!setValue || typeof remiseBalance !== "number" || typeof orderTotal !== "number"}
                      >
                        Max
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <div className="space-y-3">
          <Label className="text-xs font-medium">Méthode de paiement <span className="text-destructive">*</span></Label>
          <div className="flex flex-wrap gap-3">
            {[
              {
                value: "cash_on_delivery",
                label: "À la livraison",
                icon: "💵",
              },
              { value: "card", label: "Carte bancaire", icon: "💳" },
              {
                value: "bank_transfer",
                label: "Virement bancaire",
                icon: "🏦",
              },
            ].map((option) => (
              <label
                key={option.value}
                className="group relative flex items-center gap-2 px-3 py-2 rounded-lg border border-border bg-background hover:bg-accent/50 hover:border-primary/30 transition-all cursor-pointer text-xs"
              >
                <input
                  type="radio"
                  value={option.value}
                  {...register("paymentMethod")}
                  className="peer sr-only"
                />
                <div className="absolute inset-0 rounded-lg border-2 border-primary opacity-0 peer-checked:opacity-100 transition-opacity pointer-events-none" />
                <span className="text-base">{option.icon}</span>
                <span className="font-medium">{option.label}</span>
              </label>
            ))}
          </div>
          {paymentMethodError && (
            <p className="text-[10px] text-destructive mt-0.5">
              {String(paymentMethodError)}
            </p>
          )}
        </div>

        <div className="space-y-2">
          <Label className="text-xs font-medium flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5 text-muted-foreground" />
            Remarques (optionnel)
          </Label>
          <textarea
            {...register("notes")}
            rows={2}
            className="w-full rounded-md border border-input bg-background px-3 py-2 text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring resize-none"
            placeholder="Instructions spéciales pour la livraison..."
          />
          {(errors as any)?.notes && (
            <p className="text-[10px] text-destructive mt-0.5">
              {(errors as any)?.notes?.message}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
