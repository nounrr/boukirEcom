"use client"

import { useEffect, useMemo, useState } from "react"
import type { UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Building2, Globe, Mail, MapPin, Phone, Store, Truck, User } from "lucide-react"
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

  // Ensure fields exist in react-hook-form even if no native input is rendered
  useEffect(() => {
    register("deliveryMethod")
    register("pickupLocationId")
  }, [register])

  // Watch delivery method
  const deliveryMethod = (watch?.("deliveryMethod") as "delivery" | "pickup" | undefined) ?? "delivery"
  const isPickup = deliveryMethod === "pickup"
  const pickupLocationId = watch?.("pickupLocationId")
  const pickupLocationIdString = typeof pickupLocationId === "number" ? String(pickupLocationId) : (pickupLocationId ?? "")

  // Fetch pickup locations in the background to avoid delay when switching to pickup
  const {
    data: pickupLocations = [],
    isLoading: isLoadingLocations,
    error: pickupError,
  } = useGetPickupLocationsQuery(undefined)

  // Memoize selected location for performance
  const selectedPickupLocation = useMemo(
    () => {
      const id = typeof pickupLocationId === "number" ? pickupLocationId : Number(pickupLocationId)
      if (!Number.isFinite(id)) return undefined
      return pickupLocations.find((loc) => loc.id === id)
    },
    [pickupLocations, pickupLocationId]
  )

  const setDeliveryMethod = (method: "delivery" | "pickup") => {
    setValue?.("deliveryMethod", method, { shouldValidate: true, shouldDirty: true })
    if (method === "delivery") {
      // Clear pickup selection when switching back to delivery
      setValue?.("pickupLocationId", undefined as any, { shouldValidate: true, shouldDirty: true })
    }
  }

  // Auto-select first pickup location when switching to pickup
  useEffect(() => {
    if (!isPickup) return
    if (!setValue) return
    if (pickupLocationId) return
    if (pickupLocations.length === 0) return

    setValue("pickupLocationId", pickupLocations[0].id, { shouldValidate: true, shouldDirty: true })
  }, [isPickup, pickupLocations, pickupLocationId, setValue])

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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Button
            type="button"
            variant="outline"
            className={
              "h-11 justify-start gap-2 border " +
              (deliveryMethod === "delivery"
                ? "border-emerald-500/70 bg-emerald-50 text-emerald-800 hover:bg-emerald-50 dark:bg-emerald-950/25 dark:text-emerald-300 dark:border-emerald-700/60"
                : "border-border bg-background text-foreground")
            }
            onClick={() => setDeliveryMethod("delivery")}
          >
            <Truck className="w-4 h-4" />
            Livraison à domicile
          </Button>

          <Button
            type="button"
            variant="outline"
            className={
              "h-11 justify-start gap-2 border " +
              (deliveryMethod === "pickup"
                ? "border-violet-500/70 bg-violet-50 text-violet-800 hover:bg-violet-50 dark:bg-violet-950/25 dark:text-violet-300 dark:border-violet-700/60"
                : "border-border bg-background text-foreground")
            }
            onClick={() => setDeliveryMethod("pickup")}
          >
            <Store className="w-4 h-4" />
            Retrait en boutique
          </Button>
        </div>

        {/* Pickup Location Selector */}
        {isPickup && (
          <div className="flex flex-col gap-3 pt-2">
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-violet-600" />
              <Label className="text-sm font-medium text-foreground">
                Point de retrait <span className="text-destructive">*</span>
              </Label>
            </div>

            {pickupLocations.length > 0 ? (
              <>
                <Select
                  value={pickupLocationIdString}
                  onValueChange={(value) => setValue?.("pickupLocationId", Number(value), { shouldValidate: true })}
                >
                  <SelectTrigger className="h-11 bg-background border-input">
                    <SelectValue placeholder="Sélectionnez un point de retrait" />
                  </SelectTrigger>
                  <SelectContent className="bg-background/98 backdrop-blur-2xl border-border/40 shadow-xl shadow-black/10">
                    {pickupLocations.map((location) => (
                      <SelectItem key={location.id} value={String(location.id)}>
                        {location.name} - {location.city}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                {selectedPickupLocation && (
                  <div className="flex items-start gap-2 text-xs text-muted-foreground">
                    <MapPin className="w-3.5 h-3.5 text-violet-600 dark:text-violet-400 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-foreground/90">{selectedPickupLocation.name}</p>
                      <p>{selectedPickupLocation.address}, {selectedPickupLocation.city}</p>
                    </div>
                  </div>
                )}

                {isLoadingLocations && (
                  <p className="text-xs text-muted-foreground">Chargement des points de retrait...</p>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center p-8 rounded-xl border border-dashed border-border/50">
                <p className="text-sm text-muted-foreground">Aucun point de retrait disponible pour le moment</p>
              </div>
            )}

            {pickupError && (
              <p className="text-xs text-destructive">
                Impossible de charger les points de retrait.
              </p>
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
            <div className="w-8 h-8 rounded-lg bg-sky-500/10 flex items-center justify-center">
              <User className="w-4 h-4 text-sky-600" />
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
              <SelectTrigger className="h-[41px]! bg-background border-input w-full">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <span className="text-base">{selectedCountry.flag}</span>
                    <span className="text-sm font-medium">{selectedCountry.dialCode}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-background/98 backdrop-blur-2xl border-border/40 shadow-xl shadow-black/10">
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
        <div className="flex flex-col gap-4 bg-background border border-border/50 rounded-2xl p-5 shadow-sm">
          {/* Header */}
          <div className="flex flex-col gap-3 pb-4 border-b border-border/50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                <MapPin className="w-4 h-4 text-indigo-600" />
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

export default ShippingInfoStep
