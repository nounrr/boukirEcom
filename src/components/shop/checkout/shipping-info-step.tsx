"use client"

import { useState, memo, useEffect, useMemo } from "react"
import type { UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { User, Mail, Phone, MapPin, Building2, Globe, Truck, Store, Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { useGetPickupLocationsQuery } from "@/state/api/ecommerce-public-api-slice"

interface ShippingInfoStepProps {
  register: UseFormRegister<any>
  errors: FieldErrors<any>
  watch?: UseFormWatch<any>
  setValue?: UseFormSetValue<any>
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

export function ShippingInfoStep({ register, errors, watch, setValue }: ShippingInfoStepProps) {
  const [selectedCountry, setSelectedCountry] = useState(PHONE_COUNTRIES[0])

  // Watch delivery method
  const deliveryMethod = watch?.("deliveryMethod") || "delivery"
  const isPickup = deliveryMethod === "pickup"
  const pickupLocationId = watch?.("pickupLocationId")

  // Fetch pickup locations (always fetched, not conditional)
  const { data: pickupLocations = [], isLoading: isLoadingLocations, error: pickupError } = useGetPickupLocationsQuery()

  // Memoize selected location for performance
  const selectedPickupLocation = useMemo(
    () => pickupLocations.find((loc) => loc.id === pickupLocationId),
    [pickupLocations, pickupLocationId]
  )

  // Auto-select first pickup location when switching to pickup
  useEffect(() => {
    if (isPickup && pickupLocations.length > 0 && setValue && !pickupLocationId) {
      setValue("pickupLocationId", pickupLocations[0].id, { shouldValidate: true })
    }
  }, [isPickup, pickupLocations, setValue, pickupLocationId])

  return (
    <div className="flex flex-col gap-5">
      {/* Delivery Method Selection */}
      <div className="flex flex-col gap-4 bg-background border border-border/50 rounded-2xl p-5 shadow-sm">
        <div className="flex flex-col gap-3 pb-4 border-b border-border/50">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
              <Truck className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex flex-col gap-0.5">
              <h3 className="text-sm font-semibold text-foreground">Mode de livraison</h3>
              <p className="text-xs text-muted-foreground">Choisissez comment recevoir votre commande</p>
            </div>
          </div>
        </div>

        {/* Hidden radio inputs for form registration */}
        <input type="hidden" {...register("deliveryMethod")} />

        <RadioGroup
          value={deliveryMethod}
          onValueChange={(value) => setValue?.("deliveryMethod", value as "delivery" | "pickup", { shouldValidate: true })}
          className="grid grid-cols-1 md:grid-cols-2 gap-3"
        >
          {/* Delivery Option */}
          <Label
            htmlFor="delivery-option"
            className={cn(
              "relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer",
              "bg-background hover:bg-accent/30",
              deliveryMethod === "delivery"
                ? "border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-sm shadow-emerald-500/10"
                : "border-border/50 hover:border-emerald-300/50"
            )}
          >
            <RadioGroupItem value="delivery" id="delivery-option" className="sr-only" />
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors",
              deliveryMethod === "delivery"
                ? "bg-emerald-500 dark:bg-emerald-600"
                : "bg-emerald-100 dark:bg-emerald-900/40"
            )}>
              <Truck className={cn(
                "w-5 h-5 transition-colors",
                deliveryMethod === "delivery" ? "text-white" : "text-emerald-600 dark:text-emerald-400"
              )} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Livraison à domicile</p>
              <p className="text-xs text-muted-foreground">Recevez votre commande chez vous</p>
            </div>
            <div className={cn(
              "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
              deliveryMethod === "delivery"
                ? "border-emerald-500 bg-emerald-500"
                : "border-border/60 bg-background"
            )}>
              {deliveryMethod === "delivery" && (
                <div className="w-2.5 h-2.5 rounded-full bg-white" />
              )}
            </div>
          </Label>

          {/* Pickup Option */}
          <Label
            htmlFor="pickup-option"
            className={cn(
              "relative flex items-center gap-3 p-4 rounded-xl border-2 transition-all duration-200 cursor-pointer",
              "bg-background hover:bg-accent/30",
              deliveryMethod === "pickup"
                ? "border-violet-500 bg-violet-50/50 dark:bg-violet-950/20 shadow-sm shadow-violet-500/10"
                : "border-border/50 hover:border-violet-300/50"
            )}
          >
            <RadioGroupItem value="pickup" id="pickup-option" className="sr-only" />
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors",
              deliveryMethod === "pickup"
                ? "bg-violet-500 dark:bg-violet-600"
                : "bg-violet-100 dark:bg-violet-900/40"
            )}>
              <Store className={cn(
                "w-5 h-5 transition-colors",
                deliveryMethod === "pickup" ? "text-white" : "text-violet-600 dark:text-violet-400"
              )} />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">Retrait en boutique</p>
              <p className="text-xs text-muted-foreground">Récupérez votre commande en magasin</p>
            </div>
            <div className={cn(
              "w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all",
              deliveryMethod === "pickup"
                ? "border-violet-500 bg-violet-500"
                : "border-border/60 bg-background"
            )}>
              {deliveryMethod === "pickup" && (
                <div className="w-2.5 h-2.5 rounded-full bg-white" />
              )}
            </div>
          </Label>
        </RadioGroup>

        {/* Pickup Location Selector */}
        {isPickup && (
          <div className="flex flex-col gap-3 pt-2 animate-in fade-in-0 slide-in-from-top-2 duration-200">
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-violet-600" />
              <Label className="text-sm font-medium text-foreground">
                Point de retrait <span className="text-destructive">*</span>
              </Label>
            </div>

            {isLoadingLocations ? (
              <div className="flex items-center justify-center p-8 rounded-xl border border-dashed border-border/50">
                <div className="flex flex-col items-center gap-2">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-500"></div>
                  <p className="text-xs text-muted-foreground">Chargement des points de retrait...</p>
                </div>
              </div>
            ) : pickupLocations.length > 0 ? (
              <>
                <Select
                  value={pickupLocationId}
                  onValueChange={(value) => setValue?.("pickupLocationId", value, { shouldValidate: true })}
                >
                  <SelectTrigger className="h-auto min-h-[44px] bg-background border-input">
                    <SelectValue placeholder="Sélectionnez un point de retrait">
                      {selectedPickupLocation ? (
                        <div className="flex items-center gap-3 py-1">
                          <div className="w-8 h-8 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center shrink-0">
                            <Store className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                          </div>
                          <div className="flex flex-col items-start gap-0.5 text-left">
                            <span className="text-sm font-medium text-foreground">{selectedPickupLocation.name}</span>
                            <span className="text-xs text-muted-foreground">
                              {selectedPickupLocation.city}
                              {selectedPickupLocation.address && ` • ${selectedPickupLocation.address}`}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-sm text-muted-foreground">Sélectionnez un point de retrait</span>
                      )}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className="bg-background">
                    {pickupLocations.map((location) => (
                      <SelectItem key={location.id} value={location.id} className="cursor-pointer">
                        <div className="flex items-start gap-3 py-2">
                          <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center shrink-0">
                            <Store className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-sm font-semibold text-foreground">{location.name}</p>
                              {location.isActive && (
                                <span className="px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400">
                                  Disponible
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground mb-1">
                              {location.address}, {location.city}
                              {location.postalCode && `, ${location.postalCode}`}
                            </p>
                            {location.phone && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <Phone className="w-3 h-3" />
                                {location.phone}
                              </p>
                            )}
                            {location.openingHours && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                                <Clock className="w-3 h-3" />
                                {location.openingHours}
                              </p>
                            )}
                          </div>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {/* Selected Location Details Card */}
                {selectedPickupLocation && (
                  <div className="rounded-xl border border-violet-200 dark:border-violet-800 bg-violet-50/50 dark:bg-violet-950/20 p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 rounded-lg bg-violet-100 dark:bg-violet-900/40 flex items-center justify-center shrink-0">
                        <MapPin className="w-5 h-5 text-violet-600 dark:text-violet-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground mb-1">{selectedPickupLocation.name}</p>
                        <p className="text-xs text-muted-foreground mb-2">
                          {selectedPickupLocation.address}
                          <br />
                          {selectedPickupLocation.city}
                          {selectedPickupLocation.postalCode && `, ${selectedPickupLocation.postalCode}`}
                        </p>
                        <div className="flex flex-col gap-1">
                          {selectedPickupLocation.phone && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Phone className="w-3 h-3" />
                              <span>{selectedPickupLocation.phone}</span>
                            </div>
                          )}
                          {selectedPickupLocation.openingHours && (
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              <span>{selectedPickupLocation.openingHours}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center p-8 rounded-xl border border-dashed border-border/50">
                <p className="text-sm text-muted-foreground">Aucun point de retrait disponible pour le moment</p>
              </div>
            )}
          </div>
        )}

        {/* Error messages */}
        {errors.deliveryMethod && (
          <p className="text-xs text-destructive">{errors.deliveryMethod.message as string}</p>
        )}
        {errors.pickupLocationId && (
          <p className="text-xs text-destructive">{errors.pickupLocationId.message as string}</p>
        )}
      </div>

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
              maxLength={9}
              Icon={Phone}
              error={(errors.shippingAddress as any)?.phone?.message as string}
              className="h-11"
            />
          </div>
        </div>
      </div>

      {/* Shipping Address - Only show for delivery */}
      {!isPickup && (
        <div className="flex flex-col gap-4 bg-background border border-border/50 rounded-2xl p-5 shadow-sm animate-in fade-in-0 slide-in-from-top-2 duration-200">
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
      )}
    </div>
  )
}

export default memo(ShippingInfoStep)
