"use client"

import { useEffect, useMemo, useRef, useState, useCallback } from "react"
import type { UseFormRegister, FieldErrors, UseFormWatch, UseFormSetValue } from "react-hook-form"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Building2, Globe, Mail, MapPin, Phone, Store, Truck, User } from "lucide-react"
import { useGetPickupLocationsQuery } from "@/state/api/ecommerce-public-api-slice"
import { useTranslations } from "next-intl"
import dynamic from "next/dynamic"

const LocationPicker = dynamic(() => import("./location-picker"), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] w-full rounded-xl border border-border bg-muted/10 animate-pulse flex items-center justify-center">
      <div className="flex flex-col items-center gap-2">
        <Truck className="w-8 h-8 text-muted-foreground/20" />
        <span className="text-sm text-muted-foreground">Chargement de la carte...</span>
      </div>
    </div>
  ),
})

interface ShippingInfoStepProps {
  register: UseFormRegister<any>
  errors: FieldErrors<any>
  watch?: UseFormWatch<any>
  setValue?: UseFormSetValue<any>
}

const PHONE_COUNTRIES = [
  { code: "MA", name: "Maroc", dialCode: "+212" },
  { code: "FR", name: "France", dialCode: "+33" },
  { code: "ES", name: "Espagne", dialCode: "+34" },
  { code: "DE", name: "Allemagne", dialCode: "+49" },
  { code: "IT", name: "Italie", dialCode: "+39" },
  { code: "GB", name: "Royaume-Uni", dialCode: "+44" },
  { code: "BE", name: "Belgique", dialCode: "+32" },
  { code: "NL", name: "Pays-Bas", dialCode: "+31" },
  { code: "CH", name: "Suisse", dialCode: "+41" },
  { code: "PT", name: "Portugal", dialCode: "+351" },
  { code: "DZ", name: "Algérie", dialCode: "+213" },
  { code: "TN", name: "Tunisie", dialCode: "+216" },
  { code: "EG", name: "Égypte", dialCode: "+20" },
  { code: "SA", name: "Arabie Saoudite", dialCode: "+966" },
  { code: "AE", name: "Émirats arabes unis", dialCode: "+971" },
  { code: "US", name: "États-Unis", dialCode: "+1" },
  { code: "CA", name: "Canada", dialCode: "+1" },
  { code: "TR", name: "Turquie", dialCode: "+90" },
  { code: "SE", name: "Suède", dialCode: "+46" },
  { code: "NO", name: "Norvège", dialCode: "+47" },
]

export function ShippingInfoStep({ register, errors, watch, setValue }: ShippingInfoStepProps) {
  const tCheckout = useTranslations("checkout")
  const tAuth = useTranslations("auth")

  const [selectedCountry, setSelectedCountry] = useState(PHONE_COUNTRIES[0])
  const [localPhoneNumber, setLocalPhoneNumber] = useState("")
  const isSyncingFromFormRef = useRef(false)
  const hasUserEditedPhoneRef = useRef(false)

  // Ensure fields exist in react-hook-form even if no native input is rendered
  useEffect(() => {
    register("deliveryMethod")
    register("pickupLocationId")
    register("shippingAddress.phone")
  }, [register])

  // Parse existing phone number from form to extract country code and number
  // Phone format: country code + local number (e.g., "+212612345678")
  const fullPhoneNumber = watch?.("shippingAddress.phone") as string | undefined

  useEffect(() => {
    if (!fullPhoneNumber) return

    // Mark this update as coming from RHF (prefill / programmatic setValue)
    // so we don't immediately overwrite it with dialCode-only.
    isSyncingFromFormRef.current = true

    // Try to parse the full phone number to extract country code
    const matchedCountry = PHONE_COUNTRIES.find(country =>
      fullPhoneNumber.startsWith(country.dialCode)
    )

    if (matchedCountry) {
      setSelectedCountry(matchedCountry)
      // Extract the local number (remove country code)
      const localNumber = fullPhoneNumber.slice(matchedCountry.dialCode.length)
      setLocalPhoneNumber(localNumber)
    } else {
      // If no country code found, assume it's just the local number
      setLocalPhoneNumber(fullPhoneNumber)
    }

    // Release the guard on the next tick (after state updates enqueue)
    setTimeout(() => {
      isSyncingFromFormRef.current = false
    }, 0)
  }, [fullPhoneNumber])

  // Update full phone number in form whenever country or local number changes
  // This ensures the backend receives the complete phone number with country code
  useEffect(() => {
    if (!setValue) return

    // Don't write back while we're hydrating local state from the form.
    if (isSyncingFromFormRef.current) return

    // IMPORTANT:
    // Don't write a value on mount (e.g. just "+212"). That blocks later
    // prefilling from `/me` because the form field becomes "non-empty".
    // Only sync back after the user edits the phone UI.
    if (!hasUserEditedPhoneRef.current) return

    const fullPhone = selectedCountry.dialCode + localPhoneNumber

    // If user cleared local input, clear the form field too.
    if (!localPhoneNumber) {
      if (fullPhoneNumber) {
        setValue("shippingAddress.phone", "", { shouldValidate: true })
      }
      return
    }

    // Avoid redundant setValue calls (prevents loops).
    if (fullPhoneNumber === fullPhone) return

    setValue("shippingAddress.phone", fullPhone, { shouldValidate: true })
  }, [selectedCountry, localPhoneNumber, setValue, fullPhoneNumber])

  // Watch delivery method
  const deliveryMethod = (watch?.("deliveryMethod") as "delivery" | "pickup" | undefined) ?? "delivery"
  const isPickup = deliveryMethod === "pickup"
  const pickupLocationId = watch?.("pickupLocationId")
  const pickupLocationIdString = typeof pickupLocationId === "number" ? String(pickupLocationId) : (pickupLocationId ?? "")

  const initialLat = watch?.("shippingAddress.latitude")
  const initialLng = watch?.("shippingAddress.longitude")

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

  const handleLocationSelect = useCallback((location: { lat: number, lng: number, address: string, city: string, postalCode: string }) => {
    if (!setValue) return

    setValue("shippingAddress.latitude", location.lat, { shouldValidate: true })
    setValue("shippingAddress.longitude", location.lng, { shouldValidate: true })

    if (location.address) setValue("shippingAddress.address", location.address, { shouldValidate: true, shouldDirty: true })
    if (location.city) setValue("shippingAddress.city", location.city, { shouldValidate: true, shouldDirty: true })
    if (location.postalCode) setValue("shippingAddress.postalCode", location.postalCode, { shouldValidate: true, shouldDirty: true })
  }, [setValue])

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
              <h3 className="text-sm font-semibold text-foreground">{tCheckout("deliveryMethodTitle")}</h3>
              <p className="text-xs text-muted-foreground">{tCheckout("deliveryMethodSubtitle")}</p>
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
            {tCheckout("homeDelivery")}
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
            {tCheckout("storePickup")}
          </Button>
        </div>

        {/* Pickup Location Selector */}
        {isPickup && (
          <div className="flex flex-col gap-3 pt-2">
            <div className="flex items-center gap-2">
              <Store className="w-4 h-4 text-violet-600" />
              <Label className="text-sm font-medium text-foreground">
                {tCheckout("pickupPointLabel")} <span className="text-destructive">*</span>
              </Label>
            </div>

            {pickupLocations.length > 0 ? (
              <>
                <Select
                  value={pickupLocationIdString}
                  onValueChange={(value) => setValue?.("pickupLocationId", Number(value), { shouldValidate: true })}
                >
                  <SelectTrigger className="h-11 bg-background border-input">
                    <SelectValue placeholder={tCheckout("pickupPointPlaceholder")} />
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
                  <p className="text-xs text-muted-foreground">{tCheckout("pickupLoading")}</p>
                )}
              </>
            ) : (
              <div className="flex items-center justify-center p-8 rounded-xl border border-dashed border-border/50">
                  <p className="text-sm text-muted-foreground">{tCheckout("pickupEmpty")}</p>
              </div>
            )}

            {pickupError && (
              <p className="text-xs text-destructive">
                {tCheckout("pickupLoadError")}
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
              <h3 className="text-sm font-semibold text-foreground">{tCheckout("personalInfoTitle")}</h3>
              <p className="text-xs text-muted-foreground">{tCheckout("personalInfoSubtitle")}</p>
            </div>
          </div>
        </div>

        {/* Name fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex flex-col gap-2">
            <Label htmlFor="firstName" className="text-sm font-medium text-foreground">
              {tAuth("firstName")} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="firstName"
              {...register("shippingAddress.firstName")}
              placeholder={tCheckout("firstNamePlaceholder")}
              Icon={User}
              error={(errors.shippingAddress as any)?.firstName?.message as string}
              className="h-11"
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="lastName" className="text-sm font-medium text-foreground">
              {tAuth("lastName")} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="lastName"
              {...register("shippingAddress.lastName")}
              placeholder={tCheckout("lastNamePlaceholder")}
              Icon={User}
              error={(errors.shippingAddress as any)?.lastName?.message as string}
              className="h-11"
            />
          </div>
        </div>

        {/* Email */}
        <div className="flex flex-col gap-2">
          <Label htmlFor="email" className="text-sm font-medium text-foreground">
            {tAuth("email")} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            {...register("email")}
            placeholder={tCheckout("emailPlaceholder")}
            Icon={Mail}
            error={errors.email?.message as string}
            className="h-11"
          />
        </div>

        {/* Phone */}
        <div className="flex flex-col gap-2">
          <Label className="text-sm font-medium text-foreground">
            {tAuth("phone")} <span className="text-destructive">*</span>
          </Label>
          <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-2">
            <Select 
              value={selectedCountry.code}
              onValueChange={(code) => {
                const found = PHONE_COUNTRIES.find((c) => c.code === code)
                if (found) {
                  setSelectedCountry(found)
                  // Only consider this an "edit" if the user is interacting
                  // with the phone UI (prevents mount-time writes).
                  hasUserEditedPhoneRef.current = true
                }
              }}
            >
              <SelectTrigger className="!h-[42px] bg-background border-input w-full">
                <SelectValue>
                  <div className="flex items-center gap-2">
                    <img
                      src={`https://flagcdn.com/w20/${selectedCountry.code.toLowerCase()}.png`}
                      srcSet={`https://flagcdn.com/w40/${selectedCountry.code.toLowerCase()}.png 2x`}
                      alt={selectedCountry.name}
                      className="w-5 h-auto shrink-0"
                    />
                    <span className="text-sm font-semibold text-primary">{selectedCountry.dialCode}</span>
                  </div>
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="bg-background/98 backdrop-blur-2xl border-border/40 shadow-xl shadow-black/10">
                {PHONE_COUNTRIES.map((country) => (
                  <SelectItem key={country.code} value={country.code}>
                    <div className="flex items-center gap-3">
                      <img
                        src={`https://flagcdn.com/w20/${country.code.toLowerCase()}.png`}
                        srcSet={`https://flagcdn.com/w40/${country.code.toLowerCase()}.png 2x`}
                        alt={country.name}
                        className="w-5 h-auto shrink-0"
                      />
                      <span className="text-sm font-medium">{country.name}</span>
                      <span className="text-xs text-muted-foreground">{country.dialCode}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input
              value={localPhoneNumber}
              onChange={(e) => {
                hasUserEditedPhoneRef.current = true
                const digitsOnly = e.target.value.replace(/\D/g, "").slice(0, 9)
                setLocalPhoneNumber(digitsOnly)
              }}
              placeholder={tCheckout("phonePlaceholder")}
              type="tel"
              inputMode="numeric"
              pattern="[0-9]*"
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
                <h3 className="text-sm font-semibold text-foreground">{tCheckout("shippingAddressTitle")}</h3>
                <p className="text-xs text-muted-foreground">{tCheckout("shippingAddressSubtitle")}</p>
              </div>
            </div>
          </div>

          <div className="overflow-hidden z-0 relative">
            <LocationPicker
              onLocationSelect={handleLocationSelect}
              initialLat={typeof initialLat === 'number' ? initialLat : undefined}
              initialLng={typeof initialLng === 'number' ? initialLng : undefined}
            />
          </div>

          {/* Street Address */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="address" className="text-sm font-medium text-foreground">
              {tCheckout("fullAddressLabel")} <span className="text-destructive">*</span>
            </Label>
            <Input
              id="address"
              {...register("shippingAddress.address")}
              placeholder={tCheckout("fullAddressPlaceholder")}
              Icon={MapPin}
              error={(errors.shippingAddress as any)?.address?.message as string}
              className="h-11"
            />
          </div>

          {/* City and Postal Code */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <Label htmlFor="city" className="text-sm font-medium text-foreground">
                {tCheckout("city")} <span className="text-destructive">*</span>
              </Label>
              <Input
                id="city"
                {...register("shippingAddress.city")}
                placeholder={tCheckout("cityPlaceholder")}
                Icon={Building2}
                error={(errors.shippingAddress as any)?.city?.message as string}
                className="h-11"
              />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="postalCode" className="text-sm font-medium text-foreground">
                {tCheckout("postalCode")} <span className="text-muted-foreground text-xs font-normal">({tCheckout("optional")})</span>
              </Label>
              <Input
                id="postalCode"
                {...register("shippingAddress.postalCode")}
                placeholder={tCheckout("postalCodePlaceholder")}
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
