'use client'

import { ChevronRight, Home, Store, Package, ShoppingCart, Heart, CreditCard, UserCircle, Settings as SettingsIcon, LogIn, UserPlus, Tag } from 'lucide-react'
import Link from "next/link"
import { usePathname, useSearchParams } from "next/navigation"
import * as React from "react"
import { useLocale, useTranslations } from 'next-intl'
import { useGetProductQuery } from '@/state/api/products-api-slice'
import { useGetOrderQuery } from '@/state/api/orders-api-slice'
import { getSupportedLocales } from '@/components/i18n/locale-preference-initializer'

import { 
  Breadcrumb,
  BreadcrumbEllipsis,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

export function DynamicBreadcrumb() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const locale = useLocale()
  const t = useTranslations('breadcrumb')

  const supportedLocales = getSupportedLocales()

  // Detect product ID from the current path to fetch product name
  const pathParts = pathname.split('/').filter(Boolean)
  const filteredPartsForId = pathParts.filter(part => !(supportedLocales as readonly string[]).includes(part))
  const productIdx = filteredPartsForId.indexOf('product')
  const productId = productIdx !== -1 ? filteredPartsForId[productIdx + 1] : undefined
  const { data: productData } = useGetProductQuery(productId as string, { skip: !productId })

  // Detect order ID from the current path to fetch order number
  const ordersIdx = filteredPartsForId.indexOf('orders')
  const orderId = ordersIdx !== -1 ? filteredPartsForId[ordersIdx + 1] : undefined
  const { data: orderData } = useGetOrderQuery({ id: orderId as string }, { skip: !orderId })

  const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
    'shop': Store,
    'products': Package,
    'product': Package,
    'cart': ShoppingCart,
    'wishlist': Heart,
    'checkout': CreditCard,
    'profile': UserCircle,
    'orders': Package,
    'settings': SettingsIcon,
    'category': Tag,
    'login': LogIn,
    'register': UserPlus,
  }

  const segments = React.useMemo(() => {
    const parts = pathname.split('/').filter(Boolean)
    // Filter out locale segments (fr/ar/en/zh)
    const filteredParts = parts.filter(part => !(supportedLocales as readonly string[]).includes(part))

    return filteredParts.map((part, index) => {
      // Check if we're in shop context
      const isInShopSection = pathname.includes('/shop')
      const isInProductSection = pathname.includes('/products')
      const isInCategorySection = pathname.includes('/category')

      // Handle category with query params
      if (part === 'category' && searchParams.has('name')) {
        const categoryName = searchParams.get('name')
        const partIndex = parts.indexOf(part)
        return {
          title: categoryName || t('category'),
          href: '/' + parts.slice(0, partIndex + 1).join('/') + `?name=${categoryName}`,
          active: index === filteredParts.length - 1,
          icon: iconMap['category']
        }
      }

      // Handle shop with filters
      if (part === 'shop' && searchParams.has('search')) {
        const search = searchParams.get('search')
        const partIndex = parts.indexOf(part)
        return {
          title: t('shop'),
          href: '/' + parts.slice(0, partIndex + 1).join('/'),
          filter: search,
          active: index === filteredParts.length - 1,
          icon: iconMap['shop']
        }
      }

      // On product pages, show "Shop" instead of "Product" in the trail
      if (part === 'product') {
        return {
          title: t('shop'),
          href: `/${locale}/shop`,
          active: false,
          icon: iconMap['shop']
        }
      }

      // Handle product ID (skip it as a segment since it's part of product route)
      if (filteredParts[index - 1] === 'product' && !isNaN(Number(part))) {
        const productName = productData?.designation || searchParams.get('name') || t('productNumber', { id: part })
        const partIndex = parts.indexOf(part)
        return {
          title: productName,
          href: '/' + parts.slice(0, partIndex + 1).join('/'),
          active: index === filteredParts.length - 1,
          icon: iconMap['product']
        }
      }

      // Handle order ID - display order number instead
      if (filteredParts[index - 1] === 'orders' && !isNaN(Number(part))) {
        const orderNumber = orderData?.orderNumber || part
        const partIndex = parts.indexOf(part)
        return {
          title: t('orderNumber', { id: orderNumber }),
          href: '/' + parts.slice(0, partIndex + 1).join('/'),
          active: index === filteredParts.length - 1,
          icon: iconMap['orders']
        }
      }

      // Default handling for main pages
      const titleMap: Record<string, string> = {
        'shop': t('shop'),
        'products': t('products'),
        'product': t('product'),
        'cart': t('cart'),
        'wishlist': t('wishlist'),
        'checkout': t('checkout'),
        'profile': t('profile'),
        'orders': t('orders'),
        'settings': t('settings'),
        'category': t('category'),
        'login': t('login'),
        'register': t('register'),
      }

      return {
        title: titleMap[part] || part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, ' '),
        href: '/' + parts.slice(0, parts.indexOf(part) + 1).join('/'),
        active: index === filteredParts.length - 1,
        icon: iconMap[part]
      }
    })
  }, [pathname, searchParams, t, productData?.designation, orderData?.orderNumber, locale, supportedLocales])

  const [maxItems, setMaxItems] = React.useState(3)
  const visibleItems = segments.slice(-maxItems)
  const hiddenItems = segments.slice(0, -maxItems)

  React.useEffect(() => {
    const updateMaxItems = () => {
      // Mobile app feel: keep breadcrumbs compact on smaller screens.
      // - < md: show last 2
      // - md: show last 3
      // - lg+: show full trail
      const w = window.innerWidth
      setMaxItems(w >= 1024 ? segments.length : w >= 768 ? 3 : 2)
    }
    updateMaxItems()
    window.addEventListener('resize', updateMaxItems)
    return () => window.removeEventListener('resize', updateMaxItems)
  }, [segments.length])

  if (!segments.length) return null

  return (
    <div className="bg-background/60 backdrop-blur-sm border-b border-border/20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-16 py-2 sm:py-3 md:py-4">
        <Breadcrumb>
          <BreadcrumbList className="flex-nowrap md:flex-wrap gap-1 overflow-x-auto md:overflow-visible">
            <BreadcrumbItem>
              <BreadcrumbLink 
                href={`/${locale}`} 
                className="group flex items-center gap-1 px-2 py-1 rounded-md text-[11px] sm:text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
              >
                <Home className="h-3 w-3 sm:h-3.5 sm:w-3.5 group-hover:scale-110 transition-transform duration-200" />
                <span className="hidden md:inline text-sm font-medium">{t('home')}</span>
              </BreadcrumbLink>
            </BreadcrumbItem>

            {hiddenItems.length > 0 && (
              <>
                <BreadcrumbSeparator>
                  <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground/50" />
                </BreadcrumbSeparator>
                <BreadcrumbItem>
                  <DropdownMenu>
                    <DropdownMenuTrigger className="flex items-center gap-1 px-2 py-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]">
                      <BreadcrumbEllipsis className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                      <span className="sr-only">{t('showMore')}</span>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="start" className="bg-background/98 backdrop-blur-xl border-border/40 shadow-xl">
                      {hiddenItems.map((item) => {
                        const Icon = item.icon
                        return (
                          <DropdownMenuItem key={item.href} asChild>
                            <Link href={item.href} className="flex items-center gap-2 cursor-pointer">
                              {Icon && <Icon className="h-3.5 w-3.5 text-muted-foreground" />}
                              <span className="text-sm">{item.title}</span>
                            </Link>
                          </DropdownMenuItem>
                        )
                      })}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </BreadcrumbItem>
              </>
            )}

            {visibleItems.map((item) => {
              const Icon = item.icon
              return (
                <React.Fragment key={item.href}>
                  <BreadcrumbSeparator>
                    <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-muted-foreground/50" />
                  </BreadcrumbSeparator>
                  <BreadcrumbItem>
                    {item.active ? (
                      <BreadcrumbPage className="flex items-center gap-1 px-2 py-1 rounded-md bg-primary/10 text-primary">
                        {Icon && <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5 shrink-0" />}
                        <span className="text-[11px] sm:text-sm font-semibold inline-block truncate max-w-56 sm:max-w-90 md:max-w-[560px] lg:max-w-[720px]">
                          {item.title}
                        </span>
                      </BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink 
                        href={item.href} 
                          className="group flex items-center gap-1 px-2 py-1 rounded-md text-[11px] sm:text-sm text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-all duration-200 outline-none focus-visible:border-ring focus-visible:ring-ring/50 focus-visible:ring-[3px]"
                      >
                          {Icon && <Icon className="h-3 w-3 sm:h-3.5 sm:w-3.5 group-hover:scale-110 transition-transform duration-200 shrink-0" />}
                          <span className="font-medium">{item.title}</span>
                        {item.filter && (
                            <span className="ml-1 text-[10px] sm:text-xs text-muted-foreground/70 italic">
                            ({item.filter})
                          </span>
                        )}
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </React.Fragment>
              )
            })}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
    </div>
  )
}
