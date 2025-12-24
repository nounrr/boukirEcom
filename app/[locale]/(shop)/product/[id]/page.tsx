"use client"

import { useCart } from "@/components/layout/cart-context-provider"
import { useAuthDialog } from "@/components/providers/auth-dialog-provider"
import { ProductGallery } from "@/components/shop/product-gallery"
import { ProductSuggestions } from "@/components/shop/product-suggestions"
import { VariantSelector } from "@/components/shop/variant-selector"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { useGetProductQuery } from "@/state/api/products-api-slice"
import {
  useAddToWishlistMutation,
  useRemoveFromWishlistByProductMutation
} from "@/state/api/wishlist-api-slice"
import { useAppSelector } from "@/state/hooks"
import { Heart, Minus, Package, Plus, Share2, ShoppingCart, Tag } from "lucide-react"
import { useLocale } from "next-intl"
import { useParams } from "next/navigation"
import { useEffect, useState } from "react"

export default function ProductPage() {
  const params = useParams()
  const locale = useLocale()
  const toast = useToast()
  const { cartRef } = useCart()
  const { isAuthenticated } = useAppSelector((state) => state.user)
  const { openAuthDialog } = useAuthDialog()

  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const [displayImages, setDisplayImages] = useState<{ id: number; image_url: string }[]>([])
  const goPrevImage = () => setSelectedImage((i) => (i - 1 + (displayImages?.length || 1)) % (displayImages?.length || 1))
  const goNextImage = () => setSelectedImage((i) => (i + 1) % (displayImages?.length || 1))
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null)

  // Fetch product from API
  const { data: product, isLoading, isError, refetch } = useGetProductQuery(params.id as string)
  // Initialize default unit selection (must be before conditional returns)
  useEffect(() => {
    const units = (product as any)?.units as Array<{ id: number; is_default: boolean }> | undefined
    if (units && units.length > 0) {
      const def = units.find(u => u.is_default) || units[0]
      setSelectedUnitId(def?.id ?? null)
    } else {
      setSelectedUnitId(null)
    }
  }, [product])

  // Keep hooks before any conditional returns: initialize gallery images when product changes
  useEffect(() => {
    if (!product) {
      setDisplayImages([])
      setSelectedImage(0)
      return
    }
    const baseGallery = (Array.isArray(product.gallery) && product.gallery.length > 0)
      ? product.gallery
      : [{ id: 1, image_url: product.image_url, position: 0 }]
    const defaultImages = baseGallery.map(({ id, image_url }: any) => ({ id, image_url }))
    setDisplayImages(defaultImages)
    setSelectedImage(0)
  }, [product?.id])

  // Sync variant selection to a variant-specific gallery subset if available
  useEffect(() => {
    if (!product) return
    const v = selectedVariant ? (product.variants || []).find((x: any) => x.id === selectedVariant) : null
    const variantGallery = v?.gallery || []
    if (variantGallery.length > 0) {
      const imgs = variantGallery.map(({ id, image_url }: any) => ({ id, image_url }))
      setDisplayImages(imgs)
      if (v?.image_url) {
        const idx = imgs.findIndex((g) => g.image_url === v.image_url)
        setSelectedImage(idx >= 0 ? idx : 0)
      } else {
        setSelectedImage(0)
      }
    } else {
      const fallback = ((product.gallery && product.gallery.length > 0)
        ? product.gallery
        : [{ id: 1, image_url: product.image_url, position: 0 }]
      ).map(({ id, image_url }: any) => ({ id, image_url }))
      setDisplayImages(fallback)
      setSelectedImage(0)
    }
  }, [selectedVariant, product])

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
      unitId: (activeUnit as any)?.id,
      unitName: (activeUnit as any)?.unit_name || (activeUnit as any)?.name || product.base_unit,
      name: product.designation,
      price: currentPrice,
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
  const hasDiscount = product.has_promo && product.prix_promo
  const similarProducts = (product as any).suggestions || product.similar_products || []

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



  // Resolve active unit and variant-aware price
  const activeUnit = (product as any)?.units?.find((u: any) => u.id === selectedUnitId) || null
  const selectedVariantObj = (selectedVariant ? (product.variants || []).find((v: any) => v.id === selectedVariant) : null) || null
  const variantPrice: number | null = selectedVariantObj ? (selectedVariantObj.prix_vente ?? (selectedVariantObj as any).price ?? null) : null
  const baseUnitPrice: number = (activeUnit?.prix_vente ?? product.prix_vente) as number
  const computedPriceBeforeDiscount: number = (variantPrice ?? baseUnitPrice) as number
  const currentPrice: number = (hasDiscount && computedPriceBeforeDiscount)
    ? Number((computedPriceBeforeDiscount * (1 - (product.pourcentage_promo || 0) / 100)).toFixed(2))
    : Number((product.prix_promo ?? computedPriceBeforeDiscount).toFixed(2))



  return (
    <div className="bg-background">
      <div className="container mx-auto px-6 sm:px-8 lg:px-16 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8">
          {/* Left: Image Gallery */}
          <div className="lg:col-span-6">
            <ProductGallery
              images={displayImages}
              selectedIndex={selectedImage}
              onSelectedChange={setSelectedImage}
              promoPercent={hasDiscount ? product.pourcentage_promo : null}
              className=""
              altText={product.designation}
              onMainClick={() => goNextImage()}
              showIndex
              maxHeight={520}
              thumbSize={72}
              thumbsOnLeft
            />
          </div>

          {/* Right: Product Info */}
          <div className="lg:col-span-6 space-y-4">
            {/* Breadcrumb/Category */}
            {product.categorie?.nom && (
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="text-xs px-2 py-0.5 rounded-full border-border/50">
                  <span className="inline-flex items-center gap-1 text-muted-foreground"><Tag className="w-3 h-3" /> {product.categorie.nom}</span>
                </Badge>
                {product.brand?.nom && (
                  <Badge variant="outline" className="text-xs px-2 py-0.5 rounded-full border-border/50">
                    <span className="inline-flex items-center gap-1 text-muted-foreground">{product.brand.nom}</span>
                  </Badge>
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
                  {Number(baseUnitPrice).toFixed(2)} MAD
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

            <VariantSelector
              colorVariants={colorVariants as any}
              sizeVariants={sizeVariants as any}
              otherVariants={otherVariants as any}
              selectedId={selectedVariant}
              onChange={(id, v) => {
                setSelectedVariant(id)
                if (v.image_url) setSelectedImage(0)
              }}
              onPreviewImage={(img) => {
                if (img) {
                  const idx = displayImages.findIndex((g) => g.image_url === img)
                  setSelectedImage(idx >= 0 ? idx : 0)
                }
              }}
            />

            {/* Units Selector */}
            {(product.units && product.units.length > 0) && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Unité</label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.units.map((u: any) => (
                    <button
                      key={u.id}
                      onClick={() => setSelectedUnitId(u.id)}
                      className={cn(
                        "px-3 py-1.5 text-sm font-medium rounded-md border transition-all",
                        selectedUnitId === u.id
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border hover:border-primary/50 hover:bg-muted/50"
                      )}
                      title={u.unit_name || u.name}
                    >
                      <span className="mr-2">{u.unit_name || u.name}</span>
                      {typeof u.prix_vente === 'number' && (
                        <span className="text-xs text-muted-foreground">{Number(u.prix_vente).toFixed(2)} MAD</span>
                      )}
                    </button>
                  ))}
                </div>
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
