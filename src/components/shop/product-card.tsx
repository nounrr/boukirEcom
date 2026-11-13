'use client'

import { useState, useCallback, useMemo, useEffect, useRef } from 'react'
import { productHref } from '@/lib/seo/product-url'
import { Heart, Eye, Package, Check, Ruler, Box, Plus, Share2, Flame, Sparkles } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { toAbsoluteImageUrl } from '@/lib/image-url'
import { getImageEdgeColor } from '@/lib/image-edge-color'
import { formatCommercialUnit, formatUnitRate } from '@/lib/commercial-unit'
import { getLocalizedCategoryName, getLocalizedProductName } from '@/lib/localized-fields'
import Image from 'next/image'
import Link from 'next/link'
import { useLocale, useTranslations } from 'next-intl'
import { ProductImageMask } from './product-image-mask'
import { flyToCart, splitPrice, textureFor } from '@/lib/product-ui'
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
  color_name?: string | null
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
  designation?: string | null
  designation_ar?: string | null
  designation_en?: string | null
  designation_zh?: string | null
  description?: string
  price: number
  originalPrice?: number
  image: string
  fallbackImage?: string
  images?: string[]
  category: string
  categoryObj?: {
    nom?: string | null
    nom_ar?: string | null
    nom_en?: string | null
    nom_zh?: string | null
  } | null
  brand?: string
  unit?: string
  stock: number
  in_stock?: boolean | number | string | null
  inStock?: boolean | number | string | null
  purchase_limit?: number
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
  viewMode?: 'grid' | 'list'
  isWide?: boolean
  layout?: 'tile' | 'row'
  onAddToCart?: (productId: number, variantId?: number) => void
  onToggleWishlist?: (productId: number) => void
  onQuickView?: (productId: number) => void
}

export function ProductCard({
  product,
  viewMode = 'grid',
  isWide = false,
  layout = 'tile',
  onAddToCart,
  onToggleWishlist,
  onQuickView
}: ProductCardProps) {
  const t = useTranslations('productCard')
  const tCommon = useTranslations('common')
  const tx = useTranslations('xp.product')
  const imageBoxRef = useRef<HTMLDivElement>(null)

  const normalizedVariants = useMemo<SimpleVariant[]>(() => {
    return (product.variants ?? []).map((v) => ({
      id: v.id,
      // Prefer the backend "variant_type" (e.g. Couleur/Taille), fall back to name.
      name: v.variant_type ?? v.type ?? v.name ?? v.variant_name,
      // Prefer the option value (e.g. Beige Sable), fall back to variant_name/name.
      value: v.value ?? v.variant_name ?? v.name,
      colorName: v.color_name?.trim() || undefined,
      type: v.variant_type ?? v.type,
      available: v.available === undefined ? true : Boolean(v.available),
      image: v.image ?? v.image_url,
    }))
  }, [product.variants])

  const [selectedVariant, setSelectedVariant] = useState<number | null>(() => {
    return product.isVariantRequired ? normalizedVariants[0]?.id ?? null : null
  })

  // Keep selection in sync when product or variants change
  useEffect(() => {
    if (normalizedVariants.length === 0) {
      if (selectedVariant !== null) setSelectedVariant(null)
      return
    }

    if (!product.isVariantRequired && selectedVariant === null) return

    const stillExists = selectedVariant != null && normalizedVariants.some((v) => v.id === selectedVariant)
    if (stillExists) return

    const firstAvailable = normalizedVariants[0]
    setSelectedVariant(firstAvailable?.id ?? normalizedVariants[0].id)
  }, [normalizedVariants, product.isVariantRequired, selectedVariant])

  const normalizedBaseImage = useMemo(() => toAbsoluteImageUrl(product.image) ?? '', [product.image])
  const normalizedFallbackImage = useMemo(() => toAbsoluteImageUrl(product.fallbackImage) ?? '', [product.fallbackImage])
  const [currentImage, setCurrentImage] = useState(() => {
    const firstImage = product.isVariantRequired ? product.variants?.[0]?.image ?? product.variants?.[0]?.image_url : null
    return toAbsoluteImageUrl(firstImage) ?? normalizedBaseImage
  })
  const [imageError, setImageError] = useState(false)
  const [imageBackgrounds, setImageBackgrounds] = useState<Record<string, string>>({})
  const analyzedImages = useRef(new Set<string>())
  const imageBackground = imageBackgrounds[currentImage] || '#ffffff'
  const detectImageBackground = useCallback((source: string, image: HTMLImageElement) => {
    if (analyzedImages.current.has(source)) return
    analyzedImages.current.add(source)
    const color = getImageEdgeColor(image) || '#ffffff'
    setImageBackgrounds(previous => ({ ...previous, [source]: color }))
  }, [])
  const [isAddedToCart, setIsAddedToCart] = useState(false)
  const locale = useLocale()

  const handleImageError = useCallback(() => {
    if (normalizedFallbackImage && currentImage !== normalizedFallbackImage) {
      setCurrentImage(normalizedFallbackImage)
      setImageError(false)
    } else {
      setImageError(true)
    }
  }, [currentImage, normalizedFallbackImage])

  const localizedProductName = useMemo(() => {
    if (product.designation || product.designation_ar || product.designation_en || product.designation_zh) {
      const value = getLocalizedProductName(product as any, locale)
      return value || product.name
    }
    return product.name
  }, [locale, product])

  const localizedCategoryName = useMemo(() => {
    if (product.categoryObj) {
      return getLocalizedCategoryName(product.categoryObj as any, locale) || product.category
    }
    return product.category
  }, [locale, product.category, product.categoryObj])
  const { cartRef } = useCart()
  const { isAuthenticated } = useAppSelector((state) => state.user)
  const toast = useToast()
  const { openAuthDialog } = useAuthDialog()

  // Wishlist mutations only - no query needed as product.is_wishlisted is provided by backend
  const [addToWishlistApi, { isLoading: isAddingToWishlist }] = useAddToWishlistMutation()
  const [removeFromWishlistApi, { isLoading: isRemovingFromWishlist }] = useRemoveFromWishlistByProductMutation()

  // Optimistic wishlist state (Home page doesn't refetch products after mutation)
  const [isWishlisted, setIsWishlisted] = useState<boolean>(() => product.is_wishlisted === true)

  // Keep optimistic state in sync when parent data updates (e.g. shop page refetch)
  useEffect(() => {
    setIsWishlisted(product.is_wishlisted === true)
  }, [product.id, product.is_wishlisted])

  const isWishlistLoading = isAddingToWishlist || isRemovingFromWishlist

  const handleToggleWishlist = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!isAuthenticated) {
      openAuthDialog('login')
      return
    }

    const wasWishlisted = isWishlisted
    // Optimistically update UI immediately
    setIsWishlisted(!wasWishlisted)

    try {
      if (wasWishlisted) {
        await removeFromWishlistApi({
          productId: product.id,
          variantId: selectedVariant || undefined,
        }).unwrap()
        toast.success(t('wishlistRemovedTitle'), { description: localizedProductName })
      } else {
        await addToWishlistApi({
          productId: product.id,
          variantId: selectedVariant || undefined,
        }).unwrap()
        toast.success(t('wishlistAddedTitle'), { description: localizedProductName })
      }
      onToggleWishlist?.(product.id)
    } catch (error) {
      // Revert optimistic update on error
      setIsWishlisted(wasWishlisted)
      toast.error(t('genericErrorTitle'), { description: t('wishlistUpdateFailedDesc') })
    }
  }, [addToWishlistApi, isAuthenticated, isWishlisted, localizedProductName, onToggleWishlist, openAuthDialog, product.id, removeFromWishlistApi, selectedVariant, t, toast])

  const handleAddToCart = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

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
        itemPrice = Number(variantPrice) * (1 - (product.sale?.discount ?? 0) / 100)
      }
    }

    // Guest users can add to cart via localStorage, which syncs on auth
    const selectedVariantObj = selectedVariant
      ? product.variants?.find(v => v.id === selectedVariant)
      : undefined
    const variantLabel = selectedVariantObj?.value || selectedVariantObj?.name
    const unitLabel = product.unit
    const suffixParts = [variantLabel, unitLabel].filter(Boolean)
    const displayName = suffixParts.length > 0 ? `${localizedProductName} • ${suffixParts.join(' · ')}` : localizedProductName
    const cartItem = {
      productId: product.id,
      variantId: selectedVariant || undefined,
      variantName: selectedVariantObj?.value || selectedVariantObj?.name,
      name: displayName,
      designation: (product as any).designation ?? null,
      designation_ar: (product as any).designation_ar ?? null,
      designation_en: (product as any).designation_en ?? null,
      designation_zh: (product as any).designation_zh ?? null,
      price: itemPrice,
      quantity: 1,
      image: currentImage,
      category: localizedCategoryName,
      categoryObj: product.categoryObj ?? null,
      stock: product.stock,
      purchase_limit: typeof (product as any).purchase_limit === 'number' ? (product as any).purchase_limit : undefined,
    }

    // Add item via cart ref (handles API + localStorage automatically)
    if (cartRef?.current) {
      try {
        flyToCart(imageBoxRef.current, imageError ? '' : currentImage)
        await cartRef.current.addItem(cartItem)

        // Show success feedback
        setIsAddedToCart(true)
        setTimeout(() => setIsAddedToCart(false), 2000)

        // Open the cart once the product has "landed" in it
        setTimeout(() => {
          cartRef.current?.open()
        }, 820)

        // Also call the optional callback
        onAddToCart?.(product.id, selectedVariant || undefined)
      } catch (error) {
        const data = (error as any)?.data
        const code = data?.code || data?.error
        const message = data?.message
        const normalizedCode = typeof code === 'string' ? code.toLowerCase() : ''
        const normalizedMessage = typeof message === 'string' ? message.toLowerCase() : ''

        if (code === 'PURCHASE_LIMIT_EXCEEDED' || normalizedCode === 'purchase_limit_exceeded') {
          toast.error(t('genericErrorTitle'), { description: t('maxQuantityReachedDesc') })
        } else {
          toast.error(t('genericErrorTitle'), { description: t('genericErrorDesc') })
        }
      }
    }
  }, [cartRef, localizedCategoryName, localizedProductName, product.id, product.isVariantRequired, product.price, product.sale?.discount, product.stock, product.variants, selectedVariant, currentImage, imageError, onAddToCart, t, toast])

  const handleQuickView = useCallback((e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    // Navigate to product page instead of quick view modal
    window.location.href = productHref(product, locale)
  }, [product, locale])

  const handleShare = useCallback(async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    const url = `${window.location.origin}${productHref(product, locale)}`
    if (navigator.share) {
      try {
        await navigator.share({ title: localizedProductName, url })
        return
      } catch (error) {
        if ((error as DOMException)?.name === 'AbortError') return
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      toast.success(tx('linkCopied'), { description: localizedProductName })
    } catch {
      /* clipboard unavailable */
    }
  }, [localizedProductName, locale, product, toast, tx])

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
    if (variant?.image || variant?.image_url) {
      setCurrentImage(toAbsoluteImageUrl(variant.image ?? variant.image_url) ?? '')
      setImageError(false)
    }
  }, [selectedVariant, product.variants])

  useEffect(() => {
    const firstImage = product.isVariantRequired ? product.variants?.[0]?.image ?? product.variants?.[0]?.image_url : null
    setCurrentImage(toAbsoluteImageUrl(firstImage) ?? normalizedBaseImage)
    setImageError(false)
  }, [normalizedBaseImage, product.id, product.isVariantRequired, product.variants])

  const getVariantLabel = useCallback((variant: ProductVariant) => {
    const raw = variant.value || variant.name
    return raw ? raw.toString().trim() : ''
  }, [])

  const isColorVariant = useCallback((variant: ProductVariant) => {
    const label = (variant.color_name?.trim() || getVariantLabel(variant)).toLowerCase()
    const type = (variant.variant_type ?? variant.type ?? variant.name)?.toLowerCase?.() || ''
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
    return suffixParts.length > 0 ? `${localizedProductName} • ${suffixParts.join(' · ')}` : localizedProductName
  }, [localizedProductName, product.unit, product.variants, selectedVariant])

  // Memoize computed values
  const discountPercentage = useMemo(() =>
    product.sale?.discount ||
    (product.originalPrice ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100) : 0),
    [product.sale?.discount, product.originalPrice, product.price]
  )

  // Calculate current price based on selected variant
  const currentPrice = useMemo(() => {
    if (selectedVariant) {
      const variant = product.variants?.find(v => v.id === selectedVariant)
      // Check if variant has a specific price (prix_vente or price field)
      const variantPrice = (variant as any)?.prix_vente ?? (variant as any)?.price
      if (variantPrice != null) {
        const discount = product.sale?.discount ?? 0
        return Number(variantPrice) * (1 - discount / 100)
      }
    }
    return product.price
  }, [selectedVariant, product.variants, product.price, product.sale?.discount])

  // Calculate current original price for discount display
  const currentOriginalPrice = useMemo(() => {
    if (selectedVariant) {
      const variant = product.variants?.find(v => v.id === selectedVariant)
      const variantOriginal = (variant as any)?.prix_original ?? (variant as any)?.originalPrice ??
        (product.sale?.discount ? (variant as any)?.prix_vente : null)
      if (variantOriginal != null) {
        return Number(variantOriginal)
      }
    }
    return product.originalPrice
  }, [selectedVariant, product.variants, product.originalPrice, product.sale?.discount])

  const displayUnit = formatCommercialUnit(product.unit, locale as any)
  const unitRate = formatUnitRate(tCommon('currency'), product.unit, locale as any)

  const price = splitPrice(currentPrice, locale)
  const hasDiscount = Boolean(currentOriginalPrice && currentOriginalPrice > currentPrice)
  const savings = hasDiscount ? (currentOriginalPrice as number) - currentPrice : 0
  const isNew = product.badges?.some((b) => b.variant === 'new') ?? false
  const href = productHref(product, locale)
  const stop = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const priceBlock = (size: 'lg' | 'md') => (
    <div className="min-w-0">
      <div className="flex items-baseline gap-1 tabular">
        <span className={cn('font-extrabold tracking-tight text-foreground', size === 'lg' ? 'text-[1.6rem] leading-none' : 'text-xl leading-none')}>{price.int}</span>
        <span className={cn('font-bold text-foreground', size === 'lg' ? 'text-sm' : 'text-xs')}>{price.mark}{price.dec}</span>
      </div>
      <p className="mt-1 truncate text-[10px] font-semibold uppercase tracking-wide text-accent-text">{unitRate}</p>
      {hasDiscount ? (
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <span className="text-xs text-muted-foreground line-through tabular">{(currentOriginalPrice as number).toFixed(2)}</span>
          <span className="rounded-md bg-[#c8321f]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#c8321f] dark:bg-[#f2695a]/15 dark:text-[#f2695a]">
            {tx('save', { amount: savings.toFixed(2) })}
          </span>
        </div>
      ) : null}
    </div>
  )

  const addButton = (size: 'lg' | 'md') => (
    <button
      type="button"
      onClick={handleAddToCart}
      aria-label={t('addToCart')}
      title={t('addToCart')}
      className={cn(
        'relative grid shrink-0 place-items-center overflow-hidden rounded-full transition-[transform,background-color,box-shadow] duration-300 ease-[var(--ease-premium)] active:scale-90',
        size === 'lg' ? 'size-12' : 'size-10',
        isAddedToCart
          ? 'bg-[#1f9d55] text-white shadow-[0_10px_24px_-10px_rgba(31,157,85,0.9)]'
          : 'bg-gold text-ink shadow-[0_12px_26px_-12px_rgba(242,159,4,0.95)] hover:scale-110 hover:shadow-[0_16px_32px_-12px_rgba(242,159,4,1)]'
      )}
    >
      <Plus className={cn('absolute size-5 transition-all duration-300', isAddedToCart ? 'rotate-90 scale-0 opacity-0' : 'rotate-0 scale-100 opacity-100')} strokeWidth={2.6} />
      <Check className={cn('absolute size-5 transition-all duration-300', isAddedToCart ? 'scale-100 opacity-100' : '-rotate-90 scale-0 opacity-0')} strokeWidth={2.8} />
      {isAddedToCart ? <span className="absolute inset-0 rounded-full bg-white/40 motion-safe:animate-ping" aria-hidden="true" /> : null}
    </button>
  )

  const actionButton =
    'grid size-9 place-items-center rounded-full border border-black/5 bg-white/95 text-ink shadow-[0_8px_18px_-10px_rgba(13,13,13,0.45)] backdrop-blur transition-[transform,background-color,color] duration-300 hover:scale-110'

  if (layout === 'row') {
    return (
      <div className="group relative w-full overflow-hidden rounded-[1.25rem] border border-border bg-card text-card-foreground transition-[transform,box-shadow,border-color] duration-[800ms] ease-[var(--ease-slow)] hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-premium">
        <Link href={href} className="flex gap-3 p-2.5 sm:gap-4 sm:p-3">
          <div ref={imageBoxRef} className="relative size-28 shrink-0 overflow-hidden rounded-2xl sm:size-32" style={{ backgroundColor: imageBackground }}>
            {currentImage && !imageError ? (
              <Image
                src={currentImage}
                alt={localizedProductName}
                fill
                sizes="128px"
                className="object-contain p-2.5 transition-transform duration-[1400ms] ease-[var(--ease-slow)] group-hover:scale-110"
                onLoad={(event) => detectImageBackground(currentImage, event.currentTarget)}
                onError={handleImageError}
              />
            ) : (
              <Image src={textureFor(product.id)} alt="" fill sizes="128px" className="object-cover" />
            )}
            {discountPercentage > 0 ? (
              <span className="absolute start-2 top-2 inline-flex items-center gap-0.5 rounded-full bg-gold px-1.5 py-0.5 text-[10px] font-extrabold text-ink">
                <Flame className="size-2.5" />-{discountPercentage}%
              </span>
            ) : null}
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <p className="truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-accent-text">{product.brand || localizedCategoryName}</p>
                <h3 className="mt-0.5 line-clamp-2 text-sm font-semibold leading-snug">{displayName}</h3>
              </div>
              <div className="flex shrink-0 items-center gap-1" onClick={stop}>
                <button type="button" onClick={handleShare} className="grid size-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground" title={tx('share')} aria-label={tx('share')}>
                  <Share2 className="size-4" />
                </button>
                <button
                  type="button"
                  onClick={handleToggleWishlist}
                  disabled={isWishlistLoading}
                  aria-pressed={isWishlisted}
                  className={cn('grid size-8 place-items-center rounded-full transition-all duration-300', isWishlisted ? 'bg-[#e0303a] text-white' : 'text-muted-foreground hover:bg-muted hover:text-[#e0303a]', isWishlistLoading && 'opacity-50')}
                  title={isWishlisted ? t('removeFromWishlist') : t('addToWishlist')}
                  aria-label={isWishlisted ? t('removeFromWishlist') : t('addToWishlist')}
                >
                  <Heart className={cn('size-4 transition-transform duration-300', isWishlisted && 'scale-110 fill-current')} />
                </button>
              </div>
            </div>
            <span className="mt-1 inline-flex items-center gap-1.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
              <span className="size-1.5 rounded-full bg-current" />
              {t('inStock')}
            </span>
            {hasVariants ? (
              <div className="mt-2" onClick={stop}>
                <VariantSwatches variants={swatchVariants} selectedId={selectedVariant} onSelect={(variant) => handleVariantClick(variant)} max={4} assumeColor={hasColorVariants} />
              </div>
            ) : null}
            <div className="mt-auto flex items-end justify-between gap-3 pt-2">
              {priceBlock('md')}
              <div onClick={stop}>{addButton('md')}</div>
            </div>
          </div>
        </Link>
      </div>
    )
  }

  return (
    <div
      className={cn(
        'group relative flex w-full flex-col overflow-hidden rounded-[1.4rem] border border-border bg-card text-card-foreground transition-[transform,box-shadow,border-color] duration-[800ms] ease-[var(--ease-slow)] hover:-translate-y-1.5 hover:border-primary/45 hover:shadow-[0_30px_60px_-30px_rgba(13,13,13,0.45),0_0_0_1px_rgba(242,159,4,0.15)] dark:hover:shadow-[0_30px_60px_-30px_rgba(0,0,0,0.9),0_0_0_1px_rgba(242,159,4,0.25)]',
        isWide ? 'max-w-none' : 'mx-auto max-w-none sm:max-w-[300px]'
      )}
    >
      {/* Image stage */}
      <div ref={imageBoxRef} className="relative aspect-[1/1.02] overflow-hidden" style={{ backgroundColor: imageBackground }}>
        <Link href={href} className="absolute inset-0 z-0" aria-label={localizedProductName} tabIndex={-1}>
          {currentImage && !imageError ? (
            <Image
              src={currentImage}
              alt={localizedProductName}
              fill
              sizes="(min-width:1024px) 300px, (min-width:640px) 33vw, 50vw"
              className="object-contain p-5 transition-transform duration-[1600ms] ease-[var(--ease-slow)] group-hover:scale-[1.07]"
              onLoad={(event) => detectImageBackground(currentImage, event.currentTarget)}
              onError={handleImageError}
            />
          ) : (
            <>
              <Image src={textureFor(product.id)} alt="" fill sizes="(min-width:1024px) 300px, 50vw" className="object-cover transition-transform duration-[1600ms] ease-[var(--ease-slow)] group-hover:scale-[1.07]" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/35 to-transparent" />
              <Package className="absolute bottom-3 end-3 size-5 text-white/80" aria-hidden="true" />
            </>
          )}
          {/* light sweep on hover */}
          <span
            className="pointer-events-none absolute inset-y-0 -start-1/2 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/45 to-transparent opacity-0 transition-[inset-inline-start,opacity] duration-[1600ms] ease-[var(--ease-slow)] group-hover:start-[120%] group-hover:opacity-100"
            aria-hidden="true"
          />
        </Link>

        {/* Badges */}
        <div className="pointer-events-none absolute start-3 top-3 z-10 flex flex-col items-start gap-1.5">
          {discountPercentage > 0 ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-gold px-2.5 py-1 text-[11px] font-extrabold text-ink shadow-[0_8px_18px_-8px_rgba(242,159,4,0.9)]">
              <Flame className="size-3" strokeWidth={2.6} />-{discountPercentage}%
            </span>
          ) : null}
          {discountPercentage > 0 ? (
            <span className="rounded-full bg-ink/85 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-brand-yellow backdrop-blur">{tx('promo')}</span>
          ) : null}
          {isNew ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-white/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-ink shadow-sm">
              <Sparkles className="size-3 text-[#a35f00]" />
              {tx('new')}
            </span>
          ) : null}
        </div>

        {/* Floating actions: always visible on touch, slide in on hover with a mouse */}
        <div className="absolute end-3 top-3 z-10 flex flex-col gap-2 transition-all duration-[800ms] ease-[var(--ease-slow)] [@media(hover:hover)]:translate-x-3 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-focus-within:translate-x-0 [@media(hover:hover)]:group-focus-within:opacity-100 [@media(hover:hover)]:group-hover:translate-x-0 [@media(hover:hover)]:group-hover:opacity-100 rtl:[@media(hover:hover)]:-translate-x-3">
          <button
            type="button"
            onClick={handleToggleWishlist}
            disabled={isWishlistLoading}
            aria-pressed={isWishlisted}
            aria-label={isWishlisted ? t('removeFromWishlist') : t('addToWishlist')}
            title={isWishlisted ? t('removeFromWishlist') : t('addToWishlist')}
            className={cn(actionButton, isWishlisted && '!bg-[#e0303a] !text-white', isWishlistLoading && 'opacity-50')}
          >
            <Heart className={cn('size-4 transition-transform duration-300', isWishlisted && 'scale-110 fill-current')} />
          </button>
          <button type="button" onClick={handleShare} aria-label={tx('share')} title={tx('share')} className={actionButton}>
            <Share2 className="size-4" />
          </button>
          <button type="button" onClick={handleQuickView} aria-label={t('quickView')} title={t('quickView')} className={actionButton}>
            <Eye className="size-4" />
          </button>
        </div>
        {/* keep the "liked" state visible while the action column is hidden */}
        {isWishlisted ? (
          <span className="pointer-events-none absolute end-3 top-3 z-[5] grid size-9 place-items-center rounded-full bg-[#e0303a] text-white transition-opacity [@media(hover:hover)]:group-hover:opacity-0" aria-hidden="true">
            <Heart className="size-4 fill-current" />
          </span>
        ) : null}
      </div>

      {/* Content */}
      <Link href={href} className="flex flex-1 flex-col gap-2 p-3.5 sm:p-4">
        <div className="flex items-center justify-between gap-2">
          <p className="truncate text-[10px] font-semibold uppercase tracking-[0.16em] text-accent-text">{product.brand || localizedCategoryName}</p>
          <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-semibold text-emerald-700 dark:text-emerald-400">
            <span className="size-1.5 rounded-full bg-current" />
            {t('inStock')}
          </span>
        </div>
        <h3 className="line-clamp-2 min-h-[2.5rem] text-[14px] font-semibold leading-snug transition-colors group-hover:text-accent-text">{displayName}</h3>

        {hasVariants ? (
          <div className="flex flex-wrap items-center gap-1.5">
            {hasColorVariants ? (
              <Badge variant="outline" className="h-5 gap-1 border-border px-1.5 py-0 text-[10px]">
                <span className="size-2 rounded-full bg-linear-to-br from-red-400 via-blue-400 to-green-400" />
                {colorVariants.length}
              </Badge>
            ) : null}
            {nonColorVariants.length > 0 ? (
              <Badge variant="outline" className="h-5 gap-1 border-border px-1.5 py-0 text-[10px]">
                <Ruler className="size-2.5" />
                {nonColorVariants.length}
              </Badge>
            ) : null}
            {product.unit ? (
              <Badge variant="outline" className="h-5 gap-1 border-border px-1.5 py-0 text-[10px]">
                <Box className="size-2.5" />
                {displayUnit}
              </Badge>
            ) : null}
          </div>
        ) : null}

        {hasVariants ? (
          <div onClick={stop} className="cursor-pointer">
            <VariantSwatches variants={swatchVariants} selectedId={selectedVariant} onSelect={(variant) => handleVariantClick(variant)} max={5} assumeColor={hasColorVariants} />
          </div>
        ) : null}

        <div className="mt-auto flex items-end justify-between gap-3 border-t border-border/70 pt-3">
          {priceBlock('lg')}
          <div onClick={stop}>{addButton('lg')}</div>
        </div>
      </Link>
    </div>
  )

}
