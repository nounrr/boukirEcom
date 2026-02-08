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
import { useAppDispatch, useAppSelector } from "@/state/hooks"
import { clearAuth } from "@/state/slices/user-slice"
import { AnimatePresence, motion } from "framer-motion"
import { ChevronDown, Home, LogOut, Menu, Package, Store, UserCircle2 } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import Image from "next/image"
import Link from "next/link"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { useEffect, useRef, useState } from "react"
import { useCart } from "./cart-context-provider"
import { CartPopover } from "./cart-popover"
import { HeaderSearch } from "./header-search"
import { WishlistIcon } from "./wishlist-icon"

import { CategoriesMegaMenu } from "./categories-mega-menu"
import { CategoriesMobileMenu } from "./categories-mobile-menu"

import {
  getSupportedLocales,
  setPreferredLocale,
  type SupportedLocale,
} from "@/components/i18n/locale-preference-initializer"
import { API_CONFIG } from "@/lib/api-config"

export function Header() {
  const t = useTranslations('header')
  const tCommon = useTranslations('common')
  const tFilters = useTranslations('productFilters')
  const locale = useLocale()
  const isArabic = locale === 'ar'
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const dispatch = useAppDispatch()
  const { user, isAuthenticated, accessToken } = useAppSelector((state) => state.user)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isHeaderVisible, setIsHeaderVisible] = useState(true)
  const isAuthLoading = !!accessToken && !user

  const lastScrollYRef = useRef(0)
  const tickingRef = useRef(false)
  const headerVisibleRef = useRef(true)

  useEffect(() => {
    headerVisibleRef.current = isHeaderVisible
  }, [isHeaderVisible])

  useEffect(() => {
    if (typeof window === "undefined") return

    lastScrollYRef.current = window.scrollY

    const handleScroll = () => {
      if (tickingRef.current) return
      tickingRef.current = true

      window.requestAnimationFrame(() => {
        const currentY = window.scrollY
        const lastY = lastScrollYRef.current
        const delta = currentY - lastY

        // Near the top, always show the header.
        if (currentY < 24) {
          if (!headerVisibleRef.current) setIsHeaderVisible(true)
          lastScrollYRef.current = currentY
          tickingRef.current = false
          return
        }

        // While mobile menu is open, keep the header visible.
        if (isMobileMenuOpen) {
          if (!headerVisibleRef.current) setIsHeaderVisible(true)
          lastScrollYRef.current = currentY
          tickingRef.current = false
          return
        }

        // Add a small dead-zone to avoid flicker.
        const HIDE_THRESHOLD = 10
        const SHOW_THRESHOLD = 8

        if (delta > HIDE_THRESHOLD && headerVisibleRef.current) {
          setIsHeaderVisible(false)
        } else if (delta < -SHOW_THRESHOLD && !headerVisibleRef.current) {
          setIsHeaderVisible(true)
        }

        lastScrollYRef.current = currentY
        tickingRef.current = false
      })
    }

    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [isMobileMenuOpen])

  const supportedLocales = getSupportedLocales()

  const languageMeta: Record<SupportedLocale, { label: string; flagCode: string; short: string }> = {
    fr: { label: "Français", flagCode: "fr", short: "FR" },
    ar: { label: "العربية", flagCode: "ma", short: "AR" },
    en: { label: "English", flagCode: "gb", short: "EN" },
    zh: { label: "中文", flagCode: "cn", short: "ZH" },
  }

  const stripLocalePrefix = (value: string): string => {
    const parts = value.split("/").filter(Boolean)
    if (parts.length > 0 && (supportedLocales as readonly string[]).includes(parts[0])) {
      parts.shift()
    }
    return `/${parts.join("/")}`.replace(/\/$/, "") || "/"
  }

  const buildLocalizedHref = (nextLocale: SupportedLocale) => {
    const basePath = stripLocalePrefix(pathname)
    const queryString = searchParams?.toString?.() ?? ""
    const prefix = `/${nextLocale}`
    const path = basePath === "/" ? prefix : `${prefix}${basePath}`
    return queryString ? `${path}?${queryString}` : path
  }

  const handleLocaleChange = (nextLocale: SupportedLocale) => {
    if (nextLocale === (locale as any)) return
    setPreferredLocale(nextLocale)
    setIsMobileMenuOpen(false)
    const href = buildLocalizedHref(nextLocale)
    router.push(href)
    router.refresh()
  }

  // Get cartRef from context
  const { cartRef } = useCart()

  const handleLogout = async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } catch {
      // ignore network errors; still clear client state
    } finally {
      dispatch(clearAuth())
      setIsMobileMenuOpen(false)
      router.replace(`/${locale}/shop`)
      router.refresh()
    }
  }

  const navLinks = [
    { href: `/${locale}`, label: t('home'), icon: Home },
    { href: `/${locale}/shop`, label: t('shop'), icon: Store },
  ]

  const secondaryLinks = [
    { href: `/${locale}/shop`, label: t('shop') },
    { href: `/${locale}/shop?sort=promo`, label: tFilters('sort.bestPromos') },
    { href: `/${locale}/shop?sort=popular`, label: tFilters('sort.popular') },
    { href: `/${locale}/shop`, label: tFilters('brands') },
    ...(isAuthenticated ? [{ href: `/${locale}/orders`, label: t('orders') }] : []),
  ]

  return (
    <>
      <motion.div
        className="sticky top-0 z-50 w-full"
        initial={false}
        animate={{ y: isHeaderVisible ? 0 : "-100%" }}
        transition={{ type: "spring", stiffness: 520, damping: 46, mass: 0.9 }}
        style={{ willChange: "transform" }}
      >
        <header className="w-full shadow-xs shadow-black/10 overflow-x-clip">
          {/* Primary Bar */}
          <div className="bg-primary text-white border-b border-white/15">
            <div className="container mx-auto px-4 sm:px-6 lg:px-16">
              <div className="flex h-[75px] items-center justify-between gap-2 sm:gap-3">
                {/* Logo */}
                <Link href={`/${locale}`} className="flex items-center gap-2.5 shrink-0 group">
                  <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-white flex items-center justify-center shadow-md shadow-black/15 group-hover:shadow-lg group-hover:shadow-black/20 transition-all duration-300 ring-1 ring-black/10 group-hover:ring-black/15">
                    <Image src="/logo.png" alt="Logo" width={32} height={32} className="object-contain h-auto" />
                  </div>
                  <span className="font-bold text-lg hidden sm:block text-white tracking-tight">
                    Boukir
                  </span>
                </Link>

                {/* Desktop Search */}
                <div className="hidden md:flex flex-1 justify-center px-3 lg:px-6">
                  <HeaderSearch
                    placeholder={t('searchPlaceholder')}
                    className="w-full"
                    maxWidthClassName="max-w-[720px]"
                    onSearchDone={() => setIsMobileMenuOpen(false)}
                  />
                </div>

                {/* Actions */}
                <div className="flex items-center gap-0.5 sm:gap-1.5">
                  {/* Mobile Search */}
                  <div className="md:hidden">
                    <HeaderSearch
                      variant="icon"
                      placeholder={t('searchPlaceholder')}
                      onSearchDone={() => setIsMobileMenuOpen(false)}
                    />
                  </div>

                  {/* Wishlist */}
                  <WishlistIcon tone="onPrimary" size="sm" />

                  {/* Cart */}
                  <CartPopover ref={cartRef} tone="onPrimary" size="sm" />

                  {/* Separator after wishlist/cart */}
                  <div className="hidden lg:block h-6 w-px bg-linear-to-b from-transparent via-border/60 to-transparent mx-1.5" />

                  {/* Language */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        className="hidden lg:flex items-center gap-2 h-9 px-3 hover:bg-white/10 border border-transparent hover:border-white/20 rounded-full transition-all duration-200 text-white"
                        aria-label={tCommon('language')}
                      >
                        <img
                          src={`https://flagcdn.com/w20/${languageMeta[(locale as SupportedLocale) || "fr"]?.flagCode ?? "un"}.png`}
                          srcSet={`https://flagcdn.com/w40/${languageMeta[(locale as SupportedLocale) || "fr"]?.flagCode ?? "un"}.png 2x`}
                          alt={languageMeta[(locale as SupportedLocale) || "fr"]?.label ?? "Language"}
                          className="w-5 h-auto shrink-0"
                        />
                        <span className="text-xs font-semibold text-white/90">
                          {languageMeta[(locale as SupportedLocale) || "fr"]?.short ?? String(locale).toUpperCase()}
                        </span>
                        <ChevronDown className="w-3 h-3 text-white/70" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align={isArabic ? "start" : "end"}
                      className="w-56 p-1 bg-background/98 backdrop-blur-2xl border-border/40 shadow-xl shadow-black/10"
                    >
                      <DropdownMenuLabel className="text-xs text-muted-foreground">{tCommon('language')}</DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      {supportedLocales.map((l) => (
                        <DropdownMenuItem
                          key={l}
                          onSelect={(e) => {
                            e.preventDefault()
                            handleLocaleChange(l)
                          }}
                          className="cursor-pointer flex items-center gap-2"
                        >
                          <img
                            src={`https://flagcdn.com/w20/${languageMeta[l].flagCode}.png`}
                            srcSet={`https://flagcdn.com/w40/${languageMeta[l].flagCode}.png 2x`}
                            alt={languageMeta[l].label}
                            className="w-5 h-auto shrink-0"
                          />
                          <span className="text-sm font-medium">{languageMeta[l].label}</span>
                          {l === (locale as any) ? <span className="ml-auto text-xs text-primary">✓</span> : null}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>

                  {/* Separator before user menu */}
                  {isAuthenticated && user && (
                    <div className="hidden lg:block h-6 w-px bg-linear-to-b from-transparent via-border/60 to-transparent mx-1.5" />
                  )}

                  {/* Mobile Menu Toggle */}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="lg:hidden hover:bg-white/10 transition-all duration-200 h-10 w-10"
                    onClick={() => setIsMobileMenuOpen((prev) => !prev)}
                  >
                    <Menu className="w-5 h-5 text-white/85" />
                  </Button>

                  {/* Mobile Profile Avatar */}
                  {isAuthenticated && user ? (
                    <Link
                      href={`/${locale}/profile`}
                      className="lg:hidden inline-flex items-center justify-center h-8 w-8 rounded-full bg-white/10 border border-white/20 hover:bg-white/15 hover:border-white/30 transition-colors overflow-hidden"
                      aria-label={t('profile')}
                    >
                      {user.avatar_url ? (
                        <img
                          src={user.avatar_url.startsWith('http') ? user.avatar_url : `${API_CONFIG.BASE_URL}${user.avatar_url}`}
                          alt={user.prenom || user.email}
                          className="object-cover w-full h-full"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <span className="text-[10px] font-bold text-white">
                          {user.prenom?.[0]?.toUpperCase() || user.nom?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                        </span>
                      )}
                    </Link>
                  ) : null}

                  {/* User Menu */}
                  {isAuthLoading ? (
                    <div className="hidden sm:flex items-center gap-2 pl-3 ml-2 border-l border-white/15">
                      <div className="h-9 w-20 rounded-full bg-white/15 animate-pulse" />
                      <div className="h-9 w-24 rounded-full bg-white/25 animate-pulse" />
                    </div>
                  ) : isAuthenticated && user ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="hidden lg:flex items-center gap-1.5 h-9 px-2 hover:bg-white/10 border border-transparent hover:border-white/20 rounded-full transition-all duration-200 group text-white">
                          <div className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center shrink-0 border border-white/20 group-hover:border-white/30 transition-all duration-200 shadow-sm overflow-hidden">
                            {user.avatar_url ? (
                              <img
                                src={user.avatar_url.startsWith('http') ? user.avatar_url : `${API_CONFIG.BASE_URL}${user.avatar_url}`}
                                alt={user.prenom || user.email}
                                className="object-cover w-full h-full"
                                referrerPolicy="no-referrer"
                              />
                            ) : (
                              <span className="text-[11px] font-bold text-white">
                                {user.prenom?.[0]?.toUpperCase() || user.nom?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                              </span>
                            )}
                          </div>
                          <ChevronDown className="w-3 h-3 text-white/70 group-hover:text-white transition-colors duration-200" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align={isArabic ? "start" : "end"} className="w-64 p-0 bg-background/98 backdrop-blur-2xl border-border/40 shadow-xl shadow-black/10">
                        <DropdownMenuLabel className="p-0 mb-1">
                          <div className="relative overflow-hidden rounded-t-lg bg-linear-to-br from-muted/50 via-muted/30 to-transparent p-3.5 border-b border-border/40">
                            <div className="flex items-center gap-2.5">
                              <div className="relative">
                                <div className="w-10 h-10 rounded-full bg-linear-to-br from-primary via-primary/90 to-primary/80 flex items-center justify-center shrink-0 shadow-md shadow-primary/15 ring-1 ring-primary/20 overflow-hidden">
                                  {user.avatar_url ? (
                                    <img
                                      src={user.avatar_url.startsWith('http') ? user.avatar_url : `${API_CONFIG.BASE_URL}${user.avatar_url}`}
                                      alt={user.prenom || user.email}
                                      className="object-cover w-full h-full"
                                      referrerPolicy="no-referrer"
                                    />
                                  ) : (
                                    <span className="text-sm font-bold text-primary-foreground">
                                      {user.prenom?.[0]?.toUpperCase() || user.nom?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                                    </span>
                                  )}
                                </div>
                                <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-green-500 rounded-full border-[1.5px] border-background shadow-sm" />
                              </div>
                              <div className="flex flex-col gap-0.5 min-w-0 flex-1">
                                <p className="text-sm font-semibold truncate text-foreground">{user.prenom} {user.nom}</p>
                                <p className="text-[11px] text-muted-foreground truncate">{user.email}</p>
                                <span className="inline-flex items-center gap-1 text-[10px] text-primary font-medium mt-0.5">
                                  <span className="w-1 h-1 rounded-full bg-primary animate-pulse" />
                                  Active
                                </span>
                              </div>
                            </div>
                          </div>
                        </DropdownMenuLabel>
                        <div className="px-1.5 pb-1.5">
                          <DropdownMenuItem asChild>
                            <Link href={`/${locale}/profile`} className="cursor-pointer flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-muted/50 transition-all duration-200 group">
                              <div className="w-7 h-7 rounded-md bg-muted/50 flex items-center justify-center group-hover:bg-muted transition-colors duration-200">
                                <UserCircle2 className="w-3.5 h-3.5 text-foreground/70" />
                              </div>
                              <span className="text-sm font-medium text-foreground/90">{t('profile')}</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/${locale}/orders`} className="cursor-pointer flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-muted/50 transition-all duration-200 group">
                              <div className="w-7 h-7 rounded-md bg-muted/50 flex items-center justify-center group-hover:bg-muted transition-colors duration-200">
                                <Package className="w-3.5 h-3.5 text-foreground/70" />
                              </div>
                              <span className="text-sm font-medium text-foreground/90">{t('orders')}</span>
                            </Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator className="my-1" />
                          <DropdownMenuItem asChild>
                            <button
                              type="button"
                              onClick={handleLogout}
                              className="cursor-pointer flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-destructive/10 transition-all duration-200 group w-full"
                            >
                              <div className="w-7 h-7 rounded-md bg-destructive/10 flex items-center justify-center group-hover:bg-destructive/15 transition-colors duration-200">
                                <LogOut className="w-3.5 h-3.5 text-destructive" />
                              </div>
                              <span className="text-sm font-medium text-destructive">{t('logout')}</span>
                            </button>
                          </DropdownMenuItem>
                        </div>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <div className="hidden sm:flex items-center gap-2 pl-3 ml-2 border-l border-white/15">
                      <Link href={`/${locale}/login`}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="bg-white/10 text-white hover:bg-white/15 hover:ring-1 hover:ring-white/20 transition-all duration-200 font-medium h-9 px-4"
                        >
                          {t('login')}
                        </Button>
                      </Link>
                      <Link href={`/${locale}/register`}>
                        <Button
                          size="sm"
                          className="bg-white text-primary hover:bg-white/90 hover:shadow-lg hover:shadow-black/15 shadow-md shadow-black/10 transition-all duration-200 font-semibold h-9 px-4"
                        >
                          {t('register')}
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
          </div>
            </div>
          </div>

          {/* Secondary Nav Bar (Desktop) */}
          <div className="hidden lg:block bg-background text-foreground border-b border-border/40">
            <div className="container mx-auto px-6 sm:px-8 lg:px-16">
              <div className="flex h-14 items-center gap-3">
                <CategoriesMegaMenu tone="onSurface" />
                <nav className="flex items-center gap-1.5 min-w-0">
                  {secondaryLinks.map((link) => (
                    <Link
                      key={link.href + link.label}
                      href={link.href}
                      className={
                        'px-3 py-2 rounded-full text-sm font-semibold text-foreground/85 hover:text-foreground hover:bg-muted/60 transition-colors'
                      }
                    >
                      {link.label}
                    </Link>
                  ))}
                </nav>

                <Link
                  href={`/${locale}/contact`}
                  className="ml-auto inline-flex items-center rounded-full border border-primary/20 bg-primary/10 px-4 py-2 text-sm font-semibold text-primary hover:bg-primary/15 hover:border-primary/30 transition-colors"
                >
                  {t('contactUs')}
                </Link>
              </div>
            </div>
          </div>

          {/* Mobile Menu (within primary background) */}
          <div className="bg-primary text-white lg:hidden">
            <div className="container mx-auto px-4 sm:px-6 lg:px-16">
              <AnimatePresence>
                {isMobileMenuOpen && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.3, ease: "easeInOut" }}
                    className="border-t border-white/15 overflow-hidden"
                  >
                    <div className="py-4">
                      <nav className="flex flex-col gap-2">
                        {navLinks.map((link) => (
                          <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center gap-2 px-2.5 py-2.5 text-sm font-medium text-white/85 hover:text-white hover:bg-white/10 rounded-lg transition-colors capitalize"
                        >
                          <link.icon className="w-4 h-4" />
                          {link.label}
                        </Link>
                      ))}

                        {isAuthenticated ? (
                          <Link
                            href={`/${locale}/orders`}
                            onClick={() => setIsMobileMenuOpen(false)}
                            className="flex items-center gap-2 px-2.5 py-2.5 text-sm font-medium text-white/85 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                          >
                            <Package className="w-4 h-4" aria-hidden="true" />
                            {t('orders')}
                          </Link>
                        ) : null}

                        <Link
                          href={`/${locale}/contact`}
                          onClick={() => setIsMobileMenuOpen(false)}
                          className="flex items-center justify-between gap-2 px-2.5 py-2.5 text-sm font-semibold text-white hover:bg-white/10 rounded-lg transition-colors"
                        >
                          <span>{t('contactUs')}</span>
                          <span className="text-xs text-white/70">→</span>
                        </Link>
                      </nav>

                      {/* Mobile Auth Buttons */}
                      {isAuthLoading ? (
                        <div className="flex gap-3 mt-4 px-3">
                          <div className="flex-1 h-10 rounded-md bg-white/15 animate-pulse" />
                          <div className="flex-1 h-10 rounded-md bg-white/25 animate-pulse" />
                        </div>
                      ) : !isAuthenticated ? (
                        <div className="flex gap-3 mt-4 px-3">
                          <Link href={`/${locale}/login`} className="flex-1">
                            <Button variant="ghost" className="w-full bg-white/10 text-white hover:bg-white/15">
                              {t('login')}
                            </Button>
                          </Link>
                          <Link href={`/${locale}/register`} className="flex-1">
                            <Button className="w-full bg-white text-primary hover:bg-white/90">
                              {t('register')}
                            </Button>
                          </Link>
                        </div>
                      ) : (
                        <div className="mt-4 px-3">
                          <button
                            type="button"
                            onClick={handleLogout}
                            className="w-full flex items-center gap-2 px-2.5 py-2.5 text-sm font-semibold rounded-lg transition-colors border border-destructive/25 bg-destructive/10 text-destructive hover:bg-destructive/15"
                          >
                            <LogOut className="w-4 h-4" aria-hidden="true" />
                            {t('logout')}
                          </button>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </header>

        {/* Categories Dropdown (Mobile) */}
        <div className="lg:hidden bg-background text-foreground border-b border-border/40">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="py-2">
              <CategoriesMobileMenu tone="onSurface" />
            </div>
          </div>
        </div>
      </motion.div>
    </>
  )
}
