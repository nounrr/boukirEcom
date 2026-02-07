"use client"

import { useCart } from "@/components/layout/cart-context-provider"
import { useAuthDialog } from "@/components/providers/auth-dialog-provider"
import { ProductGallery } from "@/components/shop/product-gallery"
import { ProductSuggestions } from "@/components/shop/product-suggestions"
import { VariantSelector } from "@/components/shop/variant-selector"
import { TechnicalSheet } from "@/components/shop/technical-sheet"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"
import { isOutOfStockLike } from "@/lib/stock"
import { useGetProductQuery } from "@/state/api/products-api-slice"
import {
  useAddToWishlistMutation,
  useRemoveFromWishlistByProductMutation
} from "@/state/api/wishlist-api-slice"
import { useAppSelector } from "@/state/hooks"
import { Heart, Minus, Package, Plus, Share2, ShoppingCart, Tag } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { notFound, useParams } from "next/navigation"
import { useEffect, useMemo, useState } from "react"

export default function ProductPage() {
  const params = useParams()
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

  const [quantity, setQuantity] = useState(1)
  const [selectedImage, setSelectedImage] = useState(0)
  const [displayImages, setDisplayImages] = useState<{ id: number; image_url: string }[]>([])
  const goPrevImage = () => setSelectedImage((i) => (i - 1 + (displayImages?.length || 1)) % (displayImages?.length || 1))
  const goNextImage = () => setSelectedImage((i) => (i + 1) % (displayImages?.length || 1))
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null)
  const [isAddingToCart, setIsAddingToCart] = useState(false)
  const [selectedUnitId, setSelectedUnitId] = useState<number | null>(null)

  // If user enters an obviously invalid id, render 404 immediately.
  // (Prevents showing a generic error UI for routes like /product/ss)
  useEffect(() => {
    const rawId = (params as any)?.id
    const id = Array.isArray(rawId) ? rawId?.[0] : rawId
    if (typeof id === "string" && id.trim().length > 0 && !/^\d+$/.test(id)) {
      notFound()
    }
  }, [params])

  // Fetch product from API
  const { data: product, isLoading, isError, error, refetch } = useGetProductQuery(params.id as string)
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
    const newQuantity = quantity + delta
    if (newQuantity >= 1 && newQuantity <= product.quantite_disponible) {
      setQuantity(newQuantity)
    }
  }

  const handleAddToCart = async () => {
    if (!product) return

    const outOfStock = isOutOfStockLike({
      stock: (product as any)?.quantite_disponible,
      quantite_disponible: (product as any)?.quantite_disponible,
      in_stock: (product as any)?.in_stock,
      inStock: (product as any)?.inStock,
    })
    if (outOfStock) {
      toast.error(tCommon("error"), { description: tProductCard("outOfStock") })
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
      category: product.categorie?.nom || t("categoryFallback"),
      stock: product.quantite_disponible,
    }

    if (cartRef?.current) {
      try {
        await cartRef.current.addItem(cartItem)
        toast.success(t("addedToCartTitle"), {
          description: t("addedToCartDesc", { quantity, name: baseName }),
        })

        setTimeout(() => {
          cartRef.current?.open()
        }, 300)
      } catch (error) {
        const data = (error as any)?.data
        const code = data?.code || data?.error
        const message = data?.message
        if (code === "out_of_stock" || message === "out_of_stock") {
          toast.error(tCommon("error"), { description: tProductCard("outOfStock") })
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

  if (isLoading) {
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
    const status = (error as any)?.status
    if (status === 404 || status === 400) {
      notFound()
    }
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center space-y-4">
          <Package className="w-16 h-16 mx-auto text-muted-foreground" />
          <h1 className="text-2xl font-bold">{t("loadErrorTitle")}</h1>
          <p className="text-muted-foreground">{t("loadErrorDesc")}</p>
        </div>
      </div>
    )
  }

  if (!product) {
    notFound()
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



  const baseDesignation = getLocalizedDesignation(product)
  const titleVariantLabel = (selectedVariantObj as any)?.variant_name || (selectedVariantObj as any)?.name
  const titleUnitLabel = (activeUnit as any)?.unit_name || (activeUnit as any)?.name || product.base_unit
  const titleSuffixParts = [titleVariantLabel, titleUnitLabel].filter(Boolean)
  const titleDisplayName = titleSuffixParts.length > 0
    ? `${baseDesignation} • ${titleSuffixParts.join(' · ')}`
    : baseDesignation

  const isOutOfStock = isOutOfStockLike({
    quantite_disponible: (product as any)?.quantite_disponible,
    in_stock: (product as any)?.in_stock,
    inStock: (product as any)?.inStock,
  })

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
              altText={baseDesignation}
              onMainClick={() => goNextImage()}
              showIndex
              maxHeight={520}
              thumbSize={72}
              thumbsOnLeft={!isArabic}
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
              {titleDisplayName}
            </h1>

            {/* Price */}
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold text-foreground">
                  {currentPrice.toFixed(2)} {currency}
                </span>
                {hasDiscount && product.pourcentage_promo && (
                  <Badge className="bg-red-500 hover:bg-red-600 text-white text-xs px-2 py-0.5 h-6 font-bold">
                    -{product.pourcentage_promo}%
                  </Badge>
                )}
              </div>
              {hasDiscount && (
                <span className="text-base text-muted-foreground line-through">
                  {Number(baseUnitPrice).toFixed(2)} {currency}
                </span>
              )}
            </div>

            {/* Stock Status */}
            <div className="flex items-center gap-2">
              {!isOutOfStock && product.quantite_disponible > 0 ? (
                <>
                  <Badge variant="outline" className="border-green-500/50 text-green-600 text-xs px-2 py-0.5">
                    {t("inStock")}
                  </Badge>
                  {/* <span className="text-xs text-muted-foreground">
                    {product.quantite_disponible} unités disponibles
                  </span> */}
                </>
              ) : (
                  <Badge variant="destructive" className="text-xs text-white">{tProductCard("outOfStock")}</Badge>
              )}
            </div>
            <Separator />

            <div className="cursor-pointer">
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
                style="circle"
              />
            </div>

            {/* Units Selector */}
            {(product.units && product.units.length > 0) && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">{t("unitLabel")}</label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.units.map((u: any) => (
                    <button
                      key={u.id}
                      onClick={() => setSelectedUnitId(u.id)}
                      className={cn(
                        "px-3 py-1.5 text-sm font-medium rounded-md border transition-all cursor-pointer",
                        selectedUnitId === u.id
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border hover:border-primary/50 hover:bg-muted/50"
                      )}
                      title={u.unit_name || u.name}
                    >
                      <span className="mr-2 rtl:mr-0 rtl:ml-2">{u.unit_name || u.name}</span>
                      {typeof u.prix_vente === 'number' && (
                        <span className="text-xs text-muted-foreground">{Number(u.prix_vente).toFixed(2)} {currency}</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <Separator />

            {/* Quantity Selector */}
            <div className="space-y-2">
              <label className="text-sm font-medium">{t("quantityLabel")}</label>
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
                    disabled={isOutOfStock || quantity >= product.quantite_disponible}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>
                <span className="text-sm text-muted-foreground">
                  {t("totalLabel")}: <span className="font-semibold text-foreground">{(currentPrice * quantity).toFixed(2)} {currency}</span>
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                size="lg"
                className="flex-1 h-11 text-sm font-semibold"
                onClick={handleAddToCart}
                disabled={isAddingToCart || isOutOfStock || product.quantite_disponible === 0}
              >
                <ShoppingCart className="w-4 h-4 mr-2 rtl:mr-0 rtl:ml-2" />
                {tProductCard("addToCart")}
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
                <h3 className="text-sm font-semibold">{t("descriptionHeading")}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Technical Sheet - Full Width Below */}
        {product.fiche_technique && (
          <div className="mt-8">
            <TechnicalSheet fiche={product.fiche_technique} />
          </div>
        )}
      </div>

      {/* Similar Products */}
      {similarProducts.length > 0 && (
        <div className="bg-muted/30 py-12 mt-12">
          <div className="container mx-auto px-6 sm:px-8 lg:px-16">
            <ProductSuggestions
              products={similarProducts}
              title={t("similarTitle")}
              description={t("similarDesc")}
            />
          </div>
        </div>
      )}
    </div>
  )
}
