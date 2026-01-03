"use client"

import { useState, useTransition, useMemo, useCallback } from "react"
import { useRouter } from "next/navigation"
import { useLocale } from "next-intl"
import { z } from "zod"
import { useForm, type SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import CheckoutWizard from "@/components/shop/checkout/checkout-wizard"
import ShippingInfoStep from "@/components/shop/checkout/shipping-info-step"
import PaymentStep from "@/components/shop/checkout/payment-step"
import OrderSummaryStep from "@/components/shop/checkout/order-summary-step"
import OrderCartSummary from "@/components/shop/checkout/order-cart-summary"
import { ShoppingCart, ChevronLeft, ChevronRight, Check, Package } from "lucide-react"
import Image from "next/image"
import { useGetCartQuery } from "@/state/api/cart-api-slice"
import type { CartItem as APICartItem } from "@/state/api/cart-api-slice"
import { useCreateOrderMutation } from "@/state/api/orders-api-slice"
import { useAppSelector, useAppDispatch } from "@/state/hooks"
import { clearCart } from "@/state/slices/cart-slice"
import { cartStorage } from "@/lib/cart-storage"

// Validation schema
const checkoutSchema = z.object({
  shippingAddress: z.object({
    firstName: z.string().min(2, { message: "Le prénom doit contenir au moins 2 caractères" }),
    lastName: z.string().min(2, { message: "Le nom doit contenir au moins 2 caractères" }),
    phone: z
      .string()
      .min(6, { message: "Numéro de téléphone invalide" })
      .max(15, { message: "Numéro de téléphone trop long" }),
    address: z.string().min(5, { message: "L'adresse doit contenir au moins 5 caractères" }),
    city: z.string().min(2, { message: "La ville doit contenir au moins 2 caractères" }),
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
  paymentMethod: z.enum(["cash_on_delivery", "card", "bank_transfer", "mobile_payment"], {
    message: "Veuillez sélectionner une méthode de paiement",
  }),
  // Card payment fields
  cardholderName: z.string().min(3, { message: "Le nom du titulaire est requis" }).optional().or(z.literal("")),
  cardNumber: z.string().min(13, { message: "Numéro de carte invalide" }).optional().or(z.literal("")),
  cardExpiry: z.string().min(5, { message: "Date d'expiration requise" }).optional().or(z.literal("")),
  cardCVV: z.string().min(3, { message: "CVV invalide" }).max(4).optional().or(z.literal("")),
  notes: z.string().optional(),
  email: z.string().email({ message: "Email invalide" }),
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
      paymentMethod: "cash_on_delivery",
      cardholderName: "",
      cardNumber: "",
      cardExpiry: "",
      cardCVV: "",
      notes: "",
      email: "",
    },
  })

  // Watch form values for summary step
  const formValues = watch()

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
        // Prepare order data
        const orderData: any = {
          customerName: `${values.shippingAddress.firstName} ${values.shippingAddress.lastName}`,
          customerEmail: values.email,
          customerPhone: values.shippingAddress.phone,
          shippingAddressLine1: values.shippingAddress.address,
          shippingAddressLine2: undefined,
          shippingCity: values.shippingAddress.city,
          shippingState: undefined,
          shippingPostalCode: values.shippingAddress.postalCode || undefined,
          shippingCountry: "Morocco",
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
            quantity: item.quantity,
          })) : undefined,
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
          status: order.status,
        })

        // Clear cart for guest users (authenticated users' cart is cleared by backend)
        if (!isAuthenticated) {
          console.log("🧹 Clearing guest cart from localStorage")
          dispatch(clearCart())
        }

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
  }, [items, router, locale, promoCodeValue, createOrder, isAuthenticated, dispatch])

  // Navigate between steps with validation
  const goToNextStep = useCallback(async () => {
    let isValid = false

    if (currentStep === 1) {
      isValid = await trigger(["shippingAddress", "email"])
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
                {currentStep === 1 && <ShippingInfoStep register={register} errors={errors} />}

                {currentStep === 2 && (
                  <PaymentStep
                    register={register}
                    errors={errors}
                    watch={watch}
                    setValue={setValue}
                    paymentMethod={formValues.paymentMethod}
                  />
                )}

                {currentStep === 3 && (
                  <OrderSummaryStep
                    formValues={{
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
                      className="flex-1 h-11 bg-gradient-to-r from-primary via-primary/95 to-primary/90 hover:from-primary/95 hover:via-primary hover:to-primary shadow-md hover:shadow-lg transition-all"
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
