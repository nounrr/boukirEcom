"use client"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet"
import { useAppDispatch, useAppSelector } from "@/state/hooks"
import { clearAuth } from "@/state/slices/user-slice"
import {
  Calculator,
  ChevronDown,
  HardHat,
  Heart,
  LayoutGrid,
  LogOut,
  Mail,
  Menu,
  Package,
  Percent,
  Ruler,
  Store,
  UserCircle2,
  Wrench,
  X,
} from "lucide-react"
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
import { ThemeToggle } from "@/components/theme/theme-toggle"
import { BrandLockup } from "@/components/brand/brand-lockup"
import { cn } from "@/lib/utils"

import {
  getSupportedLocales,
  setPreferredLocale,
  type SupportedLocale,
} from "@/components/i18n/locale-preference-initializer"
import { API_CONFIG } from "@/lib/api-config"

const languageMeta: Record<SupportedLocale, { label: string; short: string }> = {
  fr: { label: "Français", short: "FR" },
  ar: { label: "العربية", short: "AR" },
  en: { label: "English", short: "EN" },
  zh: { label: "中文", short: "ZH" },
}

function avatarSrc(url?: string | null) {
  if (!url) return null
  return url.startsWith("http") ? url : `${API_CONFIG.BASE_URL}${url}`
}

export function Header() {
  const t = useTranslations("header")
  const tCommon = useTranslations("common")
  const tx = useTranslations("xp.nav")
  const locale = useLocale()
  const isArabic = locale === "ar"
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const dispatch = useAppDispatch()
  const { user, isAuthenticated, accessToken } = useAppSelector((state) => state.user)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isHeaderVisible, setIsHeaderVisible] = useState(true)
  const [isScrolled, setIsScrolled] = useState(false)
  const isAuthLoading = !!accessToken && !user
  const isHome = pathname === `/${locale}` || pathname === `/${locale}/`
  const overlay = isHome && !isScrolled

  const lastScrollYRef = useRef(0)
  const tickingRef = useRef(false)
  const headerVisibleRef = useRef(true)

  useEffect(() => {
    headerVisibleRef.current = isHeaderVisible
  }, [isHeaderVisible])

  // Hide on scroll down, reveal on scroll up; frosted once the page moves.
  useEffect(() => {
    lastScrollYRef.current = window.scrollY
    setIsScrolled(window.scrollY > 24)
    const handleScroll = () => {
      if (tickingRef.current) return
      tickingRef.current = true
      window.requestAnimationFrame(() => {
        const currentY = window.scrollY
        const delta = currentY - lastScrollYRef.current
        setIsScrolled(currentY > 24)
        if (currentY < 120 || isMobileMenuOpen) {
          if (!headerVisibleRef.current) setIsHeaderVisible(true)
        } else if (delta > 10 && headerVisibleRef.current) {
          setIsHeaderVisible(false)
        } else if (delta < -8 && !headerVisibleRef.current) {
          setIsHeaderVisible(true)
        }
        lastScrollYRef.current = currentY
        tickingRef.current = false
      })
    }
    window.addEventListener("scroll", handleScroll, { passive: true })
    return () => window.removeEventListener("scroll", handleScroll)
  }, [isMobileMenuOpen])

  useEffect(() => {
    setIsMobileMenuOpen(false)
  }, [pathname])

  const supportedLocales = getSupportedLocales()

  const stripLocalePrefix = (value: string): string => {
    const parts = value.split("/").filter(Boolean)
    if (parts.length > 0 && (supportedLocales as readonly string[]).includes(parts[0])) parts.shift()
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
    if (nextLocale === (locale as SupportedLocale)) return
    setPreferredLocale(nextLocale)
    setIsMobileMenuOpen(false)
    router.push(buildLocalizedHref(nextLocale))
    router.refresh()
  }

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

  const maalemHref = isAuthenticated ? `/${locale}/profile/maalem` : `/${locale}/register`

  const primaryLinks = [
    { href: `/${locale}/shop`, label: t("shop"), icon: Store },
    { href: `/${locale}/shop?sort=promo`, label: tx("promotions"), icon: Percent },
    { href: `/${locale}/services`, label: t("services"), icon: Wrench },
    { href: `/${locale}/maalems`, label: t("maalems"), icon: HardHat },
  ]

  const isActive = (href: string) => {
    const [path] = href.split("?")
    return pathname === path || (path !== `/${locale}` && pathname.startsWith(`${path}/`))
  }

  const user1 = user
  const initials = user1 ? (user1.prenom?.[0] || user1.nom?.[0] || user1.email?.[0] || "?").toUpperCase() : ""

  return (
    <div
      data-site-header
      className={cn(
        "sticky top-0 z-50 w-full transition-transform duration-500 ease-[var(--ease-premium)] will-change-transform",
        isHome && "-mb-[64px] lg:-mb-[120px]",
        !isHeaderVisible && "-translate-y-full"
      )}
    >
      <header
        className={cn(
          "relative w-full text-white transition-[background-color,border-color,backdrop-filter] duration-500",
          overlay
            ? "border-b border-white/10 bg-ink/95 backdrop-blur-xl dark:bg-transparent dark:bg-gradient-to-b dark:from-black/70 dark:via-black/30 dark:to-transparent dark:backdrop-blur-none"
            : "border-b border-white/[0.07] bg-ink/90 backdrop-blur-xl backdrop-saturate-150"
        )}
      >
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:absolute focus:start-4 focus:top-3 focus:z-[70] focus:rounded-md focus:bg-primary focus:px-4 focus:py-2 focus:text-sm focus:font-semibold focus:text-ink"
        >
          {tx("skipToContent")}
        </a>

        {/* Row 1 — brand, search, actions */}
        <div className="mx-auto max-w-[1440px] px-4 sm:px-6 lg:px-10">
          <div className="flex h-16 items-center gap-3 lg:h-[72px] lg:gap-6">
            <Link href={`/${locale}`} className="shrink-0 rounded-md outline-offset-4" aria-label="Boukir Construction">
              <BrandLockup />
            </Link>

            <div className="hidden flex-1 justify-center md:flex">
              <HeaderSearch
                placeholder={t("searchPlaceholder")}
                className="w-full"
                maxWidthClassName="max-w-[620px]"
                onSearchDone={() => setIsMobileMenuOpen(false)}
              />
            </div>

            <div className="ms-auto flex items-center gap-0.5 sm:gap-1 md:ms-0">
              <div className="md:hidden">
                <HeaderSearch variant="icon" placeholder={t("searchPlaceholder")} onSearchDone={() => setIsMobileMenuOpen(false)} />
              </div>

              <div className="hidden sm:block">
                <WishlistIcon tone="onPrimary" size="sm" />
              </div>
              <CartPopover ref={cartRef} tone="onPrimary" size="sm" />

              <span className="mx-1.5 hidden h-6 w-px bg-white/15 lg:block" aria-hidden="true" />

              <ThemeToggle tone="onDark" className="hidden size-9 lg:inline-flex" />

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="hidden h-9 items-center gap-1.5 rounded-full border border-white/15 px-3 text-xs font-semibold tracking-wide text-white/85 transition-colors hover:border-white/30 hover:text-white lg:inline-flex"
                    aria-label={tCommon("language")}
                  >
                    {languageMeta[(locale as SupportedLocale) || "fr"]?.short ?? String(locale).toUpperCase()}
                    <ChevronDown className="size-3 opacity-70" aria-hidden="true" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align={isArabic ? "start" : "end"} className="w-52 p-1">
                  <DropdownMenuLabel className="text-xs text-muted-foreground">{tCommon("language")}</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {supportedLocales.map((l) => (
                    <DropdownMenuItem
                      key={l}
                      onSelect={(e) => {
                        e.preventDefault()
                        handleLocaleChange(l)
                      }}
                      className="flex cursor-pointer items-center gap-2"
                    >
                      <span className="w-7 text-[11px] font-bold tracking-wider text-muted-foreground">{languageMeta[l].short}</span>
                      <span className="text-sm font-medium">{languageMeta[l].label}</span>
                      {l === locale ? <span className="ms-auto size-1.5 rounded-full bg-primary" aria-hidden="true" /> : null}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {isAuthLoading ? (
                <div className="ms-2 hidden h-9 w-28 animate-pulse rounded-full bg-white/10 lg:block" />
              ) : isAuthenticated && user ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button
                      type="button"
                      className="ms-1 hidden h-9 items-center gap-1.5 rounded-full border border-white/15 ps-1 pe-2.5 transition-colors hover:border-white/30 lg:inline-flex"
                      aria-label={t("profile")}
                    >
                      <span className="grid size-7 place-items-center overflow-hidden rounded-full bg-gold text-[11px] font-bold text-ink">
                        {avatarSrc(user.avatar_url) ? (
                          <img src={avatarSrc(user.avatar_url)!} alt="" className="size-full object-cover" referrerPolicy="no-referrer" />
                        ) : (
                          initials
                        )}
                      </span>
                      <ChevronDown className="size-3 text-white/70" aria-hidden="true" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align={isArabic ? "start" : "end"} className="w-64 p-1.5">
                    <DropdownMenuLabel className="px-2.5 py-2">
                      <p className="truncate text-sm font-semibold">{user.prenom} {user.nom}</p>
                      <p className="truncate text-xs font-normal text-muted-foreground">{user.email}</p>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={`/${locale}/profile`} className="flex cursor-pointer items-center gap-2.5 px-2.5 py-2">
                        <UserCircle2 className="size-4 text-muted-foreground" /> {t("profile")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/${locale}/orders`} className="flex cursor-pointer items-center gap-2.5 px-2.5 py-2">
                        <Package className="size-4 text-muted-foreground" /> {t("orders")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={`/${locale}/wishlist`} className="flex cursor-pointer items-center gap-2.5 px-2.5 py-2">
                        <Heart className="size-4 text-muted-foreground" /> {tx("favorites")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link href={maalemHref} className="flex cursor-pointer items-center gap-2.5 px-2.5 py-2">
                        <HardHat className="size-4 text-muted-foreground" /> {t("maalem")}
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <button type="button" onClick={handleLogout} className="flex w-full cursor-pointer items-center gap-2.5 px-2.5 py-2 text-destructive">
                        <LogOut className="size-4" /> {t("logout")}
                      </button>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <div className="ms-2 hidden items-center gap-1.5 lg:flex">
                  <Link href={`/${locale}/login`} className="inline-flex h-9 items-center rounded-full px-3.5 text-sm font-medium text-white/85 transition-colors hover:text-white">
                    {t("login")}
                  </Link>
                  <Link
                    href={`/${locale}/register`}
                    className="inline-flex h-9 items-center rounded-full bg-white px-4 text-sm font-semibold text-ink transition-colors hover:bg-brand-yellow"
                  >
                    {t("register")}
                  </Link>
                </div>
              )}

              <button
                type="button"
                className="ms-0.5 grid size-10 place-items-center rounded-full text-white/90 transition-colors hover:bg-white/10 lg:hidden"
                onClick={() => setIsMobileMenuOpen(true)}
                aria-label={tx("openMenu")}
                aria-expanded={isMobileMenuOpen}
              >
                <Menu className="size-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Row 2 — catalogue navigation (desktop) */}
        <div className={cn("hidden border-t lg:block", overlay ? "border-white/10" : "border-white/[0.06]")}>
          <div className="mx-auto flex h-12 max-w-[1440px] items-center gap-2 px-10">
            <CategoriesMegaMenu tone="onPrimary" />
            <span className="mx-2 h-5 w-px bg-white/15" aria-hidden="true" />
            <nav aria-label={tx("mainNavigation")} className="flex min-w-0 items-center gap-0.5">
              {primaryLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  aria-current={isActive(link.href) ? "page" : undefined}
                  className={cn(
                    "relative whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] font-medium tracking-wide text-white/75 transition-colors hover:text-white xl:px-3.5",
                    "after:absolute after:inset-x-3.5 after:-bottom-[9px] after:h-px after:origin-center after:scale-x-0 after:bg-brand-orange after:transition-transform after:duration-300 hover:after:scale-x-100",
                    isActive(link.href) && "text-white after:scale-x-100"
                  )}
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href={`/${locale}/calculateurs`}
                aria-current={pathname.startsWith(`/${locale}/calculateurs`) ? "page" : undefined}
                className="group ms-2 inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full border border-brand-orange/40 bg-brand-orange/10 px-3.5 py-1.5 text-[13px] font-semibold text-brand-yellow transition-colors hover:border-brand-orange hover:bg-brand-orange hover:text-ink"
              >
                <Calculator className="size-3.5" aria-hidden="true" />
                {tx("calculators")}
              </Link>
              <Link
                href={`/${locale}/studio`}
                className="whitespace-nowrap rounded-full px-3 py-1.5 text-[13px] font-medium tracking-wide text-white/75 transition-colors hover:text-white xl:px-3.5"
              >
                {tx("studio")}
              </Link>
            </nav>
            <Link
              href={`/${locale}/contact`}
              className="ms-auto inline-flex shrink-0 items-center gap-2 whitespace-nowrap text-[13px] font-medium text-white/75 transition-colors hover:text-white"
            >
              <Mail className="size-3.5" aria-hidden="true" />
              {t("contactUs")}
            </Link>
          </div>
        </div>
      </header>

      {/* Mobile off-canvas navigation */}
      <Sheet open={isMobileMenuOpen} onOpenChange={setIsMobileMenuOpen}>
        <SheetContent
          side={isArabic ? "left" : "right"}
          className="w-[min(88vw,380px)] gap-0 border-white/10 bg-ink p-0 text-white [&>button:last-child]:hidden"
        >
          <SheetTitle className="sr-only">{tx("menu")}</SheetTitle>
          <div className="flex h-16 items-center justify-between border-b border-white/10 px-5">
            <BrandLockup compact />
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(false)}
              className="grid size-10 place-items-center rounded-full text-white/80 hover:bg-white/10 hover:text-white"
              aria-label={tx("closeMenu")}
            >
              <X className="size-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto px-5 pb-8 pt-4">
            <Link
              href={`/${locale}/calculateurs`}
              className="mb-4 flex items-center gap-3 rounded-2xl border border-brand-orange/30 bg-brand-orange/10 p-4"
            >
              <span className="grid size-10 place-items-center rounded-xl bg-gold text-ink">
                <Ruler className="size-5" />
              </span>
              <span className="min-w-0">
                <span className="block text-sm font-semibold text-white">{tx("calculators")}</span>
                <span className="block text-xs text-white/60">{tx("calculatorsHint")}</span>
              </span>
            </Link>

            <nav aria-label={tx("mainNavigation")} className="flex flex-col">
              {[
                { href: `/${locale}`, label: t("home"), icon: LayoutGrid },
                ...primaryLinks,
                { href: `/${locale}/studio`, label: tx("studio"), icon: Ruler },
                { href: `/${locale}/projet`, label: tx("planner"), icon: Calculator },
                { href: maalemHref, label: t("maalem"), icon: HardHat },
                ...(isAuthenticated ? [{ href: `/${locale}/orders`, label: t("orders"), icon: Package }] : []),
                { href: `/${locale}/wishlist`, label: tx("favorites"), icon: Heart },
                { href: `/${locale}/contact`, label: t("contactUs"), icon: Mail },
              ].map((link) => (
                <Link
                  key={link.href + link.label}
                  href={link.href}
                  aria-current={isActive(link.href) ? "page" : undefined}
                  className="flex items-center gap-3 border-b border-white/[0.06] py-3.5 text-[15px] font-medium text-white/85 transition-colors hover:text-white aria-[current=page]:text-brand-yellow"
                >
                  <link.icon className="size-4 text-white/45" aria-hidden="true" />
                  {link.label}
                </Link>
              ))}
            </nav>

            <div className="mt-5">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-white/45">{tx("categories")}</p>
              <CategoriesMobileMenu tone="onPrimary" />
            </div>

            <div className="mt-6 flex items-center justify-between gap-3">
              <div className="flex flex-wrap gap-1.5">
                {supportedLocales.map((l) => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => handleLocaleChange(l)}
                    aria-current={l === locale ? "true" : undefined}
                    className={cn(
                      "h-9 rounded-full border px-3 text-xs font-semibold tracking-wide transition-colors",
                      l === locale ? "border-brand-orange bg-brand-orange text-ink" : "border-white/15 text-white/75 hover:text-white"
                    )}
                  >
                    {languageMeta[l].short}
                  </button>
                ))}
              </div>
              <ThemeToggle tone="onDark" />
            </div>

            <div className="mt-6">
              {isAuthLoading ? (
                <div className="h-11 animate-pulse rounded-full bg-white/10" />
              ) : !isAuthenticated ? (
                <div className="grid grid-cols-2 gap-2">
                  <Link href={`/${locale}/login`} className="inline-flex h-11 items-center justify-center rounded-full border border-white/15 text-sm font-medium">
                    {t("login")}
                  </Link>
                  <Link href={`/${locale}/register`} className="inline-flex h-11 items-center justify-center rounded-full bg-white text-sm font-semibold text-ink">
                    {t("register")}
                  </Link>
                </div>
              ) : (
                <div className="space-y-2">
                  <Link href={`/${locale}/profile`} className="flex items-center gap-3 rounded-2xl bg-white/[0.04] p-3">
                    <span className="grid size-9 place-items-center overflow-hidden rounded-full bg-gold text-xs font-bold text-ink">
                      {avatarSrc(user?.avatar_url) ? <img src={avatarSrc(user?.avatar_url)!} alt="" className="size-full object-cover" referrerPolicy="no-referrer" /> : initials}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold">{user?.prenom} {user?.nom}</span>
                      <span className="block truncate text-xs text-white/55">{t("profile")}</span>
                    </span>
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex h-11 w-full items-center justify-center gap-2 rounded-full border border-destructive/40 text-sm font-semibold text-[#f2695a]"
                  >
                    <LogOut className="size-4" /> {t("logout")}
                  </button>
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  )
}
