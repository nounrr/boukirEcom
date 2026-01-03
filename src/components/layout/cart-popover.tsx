"use client"

import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useAppSelector } from "@/state/hooks"
import { 
  CartItem,
  useGetCartQuery, 
  useAddToCartMutation, 
  useUpdateCartItemMutation, 
  useRemoveFromCartMutation 
} from "@/state/api/cart-api-slice"
import { ShoppingCart, Trash2, Plus, Minus, ShoppingBag, ArrowRight, Package2 } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import Image from "next/image"
import Link from "next/link"
import { cn } from "@/lib/utils"
import { forwardRef, useImperativeHandle, useState, useEffect } from "react"

const CART_STORAGE_KEY = 'boukir_guest_cart'

export interface CartPopoverRef {
  open: () => void
  close: () => void
  addItem: (item: CartItem) => void
}

export const CartPopover = forwardRef<CartPopoverRef>((props, ref) => {
  const t = useTranslations('cart')
  const locale = useLocale()
  const { isAuthenticated } = useAppSelector((state) => state.user)
  const [isOpen, setIsOpen] = useState(false)
  
  // Local state for cart items (used for guests)
  const [localItems, setLocalItems] = useState<CartItem[]>([])
  
  // RTK Query hooks (used for authenticated users)
  const { data: backendCart, refetch: refetchCart } = useGetCartQuery(undefined, {
    skip: !isAuthenticated, // Only fetch if authenticated
  })
  const [addToCartApi] = useAddToCartMutation()
  const [updateCartApi] = useUpdateCartItemMutation()
  const [removeFromCartApi] = useRemoveFromCartMutation()
  
  // Determine which cart to use
  const items = isAuthenticated ? (backendCart?.items || []) : localItems
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0)
  
  // Debug: Log component mount
  useEffect(() => {
    console.log('🎨 CartPopover component mounted')
  }, [])

  // Refetch cart when popover opens (for authenticated users)
  useEffect(() => {
    if (isOpen && isAuthenticated) {
      console.log('🔄 Cart popover opened, refetching cart data...')
      refetchCart()
    }
  }, [isOpen, isAuthenticated, refetchCart])

  // Load from localStorage on mount (for guests)
  useEffect(() => {
    if (!isAuthenticated && typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem(CART_STORAGE_KEY)
        if (stored) {
          setLocalItems(JSON.parse(stored))
          console.log('👤 Loaded cart from localStorage')
        }
      } catch (error) {
        console.error('Error loading cart from localStorage:', error)
      }
    }
  }, [isAuthenticated])
  
  // Save to localStorage whenever local items change (for guests)
  useEffect(() => {
    if (!isAuthenticated && typeof window !== 'undefined') {
      try {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(localItems))
      } catch (error) {
        console.error('Error saving cart to localStorage:', error)
      }
    }
  }, [localItems, isAuthenticated])
  
  // Expose methods via ref
  useImperativeHandle(ref, () => {
    console.log('🔧 CartPopover ref initialized')
    return {
      open: () => setIsOpen(true),
      close: () => setIsOpen(false),
      addItem: async (item: CartItem) => {
        if (isAuthenticated) {
          // Authenticated: Call API
          try {
            await addToCartApi({
              productId: item.productId,
              variantId: item.variantId,
              quantity: item.quantity,
            }).unwrap()
            console.log('🔐 Item added to backend cart')
            await refetchCart()
          } catch (error) {
            console.error('❌ Failed to add to backend cart:', error)
          }
        } else {
          // Guest: Update local state + localStorage
          setLocalItems(prev => {
            const itemKey = item.variantId
              ? `${item.productId}-${item.variantId}`
              : `${item.productId}`

            const existingIndex = prev.findIndex(i => {
              const key = i.variantId ? `${i.productId}-${i.variantId}` : `${i.productId}`
              return key === itemKey
            })

            if (existingIndex >= 0) {
              const newItems = [...prev]
              newItems[existingIndex].quantity += item.quantity
              return newItems
            } else {
              return [...prev, item]
            }
          })
          console.log('👤 Item added to localStorage cart')
        }
      },
    }
  }, [isAuthenticated, addToCartApi, refetchCart])
  
  const handleRemoveItem = async (item: CartItem) => {
    if (isAuthenticated) {
      try {
        if (!item.id) {
          console.error('❌ Cart item ID missing')
          return
        }
        await removeFromCartApi({ id: item.id }).unwrap()
        console.log('🔐 Item removed from backend')
        refetchCart()
      } catch (error) {
        console.error('❌ Failed to remove from backend:', error)
      }
    } else {
      setLocalItems(prev => {
        const itemKey = item.variantId ? `${item.productId}-${item.variantId}` : `${item.productId}`
        return prev.filter(i => {
          const key = i.variantId ? `${i.productId}-${i.variantId}` : `${i.productId}`
          return key !== itemKey
        })
      })
      console.log('👤 Item removed from localStorage')
    }
  }
  
  const handleUpdateQuantity = async (item: CartItem, quantity: number) => {
    if (quantity <= 0) {
      handleRemoveItem(item)
      return
    }
    
    if (isAuthenticated) {
      try {
        if (!item.id) {
          console.error('❌ Cart item ID missing')
          return
        }
        await updateCartApi({ id: item.id, quantity }).unwrap()
        console.log('🔐 Quantity updated in backend')
        refetchCart()
      } catch (error) {
        console.error('❌ Failed to update backend:', error)
      }
    } else {
      setLocalItems(prev => {
        const itemKey = item.variantId ? `${item.productId}-${item.variantId}` : `${item.productId}`
        return prev.map(i => {
          const key = i.variantId ? `${i.productId}-${i.variantId}` : `${i.productId}`
          if (key === itemKey) {
            return { ...i, quantity }
          }
          return i
        })
      })
      console.log('👤 Quantity updated in localStorage')
    }
  }

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="relative hover:bg-muted/50 transition-all duration-200 h-9 w-9 group">
          <ShoppingCart className="w-4.5 h-4.5 text-muted-foreground group-hover:text-foreground transition-colors duration-200" />
          <Badge className="absolute -top-0.5 ltr:-right-0.5 rtl:-left-0.5 h-4.5 w-4.5 flex items-center justify-center p-0 text-[10px] font-semibold bg-primary text-primary-foreground shadow-md shadow-primary/20 group-hover:scale-105 transition-transform duration-200 border border-background">
            {itemCount}
          </Badge>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-[420px] p-0 bg-background/98 backdrop-blur-2xl border-border/40 shadow-xl shadow-black/10">
        <DropdownMenuLabel className="p-0 mb-1">
          <div className="relative overflow-hidden rounded-t-lg bg-gradient-to-br from-muted/50 via-muted/30 to-transparent p-3.5 border-b border-border/40">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary via-primary/90 to-primary/80 flex items-center justify-center shadow-md shadow-primary/15 ring-1 ring-primary/20">
                  <ShoppingBag className="w-5 h-5 text-primary-foreground" />
                </div>
                <div className="flex flex-col gap-0.5">
                  <p className="text-sm font-semibold text-foreground">Panier</p>
                  <p className="text-[11px] text-muted-foreground">
                    {itemCount} article{itemCount !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              {itemCount > 0 && (
                <div className="text-right">
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-lg font-bold text-foreground">{total.toFixed(2)} MAD</p>
                </div>
              )}
            </div>
          </div>
        </DropdownMenuLabel>

        {items.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted/50 flex items-center justify-center">
              <Package2 className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <p className="text-sm font-medium text-foreground mb-1">Votre panier est vide</p>
            <p className="text-xs text-muted-foreground mb-4">Ajoutez des articles pour commencer vos achats</p>
            <Link href={`/${locale}/shop`}>
              <Button size="sm" className="bg-gradient-to-r from-primary via-primary/95 to-primary/90 hover:from-primary/95 hover:via-primary hover:to-primary shadow-md shadow-primary/15">
                Parcourir les produits
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="max-h-[360px] overflow-y-auto overscroll-contain px-1.5 py-2">
              <div className="space-y-1.5">
                {items.map((item) => (
                  <div
                    key={`${item.productId}-${item.variantId || ''}`}
                    className="group flex items-start gap-3 p-2.5 rounded-lg hover:bg-muted/50 transition-all duration-200"
                  >
                    {/* Product Image */}
                    <div className="relative w-16 h-16 shrink-0 rounded-md overflow-hidden bg-muted/30 ring-1 ring-border/20">
                      {item.image ? (
                        <Image
                          src={item.image}
                          alt={item.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package2 className="w-6 h-6 text-muted-foreground/30" />
                        </div>
                      )}
                    </div>

                    {/* Product Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-medium text-foreground line-clamp-1 mb-1">
                        {item.name}
                      </h4>
                      <p className="text-xs font-semibold text-primary mb-2">
                        {item.price.toFixed(2)} MAD
                      </p>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1 bg-muted/50 rounded-md border border-border/30">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleUpdateQuantity(item, item.quantity - 1)}
                            className="h-6 w-6 hover:bg-muted transition-colors"
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="text-xs font-medium min-w-5 text-center">
                            {item.quantity}
                          </span>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleUpdateQuantity(item, item.quantity + 1)}
                            className="h-6 w-6 hover:bg-muted transition-colors"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>

                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleRemoveItem(item)}
                          className="h-6 w-6 hover:bg-destructive/10 hover:text-destructive transition-all ml-auto opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </div>
                    </div>

                    {/* Subtotal */}
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">
                        {(item.price * item.quantity).toFixed(2)}
                      </p>
                      <p className="text-[10px] text-muted-foreground">MAD</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <DropdownMenuSeparator className="my-0" />

            {/* Cart Actions */}
            <div className="p-3 space-y-2">
              <div className="flex items-center justify-between px-2 py-1.5 bg-muted/30 rounded-md">
                <span className="text-sm font-medium text-foreground">Total</span>
                <span className="text-lg font-bold text-foreground">{total.toFixed(2)} MAD</span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Link href={`/${locale}/cart`} className="w-full">
                  <Button variant="outline" className="w-full border-border/60 hover:bg-muted/50 transition-all duration-200">
                    Voir le panier
                  </Button>
                </Link>
                <Link href={`/${locale}/checkout`} className="w-full">
                  <Button className="w-full bg-gradient-to-r from-primary via-primary/95 to-primary/90 hover:from-primary/95 hover:via-primary hover:to-primary shadow-md shadow-primary/15 hover:shadow-lg hover:shadow-primary/20 transition-all duration-200">
                    Commander
                    <ArrowRight className="w-3.5 h-3.5 ml-1.5" />
                  </Button>
                </Link>
              </div>
            </div>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
})

CartPopover.displayName = 'CartPopover'
