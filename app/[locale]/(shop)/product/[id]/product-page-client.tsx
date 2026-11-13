"use client"
import { productIdFromSegment, productSlug } from '@/lib/seo/product-url'

import { useCart } from "@/components/layout/cart-context-provider"
import { useAuthDialog } from "@/components/providers/auth-dialog-provider"
import { ProductGallery } from "@/components/shop/product-gallery"
import { ProductSuggestions } from "@/components/shop/product-suggestions"
import { VariantSelector } from "@/components/shop/variant-selector"
import { TechnicalSheet } from "@/components/shop/technical-sheet"
import { ProductCalculatorLink } from "@/components/shop/product-calculator-link"
import { useToast } from "@/hooks/use-toast"
import { getLocalizedCategoryName } from "@/lib/localized-fields"
import { cn } from "@/lib/utils"
import { useGetProductQuery } from "@/state/api/products-api-slice"
import {
  useAddToWishlistMutation,
  useRemoveFromWishlistByProductMutation
} from "@/state/api/wishlist-api-slice"
import { useAppSelector } from "@/state/hooks"
import { Flame, Headset, Heart, MessageCircle, Minus, Phone, Plus, Share2, ShoppingCart } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { useParams, useSearchParams } from "next/navigation"
import { useEffect, useMemo, useRef, useState } from "react"
import DOMPurify from "dompurify"
import type { ProductDetail } from '@/types/api/products'
import { isOutOfStockLike } from '@/lib/stock'
import { formatCommercialUnit, formatUnitRate } from '@/lib/commercial-unit'
import { resolveProductOfferPrice } from '@/lib/product-price'
import { mergeProductSessionState } from '@/lib/product-client-snapshot'
import { flyToCart, splitPrice } from '@/lib/product-ui'
import { toAbsoluteImageUrl } from '@/lib/image-url'
import { CONTACT, whatsappHref } from '@/lib/contact'

function galleryFromProduct(product: ProductDetail) {
  const firstVariant = product.is_obligatoire_variant ? product.variants?.[0] : null
  if (firstVariant) {
    const images = [firstVariant.image_url, ...(firstVariant.gallery || []).map(image => image.image_url)]
      .filter((url): url is string => Boolean(url))
    if (images.length) return [...new Set(images)].map((image_url, index) => ({ id: index, image_url }))
  }
  const source = product.gallery?.length
    ? product.gallery
    : product.image_url
      ? [{ id: 1, image_url: product.image_url }]
      : []
  return source.map(({ id, image_url }) => ({ id, image_url })).filter(image => Boolean(image.image_url))
}

function defaultUnitId(product: ProductDetail) {
  const units = product.units ?? []
  return (units.find(unit => unit.is_default) ?? units[0])?.id ?? null
}

export default function ProductPage({ initialProduct }: { initialProduct: ProductDetail }) {
  const params = useParams()
  const searchParams = useSearchParams()
  const requestedVariant = productIdFromSegment(searchParams.get('variant'))
  const locale = useLocale()
  const t = useTranslations("productPage")
  const tCommon = useTranslations("common")
  const tProductCard = useTranslations("productCard")
  const toast = useToast()
  const { cartRef } = useCart()
  const { isAuthenticated } = useAppSelector((state) => state.user)
  const { openAuthDialog } = useAuthDialog()

  const currency = tCommon("currency")
  const isArabic = locale === "ar"

  const getLocalizedDesignation = useMemo(() => {
    return (data: any): string => {
      const fallback = (data?.designation ?? data?.name ?? "").toString()

      const candidate =
        locale === "ar"
          ? data?.designation_ar
          : locale === "en"
            ? data?.designation_en
            : locale === "zh"
              ? data?.designation_zh
              : data?.designation

      const value = (candidate ?? "").toString().trim()
      return value || fallback
    }
  }, [locale])

  const getLocalizedDescription = useMemo(() => {
    return (data: any): string => {
      const fallback = (data?.description ?? "").toString()

      const candidate =
        locale === "ar"
          ? data?.description_ar
          : locale === "en"
            ? data?.description_en
            : locale === "zh"
              ? data?.description_zh
              : data?.description

      const value = (candidate ?? "").toString().trim()
      return value || fallback
    }
  }, [locale])

  const looksLikeHtml = (value: string) => /<\s*\/?\s*[a-z][\s\S]*>/i.test(value)

  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const [displayImages, setDisplayImages] = useState<{ id: number; image_url: string }[]>(() => galleryFromProduct(initialProduct))
  const goPrevImage = () => setSelectedImage((i) => (i - 1 + (displayImages?.length || 1)) % (displayImages?.length || 1))
  const goNextImage = () => setSelectedImage((i) => (i + 1) % (displayImages?.length || 1))
  const [selectedVariant, setSelectedVariant] = useState<number | null>(() => {
    const requested = initialProduct.variants?.find(v => String(v.id) === requestedVariant)
    return requested?.id ?? (initialProduct.is_obligatoire_variant ? initialProduct.variants?.[0]?.id ?? null : null)
  })
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const galleryRef = useRef<HTMLDivElement>(null)
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(() => defaultUnitId(initialProduct))

  // The server has already validated the route and supplied public data. This
  // browser request only refreshes current catalogue/session information.
  const { data: queriedProduct, refetch } = useGetProductQuery(productIdFromSegment(params.id) || '', { skip: !productIdFromSegment(params.id) })
  // Price, variants and units must remain the exact snapshot used by the
  // initial HTML and JSON-LD. The browser refresh contributes session state only.
  const product = useMemo(
    () => mergeProductSessionState(initialProduct, queriedProduct),
    [initialProduct, queriedProduct],
  )
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
    setDisplayImages(galleryFromProduct(product))
    setSelectedImage(0)
  }, [product?.id])

  // Direct variant URLs and browser history restore the same purchasable variant.
  useEffect(() => {
    if (!product) return
    const variant = (product.variants || []).find(v => String(v.id) === requestedVariant)
    setSelectedVariant(variant?.id ?? (product.is_obligatoire_variant ? product.variants?.[0]?.id ?? null : null))
  }, [product, requestedVariant])

  // Auto-select first variant when variants are required
  useEffect(() => {
    if (!product) return
    const variants = (product.variants || []) as Array<{ id: number; available?: boolean }>
    if (!variants.length) return
    const isVariantRequired = (product as any).is_obligatoire_variant || (product as any).isObligatoireVariant
    if (isVariantRequired && !selectedVariant) {
      const firstAvailable = variants.find((v) => v.available !== false) || variants[0]
      setSelectedVariant(firstAvailable?.id ?? null)
    }
  }, [product, selectedVariant])

  // Sync variant selection to a variant-specific gallery subset if available
  useEffect(() => {
    if (!product) return
    const v = selectedVariant ? (product.variants || []).find((x: any) => x.id === selectedVariant) : null
    const variantGallery = v?.gallery || []
    const variantImage = v?.image_url || null

    if (variantGallery.length > 0 || variantImage) {
      const galleryImages = variantGallery.map(({ id, image_url }: any) => ({ id, image_url }))
      const variantImageEntry = variantImage
        ? [{ id: v?.id || 0, image_url: variantImage }]
        : []
      const merged = [...variantImageEntry, ...galleryImages]
      const unique = merged.filter(
        (img, index, arr) => arr.findIndex((x) => x.image_url === img.image_url) === index
      )
      setDisplayImages(unique)
      setSelectedImage(0)
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
    const rawLimit = (product as any)?.purchase_limit ?? (product as any)?.purchaseLimit
    const purchaseLimit = typeof rawLimit === 'number' && Number.isFinite(rawLimit) ? rawLimit : null

    const next = quantity + delta
    if (next < 1) return
    if (purchaseLimit != null && next > purchaseLimit) {
      setQuantity(purchaseLimit)
      toast.error(tCommon("error"), { description: tProductCard("maxQuantityReachedDesc") })
      return
    }
    setQuantity(next)
  }

  const handleAddToCart = async () => {
    if (!product) return

    const rawLimit = (product as any)?.purchase_limit ?? (product as any)?.purchaseLimit
    const purchaseLimit = typeof rawLimit === 'number' && Number.isFinite(rawLimit) ? rawLimit : null
    if (purchaseLimit != null && quantity > purchaseLimit) {
      setQuantity(purchaseLimit)
      toast.error(tCommon("error"), { description: tProductCard("maxQuantityReachedDesc") })
      return
    }

    const isVariantRequired = (product as any).is_obligatoire_variant || (product as any).isObligatoireVariant
    if (isVariantRequired && !selectedVariant) {
      toast.error(tProductCard("variantRequiredTitle"), {
        description: tProductCard("variantRequiredDesc"),
      })
      return
    }

    setIsAddingToCart(true)
    const baseName = getLocalizedDesignation(product)
    const variantLabel = (selectedVariantObj as any)?.variant_name || (selectedVariantObj as any)?.name
    const unitLabel = (activeUnit as any)?.unit_name || (activeUnit as any)?.name || product.base_unit
    const suffixParts = [variantLabel, unitLabel].filter(Boolean)
    const displayName = suffixParts.length > 0 ? `${baseName} • ${suffixParts.join(' · ')}` : baseName
    const cartItem = {
      productId: product.id,
      variantId: selectedVariant || undefined,
      variantName: (selectedVariantObj as any)?.variant_name || (selectedVariantObj as any)?.name || undefined,
      unitId: (activeUnit as any)?.id,
      unitName: unitLabel,
      name: displayName,
      price: currentPrice,
      quantity,
      image: product.image_url,
      category: categoryLabel || t("categoryFallback"),
      stock: product.quantite_disponible,
    }

    if (cartRef?.current) {
      try {
        flyToCart(galleryRef.current, toAbsoluteImageUrl(displayImages[selectedImage]?.image_url) || '')
        await cartRef.current.addItem(cartItem)
        toast.success(t("addedToCartTitle"), {
          description: t("addedToCartDesc", { quantity, name: baseName }),
        })

        setTimeout(() => {
          cartRef.current?.open()
        }, 800)
      } catch (error) {
        const data = (error as any)?.data
        const code = data?.code || data?.error
        const message = data?.message
        const normalizedCode = typeof code === 'string' ? code.toLowerCase() : ''
        const normalizedMessage = typeof message === 'string' ? message.toLowerCase() : ''

        if (code === 'PURCHASE_LIMIT_EXCEEDED' || normalizedCode === 'purchase_limit_exceeded') {
          toast.error(tCommon("error"), { description: tProductCard("maxQuantityReachedDesc") })
        } else {
          toast.error(tCommon("error"), { description: tProductCard("genericErrorDesc") })
        }
      }
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
      const baseName = getLocalizedDesignation(product)
      if (isInWishlist) {
        await removeFromWishlistApi({ productId: product.id }).unwrap()
        toast.success(tProductCard("wishlistRemovedTitle"), { description: baseName })
      } else {
        await addToWishlistApi({ productId: product.id }).unwrap()
        toast.success(tProductCard("wishlistAddedTitle"), { description: baseName })
      }
      // Immediately refresh product to reflect wishlist state
      await refetch()
    } catch (error) {
      toast.error(tProductCard("genericErrorTitle"), {
        description: tProductCard("wishlistUpdateFailedDesc"),
      })
    }
  }

  const handleShare = async () => {
    if (!product) return

    const baseName = getLocalizedDesignation(product)
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: baseName,
          text: product.description,
          url: window.location.href,
        })
      } catch (error) {
        console.log('Share cancelled')
      }
    } else {
      navigator.clipboard.writeText(window.location.href)
      toast.success(t("linkCopiedTitle"), { description: t("linkCopiedDesc") })
    }
  }

  const images = product.gallery?.length > 0 ? product.gallery : [{ id: 1, image_url: product.image_url, position: 0 }]
  const similarProducts = (product as any).suggestions || product.similar_products || []

  // Get available colors and sizes from variants (robust detection)
  const allVariants = product.variants || []
  const colorVariantsByType = allVariants.filter((v: any) => {
    const t = v.variant_type?.toLowerCase?.()
    return t === 'couleur' || t === 'color' || t === 'coloris' || t === 'couleurs'
  })
  const colorVariantsByName = allVariants.filter((v: any) => {
    const key = (v.color_name?.trim() || v.variant_name)?.toLowerCase?.()
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
  const offerPrice = resolveProductOfferPrice(product, { variant: selectedVariantObj, unit: activeUnit })
  const computedPriceBeforeDiscount = offerPrice.listPrice ?? 0
  const currentPrice = offerPrice.price ?? 0
  const hasDiscount = offerPrice.onPromotion



  const baseDesignation = getLocalizedDesignation(product)
  const categoryLabel = getLocalizedCategoryName((product as any)?.categorie, locale)
  const isOutOfStock = isOutOfStockLike(product)
  const titleVariantLabel = (selectedVariantObj as any)?.variant_name || (selectedVariantObj as any)?.name
  const titleUnitLabel = (activeUnit as any)?.unit_name || (activeUnit as any)?.name || product.base_unit
  const displayUnit = formatCommercialUnit(titleUnitLabel, locale as any)
  const unitRate = formatUnitRate(currency, titleUnitLabel, locale as any)
  const titleSuffixParts = [titleVariantLabel, displayUnit].filter(Boolean)
  const titleDisplayName = titleSuffixParts.length > 0
    ? `${baseDesignation} • ${titleSuffixParts.join(' · ')}`
    : baseDesignation

  const tx = useTranslations("xp.product")
  const price = splitPrice(currentPrice, locale)
  const savings = hasDiscount ? Math.max(0, computedPriceBeforeDiscount - currentPrice) : 0
  const rawLimit = (product as any)?.purchase_limit ?? (product as any)?.purchaseLimit
  const purchaseLimit = typeof rawLimit === 'number' && Number.isFinite(rawLimit) ? rawLimit : null
  const description = getLocalizedDescription(product)
  const whatsapp = whatsappHref(tx("adviceMessage", { name: baseDesignation }))
  const sectionLabel = "text-[11px] font-bold uppercase tracking-[0.18em] text-muted-foreground rtl:tracking-normal"

  return (
    <div className="bg-background pb-24 text-foreground lg:pb-0">
      <div className="mx-auto max-w-[1440px] px-5 pb-16 pt-4 sm:px-8 lg:px-10 lg:pb-24 lg:pt-6">
        <div className="grid gap-8 lg:grid-cols-12 lg:gap-12 xl:gap-16">
          {/* Gallery */}
          <div ref={galleryRef} className="min-w-0 lg:col-span-7">
            <ProductGallery
              images={displayImages}
              selectedIndex={selectedImage}
              onSelectedChange={setSelectedImage}
              promoPercent={hasDiscount ? product.pourcentage_promo : null}
              className=""
              altText={baseDesignation}
              onMainClick={() => goNextImage()}
              showIndex
              maxHeight={640}
              thumbSize={76}
              thumbsOnLeft={!isArabic}
              fallbackSeed={product.id}
            />
          </div>

          {/* Buy box */}
          <div className="min-w-0 lg:col-span-5">
            <div className="space-y-7 lg:sticky lg:top-28">
              <div className="space-y-4">
                <div className="flex flex-wrap items-center gap-2.5">
                  <span className="kicker flex items-center gap-3"><span className="h-px w-8 bg-[var(--accent-text)]" aria-hidden="true" />{tx("ref")} {product.id}</span>
                  {hasDiscount && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-ink px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-brand-yellow dark:bg-white/10">
                      <Flame className="size-3" aria-hidden="true" />{tx("promo")}
                    </span>
                  )}
                </div>
                <h1 className="display-lg text-[1.9rem] leading-[1.08] sm:text-4xl xl:text-[2.6rem]">{titleDisplayName}</h1>
              </div>

              {/* Price */}
              <div className="relative overflow-hidden rounded-[1.6rem] border border-border bg-card p-5 sm:p-6">
                <div className="pointer-events-none absolute -end-20 -top-20 size-56 rounded-full bg-[radial-gradient(closest-side,rgba(242,159,4,0.16),transparent)]" aria-hidden="true" />
                <div className="relative flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <p className="sr-only">{currentPrice.toFixed(2)} {unitRate}</p>
                    <div className="flex items-start gap-1.5" aria-hidden="true">
                      <span className="display-lg tabular text-5xl leading-none sm:text-6xl">{price.int}</span>
                      <span className="mt-1 flex flex-col">
                        <span className="text-xl font-extrabold leading-none tabular">{price.mark}{price.dec}</span>
                        <span className="mt-1.5 text-[11px] font-bold uppercase tracking-wider text-accent-text">{unitRate}</span>
                      </span>
                    </div>
                    {hasDiscount && (
                      <div className="mt-3 flex flex-wrap items-center gap-2">
                        <span className="text-sm tabular text-muted-foreground line-through">{computedPriceBeforeDiscount.toFixed(2)} {unitRate}</span>
                        {savings > 0 && <span className="rounded-full bg-emerald-500/12 px-2.5 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-400">{tx("save", { amount: savings.toFixed(2) })}</span>}
                      </div>
                    )}
                  </div>
                  {hasDiscount && product.pourcentage_promo ? (
                    <span className="grid size-16 shrink-0 -rotate-[8deg] place-items-center rounded-full bg-gold text-lg font-extrabold text-ink shadow-[0_14px_30px_-12px_rgba(242,159,4,0.8)]">-{product.pourcentage_promo}%</span>
                  ) : null}
                </div>
                <div className="relative mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-border pt-4 text-sm">
                  <span className={cn("inline-flex items-center gap-2 font-semibold", isOutOfStock ? "text-red-600 dark:text-red-400" : "text-emerald-700 dark:text-emerald-400")}>
                    <span className="size-2 rounded-full bg-current shadow-[0_0_0_4px_color-mix(in_oklab,currentColor_18%,transparent)]" aria-hidden="true" />
                    {t(isOutOfStock ? "outOfStock" : "inStock")}
                  </span>
                  {categoryLabel && <span className="text-muted-foreground">{categoryLabel}</span>}
                  {product.brand?.nom && <span className="text-muted-foreground">{product.brand.nom}</span>}
                </div>
              </div>

              <div className="cursor-pointer">
                <VariantSelector
                  colorVariants={colorVariants as any}
                  sizeVariants={sizeVariants as any}
                  otherVariants={otherVariants as any}
                  selectedId={selectedVariant}
                  onChange={(id, v) => {
                    setSelectedVariant(id)
                    const url = new URL(window.location.href)
                    url.searchParams.set('variant', `${id}-${productSlug({ id, name: v.variant_name || String(id) }, locale)}`)
                    window.history.replaceState(null, '', url)
                    if (v.image_url) setSelectedImage(0)
                  }}
                  onPreviewImage={(img) => {
                    if (img) {
                      const idx = displayImages.findIndex((g) => g.image_url === img)
                      setSelectedImage(idx >= 0 ? idx : 0)
                    }
                  }}
                  style="circle"
                />
              </div>

              {/* Units */}
              {(product.units && product.units.length > 0) && (
                <div className="space-y-3">
                  <p className={sectionLabel}>{t("unitLabel")}</p>
                  <div className="flex flex-wrap gap-2">
                    {product.units.map((u: any) => {
                      const selected = selectedUnitId === u.id
                      return (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => setSelectedUnitId(u.id)}
                          aria-pressed={selected}
                          title={formatCommercialUnit(u.unit_name || u.name, locale as any)}
                          className={cn(
                            "inline-flex cursor-pointer flex-col items-start rounded-2xl border px-4 py-2.5 text-start transition-[border-color,background-color,color,box-shadow,transform] duration-700 ease-[var(--ease-slow)] hover:-translate-y-0.5",
                            selected
                              ? "border-transparent bg-ink text-white shadow-[0_14px_30px_-16px_rgba(13,13,13,0.6)] dark:bg-brand-yellow dark:text-ink"
                              : "border-border bg-card hover:border-[rgba(242,159,4,0.6)]"
                          )}
                        >
                          <span className="text-sm font-semibold">{formatCommercialUnit(u.unit_name || u.name, locale as any)}</span>
                          {typeof u.prix_vente === 'number' && (
                            <span className={cn("text-xs tabular", selected ? "text-white/70 dark:text-ink/70" : "text-muted-foreground")}>{Number(u.prix_vente).toFixed(2)} {formatUnitRate(currency, u.unit_name || u.name, locale as any)}</span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Quantity + total */}
              <div className="space-y-3">
                <p className={sectionLabel}>{t("quantityLabel")}</p>
                <div className="flex flex-wrap items-center gap-4">
                  <div className="inline-flex h-12 items-center rounded-full border border-border bg-card p-1">
                    <button type="button" aria-label={tx("decrease")} onClick={() => handleQuantityChange(-1)} disabled={quantity <= 1} className="grid size-10 cursor-pointer place-items-center rounded-full transition-colors duration-500 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40">
                      <Minus className="size-4" aria-hidden="true" />
                    </button>
                    <span className="min-w-12 text-center text-base font-bold tabular" aria-live="polite">{quantity}</span>
                    <button type="button" aria-label={tx("increase")} onClick={() => handleQuantityChange(1)} disabled={purchaseLimit != null ? quantity >= purchaseLimit : false} className="grid size-10 cursor-pointer place-items-center rounded-full transition-colors duration-500 hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40">
                      <Plus className="size-4" aria-hidden="true" />
                    </button>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t("totalLabel")}: <span className="text-lg font-bold tabular text-foreground">{(currentPrice * quantity).toFixed(2)} {currency}</span>
                    <span className="ms-1.5 text-xs">({quantity} × {displayUnit})</span>
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isAddingToCart}
                  className="group/cta relative inline-flex h-14 flex-1 cursor-pointer items-center justify-center gap-2.5 overflow-hidden rounded-full bg-gold px-5 text-[15px] font-semibold whitespace-nowrap text-ink shadow-[0_18px_40px_-16px_rgba(242,159,4,0.85)] transition-[transform,box-shadow] duration-700 ease-[var(--ease-slow)] hover:-translate-y-0.5 hover:shadow-[0_28px_54px_-18px_rgba(242,159,4,0.95)] active:translate-y-0 disabled:opacity-70"
                >
                  <span className="pointer-events-none absolute inset-y-0 start-0 w-1/3 -translate-x-[120%] -skew-x-12 bg-gradient-to-r from-transparent via-white/50 to-transparent transition-transform duration-[1600ms] ease-[var(--ease-slow)] group-hover/cta:translate-x-[360%] rtl:translate-x-[120%] rtl:group-hover/cta:-translate-x-[360%]" aria-hidden="true" />
                  <ShoppingCart className="relative size-[18px]" aria-hidden="true" />
                  <span className="relative">{tProductCard("addToCart")}</span>
                </button>
                <button
                  type="button"
                  onClick={handleToggleWishlist}
                  disabled={isWishlistLoading}
                  aria-pressed={isInWishlist}
                  aria-label={isInWishlist ? tProductCard("removeFromWishlist") : tProductCard("addToWishlist")}
                  title={isInWishlist ? tProductCard("removeFromWishlist") : tProductCard("addToWishlist")}
                  className={cn(
                    "grid size-14 shrink-0 cursor-pointer place-items-center rounded-full border transition-[background-color,border-color,color,transform] duration-700 ease-[var(--ease-slow)] hover:-translate-y-0.5",
                    isInWishlist ? "border-transparent bg-[#e0303a] text-white" : "border-border bg-card hover:border-[#e0303a]/50 hover:text-[#e0303a]"
                  )}
                >
                  <Heart className={cn("size-5", isInWishlist && "fill-current")} aria-hidden="true" />
                </button>
                <button
                  type="button"
                  onClick={handleShare}
                  aria-label={tx("share")}
                  title={tx("share")}
                  className="grid size-14 shrink-0 cursor-pointer place-items-center rounded-full border border-border bg-card transition-[border-color,color,transform] duration-700 ease-[var(--ease-slow)] hover:-translate-y-0.5 hover:border-[rgba(242,159,4,0.6)] hover:text-accent-text"
                >
                  <Share2 className="size-5" aria-hidden="true" />
                </button>
              </div>

              <ProductCalculatorLink
                productId={product.id}
                designation={product.designation}
                categoryId={(product as any)?.categorie?.id ?? null}
                parentCategoryId={(product as any)?.categorie?.parent_id ?? null}
              />

              {/* Advice: the store's verified phone and WhatsApp */}
              <div className="flex flex-wrap items-center gap-3 rounded-[1.4rem] border border-border bg-muted/40 p-4">
                <span className="grid size-11 shrink-0 place-items-center rounded-full bg-ink text-brand-yellow dark:bg-white/10" aria-hidden="true"><Headset className="size-5" /></span>
                <div className="min-w-[11rem] flex-1">
                  <p className="text-sm font-semibold">{tx("adviceTitle")}</p>
                  <p className="text-xs text-muted-foreground">{tx("adviceDesc")}</p>
                </div>
                <div className="ms-auto flex gap-2">
                  <a href={CONTACT.phoneHref} className="inline-flex h-10 items-center gap-1.5 rounded-full border border-border bg-card px-3.5 text-xs font-semibold transition-colors duration-500 hover:border-foreground/40">
                    <Phone className="size-3.5" aria-hidden="true" />{tx("call")}
                  </a>
                  {whatsapp && (
                    <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center gap-1.5 rounded-full bg-[#25d366] px-3.5 text-xs font-semibold text-[#06361b] transition-[filter] duration-500 hover:brightness-105">
                      <MessageCircle className="size-3.5" aria-hidden="true" />WhatsApp
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Description + technical sheet */}
        {(description || product.fiche_technique) && (
          <section className="mt-16 grid gap-8 border-t border-border pt-12 lg:mt-24 lg:grid-cols-12 lg:gap-12 lg:pt-16" aria-labelledby="product-details-title">
            <div className="lg:col-span-4">
              <p className="kicker flex items-center gap-3" data-reveal><span className="h-px w-8 bg-[var(--accent-text)]" aria-hidden="true" />{tx("detailsKicker")}</p>
              <h2 id="product-details-title" className="display-lg mt-4 text-3xl sm:text-4xl" data-reveal>{description ? t("descriptionHeading") : tx("detailsKicker")}</h2>
            </div>
            <div className="min-w-0 space-y-10 lg:col-span-8">
              {description && (looksLikeHtml(description) ? (
                <div
                  className="max-w-3xl text-base leading-relaxed text-muted-foreground [&_a]:text-accent-text [&_a]:underline [&_h3]:mt-6 [&_h3]:font-semibold [&_h3]:text-foreground [&_li]:my-1 [&_ol]:ms-5 [&_ol]:list-decimal [&_p]:my-3 [&_strong]:text-foreground [&_ul]:ms-5 [&_ul]:list-disc"
                  dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(description, { USE_PROFILES: { html: true } }) }}
                />
              ) : (
                <p className="max-w-3xl whitespace-pre-line text-base leading-relaxed text-muted-foreground">{description}</p>
              ))}
              {product.fiche_technique && <TechnicalSheet fiche={product.fiche_technique} />}
            </div>
          </section>
        )}
      </div>

      {/* Similar products */}
      {similarProducts.length > 0 && (
        <section className="border-t border-border bg-muted/30 py-16 lg:py-24">
          <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
            <ProductSuggestions
              products={similarProducts}
              title={t("similarTitle")}
              description={t("similarDesc")}
            />
          </div>
        </section>
      )}

      {/* Mobile buy bar (the floating contact button lifts above it) */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 pt-3 backdrop-blur-xl lg:hidden" style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}>
        <div className="mx-auto flex max-w-xl items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-muted-foreground">{baseDesignation}</p>
            <p className="text-lg font-extrabold tabular">{currentPrice.toFixed(2)} <span className="text-[11px] font-bold uppercase text-accent-text">{unitRate}</span></p>
          </div>
          <button type="button" onClick={handleAddToCart} disabled={isAddingToCart} className="inline-flex h-12 shrink-0 cursor-pointer items-center gap-2 rounded-full bg-gold px-5 text-sm font-semibold text-ink disabled:opacity-70">
            <ShoppingCart className="size-4" aria-hidden="true" />{tProductCard("addToCart")}
          </button>
        </div>
      </div>
    </div>
  )
}
