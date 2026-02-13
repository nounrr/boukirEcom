"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useLocale, useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react"
import { useForm, type SubmitHandler } from "react-hook-form"
import { z } from "zod"

import CheckoutWizard from "@/components/shop/checkout/checkout-wizard"
import OrderCartSummary from "@/components/shop/checkout/order-cart-summary"
import OrderConfirmationAnimation from "@/components/shop/checkout/order-confirmation-animation"
import OrderSummaryStep from "@/components/shop/checkout/order-summary-step"
import PaymentStep from "@/components/shop/checkout/payment-step"
import ShippingInfoStep from "@/components/shop/checkout/shipping-info-step"
import { Button } from "@/components/ui/button"
import { cartStorage } from "@/lib/cart-storage"
import type { CartItem as APICartItem } from "@/state/api/cart-api-slice"
import { useClearCartMutation, useGetCartQuery } from "@/state/api/cart-api-slice"
import { useCreateOrderMutation, useQuoteOrderMutation } from "@/state/api/orders-api-slice"
import { useGetCurrentUserQuery } from "@/state/api/auth-api-slice"
import { useAppDispatch, useAppSelector } from "@/state/hooks"
import { clearCart } from "@/state/slices/cart-slice"
import { ChevronLeft, ChevronRight, ShoppingCart } from "lucide-react"
import { setUser } from "@/state/slices/user-slice"
import { toast } from "@/hooks/use-toast"

type Translator = (key: string, values?: Record<string, any>) => string

const buildCheckoutSchema = (t: Translator) =>
  z
    .object({
      // Delivery method - delivery or pickup
      deliveryMethod: z.enum(["delivery", "pickup"], {
        message: t("validation.deliveryMethodRequired"),
      }),
      pickupLocationId: z.number().optional(),
      shippingAddress: z.object({
        firstName: z.string().min(2, { message: t("validation.firstNameMin") }),
        lastName: z.string().min(2, { message: t("validation.lastNameMin") }),
        phone: z
          .string()
          .min(10, { message: t("validation.phoneInvalid") })
          .max(20, { message: t("validation.phoneTooLong") }),
        address: z.string().optional(),
        city: z.string().optional(),
        postalCode: z.string().optional(),
        latitude: z.number().nullable().optional(),
        longitude: z.number().nullable().optional(),
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
        message: t("validation.paymentMethodRequired"),
      }),
      // Card payment fields
      cardholderName: z
        .string()
        .min(3, { message: t("validation.cardholderNameRequired") })
        .optional()
        .or(z.literal("")),
      cardNumber: z
        .string()
        .min(13, { message: t("validation.cardNumberInvalid") })
        .optional()
        .or(z.literal("")),
      cardExpiry: z
        .string()
        .min(5, { message: t("validation.cardExpiryRequired") })
        .optional()
        .or(z.literal("")),
      cardCVV: z
        .string()
        .min(3, { message: t("validation.cardCvvInvalid") })
        .max(4)
        .optional()
        .or(z.literal("")),
      notes: z.string().optional(),
      email: z.string().email({ message: t("validation.emailInvalid") }),
      useRemiseBalance: z.coerce.boolean().optional().default(false),
      remiseToUse: z
        .union([z.coerce.number(), z.literal(""), z.undefined(), z.null()])
        .optional()
        .transform((v) => (typeof v === "number" && Number.isFinite(v) ? v : undefined))
        .refine((v) => v === undefined || v >= 0, { message: t("validation.invalidAmount") }),
    })
    .superRefine((data, ctx) => {
      // Require address fields for delivery method
      if (data.deliveryMethod === "delivery") {
        if (!data.shippingAddress.address || data.shippingAddress.address.length < 5) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t("validation.addressMin"),
            path: ["shippingAddress", "address"],
          })
        }
        if (!data.shippingAddress.city || data.shippingAddress.city.length < 2) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: t("validation.cityMin"),
            path: ["shippingAddress", "city"],
          })
        }
      }
      // Require pickup location for pickup method
      if (data.deliveryMethod === "pickup" && !data.pickupLocationId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t("validation.pickupLocationRequired"),
          path: ["pickupLocationId"],
        })
      }
      // Disallow cash_on_delivery for pickup
      if (data.deliveryMethod === "pickup" && data.paymentMethod === "cash_on_delivery") {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: t("validation.codNotAvailablePickup"),
          path: ["paymentMethod"],
        })
      }
    })

type CheckoutFormValues = z.infer<ReturnType<typeof buildCheckoutSchema>>

export default function CheckoutPage() {
  const locale = useLocale()
  const t = useTranslations("checkout")
  const tCommon = useTranslations("common")
  const router = useRouter()
  const dispatch = useAppDispatch()

  const currency = tCommon("currency")

  const checkoutSchema = useMemo(() => buildCheckoutSchema(t), [t])

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
  const [quoteOrder, { isLoading: isQuoting }] = useQuoteOrderMutation()
  const [clearCartApi] = useClearCartMutation()

  // Wizard step state
  const [currentStep, setCurrentStep] = useState(1)

  // Promo code state
  const [promoDiscount, setPromoDiscount] = useState(0)
  const [promoCodeValue, setPromoCodeValue] = useState("")

  const wizardSteps = useMemo(
    () => [
      { id: 1, title: t("wizard.steps.shipping.title"), description: t("wizard.steps.shipping.description") },
      { id: 2, title: t("wizard.steps.payment.title"), description: t("wizard.steps.payment.description") },
      { id: 3, title: t("wizard.steps.confirmation.title"), description: t("wizard.steps.confirmation.description") },
    ],
    [t]
  )

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

  const [shippingCost, setShippingCost] = useState<number>(0)
  const total = useMemo(() => subtotal - promoDiscount + shippingCost, [subtotal, promoDiscount, shippingCost])

  const remiseBalance = useMemo(() => {
    const raw = (user as any)?.remise_balance ?? (user as any)?.remiseBalance
    const parsed = typeof raw === 'number' ? raw : Number(raw)
    return Number.isFinite(parsed) ? parsed : 0
  }, [user])

  const plafond = useMemo(() => {
    const raw = (user as any)?.plafond ?? (user as any)?.plafondAmount
    if (raw === undefined || raw === null || raw === "") return null
    const parsed = typeof raw === "number" ? raw : Number(raw)
    return Number.isFinite(parsed) ? parsed : null
  }, [user])

  const soldeCumule = useMemo(() => {
    const raw = (user as any)?.solde_cumule ?? (user as any)?.soldeCumule
    if (raw === undefined || raw === null || raw === "") return 0
    const parsed = typeof raw === "number" ? raw : Number(raw)
    return Number.isFinite(parsed) ? parsed : 0
  }, [user])

  const soldeAvailable = useMemo(() => {
    const raw = (user as any)?.solde_available ?? (user as any)?.soldeAvailable
    if (raw === undefined || raw === null || raw === "") return null
    const parsed = typeof raw === "number" ? raw : Number(raw)
    return Number.isFinite(parsed) ? parsed : null
  }, [user])

  // Check if user is eligible for Solde (Buy Now, Pay Later)
  const isSoldeEligible = useMemo(() => {
    if (!isAuthenticated || !user) return false
    const soldeFlag = (user as any)?.is_solde ?? (user as any)?.isSolde
    return soldeFlag === true || soldeFlag === 1 || soldeFlag === '1'
  }, [isAuthenticated, user])

  const [isPending, startTransition] = useTransition()
  const isProcessing = isPending || isCreatingOrder

  const [confirmAnimationOpen, setConfirmAnimationOpen] = useState(false)
  const [confirmAnimationStatus, setConfirmAnimationStatus] = useState<"processing" | "success">("processing")
  const pendingRedirectRef = useRef<string | null>(null)

  const handleConfirmAnimationComplete = useCallback(() => {
    const nextUrl = pendingRedirectRef.current
    if (!nextUrl) return

    pendingRedirectRef.current = null
    setConfirmAnimationOpen(false)
    router.push(nextUrl)
  }, [router])

  const isBlockingUi = confirmAnimationOpen || isProcessing || isQuoting
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
        latitude: null,
        longitude: null,
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

  // Automatic quote effect removed as per requirements.
  // Quote is now triggered manually when moving to next step.

  const didPrefillFromReduxRef = useRef(false)
  const didFetchMeRef = useRef(false)

  const { data: meUser, refetch: refetchMe } = useGetCurrentUserQuery(undefined, {
    skip: !isAuthenticated,
  })

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

  // 2) Fetch /me (GET via RTK Query) to load latest user details and prefill any missing fields
  useEffect(() => {
    if (!isAuthenticated || !meUser || didFetchMeRef.current) return
    didFetchMeRef.current = true

    // Keep Redux user in sync (optional but helps other screens)
    dispatch(setUser(meUser as any))

    const me: any = meUser

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
  }, [applyIfEmpty, dispatch, extractString, isAuthenticated, meUser])

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

    // Compute remaining-to-pay (after optional remise)
    const maxRemiseToUse = Math.max(0, Math.min(Number(remiseBalance || 0), Number(total || 0)))
    const parsedRequested = typeof values.remiseToUse === "number" ? values.remiseToUse : Number(values.remiseToUse)
    const requestedRemise = Number.isFinite(parsedRequested) ? parsedRequested : undefined
    const effectiveRemise = isAuthenticated && values.useRemiseBalance
      ? Math.max(0, Math.min(requestedRemise ?? maxRemiseToUse, maxRemiseToUse))
      : 0
    const remainingToPay = Math.max(0, Number(total || 0) - effectiveRemise)

    // Prevent invalid Solde requests (backend still enforces, but we avoid unnecessary calls)
    if (values.paymentMethod === "solde") {
      if (!isAuthenticated) {
        toast.error(t("errors.authRequiredForSolde"))
        const next = encodeURIComponent(`/${locale}/checkout`)
        router.push(`/${locale}/login?next=${next}`)
        return
      }

      if (remainingToPay > 0 && soldeAvailable !== null && remainingToPay > soldeAvailable) {
        toast.error(t("errors.soldeLimitExceeded", {
          available: soldeAvailable.toFixed(2),
          requested: remainingToPay.toFixed(2),
          currency,
        }))
        return
      }
    }

    setConfirmAnimationOpen(true)
    setConfirmAnimationStatus("processing")
    pendingRedirectRef.current = null

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
            shippingLatitude: values.shippingAddress.latitude || undefined,
            shippingLongitude: values.shippingAddress.longitude || undefined,
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

        // Wait for confirmation animation to finish, then redirect.
        pendingRedirectRef.current = `/${locale}/orders`
        setConfirmAnimationStatus("success")
      } catch (error: any) {
        console.error("❌ Failed to create order:", error)
        console.error("Error details:", {
          message: error?.data?.message || error?.message,
          status: error?.status,
          data: error?.data,
        })

        const errorType = error?.data?.error_type
        if (errorType === "SOLDE_AUTH_REQUIRED") {
          setConfirmAnimationOpen(false)
          pendingRedirectRef.current = null
          toast.error(error?.data?.message || t("errors.authRequiredForSolde"))
          const next = encodeURIComponent(`/${locale}/checkout`)
          router.push(`/${locale}/login?next=${next}`)
          return
        }

        if (errorType === "SOLDE_NOT_ALLOWED") {
          setConfirmAnimationOpen(false)
          pendingRedirectRef.current = null
          toast.error(error?.data?.message || t("errors.soldeNotAllowed"))
          return
        }

        if (errorType === "SOLDE_PLAFOND_EXCEEDED") {
          setConfirmAnimationOpen(false)
          pendingRedirectRef.current = null
          const plafondValue = typeof error?.data?.plafond === "number" ? error.data.plafond : undefined
          const cumuleValue = typeof error?.data?.solde_cumule === "number" ? error.data.solde_cumule : undefined
          const amountValue = typeof error?.data?.solde_amount === "number" ? error.data.solde_amount : undefined
          const projectedValue = typeof error?.data?.solde_projected === "number" ? error.data.solde_projected : undefined

          toast.error(
            error?.data?.message ||
            t("errors.soldePlafondExceeded", {
              plafond: plafondValue ? plafondValue.toString() : "none",
              currency,
            })
          )

          if (
            plafondValue !== undefined &&
            cumuleValue !== undefined &&
            amountValue !== undefined &&
            projectedValue !== undefined
          ) {
            toast.info(
              t("info.soldePlafondDetails", {
                plafond: plafondValue.toFixed(2),
                current: cumuleValue.toFixed(2),
                amount: amountValue.toFixed(2),
                projected: projectedValue.toFixed(2),
                currency,
              })
            )
          }

          // Refresh /me so UI shows updated solde_available
          try {
            await refetchMe()
          } catch {
            // ignore
          }
          return
        }

        setConfirmAnimationOpen(false)
        pendingRedirectRef.current = null
        toast.error(error?.data?.message || t("errors.orderCreateFailed"))
      }
    })
  }, [items, remiseBalance, total, soldeAvailable, router, locale, promoCodeValue, createOrder, isAuthenticated, dispatch, clearCartApi, refetchMe, t, currency])

  // Navigate between steps with validation
  const goToNextStep = useCallback(async () => {
    let isValid = false
    const deliveryMethod = watch("deliveryMethod")
    const formValues = getValues()

    if (currentStep === 1) {
      if (deliveryMethod === "pickup") {
        isValid = await trigger(["deliveryMethod", "pickupLocationId", "shippingAddress.firstName", "shippingAddress.lastName", "shippingAddress.phone", "email"])
        setShippingCost(0)
      } else {
        isValid = await trigger(["deliveryMethod", "shippingAddress", "email"])

        if (isValid) {
          const lat = formValues.shippingAddress.latitude
          const lng = formValues.shippingAddress.longitude

          try {
            const quote = await quoteOrder({
              useCart: isAuthenticated,
              deliveryMethod: "delivery",
              shippingLocation: (lat && lng) ? { lat, lng } : undefined,
              promoCode: promoCodeValue || undefined,
              items: !isAuthenticated
                ? items.map((item) => ({
                  productId: item.productId,
                  variantId: item.variantId ?? null,
                  unitId: item.unitId ?? null,
                  quantity: item.quantity,
                }))
                : undefined,
            }).unwrap()

            const nextShipping = Number(quote?.totals?.shippingCost ?? 0)
            setShippingCost(Number.isFinite(nextShipping) ? nextShipping : 0)

            if (quote?.summary?.distance_km && typeof quote.summary.distance_km === 'number') {
              toast.success(`Distance du magasin: ${quote.summary.distance_km.toFixed(2)} km`)
            }
          } catch (error) {
            console.error("Quote error:", error)
            setShippingCost(0)
          }
        }
      }
    } else if (currentStep === 2) {
      // Check if card payment is selected and validate card fields
      const paymentMethod = watch("paymentMethod")
      if (paymentMethod === "card") {
        isValid = await trigger(["paymentMethod", "cardholderName", "cardNumber", "cardExpiry", "cardCVV"])
      } else {
        isValid = await trigger("paymentMethod")
      }

      // Early Solde plafond check
      if (isValid && paymentMethod === "solde" && isAuthenticated) {
        const useRemiseBalance = !!watch("useRemiseBalance")
        const remiseToUseRaw = watch("remiseToUse")
        const maxRemiseToUse = Math.max(0, Math.min(Number(remiseBalance || 0), Number(total || 0)))
        const parsedRequested = typeof remiseToUseRaw === "number" ? remiseToUseRaw : Number(remiseToUseRaw)
        const requestedRemise = Number.isFinite(parsedRequested) ? parsedRequested : undefined
        const effectiveRemise = useRemiseBalance
          ? Math.max(0, Math.min(requestedRemise ?? maxRemiseToUse, maxRemiseToUse))
          : 0
        const remainingToPay = Math.max(0, Number(total || 0) - effectiveRemise)

        if (remainingToPay > 0 && soldeAvailable !== null && remainingToPay > soldeAvailable) {
          toast.error(t("errors.soldeLimitExceeded", {
            available: soldeAvailable.toFixed(2),
            requested: remainingToPay.toFixed(2),
            currency,
          }))
          return
        }
      }
    } else {
      isValid = true
    }

    if (isValid) {
      setCurrentStep((prev) => Math.min(prev + 1, wizardSteps.length))
    }
  }, [currentStep, trigger, watch, wizardSteps.length, quoteOrder, isAuthenticated, items, promoCodeValue, getValues, t, currency, soldeAvailable, remiseBalance, total])

  const goToPreviousStep = useCallback(() => {
    setCurrentStep((prev) => Math.max(prev - 1, 1))
  }, [])

  return (
    <div className="min-h-screen bg-background py-6">
      <OrderConfirmationAnimation
        open={confirmAnimationOpen}
        status={confirmAnimationStatus}
        onComplete={handleConfirmAnimationComplete}
      />

      {/* Loading State */}
      {isCartLoading && (
        <div className="max-w-md mx-auto text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center animate-pulse">
            <ShoppingCart className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold mb-2">{t("loading.title")}</h2>
          <p className="text-sm text-muted-foreground">{t("loading.subtitle")}</p>
        </div>
      )}

      {/* Empty Cart */}
      {!isCartLoading && isCartEmpty && (
        <div className="max-w-md mx-auto text-center py-12">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
            <ShoppingCart className="w-8 h-8 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-bold mb-2">{t("emptyCart.title")}</h2>
          <p className="text-sm text-muted-foreground mb-6">{t("emptyCart.subtitle")}</p>
          <Button onClick={() => router.push(`/${locale}/shop`)}>{t("emptyCart.backToShop")}</Button>
        </div>
      )}

      {/* Cart Loaded */}
      {!isCartLoading && !isCartEmpty && (
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          {/* Page Title - Compact */}
          <div className="text-center mb-5">
            <h1 className="text-2xl font-bold text-foreground mb-1">{t("title")}</h1>
            <p className="text-sm text-muted-foreground">{t("page.subtitle")}</p>
            <p className="text-xs text-muted-foreground mt-1">{t("page.taxIncludedNote")}</p>
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
                    soldeAvailable={soldeAvailable}
                    soldeCumule={soldeCumule}
                    plafond={plafond}
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
                      disabled={currentStep === 1 || isBlockingUi}
                      className="flex-1 h-11 border-border/60 hover:bg-muted/50 disabled:opacity-50"
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      {t("navigation.previous")}
                    </Button>

                    <Button
                      type="button"
                      onClick={goToNextStep}
                      disabled={isBlockingUi}
                      className="text-white flex-1 h-11 bg-linear-to-r from-primary via-primary/95 to-primary/90 hover:from-primary/95 hover:via-primary hover:to-primary shadow-md hover:shadow-lg transition-all"
                    >
                      {t("navigation.next")}
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
                      disabled={isBlockingUi}
                      className="flex-1 h-11 border-border/60 hover:bg-muted/50"
                    >
                      <ChevronLeft className="w-4 h-4 mr-2" />
                      {t("navigation.back")}
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
                isPending={isBlockingUi}
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
