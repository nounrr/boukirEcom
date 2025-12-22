"use client"

import { ShopPageLayout } from "@/components/layout/shop-page-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Package, Trash2, Plus, Minus } from "lucide-react"
import { useLocale } from "next-intl"
import { useGetCartQuery, useUpdateCartItemMutation, useRemoveFromCartMutation, useGetCartSuggestionsQuery } from "@/state/api/cart-api-slice"
import { useAppSelector } from "@/state/hooks"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import Link from "next/link"
import { ProductSuggestions } from "@/components/shop/product-suggestions"

export default function CartPage() {
  const locale = useLocale()
  const { isAuthenticated } = useAppSelector((state) => state.user)
  const toast = useToast()
  
  const { data: cart, isLoading } = useGetCartQuery(undefined, {
    skip: !isAuthenticated,
  })

  const cartItems = cart?.items || []
  const isEmpty = !isLoading && cartItems.length === 0

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

    try {
      await updateCartItem({ id: itemId, quantity: newQuantity }).unwrap()
      toast.success("Quantité mise à jour", { description: productName })
    } catch (error) {
      toast.error("Erreur", { description: "Impossible de mettre à jour la quantité" })
    }
  }

  const handleRemove = async (itemId: number, productName: string) => {
    try {
      await removeFromCart({ id: itemId }).unwrap()
      toast.success("Retiré du panier", { description: productName })
    } catch (error) {
      toast.error("Erreur", { description: "Impossible de retirer le produit" })
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
                key={item.id}
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
                            onClick={() => handleQuantityChange(item.id!, item.quantity - 1, item.name)}
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
                            onClick={() => handleQuantityChange(item.id!, item.quantity + 1, item.name)}
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
                      onClick={() => handleRemove(item.id!, item.name)}
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
                    <span className="font-medium">{cart?.total.toFixed(2)} MAD</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Livraison</span>
                    <span className="font-medium">À calculer</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between">
                    <span className="font-semibold">Total</span>
                    <span className="text-xl font-bold text-primary">{cart?.total.toFixed(2)} MAD</span>
                  </div>
                </div>

                <Button className="w-full" size="lg">
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
