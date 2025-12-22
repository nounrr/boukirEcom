'use client'

import { useState, useCallback, useMemo } from 'react'
import { Heart, ShoppingCart, Eye, Package, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import Image from 'next/image'
import Link from 'next/link'
import { useLocale } from 'next-intl'
import { ProductImageMask } from './product-image-mask'
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
  onAddToCart?: (productId: number, variantId?: number) => void
  onToggleWishlist?: (productId: number) => void
  onQuickView?: (productId: number) => void
}

export function ProductCard({
  product,
  viewMode = 'grid',
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

  const handleVariantClick = useCallback((e: React.MouseEvent, variant: ProductVariant) => {
    e.preventDefault()
    e.stopPropagation()
    setSelectedVariant(variant.id)
    if (variant.image) {
      setCurrentImage(variant.image)
      setImageError(false)
    }
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
    <div className="group relative bg-white rounded-2xl overflow-hidden border border-border/20 shadow-md hover:shadow-2xl transition-all duration-300 w-full max-w-[280px] mx-auto">
      {/* Auth dialog is globally provided by AuthDialogProvider */}
      {/* Image Section with Mask */}
      <Link href={`/${locale}/product/${product.id}`} className="block">
        <ProductImageMask className="aspect-square bg-gradient-to-br from-muted/60 via-muted/80 to-muted shadow-sm ring-1 ring-border/10">
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

        {/* Discount Badge */}
        {discountPercentage > 0 && (
          <div className="absolute top-3 left-3 z-20">
            <Badge className="bg-red-500 hover:bg-red-500 text-white px-2.5 py-1 text-xs font-bold">
              -{discountPercentage}%
            </Badge>
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
        <h3 className="font-semibold text-sm mb-2 line-clamp-2 leading-tight min-h-[2rem]">
          {product.name}
        </h3>

        {/* Available Sizes/Variants Info */}
        {product.variants && product.variants.length > 0 && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mb-3">
            <span className="font-medium">{product.variants.length}</span>
            <span>variant{product.variants.length > 1 ? 's' : ''}</span>
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
          <div className="flex items-center gap-2 flex-wrap">
            {product.variants.slice(0, 5).map((variant) => {
              const colorHex = colorMap[variant.name] || colorMap[variant.value]
              const isColorVariant = colorHex !== undefined
              
              if (isColorVariant) {
                return (
                  <button
                    key={variant.id}
                    onClick={(e) => {
                      if (variant.available) handleVariantClick(e, variant)
                    }}
                    disabled={!variant.available}
                    className={cn(
                      "w-7 h-7 rounded-full border-2 transition-all duration-200 relative",
                      selectedVariant === variant.id
                        ? "border-primary ring-2 ring-primary/20 scale-110"
                        : "border-border hover:border-primary/50",
                      !variant.available && "opacity-30 cursor-not-allowed"
                    )}
                    style={{ backgroundColor: colorHex }}
                    title={variant.name || variant.value}
                  >
                    {(variant.name === 'Blanc' || variant.name === 'Blanc Pur' || 
                      variant.value === 'Blanc' || variant.value === 'Blanc Pur') && (
                      <div className="absolute inset-0 rounded-full border border-border/30" />
                    )}
                    {!variant.available && (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-full h-0.5 bg-destructive rotate-45" />
                      </div>
                    )}
                  </button>
                )
              }
              
              return (
                <button
                  key={variant.id}
                  onClick={(e) => {
                    if (variant.available) handleVariantClick(e, variant)
                  }}
                  disabled={!variant.available}
                  className={cn(
                    "px-2 py-0.5 text-xs font-medium rounded-md border transition-all duration-200",
                    selectedVariant === variant.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border hover:border-primary/50 hover:bg-muted/50",
                    !variant.available && "opacity-30 cursor-not-allowed line-through"
                  )}
                  title={variant.name || variant.value}
                >
                  {variant.value}
                </button>
              )
            })}
            {product.variants.length > 5 && (
              <span className="text-[10px] text-muted-foreground">
                +{product.variants.length - 5}
              </span>
            )}
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
