"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useLocale } from "next-intl"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react"
import { useForm, type SubmitHandler } from "react-hook-form"
import { z } from "zod"

import CheckoutWizard from "@/components/shop/checkout/checkout-wizard"
import OrderCartSummary from "@/components/shop/checkout/order-cart-summary"
import OrderSummaryStep from "@/components/shop/checkout/order-summary-step"
import PaymentStep from "@/components/shop/checkout/payment-step"
import ShippingInfoStep from "@/components/shop/checkout/shipping-info-step"
import { Button } from "@/components/ui/button"
import { cartStorage } from "@/lib/cart-storage"
import type { CartItem as APICartItem } from "@/state/api/cart-api-slice"
import { useClearCartMutation, useGetCartQuery } from "@/state/api/cart-api-slice"
import { useCreateOrderMutation } from "@/state/api/orders-api-slice"
import { useAppDispatch, useAppSelector } from "@/state/hooks"
import { clearCart } from "@/state/slices/cart-slice"
import { ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react"
import { getCurrentUser } from "@/actions/auth/get-current-user"
import { setUser } from "@/state/slices/user-slice"

// Validation schema
const checkoutSchema = z.object({
  // Delivery method - delivery or pickup
  deliveryMethod: z.enum(["delivery", "pickup"], {
    message: "Veuillez sélectionner un mode de livraison",
  }),
  pickupLocationId: z.number().optional(),
  shippingAddress: z.object({
    firstName: z.string().min(2, { message: "Le prénom doit contenir au moins 2 caractères" }),
    lastName: z.string().min(2, { message: "Le nom doit contenir au moins 2 caractères" }),
    phone: z
      .string()
      .min(10, { message: "Numéro de téléphone invalide" })
      .max(20, { message: "Numéro de téléphone trop long" }),
    address: z.string().optional(),
    city: z.string().optional(),
    postalCode: z.string().optional(),
  }),
  billingAddress: z
    .object({
      firstName: z.string().optional(),
      lastName: z.string().optional(),
      phone: z.string().optional(),
      address: z.string().optional(),
      city: z.string().optional(),
      postalCode: z.string().optional(),
    })
    .optional(),
  paymentMethod: z.enum(["cash_on_delivery", "card", "bank_transfer", "mobile_payment", "solde", "pay_in_store"], {
    message: "Veuillez sélectionner une méthode de paiement",
  }),
  // Card payment fields
  cardholderName: z.string().min(3, { message: "Le nom du titulaire est requis" }).optional().or(z.literal("")),
  cardNumber: z.string().min(13, { message: "Numéro de carte invalide" }).optional().or(z.literal("")),
  cardExpiry: z.string().min(5, { message: "Date d'expiration requise" }).optional().or(z.literal("")),
  cardCVV: z.string().min(3, { message: "CVV invalide" }).max(4).optional().or(z.literal("")),
  notes: z.string().optional(),
  email: z.string().email({ message: "Email invalide" }),
  useRemiseBalance: z.coerce.boolean().optional().default(false),
  remiseToUse: z
    .union([z.coerce.number(), z.literal(""), z.undefined(), z.null()])
    .optional()
    .transform((v) => (typeof v === 'number' && Number.isFinite(v) ? v : undefined))
    .refine((v) => v === undefined || v >= 0, { message: "Montant invalide" }),
}).superRefine((data, ctx) => {
  // Require address fields for delivery method
  if (data.deliveryMethod === "delivery") {
    if (!data.shippingAddress.address || data.shippingAddress.address.length < 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "L'adresse doit contenir au moins 5 caractères",
        path: ["shippingAddress", "address"],
      })
    }
    if (!data.shippingAddress.city || data.shippingAddress.city.length < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "La ville doit contenir au moins 2 caractères",
        path: ["shippingAddress", "city"],
      })
    }
  }
  // Require pickup location for pickup method
  if (data.deliveryMethod === "pickup" && !data.pickupLocationId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Veuillez sélectionner un point de retrait",
      path: ["pickupLocationId"],
    })
  }
  // Disallow cash_on_delivery for pickup
  if (data.deliveryMethod === "pickup" && data.paymentMethod === "cash_on_delivery") {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Le paiement à la livraison n'est pas disponible pour le retrait en boutique",
      path: ["paymentMethod"],
    })
  }
})

type CheckoutFormValues = z.infer<typeof checkoutSchema>

export default function CheckoutPage() {
  const locale = useLocale()
  const router = useRouter()
  const dispatch = useAppDispatch()

  // Get user state
  const user = useAppSelector((state) => state.user.user)
  const isAuthenticated = useAppSelector((state) => state.user.isAuthenticated)

  // Fetch cart data from API (only for authenticated users)
  const { data: cartData, isLoading: isCartLoading } = useGetCartQuery(undefined, {
    skip: !isAuthenticated, // Skip API call for guest users
    refetchOnMountOrArgChange: true,
  })

  // Create order mutation
  const [createOrder, { isLoading: isCreatingOrder }] = useCreateOrderMutation()
  const [clearCartApi] = useClearCartMutation()

  // Wizard step state
  const [currentStep, setCurrentStep] = useState(1)

  // Promo code state
  const [promoDiscount, setPromoDiscount] = useState(0)
  const [promoCodeValue, setPromoCodeValue] = useState("")

  const wizardSteps = useMemo(() => [
    { id: 1, title: "Livraison", description: "Informations" },
    { id: 2, title: "Paiement", description: "Méthode" },
    { id: 3, title: "Confirmation", description: "Vérification" },
  ], [])

  // Transform cart items - use API cart for authenticated users, localStorage for guests
  const items: APICartItem[] = useMemo(() => {
    if (isAuthenticated) {
      return cartData?.items || []
    }
    // For guest users, read directly from localStorage
    const localItems = cartStorage.getCart()
    return localItems as APICartItem[]
  }, [isAuthenticated, cartData])

  const { itemsCount, subtotal } = useMemo(() => ({
    itemsCount: items.reduce((sum, item) => sum + item.quantity, 0),
    subtotal: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
  }), [items])

  const shippingCost: number = 0
  const total = useMemo(() => subtotal - promoDiscount + shippingCost, [subtotal, promoDiscount, shippingCost])

  const remiseBalance = useMemo(() => {
    const raw = (user as any)?.remise_balance ?? (user as any)?.remiseBalance
    const parsed = typeof raw === 'number' ? raw : Number(raw)
    return Number.isFinite(parsed) ? parsed : 0
  }, [user])

  // Check if user is eligible for Solde (Buy Now, Pay Later)
  const isSoldeEligible = useMemo(() => {
    if (!isAuthenticated || !user) return false
    const soldeFlag = (user as any)?.is_solde ?? (user as any)?.isSolde
    return soldeFlag === true || soldeFlag === 1 || soldeFlag === '1'
  }, [isAuthenticated, user])

  const [isPending, startTransition] = useTransition()
  const isProcessing = isPending || isCreatingOrder
  const isCartEmpty = !items.length

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    trigger,
    watch,
    setValue,
    getValues,
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(checkoutSchema) as any,
    mode: "onChange",
    defaultValues: {
      shippingAddress: {
        firstName: "",
        lastName: "",
        phone: "",
        address: "",
        city: "",
        postalCode: "",
      },
      billingAddress: {
        firstName: "",
        lastName: "",
        phone: "",
        address: "",
        city: "",
        postalCode: "",
      },
      deliveryMethod: "delivery",
      pickupLocationId: undefined,
      paymentMethod: "cash_on_delivery",
      cardholderName: "",
      cardNumber: "",
      cardExpiry: "",
      cardCVV: "",
      notes: "",
      email: "",
      useRemiseBalance: false,
      remiseToUse: undefined,
    },
  })

  // Watch form values for summary step
  const formValues = watch()

  const didPrefillFromReduxRef = useRef(false)
  const didFetchMeRef = useRef(false)

  const applyIfEmpty = useCallback(
    (path: any, value?: string | null) => {
      if (!value) return
      const current = getValues(path)
      if (typeof current === "string" && current.trim().length > 0) return

      setValue(path, value, {
        shouldDirty: false,
        shouldTouch: false,
        shouldValidate: false,
      })
    },
    [getValues, setValue]
  )

  const extractString = useCallback((obj: any, keys: string[]) => {
    for (const key of keys) {
      const value = obj?.[key]
      if (typeof value === "string" && value.trim().length > 0) return value.trim()
    }
    return undefined
  }, [])

  // 1) Prefill from Redux user as soon as it exists (fast path)
  useEffect(() => {
    if (!isAuthenticated || !user || didPrefillFromReduxRef.current) return

    applyIfEmpty("shippingAddress.firstName", user.prenom)
    applyIfEmpty("shippingAddress.lastName", user.nom)
    applyIfEmpty("shippingAddress.phone", user.telephone)
    applyIfEmpty("email", user.email)

    didPrefillFromReduxRef.current = true
  }, [applyIfEmpty, isAuthenticated, user])

  // 2) Fetch /me (server action) to load latest user details from DB and prefill any missing fields
  useEffect(() => {
    if (!isAuthenticated || didFetchMeRef.current) return
    didFetchMeRef.current = true

    const run = async () => {
      const result = await getCurrentUser()
      if (!result.success) return

      // Keep Redux user in sync (optional but helps other screens)
      dispatch(setUser(result.user as any))

      const me: any = result.user

      applyIfEmpty("shippingAddress.firstName", extractString(me, ["prenom", "firstName", "first_name"]))
      applyIfEmpty("shippingAddress.lastName", extractString(me, ["nom", "lastName", "last_name"]))
      applyIfEmpty("shippingAddress.phone", extractString(me, ["telephone", "phone", "mobile", "tel"]))
      applyIfEmpty("email", extractString(me, ["email"]))

      // If backend returns saved shipping address fields, use them too (best-effort)
      applyIfEmpty(
        "shippingAddress.address",
        extractString(me, ["address", "adresse", "shippingAddressLine1", "shipping_address_line1", "adresse_livraison"])
      )
      applyIfEmpty(
        "shippingAddress.city",
        extractString(me, ["city", "ville", "shippingCity", "shipping_city", "shipping_ville"])
      )
      applyIfEmpty(
        "shippingAddress.postalCode",
        extractString(me, ["postalCode", "postal_code", "code_postal", "shippingPostalCode", "shipping_postal_code"])
      )
    }

    run()
  }, [applyIfEmpty, dispatch, extractString, isAuthenticated])

  // Handle promo code applied
  const handlePromoApplied = useCallback((discount: number, code: string) => {
    setPromoDiscount(discount)
    setPromoCodeValue(code)
  }, [])

  // Handle promo code removed
  const handlePromoRemoved = useCallback(() => {
    setPromoDiscount(0)
    setPromoCodeValue("")
  }, [])

  const onSubmit: SubmitHandler<CheckoutFormValues> = useCallback(async (values) => {
    if (!items.length) {
      return
    }

    startTransition(async () => {
      try {
        const isPickup = values.deliveryMethod === "pickup"

        // Prepare order data
        const orderData: any = {
          customerName: `${values.shippingAddress.firstName} ${values.shippingAddress.lastName}`,
          customerEmail: values.email,
          customerPhone: values.shippingAddress.phone,
          // Shipping address - only required for delivery
          ...(isPickup ? {} : {
            shippingAddressLine1: values.shippingAddress.address,
            shippingAddressLine2: undefined,
            shippingCity: values.shippingAddress.city,
            shippingState: undefined,
            shippingPostalCode: values.shippingAddress.postalCode || undefined,
            shippingCountry: "Morocco",
          }),
          // Delivery method and pickup location
          deliveryMethod: values.deliveryMethod,
          ...(isPickup && values.pickupLocationId ? { pickupLocationId: values.pickupLocationId } : {}),
          paymentMethod: values.paymentMethod,
          customerNotes: values.notes || undefined,
          promoCode: promoCodeValue || undefined,
          // For authenticated users: use cart from backend
          // For guest users: send items explicitly
          useCart: isAuthenticated,
          // Send items explicitly for guest users
          items: !isAuthenticated ? items.map(item => ({
            productId: item.productId,
            variantId: item.variantId || undefined,
            unitId: item.unitId || undefined,
            quantity: item.quantity,
          })) : undefined,
        }

        if (isAuthenticated && values.useRemiseBalance) {
          orderData.useRemiseBalance = true
          if (typeof values.remiseToUse === 'number' && Number.isFinite(values.remiseToUse) && values.remiseToUse > 0) {
            orderData.remiseToUse = values.remiseToUse
          }
        }

        console.log("🛒 Creating order with data:", {
          ...orderData,
          isAuthenticated,
          itemsCount: items.length,
          subtotal,
          total,
        })

        // Create order
        const order = await createOrder(orderData).unwrap()

        console.log("✅ Order created successfully:", {
          orderId: order.id,
          orderNumber: order.orderNumber,
          totalAmount: order.totalAmount,
          remiseUsedAmount: order.remiseUsedAmount,
          isSolde: order.isSolde,
          soldeAmount: order.soldeAmount,
          status: order.status,
          paymentStatus: order.paymentStatus,
          paymentMethod: order.paymentMethod,
        })

        // Clear cart on success (backend + local state)
        if (isAuthenticated) {
          try {
            await clearCartApi().unwrap()
          } catch (clearError) {
            console.warn("⚠️ Failed to clear backend cart after order:", clearError)
          }
        }

        console.log("🧹 Clearing local cart state")
        dispatch(clearCart())

        // Redirect to orders page
        console.log("➡️  Redirecting to orders page...")
        router.push(`/${locale}/orders`)
      } catch (error: any) {
        console.error("❌ Failed to create order:", error)
        console.error("Error details:", {
          message: error?.data?.message || error?.message,
          status: error?.status,
          data: error?.data,
        })
        // Show error to user
        alert(error?.data?.message || "Échec de la création de la commande. Veuillez réessayer.")
      }
    })
  }, [items, router, locale, promoCodeValue, createOrder, isAuthenticated, dispatch, clearCartApi])

  // Navigate between steps with validation
  const goToNextStep = useCallback(async () => {
    let isValid = false
    const deliveryMethod = watch("deliveryMethod")

    if (currentStep === 1) {
      // Validate delivery method, contact info, and address (for delivery)
      if (deliveryMethod === "pickup") {
        isValid = await trigger(["deliveryMethod", "pickupLocationId", "shippingAddress.firstName", "shippingAddress.lastName", "shippingAddress.phone", "email"])
      } else {
        isValid = await trigger(["deliveryMethod", "shippingAddress", "email"])
      }
    } else if (currentStep === 2) {
      // Check if card payment is selected and validate card fields
      const paymentMethod = watch("paymentMethod")
      if (paymentMethod === "card") {
        isValid = await trigger(["paymentMethod", "cardholderName", "cardNumber", "cardExpiry", "cardCVV"])
      } else {
        isValid = await trigger("paymentMethod")
      }
    } else {
      isValid = true
    }

    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, wizardSteps.length))
    }
  }, [currentStep, trigger, watch, wizardSteps.length])

  const goToPreviousStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }, [])

  return (
    <div className="min-h-screen bg-background py-6 px-4">
      {/* Loading State */}
      {isCartLoading && (
        <div className="max-w-md mx-auto text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center animate-pulse">
            <ShoppingCart className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold mb-2">Chargement...</h2>
          <p className="text-sm text-muted-foreground">Récupération de votre panier</p>
        </div>
      )}

      {/* Empty Cart */}
      {!isCartLoading && isCartEmpty && (
        <div className="max-w-md mx-auto text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <ShoppingCart className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold mb-2">Votre panier est vide</h2>
          <p className="text-sm text-muted-foreground mb-6">
            Ajoutez des produits à votre panier avant de passer à la commande.
          </p>
          <Button onClick={() => router.push(`/${locale}/shop`)}>Revenir à la boutique</Button>
        </div>
      )}

      {/* Cart Loaded */}
      {!isCartLoading && !isCartEmpty && (
        <div className="max-w-[1400px] mx-auto">
          {/* Page Title - Compact */}
          <div className="text-center mb-5">
            <h1 className="text-2xl font-bold text-foreground mb-1">Checkout</h1>
            <p className="text-sm text-muted-foreground">Finalisez votre commande en toute sécurité</p>
          </div>

          {/* Timeline */}
          <div className="mb-6">
            <CheckoutWizard currentStep={currentStep} steps={wizardSteps} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">
            {/* Left: Wizard Form */}
            <form onSubmit={handleSubmit(onSubmit)} className="lg:col-span-3 flex flex-col gap-6">
              {/* Step Content */}
              <div>
                {currentStep === 1 && (
                  <ShippingInfoStep
                    register={register}
                    errors={errors}
                    watch={watch}
                    setValue={setValue}
                  />
                )}

                {currentStep === 2 && (
                  <PaymentStep
                    register={register}
                    errors={errors}
                    watch={watch}
                    setValue={setValue}
                    paymentMethod={formValues.paymentMethod}
                    deliveryMethod={formValues.deliveryMethod}
                    orderTotal={total}
                    remiseBalance={remiseBalance}
                    isAuthenticated={isAuthenticated}
                    isSoldeEligible={isSoldeEligible}
                  />
                )}

                {currentStep === 3 && (
                  <OrderSummaryStep
                    formValues={{
                      deliveryMethod: formValues.deliveryMethod,
                      pickupLocationId: formValues.pickupLocationId,
                      shippingAddress: {
                        ...formValues.shippingAddress,
                        postalCode: formValues.shippingAddress.postalCode || "",
                      },
                      email: formValues.email,
                      paymentMethod: formValues.paymentMethod,
                      notes: formValues.notes || "",
                      cardholderName: formValues.cardholderName || "",
                      cardNumber: formValues.cardNumber || "",
                    }}
                  />
                )}
              </div>

              {/* Navigation Buttons - Only show for steps 1 and 2 */}
              {currentStep < 3 && (
                <div className="flex items-center justify-center pt-6 mt-4 border-t border-border/50">
                  <div className="flex items-center gap-4 w-full max-w-2xl mx-auto">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={goToPreviousStep}
                      disabled={currentStep === 1}
                      className="flex-1 h-11 border-border/60 hover:bg-muted/50 disabled:opacity-50"
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Précédent
                    </Button>

                    <Button
                      type="button"
                      onClick={goToNextStep}
                      className="text-white flex-1 h-11 bg-linear-to-r from-primary via-primary/95 to-primary/90 hover:from-primary/95 hover:via-primary hover:to-primary shadow-md hover:shadow-lg transition-all"
                    >
                      Suivant
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Back Button for Step 3 */}
              {currentStep === 3 && (
                <div className="flex items-center justify-center pt-6 mt-4 border-t border-border/50">
                  <div className="flex items-center gap-4 w-full max-w-2xl mx-auto">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={goToPreviousStep}
                      className="flex-1 h-11 border-border/60 hover:bg-muted/50"
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      Retour
                    </Button>
                  </div>
                </div>
              )}
            </form>

            {/* Right: Cart Summary */}
            <div className="lg:col-span-2">
              <OrderCartSummary
                items={items}
                subtotal={subtotal}
                shippingCost={shippingCost}
                discount={promoDiscount}
                total={total}
                showConfirmButton={currentStep === 3}
                onConfirmOrder={currentStep === 3 ? handleSubmit(onSubmit) : undefined}
                isPending={isProcessing}
                onPromoApplied={handlePromoApplied}
                onPromoRemoved={handlePromoRemoved}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
