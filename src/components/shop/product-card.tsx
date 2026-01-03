'use client'

import { useState, useCallback, useMemo } from 'react'
import { Heart, ShoppingCart, Eye, Package, Check, Ruler, Box } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { ProductImageMask } from './product-image-mask'
import { VariantSwatches, type SimpleVariant } from './variant-swatches'
import { useAppSelector } from '@/state/hooks'
import { useCart } from '@/components/layout/cart-context-provider'
import { useToast } from '@/hooks/use-toast'
import { useAuthDialog } from '@/components/providers/auth-dialog-provider'
import {
  useAddToWishlistMutation,
  useRemoveFromWishlistByProductMutation
} from '@/state/api/wishlist-api-slice'

interface ProductVariant {
  id: number
  name: string
  value: string
  available: boolean
  image?: string
}

interface Product {
  id: number
  name: string
  description?: string
  price: number
  originalPrice?: number
  image: string
  images?: string[]
  category: string
  brand?: string
  unit?: string
  stock: number
  rating?: number
  reviews?: number
  variants?: ProductVariant[]
  is_wishlisted?: boolean | null
  sale?: {
    discount: number
    label?: string
  }
  badges?: {
    text: string
    variant: 'new' | 'promo' | 'stock' | 'eco'
  }[]
}

interface ProductCardProps {
  product: Product
  viewMode?: 'grid' | 'large'
  isWide?: boolean
  onAddToCart?: (productId: number, variantId?: number) => void
  onToggleWishlist?: (productId: number) => void
  onQuickView?: (productId: number) => void
}

export function ProductCard({
  product,
  viewMode = 'grid',
  isWide = false,
  onAddToCart,
  onToggleWishlist,
  onQuickView
}: ProductCardProps) {
  const [selectedVariant, setSelectedVariant] = useState<number | null>(
    product.variants?.[0]?.id || null
  )
  const [currentImage, setCurrentImage] = useState(product.image)
  const [imageError, setImageError] = useState(false)
  const [isAddedToCart, setIsAddedToCart] = useState(false)
  const locale = useLocale()
  const { cartRef } = useCart()
  const { isAuthenticated } = useAppSelector((state) => state.user)
  const toast = useToast()
  const { openAuthDialog } = useAuthDialog()

  // Wishlist mutations only - no query needed as product.is_wishlisted is provided by backend
  const [addToWishlistApi, { isLoading: isAddingToWishlist }] = useAddToWishlistMutation()
  const [removeFromWishlistApi, { isLoading: isRemovingFromWishlist }] = useRemoveFromWishlistByProductMutation()

  // Use backend-provided wishlist state
  const isInWishlist = product.is_wishlisted === true
  const isWishlistLoading = isAddingToWishlist || isRemovingFromWishlist

  const handleToggleWishlist = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isAuthenticated) {
      openAuthDialog('login')
      return
    }

    try {
      if (isInWishlist) {
        await removeFromWishlistApi({
          productId: product.id,
          variantId: selectedVariant || undefined,
        }).unwrap()
        toast.success('Retiré des favoris', { description: product.name })
      } else {
        await addToWishlistApi({
          productId: product.id,
          variantId: selectedVariant || undefined,
        }).unwrap()
        toast.success('Ajouté aux favoris', { description: product.name })
      }
      onToggleWishlist?.(product.id)
    } catch (error) {
      toast.error('Une erreur est survenue', { description: 'Impossible de mettre à jour les favoris' })
    }
  }, [isAuthenticated, isInWishlist, product.id, selectedVariant, addToWishlistApi, removeFromWishlistApi, onToggleWishlist])

  const handleAddToCart = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    // Guest users can add to cart via localStorage, which syncs on auth
    const cartItem = {
      productId: product.id,
      variantId: selectedVariant || undefined,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: currentImage,
      category: product.category,
      stock: product.stock,
    }

    // Add item via cart ref (handles API + localStorage automatically)
    if (cartRef?.current) {
      cartRef.current.addItem(cartItem)

      // Show success feedback
      setIsAddedToCart(true)
      setTimeout(() => setIsAddedToCart(false), 2000)

      // Open cart with animation
      setTimeout(() => {
        cartRef.current?.open()
      }, 300)
    }

    // Also call the optional callback
    onAddToCart?.(product.id, selectedVariant || undefined)
  }, [cartRef, product.id, product.name, product.price, product.category, product.stock, selectedVariant, currentImage, onAddToCart])

  const handleQuickView = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Navigate to product page instead of quick view modal
    window.location.href = `/${locale}/product/${product.id}`
  }, [product.id, locale])

  const handleVariantClick = useCallback((variant: SimpleVariant) => {
    setSelectedVariant(variant.id)
    if (variant.image) {
      setCurrentImage(variant.image)
      setImageError(false)
    }
    // Update price if variant has different price (would come from API)
    // For now we keep the base price
  }, [])

  // Memoize computed values
  const discountPercentage = useMemo(() =>
    product.sale?.discount ||
    (product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0),
    [product.sale?.discount, product.originalPrice, product.price]
  )

  const isLowStock = useMemo(() => product.stock > 0 && product.stock <= 5, [product.stock])
  const isOutOfStock = useMemo(() => product.stock === 0, [product.stock])

  // Color mapping for variant visualization
  const colorMap: Record<string, string> = {
    'Blanc': '#FFFFFF',
    'Blanc Pur': '#FAFAFA',
    'Beige': '#D4C5B9',
    'Beige Sable': '#C9B99B',
    'Noir': '#000000',
    'Gris': '#6B7280',
    'Gris Perle': '#D3D3D3',
    'Rouge': '#EF4444',
    'Bleu': '#3B82F6',
    'Bleu Ciel': '#87CEEB',
    'Vert': '#10B981',
    'Jaune': '#FBBF24',
    'Orange': '#F97316',
    'Violet': '#8B5CF6',
    'Marron': '#92400E'
  }

  return (
    <div className={cn(
      "group relative bg-white rounded-2xl overflow-hidden border border-border/20 shadow-md hover:shadow-2xl transition-all duration-300 w-full mx-auto",
      isWide ? "max-w-none" : "max-w-[280px]"
    )}>
      {/* Auth dialog is globally provided by AuthDialogProvider */}
      {/* Image Section with Mask */}
      <Link href={`/${locale}/product/${product.id}`} className="block">
        <ProductImageMask className="aspect-square bg-linear-to-br from-muted/60 via-muted/80 to-muted shadow-sm ring-1 ring-border/10">
        {/* Subtle backdrop pattern for better visibility */}
        <div className="absolute inset-0 pointer-events-none opacity-40" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(0,0,0,0.03) 0%, transparent 70%)' }} />

        {/* Product Image */}
        {currentImage && !imageError ? (
          <Image
            src={currentImage}
            alt={product.name}
            fill
            className="object-cover transition-opacity duration-300 group-hover:opacity-95"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Package className="w-20 h-20 text-muted-foreground/30" />
          </div>
        )}

          {/* Discount Tag - Hanging Style */}
        {discountPercentage > 0 && (
            <div className="absolute top-2 left-2 z-20 animate-in slide-in-from-top-2 duration-300">
              <div className="relative">
                {/* Tag shape with shadow */}
                <div className="relative bg-gradient-to-br from-red-500 to-red-600 text-white px-3 py-2 rounded-lg shadow-xl">
                  {/* Hole punch effect at top */}
                  <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-3 h-3 bg-background/90 rounded-full border-2 border-red-600" />
                  {/* String/rope effect */}
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-0.5 h-3 bg-gradient-to-b from-gray-400 to-red-600" />

                  <div className="flex items-center gap-1 font-bold text-sm">
                    <span className="text-xs">-</span>
                    <span className="text-lg leading-none">{discountPercentage}</span>
                    <span className="text-xs">%</span>
                  </div>
                </div>
                {/* Shadow below tag */}
                <div className="absolute inset-0 bg-red-600/30 blur-md translate-y-1 -z-10 rounded-lg" />
              </div>
          </div>
        )}

        {/* Stock Status Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-20">
            <Badge variant="destructive" className="text-sm font-bold px-4 py-2">
              Rupture de stock
            </Badge>
          </div>
        )}

        {/* Quick Action Dock - Always visible and docked shape */}
          <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 opacity-100 transition-opacity duration-300" onClick={(e) => e.preventDefault()}>
          <div className="flex items-center gap-1 bg-white rounded-[18px] px-3 py-2 shadow-md border border-border/20">
            <Button
              size="icon"
              variant="ghost"
              onClick={handleQuickView}
              className="h-8 w-8 rounded-full hover:bg-muted"
              title="Aperçu rapide"
            >
              <Eye className="w-4 h-4" />
            </Button>
            <button
              onClick={handleToggleWishlist}
              disabled={isWishlistLoading}
              className={cn(
                "h-8 w-8 rounded-full transition-all duration-300 flex items-center justify-center border-0 outline-none focus:outline-none",
                isInWishlist
                  ? "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/30 scale-105 cursor-pointer"
                  : "bg-transparent hover:bg-red-50 text-gray-600 hover:text-red-500 cursor-pointer",
                isWishlistLoading && "opacity-50 cursor-not-allowed"
              )}
              title={isInWishlist ? "Retirer des favoris" : "Ajouter aux favoris"}
            >
              <Heart className={cn(
                "w-4 h-4 transition-all duration-300",
                isInWishlist && "fill-current animate-in zoom-in-50"
              )} />
            </button>
            <Button
              size="icon"
              variant="ghost"
              onClick={handleAddToCart}
              disabled={isOutOfStock}
              className={cn(
                "h-8 w-8 rounded-full transition-all duration-200",
                isAddedToCart
                  ? "bg-primary hover:bg-primary text-primary-foreground"
                  : "hover:bg-muted disabled:opacity-50"
              )}
              title="Ajouter au panier"
            >
              {isAddedToCart ? (
                <Check className="w-4 h-4" />
              ) : (
                  <ShoppingCart className="w-4 h-4" />
              )}
            </Button>
          </div>
        </div>
        </ProductImageMask>
      </Link>

      {/* Content Section - Compact */}
      <Link href={`/${locale}/product/${product.id}`} className="block p-3">
        {/* Category */}
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
          {product.category}
        </p>

        {/* Product Name */}
        <h3 className="font-semibold text-sm mb-2 line-clamp-2 leading-tight min-h-8">
          {product.name}
        </h3>

        {/* Available Sizes/Variants Info with Icons */}
        {product.variants && product.variants.length > 0 && (
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {/* Color variants count */}
            {product.variants.filter(v => {
              const name = v.name?.toLowerCase() || v.value?.toLowerCase() || '';
              return ['blanc', 'noir', 'rouge', 'bleu', 'vert', 'jaune', 'orange', 'violet', 'marron', 'gris', 'beige'].some(color => name.includes(color));
            }).length > 0 && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 gap-1 border-border/50">
                  <div className="w-2 h-2 rounded-full bg-linear-to-br from-red-400 via-blue-400 to-green-400" />
                  <span>{product.variants.filter(v => {
                    const name = v.name?.toLowerCase() || v.value?.toLowerCase() || '';
                    return ['blanc', 'noir', 'rouge', 'bleu', 'vert', 'jaune', 'orange', 'violet', 'marron', 'gris', 'beige'].some(color => name.includes(color));
                  }).length}</span>
                </Badge>
              )}
            {/* Size variants count */}
            {product.variants.filter(v => {
              const name = v.name?.toLowerCase() || v.value?.toLowerCase() || '';
              return /^(xxs|xs|s|m|l|xl|xxl|xxxl|2xl|3xl)$/.test(name) || name.includes('taille');
            }).length > 0 && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 gap-1 border-border/50">
                  <Ruler className="w-2.5 h-2.5" />
                  <span>{product.variants.filter(v => {
                    const name = v.name?.toLowerCase() || v.value?.toLowerCase() || '';
                    return /^(xxs|xs|s|m|l|xl|xxl|xxxl|2xl|3xl)$/.test(name) || name.includes('taille');
                  }).length}</span>
                </Badge>
              )}
            {/* Unit display if available */}
            {product.unit && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 gap-1 border-border/50">
                <Box className="w-2.5 h-2.5" />
                <span>{product.unit}</span>
              </Badge>
            )}
          </div>
        )}

        {/* Price */}
        <div className="mb-2">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-foreground">
              {product.price.toFixed(2)}
            </span>
            <span className="text-xs text-muted-foreground">MAD</span>
          </div>
          {product.originalPrice && product.originalPrice > product.price && (
            <span className="text-xs text-muted-foreground line-through">
              {product.originalPrice.toFixed(2)} MAD
            </span>
          )}
        </div>

        {/* Color/Variant Swatches */}
        {product.variants && product.variants.length > 0 && (
          <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}>
            <VariantSwatches
              variants={product.variants}
              selectedId={selectedVariant}
              onSelect={(variant) => {
                handleVariantClick(variant)
              }}
              max={5}
              assumeColor
            />
          </div>
        )}

        {/* Low Stock Warning */}
        {isLowStock && (
          <div className="mt-2">
            <Badge variant="outline" className="border-orange-500/50 text-orange-600 text-[10px] px-2 py-0.5">
              Plus que {product.stock} en stock
            </Badge>
          </div>
        )}
      </Link>
    </div>
  )
}
