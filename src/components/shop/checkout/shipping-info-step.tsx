"use client"

import { useState, memo } from "react"
import type { UseFormRegister, FieldErrors } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, Mail, Phone, MapPin, Building2, Globe } from "lucide-react"
import { cn } from "@/lib/utils"

interface ShippingInfoStepProps {
  register: UseFormRegister<any>
  errors: FieldErrors<any>
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

export function ShippingInfoStep({ register, errors }: ShippingInfoStepProps) {
  const [selectedCountry, setSelectedCountry] = useState(PHONE_COUNTRIES[0])

  return (
    <div className="flex flex-col gap-5">
      {/* Customer Information */}
      <div className="flex flex-col gap-4 bg-background border border-border/50 rounded-2xl p-5 shadow-sm">
        {/* Header */}
        <div className="flex flex-col gap-3 pb-4 border-b border-border/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div className="flex flex-col gap-0.5">
              <h3 className="text-sm font-semibold text-foreground">Informations personnelles</h3>
              <p className="text-xs text-muted-foreground">Veuillez renseigner vos coordonnées</p>
            </div>
          </div>
        </div>

        {/* Name fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="firstName" className="text-sm font-medium text-foreground">
              Prénom <span className="text-destructive">*</span>
            </Label>
            <Input
              id="firstName"
              {...register("shippingAddress.firstName")}
              placeholder="Jean"
              Icon={User}
              error={(errors.shippingAddress as any)?.firstName?.message as string}
              className="h-11"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="lastName" className="text-sm font-medium text-foreground">
              Nom <span className="text-destructive">*</span>
            </Label>
            <Input
              id="lastName"
              {...register("shippingAddress.lastName")}
              placeholder="Dupont"
              Icon={User}
              error={(errors.shippingAddress as any)?.lastName?.message as string}
              className="h-11"
            />
          </div>
        </div>

        {/* Email */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="email" className="text-sm font-medium text-foreground">
            Adresse e-mail <span className="text-destructive">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            {...register("email")}
            placeholder="vous@exemple.com"
            Icon={Mail}
            error={errors.email?.message as string}
            className="h-11"
          />
        </div>

        {/* Phone */}
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-medium text-foreground">
            Téléphone <span className="text-destructive">*</span>
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-2">
            <Select 
              value={selectedCountry.code}
              onValueChange={(code) => {
                const found = PHONE_COUNTRIES.find((c) => c.code === code)
                if (found) setSelectedCountry(found)
              }}
            >
              <SelectTrigger className="!h-[41px] bg-background border-input w-full">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <span className="text-base">{selectedCountry.flag}</span>
                    <span className="text-sm font-medium">{selectedCountry.dialCode}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-background">
                {PHONE_COUNTRIES.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    <div className="flex items-center gap-3">
                      <span className="text-base">{country.flag}</span>
                      <span className="text-sm">{country.name}</span>
                      <span className="text-xs text-muted-foreground">{country.dialCode}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              {...register("shippingAddress.phone")}
              placeholder="612345678"
              maxLength={15}
              Icon={Phone}
              error={(errors.shippingAddress as any)?.phone?.message as string}
              className="h-11"
            />
          </div>
        </div>
      </div>

      {/* Shipping Address */}
      <div className="flex flex-col gap-4 bg-background border border-border/50 rounded-2xl p-5 shadow-sm">
        {/* Header */}
        <div className="flex flex-col gap-3 pb-4 border-b border-border/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
              <MapPin className="w-4 h-4 text-primary" />
            </div>
            <div className="flex flex-col gap-0.5">
              <h3 className="text-sm font-semibold text-foreground">Adresse de livraison</h3>
              <p className="text-xs text-muted-foreground">Où souhaitez-vous recevoir votre commande</p>
            </div>
          </div>
        </div>

        {/* Street Address */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="address" className="text-sm font-medium text-foreground">
            Adresse complète <span className="text-destructive">*</span>
          </Label>
          <Input
            id="address"
            {...register("shippingAddress.address")}
            placeholder="Numéro, rue, bâtiment, étage..."
            Icon={MapPin}
            error={(errors.shippingAddress as any)?.address?.message as string}
            className="h-11"
          />
        </div>

        {/* City and Postal Code */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="city" className="text-sm font-medium text-foreground">
              Ville <span className="text-destructive">*</span>
            </Label>
            <Input
              id="city"
              {...register("shippingAddress.city")}
              placeholder="Casablanca, Rabat..."
              Icon={Building2}
              error={(errors.shippingAddress as any)?.city?.message as string}
              className="h-11"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="postalCode" className="text-sm font-medium text-foreground">
              Code postal <span className="text-muted-foreground text-xs font-normal">(optionnel)</span>
            </Label>
            <Input
              id="postalCode"
              {...register("shippingAddress.postalCode")}
              placeholder="20000"
              Icon={Globe}
              className="h-11"
            />
          </div>
        </div>
      </div>
    </div>
  )
}

export default memo(ShippingInfoStep)
