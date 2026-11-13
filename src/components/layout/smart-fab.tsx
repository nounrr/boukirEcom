"use client"

import { ArrowUp, Calculator, ClipboardList, HardHat, Headset, Mail, MessageCircle, X } from "lucide-react"
import { useLocale, useTranslations } from "next-intl"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { useCallback, useEffect, useId, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import { whatsappHref } from "@/lib/contact"

/**
 * Premium multifunction launcher (replaces the single WhatsApp bubble).
 * Keyboard: Enter/Space opens, Escape closes and restores focus, arrow keys
 * move between actions. Lifted above mobile sticky bars; hidden on checkout
 * on small screens so it never covers payment controls.
 */
export function SmartFab() {
  const t = useTranslations("xp.fab")
  const locale = useLocale()
  const pathname = usePathname()
  const [open, setOpen] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const panelId = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const isCheckout = /\/(checkout|cart)(\/|$)/.test(pathname)
  const hasStickyBar = /\/(services|maalems)\/\d+(\/|$)|\/product\/[^/]+$|\/calculateurs\/[^/]+$|\/projet(\/|$)/.test(pathname)
  const isProduct = /\/product\/[^/]+$/.test(pathname)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 640)
    onScroll()
    window.addEventListener("scroll", onScroll, { passive: true })
    return () => window.removeEventListener("scroll", onScroll)
  }, [])

  useEffect(() => setOpen(false), [pathname])

  const close = useCallback((restoreFocus = true) => {
    setOpen(false)
    if (restoreFocus) window.setTimeout(() => triggerRef.current?.focus(), 0)
  }, [])

  useEffect(() => {
    if (!open) return
    const first = panelRef.current?.querySelector<HTMLElement>("[data-fab-item]")
    first?.focus()
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        close()
      }
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        const items = Array.from(panelRef.current?.querySelectorAll<HTMLElement>("[data-fab-item]") ?? [])
        const index = items.indexOf(document.activeElement as HTMLElement)
        if (index === -1) return
        event.preventDefault()
        const next = event.key === "ArrowDown" ? (index + 1) % items.length : (index - 1 + items.length) % items.length
        items[next]?.focus()
      }
    }
    const onPointer = (event: PointerEvent) => {
      const target = event.target as Node
      if (panelRef.current?.contains(target) || triggerRef.current?.contains(target)) return
      close(false)
    }
    document.addEventListener("keydown", onKey)
    document.addEventListener("pointerdown", onPointer)
    return () => {
      document.removeEventListener("keydown", onKey)
      document.removeEventListener("pointerdown", onPointer)
    }
  }, [open, close])

  // Resolved after mount so server and client markup match.
  const [productUrl, setProductUrl] = useState<string | null>(null)
  useEffect(() => {
    setProductUrl(isProduct ? `${window.location.origin}${pathname}` : null)
  }, [isProduct, pathname])
  const message = productUrl ? t("whatsappProduct", { url: productUrl }) : t("whatsappGeneric")
  const wa = whatsappHref(message)

  const scrollTop = () => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" })
    close(false)
    const main = document.getElementById("main-content")
    main?.setAttribute("tabindex", "-1")
    main?.focus({ preventScroll: true })
  }

  const items = [
    ...(wa ? [{ key: "whatsapp", href: wa, external: true, icon: MessageCircle, accent: "bg-[#1f9d55] text-white" }] : []),
    { key: "calculator", href: `/${locale}/calculateurs`, icon: Calculator, accent: "bg-gold text-ink" },
    { key: "project", href: `/${locale}/projet`, icon: ClipboardList, accent: "bg-white/10 text-brand-yellow" },
    { key: "maalem", href: `/${locale}/services`, icon: HardHat, accent: "bg-white/10 text-brand-yellow" },
    { key: "contact", href: `/${locale}/contact`, icon: Mail, accent: "bg-white/10 text-brand-yellow" },
  ] as const

  return (
    <div
      data-smart-fab
      className={cn(
        "fixed end-4 z-[55] flex flex-col items-end gap-3 sm:end-6 rtl:items-start",
        hasStickyBar ? "bottom-[calc(5.5rem+env(safe-area-inset-bottom))] lg:bottom-6" : "bottom-[calc(1rem+env(safe-area-inset-bottom))] sm:bottom-6",
        isCheckout && "hidden lg:flex"
      )}
    >
      <div
        ref={panelRef}
        id={panelId}
        role="menu"
        aria-label={t("panelLabel")}
        hidden={!open}
        className={cn(
          "w-[min(86vw,300px)] origin-bottom-right overflow-hidden rounded-3xl border border-white/10 bg-ink/95 p-2 text-white shadow-[0_30px_60px_-20px_rgba(0,0,0,0.7)] backdrop-blur-xl rtl:origin-bottom-left",
          open && "animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2 duration-300"
        )}
      >
        <p className="px-3 pb-2 pt-2.5 text-[11px] font-semibold uppercase tracking-[0.2em] text-white/45">{t("title")}</p>
        <ul className="space-y-0.5">
          {items.map((item) => (
            <li key={item.key} role="none">
              <Link
                role="menuitem"
                data-fab-item
                href={item.href}
                target={"external" in item ? "_blank" : undefined}
                rel={"external" in item ? "noopener noreferrer" : undefined}
                onClick={() => close(false)}
                className="group flex items-center gap-3 rounded-2xl px-2.5 py-2.5 outline-none transition-colors hover:bg-white/[0.06] focus-visible:bg-white/[0.08] focus-visible:ring-1 focus-visible:ring-brand-orange"
              >
                <span className={cn("grid size-10 shrink-0 place-items-center rounded-xl", item.accent)}>
                  <item.icon className="size-[18px]" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-sm font-semibold">{t(`${item.key}.label`)}</span>
                  <span className="block truncate text-xs text-white/55">{t(`${item.key}.hint`)}</span>
                </span>
              </Link>
            </li>
          ))}
          {scrolled ? (
            <li role="none">
              <button
                type="button"
                role="menuitem"
                data-fab-item
                onClick={scrollTop}
                className="flex w-full items-center gap-3 rounded-2xl px-2.5 py-2.5 text-start outline-none transition-colors hover:bg-white/[0.06] focus-visible:bg-white/[0.08] focus-visible:ring-1 focus-visible:ring-brand-orange"
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/10 text-white">
                  <ArrowUp className="size-[18px]" aria-hidden="true" />
                </span>
                <span className="text-sm font-semibold">{t("top.label")}</span>
              </button>
            </li>
          ) : null}
        </ul>
      </div>

      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={open ? t("close") : t("open")}
        onClick={() => setOpen((value) => !value)}
        className={cn(
          "group relative grid size-14 place-items-center rounded-full text-ink outline-none transition-transform duration-300 ease-[var(--ease-premium)] hover:scale-105 active:scale-95",
          "bg-gold shadow-[0_18px_40px_-12px_rgba(242,159,4,0.75),0_0_0_1px_rgba(255,255,255,0.25)_inset] focus-visible:ring-4 focus-visible:ring-brand-orange/40"
        )}
      >
        <span className="pointer-events-none absolute inset-0 overflow-hidden rounded-full" aria-hidden="true">
          <span className="absolute inset-y-0 -start-1/2 w-1/2 bg-white/40 blur-md motion-safe:animate-[bd-sheen_3.6s_var(--ease-premium)_infinite_2s]" />
        </span>
        <X className={cn("absolute size-6 transition-all duration-300", open ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-50 opacity-0")} aria-hidden="true" />
        <Headset className={cn("absolute size-6 transition-all duration-300", open ? "rotate-90 scale-50 opacity-0" : "rotate-0 scale-100 opacity-100")} strokeWidth={1.9} aria-hidden="true" />
        {!open ? <span className="absolute end-2.5 top-2.5 size-2.5 rounded-full border-2 border-[#f2b705] bg-[#1f9d55]" aria-hidden="true" /> : null}
      </button>
    </div>
  )
}
