"use client"

import { ShopPageLayout } from "@/components/layout/shop-page-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Package, Trash2, Plus, Minus } from "lucide-react"
import { useLocale } from "next-intl"
import { useRouter } from "next/navigation"
import { useGetCartQuery, useUpdateCartItemMutation, useRemoveFromCartMutation, useGetCartSuggestionsQuery } from "@/state/api/cart-api-slice"
import { useAppSelector } from "@/state/hooks"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import Link from "next/link"
import { ProductSuggestions } from "@/components/shop/product-suggestions"
import { useState, useEffect } from "react"

// Keep this key in sync with CART_STORAGE_KEY used in cart-popover
const CART_STORAGE_KEY = 'boukir_guest_cart'

interface LocalCartItem {
  id?: number
  productId: number
  variantId?: number
  unitId?: number
  unitName?: string
  name: string
  price: number
  quantity: number
  image: string
  category?: string
  stock?: number
}

export default function CartPage() {
  const locale = useLocale()
  const router = useRouter()
  const { isAuthenticated } = useAppSelector((state) => state.user)
  const toast = useToast()
  
  // State for localStorage cart (guest users)
  const [localCart, setLocalCart] = useState<LocalCartItem[]>([])
  const [localCartLoading, setLocalCartLoading] = useState(true)

  // Load localStorage cart on mount
  useEffect(() => {
    console.log('[CartPage] mount/useEffect, isAuthenticated =', isAuthenticated)
    if (!isAuthenticated) {
      try {
        const stored = localStorage.getItem(CART_STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored)
          console.log('[CartPage] loaded from localStorage:', parsed)
          setLocalCart(parsed)
        }
      } catch (error) {
        console.error('Failed to load cart from localStorage:', error)
      }
    }
    setLocalCartLoading(false)
  }, [isAuthenticated])

  // Save to localStorage when localCart changes
  useEffect(() => {
    if (!isAuthenticated && !localCartLoading) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(localCart))
      } catch (error) {
        console.error('Failed to save cart to localStorage:', error)
      }
    }
  }, [localCart, isAuthenticated, localCartLoading])

  const { data: cart, isLoading: apiLoading } = useGetCartQuery(undefined, {
    skip: !isAuthenticated,
  })

  // Use API cart for authenticated users, localStorage for guests
  const cartItems = isAuthenticated ? (cart?.items || []) : localCart
  const isLoading = isAuthenticated ? apiLoading : localCartLoading
  const isEmpty = !isLoading && cartItems.length === 0
  const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  console.log('[CartPage] state snapshot', {
    isAuthenticated,
    apiLoading,
    localCartLoading,
    cartItemsLength: cartItems.length,
    isEmpty,
    cartItems,
  })

  // Fetch cart suggestions
  const { data: suggestedProducts, isLoading: isSuggestionsLoading } = useGetCartSuggestionsQuery(
    { limit: 4 },
    { skip: !isAuthenticated || isEmpty }
  )

  console.log('Cart suggestions:', { suggestedProducts, isSuggestionsLoading, isAuthenticated, isEmpty })

  const [updateCartItem, { isLoading: isUpdating }] = useUpdateCartItemMutation()
  const [removeFromCart, { isLoading: isRemoving }] = useRemoveFromCartMutation()

  const handleQuantityChange = async (itemId: number, newQuantity: number, productName: string) => {
    if (newQuantity < 1) return

    if (isAuthenticated) {
    // API update for authenticated users
      try {
        await updateCartItem({ id: itemId, quantity: newQuantity }).unwrap()
        toast.success("Quantité mise à jour", { description: productName })
      } catch (error) {
        toast.error("Erreur", { description: "Impossible de mettre à jour la quantité" })
      }
    } else {
      // localStorage update for guests
      setLocalCart(prev => prev.map(item =>
        item.productId === itemId ? { ...item, quantity: newQuantity } : item
      ))
      toast.success("Quantité mise à jour", { description: productName })
    }
  }

  const handleRemove = async (itemId: number, productName: string) => {
    if (isAuthenticated) {
    // API remove for authenticated users
      try {
        await removeFromCart({ id: itemId }).unwrap()
        toast.success("Retiré du panier", { description: productName })
      } catch (error) {
        toast.error("Erreur", { description: "Impossible de retirer le produit" })
      }
    } else {
      // localStorage remove for guests
      setLocalCart(prev => prev.filter(item => item.productId !== itemId))
      toast.success("Retiré du panier", { description: productName })
    }
  }

  if (isLoading) {
    return (
      <ShopPageLayout
        title="Mon Panier"
        subtitle="Chargement..."
        icon="cart"
      >
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-card border border-border rounded-xl p-4 animate-pulse">
              <div className="flex gap-4">
                <div className="w-24 h-24 bg-muted rounded-lg" />
                <div className="flex-1 space-y-3">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                  <div className="h-8 bg-muted rounded w-24" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </ShopPageLayout>
    )
  }

  return (
    <ShopPageLayout
      title="Mon Panier"
      subtitle="Vérifiez vos articles avant de passer commande"
      icon="cart"
      itemCount={cartItems.length}
      isEmpty={isEmpty}
      emptyState={{
        icon: <ShoppingCart className="w-10 h-10 text-muted-foreground" />,
        title: "Votre panier est vide",
        description: "Parcourez nos produits et ajoutez-les à votre panier pour commencer vos achats.",
        actionLabel: "Découvrir les produits",
        actionHref: `/${locale}/shop`,
      }}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => (
              <div
                key={item.id || item.productId}
                className="bg-card border border-border rounded-xl p-4 hover:shadow-md transition-shadow duration-200"
              >
                <div className="flex gap-4">
                  {/* Product Image */}
                  <Link
                    href={`/${locale}/product/${item.productId}`}
                    className="shrink-0"
                  >
                    <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-muted">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-8 h-8 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>
                  </Link>

                  {/* Product Info */}
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/${locale}/product/${item.productId}`}
                      className="hover:text-primary transition-colors"
                    >
                      <h3 className="font-semibold text-foreground line-clamp-2 mb-1">
                        {item.name}
                      </h3>
                    </Link>

                    {item.category && (
                      <p className="text-xs text-muted-foreground mb-3">
                        {item.category}
                      </p>
                    )}

                    {/* Price & Quantity Controls */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* Quantity Controls */}
                        <div className="flex items-center border border-border rounded-lg">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-r-none"
                            onClick={() => handleQuantityChange(isAuthenticated ? item.id! : item.productId, item.quantity - 1, item.name)}
                            disabled={isUpdating || item.quantity <= 1}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="px-3 text-sm font-medium min-w-[2rem] text-center">
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-l-none"
                            onClick={() => handleQuantityChange(isAuthenticated ? item.id! : item.productId, item.quantity + 1, item.name)}
                            disabled={isUpdating || item.quantity >= (item.stock || 999)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>

                        {/* Stock Warning */}
                        {item.stock && item.stock <= 5 && (
                          <Badge variant="outline" className="border-orange-500/50 text-orange-600 text-xs">
                            Plus que {item.stock} en stock
                          </Badge>
                        )}
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <div className="text-lg font-bold text-foreground">
                          {(item.price * item.quantity).toFixed(2)} MAD
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {item.price.toFixed(2)} MAD / unité
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemove(isAuthenticated ? item.id! : item.productId, item.name)}
                      disabled={isRemoving}
                      className="hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Cart Summary - Sticky Sidebar */}
          {!isEmpty && (
            <div className="lg:col-span-1">
              <div className="bg-card border border-border rounded-xl p-6 sticky top-24">
                <h3 className="text-lg font-semibold mb-4">Résumé de la commande</h3>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Sous-total</span>
                    <span className="font-medium">{cartTotal.toFixed(2)} MAD</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Livraison</span>
                    <span className="font-medium">À calculer</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between">
                    <span className="font-semibold">Total</span>
                    <span className="text-xl font-bold text-primary">{cartTotal.toFixed(2)} MAD</span>
                  </div>
                </div>

                <Button
                  className="w-full text-white"
                  size="lg"
                  onClick={() => router.push(`/${locale}/checkout`)}
                >
                  Passer la commande
                </Button>

                {/* Items Count */}
                <div className="mt-4 text-center text-sm text-muted-foreground">
                  {cartItems.length} article{cartItems.length > 1 ? 's' : ''} dans votre panier
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Suggestions Section - Full Width */}
        {!isEmpty && (
          <ProductSuggestions products={suggestedProducts || []} />
        )}
      </div>
    </ShopPageLayout>
  )
}
