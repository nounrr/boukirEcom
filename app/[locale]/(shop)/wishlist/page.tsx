"use client"

import { ShopPageLayout } from "@/components/layout/shop-page-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { AccountSidebar } from "@/components/account/account-sidebar"
import { useGetWishlistQuery, useRemoveFromWishlistMutation, useGetWishlistSuggestionsQuery } from "@/state/api/wishlist-api-slice"
import { useAddToCartMutation } from "@/state/api/cart-api-slice"
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
  const [addToCart, { isLoading: isMoving }] = useAddToCartMutation()

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
      const item = wishlist?.items?.find((wishlistItem) => wishlistItem.id === itemId)
      if (!item) {
        toast.error("Erreur", { description: "Produit introuvable dans les favoris" })
        return
      }

      await addToCart({
        productId: item.productId,
        variantId: item.variantId,
        quantity: 1,
      }).unwrap()
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
      showHeader={false}
      emptyState={{
        icon: <Heart className="w-10 h-10 text-muted-foreground" />,
        title: "Votre liste de favoris est vide",
        description: "Explorez nos produits et ajoutez vos préférés à votre liste pour les retrouver facilement.",
        actionLabel: "Découvrir les produits",
        actionHref: `/${locale}/shop`,
      }}
    >
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        <AccountSidebar active="wishlist" />
        <section className="lg:col-span-3 space-y-5">
          <div className="mb-2 flex items-center gap-3 pb-4 border-b border-border/60">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
              <Heart className="w-5 h-5 text-primary" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-2xl font-bold text-foreground">Mes Favoris</h1>
                {wishlist?.items?.length ? (
                  <Badge variant="secondary" className="text-xs px-2 py-0.5">
                    {wishlist.items.length}
                  </Badge>
                ) : null}
              </div>
              <p className="text-sm text-muted-foreground">Tous vos produits préférés en un seul endroit</p>
            </div>
          </div>
        {wishlist?.items?.map((item) => {
          const hasPromo = item.hasPromo && item.priceAfterPromo && item.priceAfterPromo < item.price
          const discount = hasPromo && item.priceAfterPromo ? Math.round(((item.price - item.priceAfterPromo) / item.price) * 100) : 0
          const productHref = `/${locale}/product/${item.productId}`
          const isLowStock = item.inStock && item.stock > 0 && item.stock <= 5

          return (
            <div
              key={item.id}
              className="group bg-card border border-border/40 rounded-2xl overflow-hidden hover:shadow-2xl hover:border-primary/40 transition-all duration-300"
            >
              <div className="flex flex-col sm:flex-row gap-0 sm:gap-6 p-5">
                {/* Product Image - Larger and more prominent */}
                <Link href={productHref} className="shrink-0 mb-4 sm:mb-0">
                  <div className="relative w-full sm:w-36 aspect-square rounded-xl overflow-hidden bg-gradient-to-br from-muted/60 to-muted shadow-md ring-1 ring-border/20">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.name}
                        fill
                        className="object-cover transition-all duration-300 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-12 h-12 text-muted-foreground/30" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                    {/* Promo Tag - Hanging Style */}
                    {hasPromo && discount > 0 && (
                      <div className="absolute top-2 left-2 z-20 animate-in slide-in-from-top-2 duration-300">
                        <div className="relative">
                          <div className="relative bg-gradient-to-br from-red-500 to-red-600 text-white px-2.5 py-1.5 rounded-lg shadow-xl">
                            <div className="absolute -top-0.5 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-background/90 rounded-full border-2 border-red-600" />
                            <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 w-0.5 h-2.5 bg-gradient-to-b from-gray-400 to-red-600" />
                            <div className="flex items-center gap-0.5 font-bold text-xs">
                              <span className="text-[10px]">-</span>
                              <span className="text-base leading-none">{discount}</span>
                              <span className="text-[10px]">%</span>
                            </div>
                          </div>
                          <div className="absolute inset-0 bg-red-600/30 blur-md translate-y-1 -z-10 rounded-lg" />
                        </div>
                      </div>
                    )}

                    {/* Quick view overlay on hover */}
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <div className="bg-background/95 backdrop-blur-sm px-4 py-2 rounded-full text-xs font-medium text-foreground shadow-lg">
                        Voir le produit
                      </div>
                    </div>
                  </div>
                </Link>

                {/* Product Info - Enhanced layout */}
                <div className="flex-1 min-w-0 flex flex-col">
                  <div className="flex-1">
                    {/* Category */}
                    {item.category && (
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1.5">
                        {item.category}
                      </p>
                    )}

                    {/* Product Name */}
                    <Link href={productHref} className="hover:text-primary transition-colors">
                      <h3 className="font-semibold text-base text-foreground line-clamp-2 mb-3 leading-snug">
                        {item.name}
                      </h3>
                    </Link>

                    {/* Price Section - More prominent */}
                    <div className="mb-3">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-2xl font-bold text-foreground">
                          {(hasPromo && item.priceAfterPromo ? item.priceAfterPromo : item.price).toFixed(2)}
                        </span>
                        <span className="text-sm text-muted-foreground font-medium">MAD</span>
                      </div>
                      {hasPromo && item.priceAfterPromo && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-muted-foreground line-through">
                            {item.price.toFixed(2)} MAD
                          </span>
                          <Badge variant="secondary" className="text-xs font-semibold bg-green-500/10 text-green-700 border-green-500/20">
                            Économisez {(item.price - item.priceAfterPromo).toFixed(2)} MAD
                          </Badge>
                        </div>
                      )}
                    </div>

                    {/* Stock Status - Enhanced */}
                    <div className="flex items-center gap-2">
                      {item.inStock && item.stock > 0 ? (
                        <>
                          <Badge variant="outline" className="border-green-500/50 text-green-600 bg-green-50/50">
                            ✓ En stock
                          </Badge>
                          {isLowStock && (
                            <Badge variant="outline" className="border-orange-500/50 text-orange-600 bg-orange-50/50">
                              Plus que {item.stock} disponibles
                            </Badge>
                          )}
                        </>
                      ) : (
                        <Badge variant="outline" className="border-red-500/50 text-red-600 bg-red-50/50">
                          ✗ Rupture de stock
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                {/* Actions - Better positioned */}
                <div className="flex sm:flex-col gap-2 items-stretch sm:items-end justify-between sm:justify-start mt-4 sm:mt-0 border-t sm:border-t-0 sm:border-l border-border/30 pt-4 sm:pt-0 sm:pl-5">
                  <Button
                    variant="outline"
                    size="sm"
                    aria-label="Retirer des favoris"
                    onClick={(e) => { e.stopPropagation(); handleRemove(item.id, item.name) }}
                    disabled={isRemoving}
                    className="hover:bg-destructive/10 hover:text-destructive hover:border-destructive/50 transition-all gap-2 flex-1 sm:flex-none"
                  >
                    <Trash2 className="w-4 h-4" />
                    <span className="sm:hidden">Retirer</span>
                  </Button>

                  {item.inStock && item.stock > 0 && (
                    <Button
                      size="sm"
                      aria-label="Ajouter au panier"
                      onClick={(e) => { e.stopPropagation(); handleMoveToCart(item.id, item.name) }}
                      disabled={isMoving}
                      className="gap-2 shadow-md hover:shadow-lg transition-all flex-1 sm:flex-none"
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

        </section>
      </div>
      {/* Suggestions Section */}
      {suggestedProducts && suggestedProducts.length > 0 && (
        <div className="mt-8 pt-8 border-t border-border/50">
          <ProductSuggestions products={suggestedProducts} />
        </div>
      )}
    </ShopPageLayout>
  )
}
