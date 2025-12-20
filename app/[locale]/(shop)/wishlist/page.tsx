"use client"

import { ShopPageLayout } from "@/components/layout/shop-page-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { useGetWishlistQuery, useRemoveFromWishlistMutation, useMoveToCartMutation } from "@/state/api/wishlist-api-slice"
import { useGetProductsQuery } from "@/state/api/products-api-slice"
import { useAppSelector } from "@/state/hooks"
import { Heart, ShoppingCart, Trash2, Package, Sparkles } from "lucide-react"
import Image from "next/image"
import Link from "next/link"
import { useLocale } from "next-intl"
import { useToast } from "@/hooks/use-toast"
import { useCart } from "@/components/layout/cart-context-provider"
import { ProductCard } from "@/components/shop/product-card"

export default function WishlistPage() {
  const locale = useLocale()
  const { isAuthenticated } = useAppSelector((state) => state.user)
  const { cartRef } = useCart()
  const toast = useToast()
  
  const { data: wishlist, isLoading } = useGetWishlistQuery(undefined, {
    skip: !isAuthenticated,
  })

  // Fetch suggested products
  const { data: suggestedProducts } = useGetProductsQuery({
    page: 1,
    per_page: 4,
    in_stock_only: true,
    sort: 'popular',
  })

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

          return (
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
                    {hasPromo && (
                      <Badge className="absolute top-2 left-2 bg-red-500 text-white px-2 py-0.5 text-xs">
                        -{discount}%
                      </Badge>
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
                    onClick={() => handleRemove(item.id, item.name)}
                    disabled={isRemoving}
                    className="hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>

                  {item.inStock && item.stock > 0 && (
                    <Button
                      size="sm"
                      onClick={() => handleMoveToCart(item.id, item.name)}
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
        {suggestedProducts?.products && suggestedProducts.products.length > 0 && (
          <div className="space-y-6 pt-8 border-t">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/10 to-orange-500/10 border border-amber-500/20">
                <Sparkles className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h2 className="text-2xl font-bold text-foreground">Vous pourriez aimer</h2>
                <p className="text-sm text-muted-foreground">Découvrez nos suggestions pour vous</p>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {suggestedProducts.products.slice(0, 4).map((product) => (
                <ProductCard
                  key={product.id}
                  product={{
                    id: product.id,
                    name: product.designation,
                    price: product.prix_promo || product.prix_vente,
                    originalPrice: product.prix_promo ? product.prix_vente : undefined,
                    image: product.image_url || '',
                    category: product.base_unit || '',
                    stock: product.quantite_disponible,
                    is_wishlisted: product.is_wishlisted,
                    sale: product.pourcentage_promo ? {
                      discount: product.pourcentage_promo,
                    } : undefined,
                  }}
                  viewMode="grid"
                />
              ))}
            </div>
          </div>
        )}
      </div>
    </ShopPageLayout>
  )
}
