"use client"

import { useState } from "react"
import { useParams } from "next/navigation"
import { useLocale } from "next-intl"
import Image from "next/image"
import { Heart, ShoppingCart, Package, Minus, Plus, Share2, Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useAppSelector } from "@/state/hooks"
import { useToast } from "@/hooks/use-toast"
import { useCart } from "@/components/layout/cart-context-provider"
import { useAuthDialog } from "@/components/providers/auth-dialog-provider"
import {
  useAddToWishlistMutation,
  useRemoveFromWishlistByProductMutation
} from "@/state/api/wishlist-api-slice"
import { useGetProductQuery } from "@/state/api/products-api-slice"
import { ProductSuggestions } from "@/components/shop/product-suggestions"
import { cn } from "@/lib/utils"

export default function ProductPage() {
  const params = useParams()
  const locale = useLocale()
  const toast = useToast()
  const { cartRef } = useCart()
  const { isAuthenticated } = useAppSelector((state) => state.user)
  const { openAuthDialog } = useAuthDialog()

  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null)
  const [isAddingToCart, setIsAddingToCart] = useState(false)

  // Fetch product from API
  const { data: product, isLoading, isError, refetch } = useGetProductQuery(params.id as string)

  const [addToWishlistApi, { isLoading: isAddingToWishlist }] = useAddToWishlistMutation()
  const [removeFromWishlistApi, { isLoading: isRemovingFromWishlist }] = useRemoveFromWishlistByProductMutation()

  const isInWishlist = product?.is_wishlisted === true
  const isWishlistLoading = isAddingToWishlist || isRemovingFromWishlist

  const handleQuantityChange = (delta: number) => {
    if (!product) return
    const newQuantity = quantity + delta
    if (newQuantity >= 1 && newQuantity <= product.quantite_disponible) {
      setQuantity(newQuantity)
    }
  }

  const handleAddToCart = async () => {
    if (!product) return
    
    if (!isAuthenticated) {
      openAuthDialog('login')
      return
    }

    setIsAddingToCart(true)
    const cartItem = {
      productId: product.id,
      name: product.designation,
      price: product.prix_promo || product.prix_vente,
      quantity,
      image: product.image_url,
      category: product.categorie?.nom || 'Produit',
      stock: product.quantite_disponible,
    }

    if (cartRef?.current) {
      cartRef.current.addItem(cartItem)
      toast.success("Ajouté au panier", { description: `${quantity} x ${product.designation}` })
      
      setTimeout(() => {
        cartRef.current?.open()
      }, 300)
    }

    setIsAddingToCart(false)
  }

  const handleToggleWishlist = async () => {
    if (!product) return
    
    if (!isAuthenticated) {
      openAuthDialog('login')
      return
    }

    try {
      if (isInWishlist) {
        await removeFromWishlistApi({ productId: product.id }).unwrap()
        toast.success('Retiré des favoris', { description: product.designation })
      } else {
        await addToWishlistApi({ productId: product.id }).unwrap()
        toast.success('Ajouté aux favoris', { description: product.designation })
      }
      // Immediately refresh product to reflect wishlist state
      await refetch()
    } catch (error) {
      toast.error('Une erreur est survenue', { description: 'Impossible de mettre à jour les favoris' })
    }
  }

  const handleShare = async () => {
    if (!product) return
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.designation,
          text: product.description,
          url: window.location.href,
        })
      } catch (error) {
        console.log('Share cancelled')
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success('Lien copié', { description: 'Le lien a été copié dans le presse-papier' })
    }
  }

  if (isLoading || !product) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="aspect-square bg-muted rounded-xl" />
            <div className="space-y-4">
              <div className="h-8 bg-muted rounded w-3/4" />
              <div className="h-4 bg-muted rounded w-1/2" />
              <div className="h-12 bg-muted rounded w-1/4" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center space-y-4">
          <Package className="w-16 h-16 mx-auto text-muted-foreground" />
          <h1 className="text-2xl font-bold">Produit non trouvé</h1>
          <p className="text-muted-foreground">Le produit que vous recherchez n'existe pas ou a été supprimé.</p>
        </div>
      </div>
    )
  }

  const images = product.gallery?.length > 0 ? product.gallery : [{ id: 1, image_url: product.image_url, position: 0 }]
  const currentPrice = product.prix_promo || product.prix_vente
  const hasDiscount = product.has_promo && product.prix_promo
  const similarProducts = product.similar_products || []

  // Get available colors and sizes from variants (robust detection)
  const allVariants = product.variants || []
  const colorVariantsByType = allVariants.filter((v: any) => {
    const t = v.variant_type?.toLowerCase?.()
    return t === 'couleur' || t === 'color' || t === 'coloris' || t === 'couleurs'
  })
  const colorVariantsByName = allVariants.filter((v: any) => {
    const key = v.variant_name?.toLowerCase?.()
    return !!key && !!(
      key in {
        'blanc': 1,'blanc pur': 1,'beige': 1,'beige sable': 1,'noir': 1,'gris': 1,'gris perle': 1,'rouge': 1,'bleu': 1,'bleu ciel': 1,'vert': 1,'jaune': 1,'orange': 1,'violet': 1,'marron': 1
      }
    )
  })
  const colorVariants = (colorVariantsByType.length > 0 ? colorVariantsByType : colorVariantsByName)

  const sizeVariants = allVariants.filter((v: any) => {
    const t = v.variant_type?.toLowerCase?.()
    if (t === 'taille' || t === 'size') return true
    const name = v.variant_name?.toLowerCase?.()
    return !!name && /^(xxs|xs|s|m|l|xl|xxl|xxxl|2xl|3xl|4xl|5xl|6xl|7xl|8xl|9xl|10xl)$/.test(name)
  })

  const otherVariants = allVariants.filter((v: any) => {
    // Exclude detected color/size
    return !colorVariants.includes(v) && !sizeVariants.includes(v)
  })

  // Color map similar to ProductCard for consistent swatch colors
  const colorMap: Record<string, string> = {
    'blanc': '#FFFFFF',
    'blanc pur': '#FAFAFA',
    'beige': '#D4C5B9',
    'beige sable': '#C9B99B',
    'noir': '#000000',
    'gris': '#6B7280',
    'gris perle': '#D3D3D3',
    'rouge': '#EF4444',
    'bleu': '#3B82F6',
    'bleu ciel': '#87CEEB',
    'vert': '#10B981',
    'jaune': '#FBBF24',
    'orange': '#F97316',
    'violet': '#8B5CF6',
    'marron': '#92400E'
  }

  function getColorHex(name?: string) {
    if (!name) return '#e5e7eb'
    const key = name.trim().toLowerCase()
    if (colorMap[key]) return colorMap[key]
    // Pastel HSL fallback based on name hash
    let hash = 0
    for (let i = 0; i < key.length; i++) {
      hash = (hash * 31 + key.charCodeAt(i)) >>> 0
    }
    const hue = hash % 360
    return `hsl(${hue}, 70%, 85%)`
  }

  return (
    <div className="bg-background">
      <div className="container mx-auto px-6 sm:px-8 lg:px-16 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Left: Image Gallery */}
          <div className="lg:col-span-7">
            <div className="sticky top-4 space-y-3">
              {/* Main Image */}
              <div className="relative aspect-square rounded-lg overflow-hidden bg-muted border border-border/40">
                {images[selectedImage]?.image_url ? (
                  <Image
                    src={images[selectedImage].image_url}
                    alt={product.designation}
                    fill
                    className="object-cover"
                    priority
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Package className="w-16 h-16 text-muted-foreground/30" />
                  </div>
                )}
                
                {hasDiscount && (
                  <Badge className="absolute top-3 left-3 bg-red-500 hover:bg-red-500 text-white px-2 py-0.5 text-xs font-semibold">
                    -{product.pourcentage_promo}%
                  </Badge>
                )}
              </div>

              {/* Thumbnail Gallery */}
              {images.length > 1 && (
                <div className="grid grid-cols-5 gap-2">
                  {images.map((image, index) => (
                    <button
                      key={image.id}
                      onClick={() => setSelectedImage(index)}
                      className={cn(
                        "relative aspect-square rounded-md overflow-hidden bg-muted border transition-all",
                        selectedImage === index
                          ? "border-primary border-2 ring-1 ring-primary/20"
                          : "border-border hover:border-primary/50"
                      )}
                    >
                      <Image
                        src={image.image_url}
                        alt={`${product.designation} - ${index + 1}`}
                        fill
                        className="object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Right: Product Info */}
          <div className="lg:col-span-5 space-y-4">
            {/* Breadcrumb/Category */}
            {product.categorie?.nom && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>{product.categorie.nom}</span>
                {product.brand?.nom && (
                  <>
                    <span>•</span>
                    <span>{product.brand.nom}</span>
                  </>
                )}
              </div>
            )}

            {/* Product Name */}
            <h1 className="text-2xl font-bold text-foreground leading-tight">
              {product.designation}
            </h1>

            {/* Price */}
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-foreground">
                {currentPrice.toFixed(2)} MAD
              </span>
              {hasDiscount && (
                <span className="text-base text-muted-foreground line-through">
                  {product.prix_vente.toFixed(2)} MAD
                </span>
              )}
            </div>

            {/* Stock Status */}
            <div className="flex items-center gap-2">
              {product.quantite_disponible > 0 ? (
                <>
                  <Badge variant="outline" className="border-green-500/50 text-green-600 text-xs px-2 py-0.5">
                    En stock
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    {product.quantite_disponible} unités disponibles
                  </span>
                </>
              ) : (
                <Badge variant="destructive" className="text-xs">Rupture de stock</Badge>
              )}
            </div>

            <Separator />

            {/* Color Variants */}
            {colorVariants.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">
                    Couleur: {selectedVariant && colorVariants.find(v => v.id === selectedVariant)?.variant_name}
                  </label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {colorVariants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant.id)}
                      disabled={!variant.available}
                      className={cn(
                        "relative w-10 h-10 rounded-full border-2 transition-all",
                        selectedVariant === variant.id
                          ? "border-primary ring-2 ring-primary/20 scale-110"
                          : "border-border hover:border-primary/50",
                        !variant.available && "opacity-30 cursor-not-allowed"
                      )}
                      style={{ backgroundColor: getColorHex(variant.variant_name) }}
                      title={variant.variant_name}
                    >
                      {selectedVariant === variant.id && (
                        <Check className="w-5 h-5 absolute inset-0 m-auto text-white drop-shadow-md" />
                      )}
                      {['blanc','blanc pur','white'].includes(variant.variant_name?.toLowerCase?.() || '') && (
                        <div className="absolute inset-0 rounded-full border border-border/30" />
                      )}
                      {!variant.available && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-full h-0.5 bg-destructive rotate-45" />
                        </div>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Size Variants */}
            {sizeVariants.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Taille</label>
                  <button className="text-xs text-primary hover:underline">
                    Guide des tailles
                  </button>
                </div>
                <div className="grid grid-cols-6 gap-2">
                  {sizeVariants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant.id)}
                      disabled={!variant.available}
                      className={cn(
                        "px-3 py-2 text-sm font-medium rounded-md border transition-all",
                        selectedVariant === variant.id
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border hover:border-primary/50 hover:bg-muted/50",
                        !variant.available && "opacity-30 cursor-not-allowed line-through"
                      )}
                    >
                      {variant.variant_name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Other Variants */}
            {otherVariants.length > 0 && (
              <div className="space-y-2">
                <label className="text-sm font-medium">{otherVariants[0]?.variant_type || 'Options'}</label>
                <div className="flex flex-wrap gap-2">
                  {otherVariants.map((variant) => (
                    <button
                      key={variant.id}
                      onClick={() => setSelectedVariant(variant.id)}
                      disabled={!variant.available}
                      className={cn(
                        "px-3 py-1.5 text-sm font-medium rounded-md border transition-all",
                        selectedVariant === variant.id
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border hover:border-primary/50 hover:bg-muted/50",
                        !variant.available && "opacity-30 cursor-not-allowed line-through"
                      )}
                    >
                      {variant.variant_name}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Unit */}
            {product.base_unit && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span className="font-medium">Unité:</span>
                <span>{product.base_unit}</span>
              </div>
            )}

            <Separator />

            {/* Quantity Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Quantité</label>
              <div className="flex items-center gap-3">
                <div className="flex items-center border border-border rounded-md">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-r-none hover:bg-muted"
                    onClick={() => handleQuantityChange(-1)}
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-3.5 h-3.5" />
                  </Button>
                  <span className="px-4 text-sm font-medium min-w-10 text-center">
                    {quantity}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 rounded-l-none hover:bg-muted"
                    onClick={() => handleQuantityChange(1)}
                    disabled={quantity >= product.quantite_disponible}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <span className="text-sm text-muted-foreground">
                  Total: <span className="font-semibold text-foreground">{(currentPrice * quantity).toFixed(2)} MAD</span>
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                size="lg"
                className="flex-1 h-11 text-sm font-semibold"
                onClick={handleAddToCart}
                disabled={isAddingToCart || product.quantite_disponible === 0}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Ajouter au panier
              </Button>
              <Button
                size="lg"
                variant="outline"
                className={cn(
                  "h-11 w-11 p-0",
                  isInWishlist && "bg-red-50 border-red-200 hover:bg-red-100"
                )}
                onClick={handleToggleWishlist}
                disabled={isWishlistLoading}
              >
                <Heart className={cn(
                  "w-4 h-4",
                  isInWishlist && "fill-red-500 text-red-500"
                )} />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-11 w-11 p-0"
                onClick={handleShare}
              >
                <Share2 className="w-4 h-4" />
              </Button>
            </div>

            <Separator />

            {/* Description */}
            {product.description && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold">Description</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Similar Products */}
      {similarProducts.length > 0 && (
        <div className="bg-muted/30 py-12 mt-12">
          <div className="container mx-auto px-6 sm:px-8 lg:px-16">
            <ProductSuggestions
              products={similarProducts}
              title="Produits similaires"
              description="Découvrez d'autres produits qui pourraient vous intéresser"
            />
          </div>
        </div>
      )}
    </div>
  )
}
