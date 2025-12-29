"use client"

import { useEffect, useMemo, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { useLocale } from "next-intl"
import { z } from "zod"
import { useForm, type SubmitHandler } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"

import { ShopPageLayout } from "@/components/layout/shop-page-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useAppSelector } from "@/state/hooks"
import { useGetCartQuery, useUpdateCartItemMutation } from "@/state/api/cart-api-slice"
import type { CartItem } from "@/state/api/cart-api-slice"
import { useCreateOrderMutation } from "@/state/api/orders-api-slice"
import { checkoutSchema } from "@/lib/validations"
import { useToast } from "@/hooks/use-toast"
import { CheckoutFormSection } from "@/components/shop/checkout-form"
import Image from "next/image"
import Link from "next/link"
import { ShoppingCart, Plus, Minus } from "lucide-react"

// Keep this key in sync with CART_STORAGE_KEY used in cart-popover and cart page
const CART_STORAGE_KEY = "boukir_guest_cart"

// Extend existing checkout schema to add customer email (required for guests)
// and relax phone validation to support international formats while keeping a
// reasonable max length for international numbers
const extendedCheckoutSchema = checkoutSchema.extend({
  shippingAddress: checkoutSchema.shape.shippingAddress.extend({
    phone: z
      .string()
      .min(6, { message: "Numéro de téléphone invalide" })
      .max(15, { message: "Numéro de téléphone trop long" }),
  }),
  email: z.string().email({ message: "Email invalide" }),
})

type CheckoutFormValues = z.infer<typeof extendedCheckoutSchema>

export default function CheckoutPage() {
  const locale = useLocale()
  const router = useRouter()
  const { isAuthenticated, user } = useAppSelector((state) => state.user)
  const toast = useToast()

  // Load cart items: backend cart for authenticated users, localStorage for guests
  const { data: backendCart } = useGetCartQuery(undefined, {
    skip: !isAuthenticated,
  })

  const [guestItems, setGuestItems] = useState<CartItem[]>([])
  const [guestCartLoading, setGuestCartLoading] = useState(true)

  useEffect(() => {
    if (!isAuthenticated && typeof window !== "undefined") {
      try {
        const stored = localStorage.getItem(CART_STORAGE_KEY)
        if (stored) {
          const parsed: CartItem[] = JSON.parse(stored)
          setGuestItems(parsed)
        }
      } catch (error) {
        console.error("Failed to load guest cart from localStorage:", error)
      }
    }
    setGuestCartLoading(false)
  }, [isAuthenticated])

  const items: CartItem[] = useMemo(
    () => (isAuthenticated ? backendCart?.items || [] : guestItems || []),
    [isAuthenticated, backendCart?.items, guestItems]
  )

  const itemsCount = items.reduce((sum, item) => sum + item.quantity, 0)
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const shippingCost: number = 0
  const total = subtotal + shippingCost

  const [createOrder, { isLoading: isCreating }] = useCreateOrderMutation()
  const [isPending, startTransition] = useTransition()
  const [updateCartItem, { isLoading: isUpdating }] = useUpdateCartItemMutation()

  const isCartEmpty = !items.length && !guestCartLoading

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CheckoutFormValues>({
    resolver: zodResolver(extendedCheckoutSchema) as any,
    mode: "onBlur",
    defaultValues: {
      shippingAddress: {
        firstName: user?.prenom || "",
        lastName: user?.nom || "",
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
      notes: "",
      email: user?.email || "",
    },
  })

  const onSubmit: SubmitHandler<CheckoutFormValues> = (values) => {
    if (!items.length) {
      toast.error("Votre panier est vide")
      return
    }

    const shipping = values.shippingAddress

    startTransition(async () => {
      try {
        const order = await createOrder({
          customerName: `${shipping.firstName} ${shipping.lastName}`.trim(),
          customerEmail: values.email,
          customerPhone: shipping.phone,
          shippingAddressLine1: shipping.address,
          shippingCity: shipping.city,
          shippingAddressLine2: undefined,
          shippingState: undefined,
          shippingPostalCode: shipping.postalCode,
          shippingCountry: "Morocco",
          paymentMethod: values.paymentMethod,
          customerNotes: values.notes,
          // Authenticated users checkout from backend cart, guests send explicit items
          useCart: isAuthenticated,
          items: !isAuthenticated
            ? items.map((item) => ({
                productId: item.productId,
                variantId: item.variantId,
                quantity: item.quantity,
              }))
            : undefined,
        }).unwrap()

        toast.success("Commande créée avec succès", {
          description: `Numéro de commande ${order.orderNumber}`,
        })

        // Clear guest cart after successful order
        if (!isAuthenticated && typeof window !== "undefined") {
          localStorage.removeItem(CART_STORAGE_KEY)
        }

        // Redirect to orders page (we'll show order history there)
        router.push(`/${locale}/orders`)
      } catch (error: any) {
        console.error("Failed to create order", error)
        toast.error("Impossible de créer la commande", {
          description: error?.data?.message || "Veuillez vérifier vos informations et réessayer.",
        })
      }
    })
  }

  const handleQuantityChange = (item: CartItem, newQuantity: number) => {
    if (newQuantity < 1) return

    if (isAuthenticated) {
      if (!item.id) return

      updateCartItem({ id: item.id, quantity: newQuantity })
        .unwrap()
        .catch((error: any) => {
          console.error("Failed to update cart item quantity", error)
          toast.error("Impossible de mettre à jour la quantité")
        })
    } else {
      setGuestItems((prev) => {
        const updated = prev.map((i) => {
          const key = i.variantId ? `${i.productId}-${i.variantId}` : `${i.productId}`
          const itemKey = item.variantId ? `${item.productId}-${item.variantId}` : `${item.productId}`
          if (key === itemKey) {
            return { ...i, quantity: newQuantity }
          }
          return i
        })

        try {
          if (typeof window !== "undefined") {
            localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(updated))
          }
        } catch (error) {
          console.error("Failed to persist guest cart quantity change", error)
        }

        return updated
      })
    }
  }

  return (
    <ShopPageLayout
      title="Finaliser la commande"
      subtitle="Renseignez vos informations pour valider votre achat"
      icon="cart"
      itemCount={itemsCount}
      isEmpty={isCartEmpty}
      emptyState={{
        icon: <ShoppingCart className="w-10 h-10 text-muted-foreground" />,
        title: "Votre panier est vide",
        description:
          "Ajoutez des produits à votre panier avant de passer à la commande.",
        actionLabel: "Revenir à la boutique",
        actionHref: `/${locale}/shop`,
      }}
    >
      {!isCartEmpty && (
        <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          {/* Checkout form */}
          <div className="lg:col-span-3">
            <CheckoutFormSection register={register} errors={errors} />
          </div>

          {/* Order summary */}
          <div className="lg:col-span-2">
            <div className="bg-gradient-to-br from-card via-card to-card/95 border border-border/60 rounded-xl p-5 space-y-3.5 shadow-sm sticky top-24">
              <h2 className="text-base font-semibold pb-2 border-b border-border/40">Récapitulatif</h2>

              <div className="space-y-2 max-h-[240px] overflow-y-auto pr-1">
                {items.map((item) => (
                  <div key={`${item.productId}-${item.variantId || ""}`} className="flex gap-2.5 pb-2 border-b border-border/30 last:border-0">
                    <div className="relative w-14 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[10px] text-muted-foreground">
                          Produit
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <h3 className="text-xs font-medium leading-tight line-clamp-1">{item.name}</h3>
                      <p className="text-[10px] text-muted-foreground">
                        {item.quantity} × {item.price.toFixed(2)} MAD
                      </p>
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-muted/50 rounded-md">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleQuantityChange(item, item.quantity - 1)}
                            disabled={isUpdating || item.quantity <= 1}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="text-[11px] font-medium w-5 text-center">
                            {item.quantity}
                          </span>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-6 w-6"
                            onClick={() => handleQuantityChange(item, item.quantity + 1)}
                            disabled={isUpdating}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        <p className="text-xs font-semibold text-primary ml-auto">
                          {(item.price * item.quantity).toFixed(2)} MAD
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-1.5 pt-2 border-t border-border/40">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Sous-total</span>
                  <span className="font-medium">{subtotal.toFixed(2)} MAD</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Livraison</span>
                  <span className="font-medium">{shippingCost === 0 ? "Gratuite" : `${shippingCost.toFixed(2)} MAD`}</span>
                </div>
                <div className="flex justify-between items-center pt-1.5 border-t border-border/40">
                  <span className="font-semibold text-sm">Total</span>
                  <span className="text-lg font-bold text-primary">{total.toFixed(2)} MAD</span>
                </div>
              </div>

              <div className="text-[10px] text-muted-foreground leading-relaxed">
                En cliquant sur "Confirmer la commande", vous acceptez nos conditions
                générales de vente.
              </div>

              <div className="flex flex-wrap gap-1.5 items-center">
                <Badge variant="outline" className="text-[10px] px-2 py-0.5">🔒 Paiement sécurisé</Badge>
                <Badge variant="outline" className="text-[10px] px-2 py-0.5">↩️ Retour 14 jours</Badge>
                <Badge variant="outline" className="text-[10px] px-2 py-0.5">💬 Support dédié</Badge>
              </div>

              <div className="text-center">
                <Link href={`/${locale}/cart`} className="text-[11px] text-muted-foreground underline hover:text-primary transition-colors">
                  Modifier le panier
                </Link>
              </div>

              <Button
                type="submit"
                size="lg"
                disabled={isCreating || isPending || isCartEmpty}
                className="w-full h-10 text-sm font-semibold"
              >
                {isCreating || isPending ? "Validation en cours..." : "Confirmer la commande"}
              </Button>
            </div>
          </div>
        </form>
      )}
    </ShopPageLayout>
  )
}
