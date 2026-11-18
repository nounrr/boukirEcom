"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Store } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"

import { cn } from "@/lib/utils"

/**
 * Floating « Boutique » button, bottom corner opposite the help menu (SmartFab).
 * Hidden on the shop itself and during cart / checkout.
 */
export function ShopFab() {
  const locale = useLocale()
  const t = useTranslations("shopFab")
  const pathname = usePathname() ?? ""

  const hidden = /\/(shop|cart|checkout)(\/|$)/.test(pathname)
  const hasStickyBar = /\/(services|maalems)\/\d+(\/|$)|\/product\/[^/]+$|\/calculateurs\/[^/]+$|\/projet(\/|$)/.test(pathname)
  if (hidden) return null

  return (
    <Link
      href={`/${locale}/shop`}
      aria-label={t("aria")}
      className={cn(
        "group fixed start-4 z-[54] inline-flex h-12 items-center gap-2 rounded-full bg-gold ps-3.5 pe-4 text-sm font-bold text-ink sm:start-6 sm:h-14 sm:ps-4 sm:pe-5",
        "shadow-[0_18px_40px_-14px_rgba(0,0,0,0.55)] ring-1 ring-black/10 transition-[translate,box-shadow] duration-300 hover:-translate-y-0.5 hover:shadow-[0_24px_48px_-14px_rgba(0,0,0,0.6)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ink focus-visible:ring-offset-2",
        hasStickyBar ? "bottom-[calc(5.5rem+env(safe-area-inset-bottom))] lg:bottom-6" : "bottom-[calc(1rem+env(safe-area-inset-bottom))] sm:bottom-6"
      )}
    >
      <span className="grid size-8 place-items-center rounded-full bg-ink text-brand-yellow transition-transform group-hover:scale-105">
        <Store className="size-4" aria-hidden="true" />
      </span>
      {t("label")}
    </Link>
  )
}
