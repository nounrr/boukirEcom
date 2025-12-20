"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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
import { CartPopover } from "./cart-popover"
import { WishlistIcon } from "./wishlist-icon"
import { useCart } from "./cart-context-provider"
import { Heart, Search, ShoppingCart, User, Menu, ChevronDown, Package, Store, Home, LogOut, Settings, X, UserCircle2 } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import Image from "next/image"
import Link from "next/link"
import { useState, useRef, useEffect } from "react"
import { useRouter } from "next/navigation"
import { motion, AnimatePresence } from "framer-motion"

export function Header() {
  const t = useTranslations('header')
  const locale = useLocale()
  const isArabic = locale === 'ar'
  const router = useRouter()
  const { user, isAuthenticated } = useAppSelector((state) => state.user)
  const [searchQuery, setSearchQuery] = useState("")
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const searchInputRef = useRef<HTMLInputElement>(null)

  // Get cartRef from context
  const { cartRef } = useCart()

  useEffect(() => {
    if (isSearchOpen && searchInputRef.current) {
      searchInputRef.current.focus()
    }
  }, [isSearchOpen])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/${locale}/shop?search=${encodeURIComponent(searchQuery)}`)
      setIsSearchOpen(false)
      setSearchQuery("")
    }
  }

  const navLinks = [
    { href: `/${locale}`, label: t('home'), icon: Home },
    { href: `/${locale}/shop`, label: t('shop'), icon: Store },
    { href: `/${locale}/products`, label: t('products'), icon: Package },
  ]

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/30 bg-gradient-to-b from-background via-background/95 to-background/90 backdrop-blur-2xl supports-[backdrop-filter]:bg-background/60 shadow-lg shadow-black/5 overflow-x-clip">
      <div className="container mx-auto px-6 sm:px-8 lg:px-16">
        {/* Top Bar */}
        <div className="flex h-[75px] items-center justify-between gap-4">
          {/* Logo */}
          <Link href={`/${locale}`} className="flex items-center gap-2.5 flex-shrink-0 group">
            <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/80 flex items-center justify-center shadow-md shadow-primary/15 group-hover:shadow-lg group-hover:shadow-primary/25 transition-all duration-300 ring-1 ring-primary/10 group-hover:ring-primary/20">
              <Image src="/logo.png" alt="Logo" width={32} height={32} className="object-contain" />
            </div>
            <span className="font-bold text-lg hidden sm:block bg-gradient-to-r from-foreground via-foreground/95 to-foreground/90 bg-clip-text text-transparent group-hover:from-primary group-hover:via-primary/90 group-hover:to-primary/80 transition-all duration-300">
              Boukir
            </span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-0.5">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="relative px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-all duration-300 capitalize group"
              >
                <span className="relative z-10">{link.label}</span>
                <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-0 h-0.5 bg-gradient-to-r from-primary/50 via-primary to-primary/50 group-hover:w-8 transition-all duration-300 rounded-full" />
              </Link>
            ))}
          </nav>

          {/* Spacer */}
          <div className="flex-1" />

          {/* Actions */}
          <div className="flex items-center gap-0.5 sm:gap-1">
            {/* Search - Icon or Input */}
            <AnimatePresence mode="wait">
              {isSearchOpen ? (
                <motion.form
                  key="search-form"
                  initial={{ width: 40, opacity: 0 }}
                  animate={{ width: "auto", opacity: 1 }}
                  exit={{ width: 40, opacity: 0 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  onSubmit={handleSearch}
                  className="relative py-1"
                >
                  <Input
                    ref={searchInputRef}
                    type="search"
                    placeholder={t('searchPlaceholder')}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="h-10 w-[360px] sm:w-[500px] ltr:pl-4 rtl:pr-4 ltr:pr-11 rtl:pl-11 text-sm focus-visible:ring-1 focus-visible:ring-offset-0 [&::-webkit-search-cancel-button]:appearance-none"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      setIsSearchOpen(false)
                      setSearchQuery("")
                    }}
                    className="absolute ltr:right-1 rtl:left-1 top-1/2 -translate-y-1/2 h-8 w-8 hover:bg-transparent"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </motion.form>
              ) : (
                <motion.div
                  key="search-icon"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsSearchOpen(true)}
                    className="hover:bg-muted/50 transition-all duration-200"
                  >
                    <Search className="w-4.5 h-4.5 text-muted-foreground hover:text-foreground transition-colors" />
                  </Button>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Wishlist */}
            <WishlistIcon />

            {/* Cart */}
              <CartPopover ref={cartRef} />

            {/* Separator before user menu */}
            {isAuthenticated && user && (
              <div className="hidden lg:block h-6 w-px bg-gradient-to-b from-transparent via-border/60 to-transparent mx-1.5" />
            )}

            {/* Mobile Menu Toggle */}
            <Button
              variant="ghost"
              size="icon"
              className="lg:hidden hover:bg-muted/50 transition-all duration-200 h-9 w-9"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              <Menu className="w-4.5 h-4.5 text-muted-foreground" />
            </Button>

            {/* User Menu */}
            {isAuthenticated && user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="hidden lg:flex items-center gap-1.5 h-9 px-2 hover:bg-muted/50 border border-transparent hover:border-border/40 rounded-full transition-all duration-200 group">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-br from-primary/15 to-primary/5 flex items-center justify-center flex-shrink-0 border border-primary/20 group-hover:border-primary/30 transition-all duration-200 shadow-sm overflow-hidden">
                      {user.avatar_url ? (
                        <Image
                          src={user.avatar_url}
                          alt={`${user.prenom} ${user.nom}`}
                          width={28}
                          height={28}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <span className="text-[11px] font-bold text-primary">
                          {user.prenom?.[0]?.toUpperCase() || user.nom?.[0]?.toUpperCase() || user.email?.[0]?.toUpperCase()}
                        </span>
                      )}
                    </div>
                    <ChevronDown className="w-3 h-3 text-muted-foreground/70 group-hover:text-muted-foreground transition-colors duration-200" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isArabic ? "start" : "end"} className="w-64 p-0 bg-background/98 backdrop-blur-2xl border-border/40 shadow-xl shadow-black/10">
                  <DropdownMenuLabel className="p-0 mb-1">
                    <div className="relative overflow-hidden rounded-t-lg bg-gradient-to-br from-muted/50 via-muted/30 to-transparent p-3.5 border-b border-border/40">
                      <div className="flex items-center gap-2.5">
                        <div className="relative">
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary via-primary/90 to-primary/80 flex items-center justify-center flex-shrink-0 shadow-md shadow-primary/15 ring-1 ring-primary/20 overflow-hidden">
                            {user.avatar_url ? (
                              <Image
                                src={user.avatar_url}
                                alt={`${user.prenom} ${user.nom}`}
                                width={40}
                                height={40}
                                className="object-cover w-full h-full"
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
                    <DropdownMenuItem asChild>
                      <Link href={`/${locale}/settings`} className="cursor-pointer flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-muted/50 transition-all duration-200 group">
                        <div className="w-7 h-7 rounded-md bg-muted/50 flex items-center justify-center group-hover:bg-muted transition-colors duration-200">
                          <Settings className="w-3.5 h-3.5 text-foreground/70" />
                        </div>
                        <span className="text-sm font-medium text-foreground/90">{t('settings')}</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="my-1" />
                    <DropdownMenuItem asChild>
                      <Link href={`/${locale}/logout`} className="cursor-pointer flex items-center gap-2.5 px-2.5 py-2 rounded-md hover:bg-destructive/10 transition-all duration-200 group">
                        <div className="w-7 h-7 rounded-md bg-destructive/10 flex items-center justify-center group-hover:bg-destructive/15 transition-colors duration-200">
                          <LogOut className="w-3.5 h-3.5 text-destructive" />
                        </div>
                        <span className="text-sm font-medium text-destructive">{t('logout')}</span>
                      </Link>
                    </DropdownMenuItem>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <Link href={`/${locale}/login`}>
                  <Button variant="ghost" size="sm" className="hover:bg-muted/50 transition-all duration-200 font-medium text-muted-foreground hover:text-foreground h-9 px-4">
                    {t('login')}
                  </Button>
                </Link>
                <Link href={`/${locale}/register`}>
                  <Button size="sm" className="bg-gradient-to-r from-primary via-primary/95 to-primary/90 hover:from-primary/95 hover:via-primary hover:to-primary shadow-md shadow-primary/15 hover:shadow-lg hover:shadow-primary/20 transition-all duration-200 font-medium h-9 px-4">
                    {t('register')}
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className="lg:hidden border-t overflow-hidden"
            >
              <div className="py-4">
                <nav className="flex flex-col gap-2">
                  {navLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-3 py-3 text-sm font-medium text-foreground hover:text-primary hover:bg-secondary/50 rounded-lg transition-colors capitalize"
                    >
                      <link.icon className="w-4 h-4" />
                      {link.label}
                    </Link>
                  ))}
                </nav>

                {/* Mobile Auth Buttons */}
                {!isAuthenticated && (
                  <div className="flex gap-3 mt-4 px-3">
                    <Link href={`/${locale}/login`} className="flex-1">
                      <Button variant="outline" className="w-full">
                        {t('login')}
                      </Button>
                    </Link>
                    <Link href={`/${locale}/register`} className="flex-1">
                      <Button className="w-full">
                        {t('register')}
                      </Button>
                    </Link>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}
