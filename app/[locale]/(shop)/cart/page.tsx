"use client"

import { ShopPageLayout } from "@/components/layout/shop-page-layout"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ShoppingCart, Package, Trash2, Plus, Minus } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import { useRouter } from "next/navigation"
import { useGetCartQuery, useUpdateCartItemMutation, useRemoveFromCartMutation, useGetCartSuggestionsQuery } from "@/state/api/cart-api-slice"
import { useAppSelector } from "@/state/hooks"
import { useToast } from "@/hooks/use-toast"
import Image from "next/image"
import Link from "next/link"
import { ProductSuggestions } from "@/components/shop/product-suggestions"
import { useState, useEffect } from "react"
import { formatCartItemName, getCartItemKey } from "@/lib/cart-storage"
import { getLocalizedCartItemBaseName, getLocalizedCartItemCategory } from "@/lib/localized-fields"

// Keep this key in sync with CART_STORAGE_KEY used in cart-popover
const CART_STORAGE_KEY = 'boukir_guest_cart'

interface LocalCartItem {
  id?: number
  productId: number
  variantId?: number
  unitId?: number
  unitName?: string
  variantName?: string
  name: string
  price: number
  quantity: number
  image: string
  category?: string
  purchase_limit?: number
}

export default function CartPage() {
  const locale = useLocale()
  const router = useRouter()
  const { isAuthenticated } = useAppSelector((state) => state.user)
  const toast = useToast()
  const t = useTranslations("cartPage")
  const tCommon = useTranslations("common")
  const currency = tCommon("currency")
  
  // State for localStorage cart (guest users)
  const [localCart, setLocalCart] = useState<LocalCartItem[]>([])
  const [localCartLoading, setLocalCartLoading] = useState(true)

  // Load localStorage cart on mount
  useEffect(() => {
    console.log('[CartPage] mount/useEffect, isAuthenticated =', isAuthenticated)
    if (!isAuthenticated) {
      try {
        const stored = localStorage.getItem(CART_STORAGE_KEY)
        if (stored) {
          const parsed = JSON.parse(stored)
          console.log('[CartPage] loaded from localStorage:', parsed)
          setLocalCart(parsed)
        }
      } catch (error) {
        console.error('Failed to load cart from localStorage:', error)
      }
    }
    setLocalCartLoading(false)
  }, [isAuthenticated])

  // Save to localStorage when localCart changes
  useEffect(() => {
    if (!isAuthenticated && !localCartLoading) {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(localCart))
      } catch (error) {
        console.error('Failed to save cart to localStorage:', error)
      }
    }
  }, [localCart, isAuthenticated, localCartLoading])

  const { data: cart, isLoading: apiLoading } = useGetCartQuery(undefined, {
    skip: !isAuthenticated,
  })

  // Use API cart for authenticated users, localStorage for guests
  const cartItems = isAuthenticated ? (cart?.items || []) : localCart
  const isLoading = isAuthenticated ? apiLoading : localCartLoading
  const isEmpty = !isLoading && cartItems.length === 0
  const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  console.log('[CartPage] state snapshot', {
    isAuthenticated,
    apiLoading,
    localCartLoading,
    cartItemsLength: cartItems.length,
    isEmpty,
    cartItems,
  })

  // Fetch cart suggestions
  const { data: suggestedProducts, isLoading: isSuggestionsLoading } = useGetCartSuggestionsQuery(
    { limit: 4 },
    { skip: !isAuthenticated || isEmpty }
  )

  console.log('Cart suggestions:', { suggestedProducts, isSuggestionsLoading, isAuthenticated, isEmpty })

  const [updateCartItem, { isLoading: isUpdating }] = useUpdateCartItemMutation()
  const [removeFromCart, { isLoading: isRemoving }] = useRemoveFromCartMutation()

  const handleQuantityChange = async (itemId: number, newQuantity: number, productName: string, itemKey?: string) => {
    if (newQuantity < 1) return

    const currentItem = cartItems.find((i: any) => {
      if (isAuthenticated) return i.id === itemId
      return itemKey ? getCartItemKey(i as LocalCartItem) === itemKey : i.productId === itemId
    }) as any

    const rawLimit =
      currentItem?.purchase_limit ??
      currentItem?.purchaseLimit ??
      currentItem?.stock?.purchase_limit ??
      currentItem?.stock?.purchaseLimit
    const purchaseLimit = typeof rawLimit === 'number' && Number.isFinite(rawLimit) ? rawLimit : null
    if (purchaseLimit != null && newQuantity > purchaseLimit) {
      toast.error(tCommon("error"), { description: t("toast.maxQuantityReachedDesc") })
      return
    }

    if (isAuthenticated) {
    // API update for authenticated users
      try {
        await updateCartItem({ id: itemId, quantity: newQuantity }).unwrap()
        toast.success(t("toast.quantityUpdatedTitle"), { description: productName })
      } catch (error) {
        const data = (error as any)?.data
        const code = data?.code || data?.error
        const message = data?.message
        const normalizedCode = typeof code === 'string' ? code.toLowerCase() : ''
        const normalizedMessage = typeof message === 'string' ? message.toLowerCase() : ''

        if (code === 'PURCHASE_LIMIT_EXCEEDED' || normalizedCode === 'purchase_limit_exceeded') {
          toast.error(tCommon("error"), { description: t("toast.maxQuantityReachedDesc") })
        } else if (
          code === 'OUT_OF_STOCK' ||
          normalizedCode === 'out_of_stock' ||
          normalizedMessage === 'out_of_stock' ||
          code === 'INSUFFICIENT_STOCK' ||
          normalizedCode === 'insufficient_stock'
        ) {
          toast.error(tCommon("error"), { description: t("toast.stockChangedDesc") })
        } else {
          toast.error(tCommon("error"), { description: t("toast.quantityUpdateFailedDesc") })
        }
      }
    } else {
      // localStorage update for guests
      setLocalCart(prev => prev.map(item =>
        (itemKey && getCartItemKey(item) === itemKey)
          ? { ...item, quantity: newQuantity }
          : item
      ))
      toast.success(t("toast.quantityUpdatedTitle"), { description: productName })
    }
  }

  const handleRemove = async (itemId: number, productName: string, itemKey?: string) => {
    if (isAuthenticated) {
    // API remove for authenticated users
      try {
        await removeFromCart({ id: itemId }).unwrap()
        toast.success(t("toast.removedTitle"), { description: productName })
      } catch (error) {
        toast.error(tCommon("error"), { description: t("toast.removeFailedDesc") })
      }
    } else {
      // localStorage remove for guests
      setLocalCart(prev => prev.filter(item =>
        itemKey ? getCartItemKey(item) !== itemKey : item.productId !== itemId
      ))
      toast.success(t("toast.removedTitle"), { description: productName })
    }
  }

  if (isLoading) {
    return (
      <ShopPageLayout
        title={t("title")}
        subtitle={tCommon("loading")}
        icon="cart"
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
      title={t("title")}
      subtitle={t("subtitle")}
      icon="cart"
      itemCount={cartItems.length}
      isEmpty={isEmpty}
      emptyState={{
        icon: <ShoppingCart className="w-10 h-10 text-muted-foreground" />,
        title: t("empty.title"),
        description: t("empty.description"),
        actionLabel: t("empty.actionLabel"),
        actionHref: `/${locale}/shop`,
      }}
    >
      <div className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Cart Items */}
          <div className="lg:col-span-2 space-y-4">
            {cartItems.map((item) => {
              const localizedBaseName = getLocalizedCartItemBaseName(item as any, locale)
              const localizedCategory = getLocalizedCartItemCategory(item as any, locale)
              const displayName = formatCartItemName({ ...(item as any), name: localizedBaseName } as any)

              return (
                <div
                  key={item.id || getCartItemKey(item as LocalCartItem)}
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
                            alt={localizedBaseName}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-8 h-8 text-muted-foreground/30" />
                        </div>
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
                          {displayName}
                      </h3>
                    </Link>

                      {localizedCategory && (
                      <p className="text-xs text-muted-foreground mb-3">
                          {localizedCategory}
                      </p>
                    )}
                    {(() => {
                      const variantName = (item as LocalCartItem).variantName;
                      const unitName = (item as LocalCartItem).unitName;

                      if (!variantName && !unitName) return null;

                      return (
                        <p className="text-[11px] text-muted-foreground mb-2">
                          {[
                            variantName
                              ? t("labels.variant", { value: variantName })
                              : null,
                            unitName ? t("labels.unit", { value: unitName }) : null,
                          ]
                            .filter(Boolean)
                            .join(t("labels.separator"))}
                        </p>
                      );
                    })()}

                    {/* Price & Quantity Controls */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {/* Quantity Controls */}
                        <div className="flex items-center border border-border rounded-lg">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-r-none"
                              onClick={() => handleQuantityChange(isAuthenticated ? item.id! : item.productId, item.quantity - 1, localizedBaseName, !isAuthenticated ? getCartItemKey(item as LocalCartItem) : undefined)}
                            disabled={isUpdating || item.quantity <= 1}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="px-3 text-sm font-medium min-w-8 text-center">
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-l-none"
                              onClick={() => handleQuantityChange(isAuthenticated ? item.id! : item.productId, item.quantity + 1, localizedBaseName, !isAuthenticated ? getCartItemKey(item as LocalCartItem) : undefined)}
                            disabled={(() => {
                              if (isUpdating) return true
                              const rawLimit =
                                (item as any)?.purchase_limit ??
                                (item as any)?.purchaseLimit ??
                                (item as any)?.stock?.purchase_limit ??
                                (item as any)?.stock?.purchaseLimit
                              const limit = typeof rawLimit === 'number' && Number.isFinite(rawLimit) ? rawLimit : null
                              return limit != null ? item.quantity >= limit : false
                            })()}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="text-right">
                        <div className="text-lg font-bold text-foreground">
                          {t("price", { price: (item.price * item.quantity).toFixed(2), currency })}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {t("pricePerUnit", { price: item.price.toFixed(2), currency })}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Remove Button */}
                  <div>
                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label={t("aria.removeItem")}
                        onClick={() => handleRemove(isAuthenticated ? item.id! : item.productId, localizedBaseName, !isAuthenticated ? getCartItemKey(item as LocalCartItem) : undefined)}
                      disabled={isRemoving}
                      className="hover:bg-destructive/10 hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
              )
            })}
          </div>

          {/* Cart Summary - Sticky Sidebar */}
          {!isEmpty && (
            <div className="lg:col-span-1">
              <div className="bg-card border border-border rounded-xl p-6 sticky top-24">
                <h3 className="text-lg font-semibold mb-4">{t("summary.title")}</h3>

                <div className="space-y-3 mb-6">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("summary.subtotal")}</span>
                    <span className="font-medium">{t("price", { price: cartTotal.toFixed(2), currency })}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">{t("summary.delivery")}</span>
                    <span className="font-medium">{t("summary.deliveryToCalculate")}</span>
                  </div>
                  <div className="border-t pt-3 flex justify-between">
                    <span className="font-semibold">{t("summary.total")}</span>
                    <span className="text-xl font-bold text-primary">{t("price", { price: cartTotal.toFixed(2), currency })}</span>
                  </div>
                </div>

                <Button
                  className="w-full text-white"
                  size="lg"
                  onClick={() => router.push(`/${locale}/checkout`)}
                >
                  {t("summary.checkout")}
                </Button>

                {/* Items Count */}
                <div className="mt-4 text-center text-sm text-muted-foreground">
                  {t("itemsCount", { count: cartItems.length })}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Suggestions Section - Full Width */}
        {!isEmpty && (
          <ProductSuggestions products={suggestedProducts || []} />
        )}
      </div>
    </ShopPageLayout>
  )
}
