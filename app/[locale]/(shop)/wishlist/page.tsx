"use client"

import { ShopPageLayout } from "@/components/layout/shop-page-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useGetWishlistQuery, useRemoveFromWishlistMutation, useMoveToCartMutation, useGetWishlistSuggestionsQuery } from "@/state/api/wishlist-api-slice"
import { useAppSelector } from "@/state/hooks"
import { Heart, ShoppingCart, Trash2, Package } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useLocale } from "next-intl"
import { useToast } from "@/hooks/use-toast"
import { useCart } from "@/components/layout/cart-context-provider"
import { ProductSuggestions } from "@/components/shop/product-suggestions"
import { useRouter } from "next/navigation"

export default function WishlistPage() {
  const locale = useLocale()
  const { isAuthenticated } = useAppSelector((state) => state.user)
  const { cartRef } = useCart()
  const toast = useToast()
  const router = useRouter()
  
  const { data: wishlist, isLoading } = useGetWishlistQuery(undefined, {
    skip: !isAuthenticated,
  })

  // Fetch wishlist suggestions
  const { data: suggestedProducts } = useGetWishlistSuggestionsQuery(
    { limit: 4 },
    { skip: !isAuthenticated }
  )

  const [removeFromWishlist, { isLoading: isRemoving }] = useRemoveFromWishlistMutation()
  const [moveToCart, { isLoading: isMoving }] = useMoveToCartMutation()

  const handleRemove = async (itemId: number, productName: string) => {
    try {
      await removeFromWishlist({ id: itemId }).unwrap()
      toast.success("Retiré de vos favoris", { description: productName })
    } catch (error) {
      toast.error("Erreur", { description: "Impossible de retirer le produit" })
    }
  }

  const handleMoveToCart = async (itemId: number, productName: string) => {
    try {
      await moveToCart({ id: itemId }).unwrap()
      toast.success("Ajouté au panier", { description: productName })
      
      // Open cart with animation
      setTimeout(() => {
        cartRef.current?.open()
      }, 300)
    } catch (error) {
      toast.error("Erreur", { description: "Impossible d'ajouter au panier" })
    }
  }

  const isEmpty = !isLoading && (!wishlist?.items || wishlist.items.length === 0)

  if (isLoading) {
    return (
      <ShopPageLayout
        title="Mes Favoris"
        subtitle="Chargement..."
        icon="heart"
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
      title="Mes Favoris"
      subtitle="Tous vos produits préférés en un seul endroit"
      icon="heart"
      itemCount={wishlist?.items?.length || 0}
      isEmpty={isEmpty}
      emptyState={{
        icon: <Heart className="w-10 h-10 text-muted-foreground" />,
        title: "Votre liste de favoris est vide",
        description: "Explorez nos produits et ajoutez vos préférés à votre liste pour les retrouver facilement.",
        actionLabel: "Découvrir les produits",
        actionHref: `/${locale}/shop`,
      }}
    >
      <div className="space-y-4">
        {wishlist?.items?.map((item) => {
          const hasPromo = item.hasPromo && item.priceAfterPromo && item.priceAfterPromo < item.price
          const discount = hasPromo && item.priceAfterPromo ? Math.round(((item.price - item.priceAfterPromo) / item.price) * 100) : 0
          const productHref = `/${locale}/product/${item.productId}`

          return (
            <div
              key={item.id}
              className="group bg-card border border-border rounded-2xl p-4 hover:shadow-lg hover:border-primary/30 transition-all duration-200 cursor-pointer"
              onClick={() => router.push(productHref)}
            >
              <div className="flex gap-4">
                {/* Product Image */}
                <Link href={productHref} className="shrink-0">
                  <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-muted ring-1 ring-border">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover transition-transform duration-200 group-hover:scale-[1.03]"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-8 h-8 text-muted-foreground/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute inset-x-2 bottom-2 flex justify-center pointer-events-none">
                      <span className="rounded-full bg-background/80 backdrop-blur px-2 py-0.5 text-xs text-foreground shadow">
                        Voir le produit
                      </span>
                    </div>
                    {hasPromo && (
                      <Badge className="absolute top-2 left-2 bg-destructive text-destructive-foreground px-2 py-0.5 text-xs shadow">
                        -{discount}%
                      </Badge>
                    )}
                  </div>
                </Link>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <Link href={productHref} className="hover:text-primary transition-colors">
                    <h3 className="font-semibold text-foreground line-clamp-2 mb-1">
                      {item.name}
                    </h3>
                  </Link>
                  
                  {item.category && (
                    <p className="text-xs text-muted-foreground mb-2">
                      {item.category}
                    </p>
                  )}

                  {/* Price */}
                  <div className="flex items-baseline gap-2 mb-3">
                    <span className="text-xl font-bold text-foreground">
                      {(hasPromo && item.priceAfterPromo ? item.priceAfterPromo : item.price).toFixed(2)} MAD
                    </span>
                    {hasPromo && item.priceAfterPromo && (
                      <span className="text-sm text-muted-foreground line-through">
                        {item.price.toFixed(2)} MAD
                      </span>
                    )}
                  </div>

                  {/* Stock Status */}
                  {item.inStock && item.stock > 0 ? (
                    <Badge variant="outline" className="border-green-500/50 text-green-600 mb-3">
                      En stock ({item.stock})
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="border-red-500/50 text-red-600 mb-3">
                      Rupture de stock
                    </Badge>
                  )}
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 items-end justify-between">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="Retirer des favoris"
                    onClick={(e) => { e.stopPropagation(); handleRemove(item.id, item.name) }}
                    disabled={isRemoving}
                    className="hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>

                  {item.inStock && item.stock > 0 && (
                    <Button
                      size="sm"
                      aria-label="Ajouter au panier"
                      onClick={(e) => { e.stopPropagation(); handleMoveToCart(item.id, item.name) }}
                      disabled={isMoving}
                      className="gap-2"
                    >
                      <ShoppingCart className="w-4 h-4" />
                      Ajouter au panier
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )
        })}

        {/* Suggestions Section */}
        <ProductSuggestions products={suggestedProducts || []} />
      </div>
    </ShopPageLayout>
  )
}
