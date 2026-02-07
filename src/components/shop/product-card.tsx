'use client'

import { useState, useCallback, useMemo, useEffect } from 'react'
import { Heart, ShoppingCart, Eye, Package, Check, Ruler, Box } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { isOutOfStockLike } from '@/lib/stock'
import { toAbsoluteImageUrl } from '@/lib/image-url'
import Image from 'next/image'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
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
  // Backend data can vary a bit across endpoints; keep this flexible.
  // We normalize these fields before passing to VariantSwatches.
  name?: string
  variant_name?: string
  variant_type?: string
  type?: string
  value?: string
  available?: boolean | number
  image?: string
  image_url?: string
  // Optional pricing fields (used when variant price differs)
  prix_vente?: number
  price?: number
  prix_original?: number
  originalPrice?: number
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
  in_stock?: boolean | number | string | null
  inStock?: boolean | number | string | null
  rating?: number
  reviews?: number
  variants?: ProductVariant[]
  is_wishlisted?: boolean | null
  isVariantRequired?: boolean
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
  const t = useTranslations('productCard')
  const tCommon = useTranslations('common')
  const normalizeAvailable = useCallback((v: ProductVariant) => {
    const raw = (v as any)?.available
    if (raw === undefined || raw === null) return true
    if (typeof raw === 'boolean') return raw
    if (typeof raw === 'number') return raw !== 0
    if (typeof raw === 'string') return raw !== '0' && raw.toLowerCase() !== 'false'
    return true
  }, [])

  const normalizedVariants = useMemo<SimpleVariant[]>(() => {
    return (product.variants ?? []).map((v) => ({
      id: v.id,
      // Prefer the backend "variant_type" (e.g. Couleur/Taille), fall back to name.
      name: v.variant_type ?? v.type ?? v.name ?? v.variant_name,
      // Prefer the option value (e.g. Beige Sable), fall back to variant_name/name.
      value: v.value ?? v.variant_name ?? v.name,
      type: v.variant_type ?? v.type,
      available: normalizeAvailable(v),
      image: v.image ?? v.image_url,
    }))
  }, [normalizeAvailable, product.variants])

  const [selectedVariant, setSelectedVariant] = useState<number | null>(() => {
    const firstAvailable = normalizedVariants.find((v) => v.available !== false)
    return firstAvailable?.id ?? normalizedVariants[0]?.id ?? null
  })

  // Keep selection in sync when product or variants change
  useEffect(() => {
    if (normalizedVariants.length === 0) {
      if (selectedVariant !== null) setSelectedVariant(null)
      return
    }

    const stillExists = selectedVariant != null && normalizedVariants.some((v) => v.id === selectedVariant)
    if (stillExists) return

    const firstAvailable = normalizedVariants.find((v) => v.available !== false)
    setSelectedVariant(firstAvailable?.id ?? normalizedVariants[0].id)
  }, [normalizedVariants, selectedVariant])

  const normalizedBaseImage = useMemo(() => toAbsoluteImageUrl(product.image) ?? '', [product.image])
  const [currentImage, setCurrentImage] = useState(normalizedBaseImage)
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
        toast.success(t('wishlistRemovedTitle'), { description: product.name })
      } else {
        await addToWishlistApi({
          productId: product.id,
          variantId: selectedVariant || undefined,
        }).unwrap()
        toast.success(t('wishlistAddedTitle'), { description: product.name })
      }
      onToggleWishlist?.(product.id)
    } catch (error) {
      toast.error(t('genericErrorTitle'), { description: t('wishlistUpdateFailedDesc') })
    }
  }, [isAuthenticated, isInWishlist, product.id, product.name, selectedVariant, addToWishlistApi, removeFromWishlistApi, onToggleWishlist, t])

  const handleAddToCart = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    const outOfStock = isOutOfStockLike({ stock: product.stock, in_stock: (product as any).in_stock, inStock: (product as any).inStock })
    if (outOfStock) {
      toast.error(t('genericErrorTitle'), { description: t('outOfStock') })
      return
    }

    if (product.isVariantRequired && !selectedVariant) {
      toast.error(t('variantRequiredTitle'), { description: t('variantRequiredDesc') })
      return
    }

    // Get current price based on selected variant
    let itemPrice = product.price
    if (selectedVariant) {
      const variant = product.variants?.find(v => v.id === selectedVariant)
      const variantPrice = (variant as any)?.prix_vente ?? (variant as any)?.price
      if (variantPrice != null) {
        itemPrice = Number(variantPrice)
      }
    }

    // Guest users can add to cart via localStorage, which syncs on auth
    const selectedVariantObj = selectedVariant
      ? product.variants?.find(v => v.id === selectedVariant)
      : undefined
    const variantLabel = selectedVariantObj?.value || selectedVariantObj?.name
    const unitLabel = product.unit
    const suffixParts = [variantLabel, unitLabel].filter(Boolean)
    const displayName = suffixParts.length > 0 ? `${product.name} • ${suffixParts.join(' · ')}` : product.name
    const cartItem = {
      productId: product.id,
      variantId: selectedVariant || undefined,
      variantName: selectedVariantObj?.value || selectedVariantObj?.name,
      name: displayName,
      price: itemPrice,
      quantity: 1,
      image: currentImage,
      category: product.category,
      stock: product.stock,
    }

    // Add item via cart ref (handles API + localStorage automatically)
    if (cartRef?.current) {
      try {
        await cartRef.current.addItem(cartItem)

        // Show success feedback
        setIsAddedToCart(true)
        setTimeout(() => setIsAddedToCart(false), 2000)

        // Open cart with animation
        setTimeout(() => {
          cartRef.current?.open()
        }, 300)

        // Also call the optional callback
        onAddToCart?.(product.id, selectedVariant || undefined)
      } catch (error) {
        const data = (error as any)?.data
        const code = data?.code || data?.error
        const message = data?.message
        if (code === 'out_of_stock' || message === 'out_of_stock') {
          toast.error(t('genericErrorTitle'), { description: t('outOfStock') })
        } else {
          toast.error(t('genericErrorTitle'), { description: t('genericErrorDesc') })
        }
      }
    }
  }, [cartRef, product.category, product.id, product.isVariantRequired, product.name, product.price, product.stock, product.variants, selectedVariant, currentImage, onAddToCart, t, toast])

  const handleQuickView = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Navigate to product page instead of quick view modal
    window.location.href = `/${locale}/product/${product.id}`
  }, [product.id, locale])

  const handleVariantClick = useCallback((variant: SimpleVariant) => {
    setSelectedVariant(variant.id)
    if (variant.image) {
      setCurrentImage(toAbsoluteImageUrl(variant.image) ?? '')
      setImageError(false)
    }
    // Update price if variant has different price (would come from API)
    // For now we keep the base price
  }, [])

  // Sync card image with selected variant image_url when available
  useEffect(() => {
    if (!selectedVariant) return
    const variant = product.variants?.find((v) => v.id === selectedVariant)
    if (variant?.image) {
      setCurrentImage(toAbsoluteImageUrl(variant.image) ?? '')
      setImageError(false)
    }
  }, [selectedVariant, product.variants])

  useEffect(() => {
    setCurrentImage(normalizedBaseImage)
    setImageError(false)
  }, [normalizedBaseImage, product.id])

  const getVariantLabel = useCallback((variant: ProductVariant) => {
    const raw = variant.value || variant.name
    return raw ? raw.toString().trim() : ''
  }, [])

  const isColorVariant = useCallback((variant: ProductVariant) => {
    const label = getVariantLabel(variant).toLowerCase()
    const type = variant.name?.toLowerCase?.() || ''
    if (['couleur', 'color', 'coloris', 'couleurs'].includes(type)) return true
    return ['blanc', 'noir', 'rouge', 'bleu', 'vert', 'jaune', 'orange', 'violet', 'marron', 'gris', 'beige', 'argent', 'doré', 'or', 'rose', 'turquoise', 'kaki'].some(color => label.includes(color))
  }, [getVariantLabel])

  const getVariantTypeLabel = useCallback((variant: ProductVariant) => {
    const type = variant.name?.toString().trim()
    return type || t('variantLabelFallback')
  }, [t])

  const hasVariants = normalizedVariants.length > 0
  const colorVariants = useMemo(() => (product.variants || []).filter(isColorVariant), [product.variants, isColorVariant])
  const nonColorVariants = useMemo(() => (product.variants || []).filter(v => !isColorVariant(v)), [product.variants, isColorVariant])
  const hasColorVariants = colorVariants.length > 0

  const swatchVariants = normalizedVariants

  const displayName = useMemo(() => {
    const selectedVariantObj = selectedVariant
      ? product.variants?.find(v => v.id === selectedVariant)
      : undefined
    const variantLabel = selectedVariantObj?.value || selectedVariantObj?.name
    const unitLabel = product.unit
    const suffixParts = [variantLabel, unitLabel].filter(Boolean)
    return suffixParts.length > 0 ? `${product.name} • ${suffixParts.join(' · ')}` : product.name
  }, [product.name, product.unit, product.variants, selectedVariant])

  // Memoize computed values
  const discountPercentage = useMemo(() =>
    product.sale?.discount ||
    (product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0),
    [product.sale?.discount, product.originalPrice, product.price]
  )

  const isLowStock = useMemo(() => product.stock > 0 && product.stock <= 5, [product.stock])
  const isOutOfStock = useMemo(
    () => isOutOfStockLike({ stock: product.stock, in_stock: (product as any).in_stock, inStock: (product as any).inStock }),
    [product.stock, (product as any).in_stock, (product as any).inStock]
  )

  // Calculate current price based on selected variant
  const currentPrice = useMemo(() => {
    if (selectedVariant) {
      const variant = product.variants?.find(v => v.id === selectedVariant)
      // Check if variant has a specific price (prix_vente or price field)
      const variantPrice = (variant as any)?.prix_vente ?? (variant as any)?.price
      if (variantPrice != null) {
        return Number(variantPrice)
      }
    }
    return product.price
  }, [selectedVariant, product.variants, product.price])

  // Calculate current original price for discount display
  const currentOriginalPrice = useMemo(() => {
    if (selectedVariant && product.originalPrice) {
      const variant = product.variants?.find(v => v.id === selectedVariant)
      const variantOriginal = (variant as any)?.prix_original ?? (variant as any)?.originalPrice
      if (variantOriginal != null) {
        return Number(variantOriginal)
      }
    }
    return product.originalPrice
  }, [selectedVariant, product.variants, product.originalPrice])

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
              className="object-cover transition-all duration-500 ease-out group-hover:scale-110"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <Package className="w-20 h-20 text-muted-foreground/30" />
          </div>
        )}

        {/* Stock Status Overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex items-center justify-center z-20">
            <Badge variant="destructive" className="text-sm font-bold px-4 py-2">
                {t('outOfStock')}
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
                title={t('quickView')}
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
                title={isInWishlist ? t('removeFromWishlist') : t('addToWishlist')}
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
                title={t('addToCart')}
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
          {displayName}
        </h3>

        {/* Available Sizes/Variants Info with Icons */}
        {hasVariants && (
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            {/* Color variants count */}
            {hasColorVariants && (
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 gap-1 border-border/50">
                  <div className="w-2 h-2 rounded-full bg-linear-to-br from-red-400 via-blue-400 to-green-400" />
                <span>{colorVariants.length}</span>
                </Badge>
              )}
            {/* Non-color variants count (size/thickness/etc.) */}
            {nonColorVariants.length > 0 && (
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 h-5 gap-1 border-border/50">
                <Ruler className="w-2.5 h-2.5" />
                <span>{nonColorVariants.length}</span>
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
          <div className="flex items-center gap-2">
            <div className="flex items-baseline gap-1">
              <span className="text-xl font-bold text-foreground">
                {currentPrice.toFixed(2)}
              </span>
              <span className="text-xs text-muted-foreground">{tCommon('currency')}</span>
            </div>
            {discountPercentage > 0 && (
              <Badge className="bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-1 h-6 font-bold">
                -{discountPercentage}%
              </Badge>
            )}
          </div>
          {currentOriginalPrice && currentOriginalPrice > currentPrice && (
            <span className="text-xs text-muted-foreground line-through">
              {currentOriginalPrice.toFixed(2)} {tCommon('currency')}
            </span>
          )}
        </div>

        {/* Color/Variant Swatches */}
        {hasVariants && (
          <div onClick={(e) => { e.preventDefault(); e.stopPropagation(); }} className="cursor-pointer">
            <VariantSwatches
              variants={swatchVariants}
              selectedId={selectedVariant}
              onSelect={(variant) => {
                handleVariantClick(variant)
              }}
              max={5}
              assumeColor={hasColorVariants}
            />
          </div>
        )}

        {/* Low Stock Warning */}
        {isLowStock && (
          <div className="mt-2">
            <Badge variant="outline" className="border-orange-500/50 text-orange-600 text-[10px] px-2 py-0.5">
              {t('lowStock', { count: product.stock })}
            </Badge>
          </div>
        )}
      </Link>
    </div>
  )
}
