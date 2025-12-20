"use client"

import { ShopPageLayout } from "@/components/layout/shop-page-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Package, Trash2, Plus, Minus } from "lucide-react"
import { useLocale } from "next-intl"

export default function CartPage() {
  const locale = useLocale()
  
  // TODO: Replace with actual cart data from API
  const cartItems: any[] = []
  const isEmpty = cartItems.length === 0

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
        {/* Cart Items */}
        <div className="space-y-4">
          {/* TODO: Map through cart items */}
          <div className="text-center py-8 text-muted-foreground">
            Intégration du panier à venir...
          </div>
        </div>

        {/* Cart Summary */}
        {!isEmpty && (
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Résumé de la commande</h3>
            
            <div className="space-y-3 mb-6">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Sous-total</span>
                <span className="font-medium">0.00 MAD</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Livraison</span>
                <span className="font-medium">À calculer</span>
              </div>
              <div className="border-t pt-3 flex justify-between">
                <span className="font-semibold">Total</span>
                <span className="text-xl font-bold text-primary">0.00 MAD</span>
              </div>
            </div>

            <Button className="w-full" size="lg">
              Passer la commande
            </Button>
          </div>
        )}
      </div>
    </ShopPageLayout>
  )
}
