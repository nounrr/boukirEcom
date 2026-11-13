"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Calculator, ChevronLeft, ChevronRight, MapPin, Pause, Play, ShieldCheck, Truck } from "lucide-react"
import { useTranslations } from "next-intl"
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion"
import { createElement, useCallback, useEffect, useMemo, useRef, useState } from "react"

import { DiamondFacet } from "@/components/brand/brand-lockup"
import { Magnetic } from "@/components/motion/primitives"
import { API_CONFIG } from "@/lib/api-config"
import { catalogHref } from "@/lib/catalog/registry"
import { cn } from "@/lib/utils"
import { useGetHeroSlidesQuery } from "@/state/api/hero-slides-api-slice"
import type { HeroSlideApi } from "@/types/api/hero-slides"

const INTERVAL = 7000

type Slide = {
  id: string
  kicker: string
  title: string
  lead?: string
  image: string
  position?: string
  remote?: boolean
  primary: { href: string; label: string }
  secondary?: { href: string; label: string }
  tertiary?: { href: string; label: string }
  mosaic?: boolean
}

const MOSAIC = [
  { src: "/product-fallbacks/mineral.webp", clip: "polygon(18% 0, 100% 0, 100% 100%, 0 100%, 0 22%)", className: "col-span-2 row-span-2" },
  { src: "/product-fallbacks/tile.webp", clip: "polygon(0 0, 100% 0, 100% 78%, 78% 100%, 0 100%)", className: "" },
  { src: "/product-fallbacks/metal.webp", clip: "polygon(0 0, 100% 0, 100% 100%, 22% 100%, 0 78%)", className: "" },
  { src: "/product-fallbacks/wood.webp", clip: "polygon(0 0, 82% 0, 100% 18%, 100% 100%, 0 100%)", className: "col-span-2" },
] as const

function absoluteImage(src?: string | null) {
  const value = String(src ?? "").trim()
  if (!value) return null
  if (/^https?:\/\//i.test(value)) return value
  return `${(API_CONFIG.BASE_URL || "").replace(/\/+$/, "")}${value.startsWith("/") ? value : `/${value}`}`
}

function text(value: unknown, locale: string) {
  if (typeof value === "string") return value
  if (!value || typeof value !== "object") return undefined
  const r = value as Record<string, unknown>
  const v = r[locale] ?? r.fr ?? r.en ?? r.ar ?? r.zh
  return typeof v === "string" ? v : undefined
}

function adminSlide(slide: HeroSlideApi, locale: string, fallbackLabel: string): Slide | null {
  const resolved = slide.content_resolved?.locale === locale ? slide.content_resolved : undefined
  const title = resolved?.title ?? text(slide.content?.title, locale)
  const image = absoluteImage(slide.media?.image_url)
  if (!title || !image) return null
  const legacy = Array.isArray(slide.ctas) ? slide.ctas : []
  const target = slide.target
  const id = target
    ? ((slide.type === "category" ? target.category_id : slide.type === "brand" ? target.brand_id : slide.type === "product" ? target.product_id : target.campaign_id) ?? target.id)
    : null
  const rawHref = legacy[0]?.href
  const href = rawHref
    ? /^https?:|^\/(fr|ar|en|zh)(\/|$)/.test(rawHref)
      ? rawHref
      : `/${locale}${rawHref.startsWith("/") ? "" : "/"}${rawHref}`
    : slide.type === "category" && id != null
      ? catalogHref(locale, "categories", id)
      : slide.type === "brand" && id != null
        ? catalogHref(locale, "marques", id)
        : slide.type === "product" && id != null
          ? `/${locale}/product/${id}`
          : `/${locale}/shop?sort=promo`
  const cta = slide.cta?.primary as unknown
  const record = typeof cta === "object" && cta ? (cta as Record<string, unknown>) : null
  const localized = record ? (record[locale === "fr" ? "label" : `label_${locale}`] ?? record.label) : undefined
  return {
    id: `admin-${slide.id}`,
    kicker: resolved?.subtitle ?? text(slide.content?.subtitle, locale) ?? "Boukir",
    title,
    lead: resolved?.description ?? text(slide.content?.description, locale),
    image,
    remote: true,
    primary: { href, label: (typeof localized === "string" ? localized : undefined) ?? slide.cta_resolved?.primary?.label ?? fallbackLabel },
  }
}

function SlideTitle({ title, as }: { title: string; as: "h1" | "h2" }) {
  let index = 0
  const words = title.split(/(\s+)/).map((token, i) => {
    if (/^\s+$/.test(token)) return " "
    const accent = /^\*.*\*[.,!?:;»]*$/.test(token)
    const clean = accent ? token.replace(/\*/g, "") : token
    const delay = 150 + index++ * 80
    return (
      <span key={i} className="kinetic-word">
        <span className={accent ? "text-gold" : undefined} style={{ transitionDelay: `${delay}ms` }}>
          {clean}
        </span>
      </span>
    )
  })
  return createElement(as, { className: "display-xl mt-7 max-w-[13ch] text-[3rem] sm:text-7xl lg:text-[5.4rem] xl:text-[6.2rem]", "aria-label": title.replace(/\*/g, "") }, words)
}

/**
 * Scene 01 — Arrival. An autoplay hero slider (crossfade + Ken Burns) that
 * the visitor can swipe/drag, step with arrows or the keyboard, and pause.
 * Back-office hero slides are appended after the brand slides.
 */
export function FlagshipHero({ locale }: { locale: string }) {
  const t = useTranslations("xp.home.hero")
  const ts = useTranslations("xp.home.heroSlides")
  const tc = useTranslations("xp.carousel")
  const tHome = useTranslations("home")
  const ref = useRef<HTMLElement>(null)
  const reduce = useReducedMotion()
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] })
  const bgY = useTransform(scrollYProgress, [0, 1], [0, 140])
  const fade = useTransform(scrollYProgress, [0, 0.7], [1, 0.2])
  const { data: adminData } = useGetHeroSlidesQuery({ locale: locale as "fr" | "ar" | "en" | "zh", limit: 4 })

  const slides = useMemo<Slide[]>(() => {
    const base: Slide[] = [
      {
        id: "brand",
        kicker: t("kicker"),
        title: t("title"),
        lead: t("lead"),
        image: "/utility-types/professional-workshop.webp",
        primary: { href: `/${locale}/shop`, label: t("ctaShop") },
        secondary: { href: `/${locale}/calculateurs`, label: t("ctaCalc") },
        tertiary: { href: `/${locale}/maalems`, label: t("ctaMaalem") },
        mosaic: true,
      },
      {
        id: "villa",
        kicker: ts("villa.kicker"),
        title: ts("villa.title"),
        lead: ts("villa.lead"),
        image: "/videos/villa/poster-end.webp",
        position: "object-[60%_center]",
        primary: { href: "#construction", label: ts("villa.cta") },
        secondary: { href: `/${locale}/projet`, label: ts("villa.cta2") },
      },
      {
        id: "tools",
        kicker: ts("tools.kicker"),
        title: ts("tools.title"),
        lead: ts("tools.lead"),
        image: "/videos/villa/poster-start.webp",
        primary: { href: `/${locale}/calculateurs`, label: ts("tools.cta") },
        secondary: { href: `/${locale}/studio`, label: ts("tools.cta2") },
      },
      {
        id: "services",
        kicker: ts("services.kicker"),
        title: ts("services.title"),
        lead: ts("services.lead"),
        image: "/utility-types/professionnel-atelier-editorial-2026.webp",
        position: "object-[42%_center]",
        primary: { href: `/${locale}/services/request/quick`, label: ts("services.cta") },
        secondary: { href: `/${locale}/maalems`, label: ts("services.cta2") },
      },
    ]
    const admin = (adminData ?? []).map((s) => adminSlide(s, locale, tHome("ctaShop"))).filter((s): s is Slide => s !== null)
    return [...base, ...admin]
  }, [adminData, locale, t, ts, tHome])

  const [active, setActive] = useState(0)
  const [paused, setPaused] = useState(false)
  const [hover, setHover] = useState(false)
  const [focusWithin, setFocusWithin] = useState(false)
  const [onScreen, setOnScreen] = useState(true)
  const [cycle, setCycle] = useState(0)
  const dragRef = useRef<{ x: number; y: number; id: number } | null>(null)
  const count = slides.length

  const go = useCallback(
    (index: number) => {
      setActive(((index % count) + count) % count)
      setCycle((c) => c + 1)
    },
    [count]
  )
  const next = useCallback(() => go(active + 1), [go, active])
  const prev = useCallback(() => go(active - 1), [go, active])

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(([e]) => setOnScreen(e.isIntersecting), { threshold: 0.2 })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const running = !paused && !hover && !focusWithin && onScreen && count > 1
  useEffect(() => {
    if (!running) return
    const id = window.setTimeout(() => {
      if (!document.hidden) next()
      else setCycle((c) => c + 1)
    }, INTERVAL)
    return () => window.clearTimeout(id)
  }, [running, next, cycle])

  const facts = [
    { icon: Truck, label: t("facts.delivery") },
    { icon: ShieldCheck, label: t("facts.payment") },
    { icon: MapPin, label: t("facts.store") },
    { icon: Calculator, label: t("facts.tools") },
  ]

  const isRtl = () => Boolean(ref.current && getComputedStyle(ref.current).direction === "rtl")

  return (
    <section
      ref={ref}
      className="grain relative isolate flex min-h-[100svh] touch-pan-y flex-col overflow-hidden bg-ink text-white"
      aria-roledescription="carousel"
      aria-label={t("kicker")}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocusCapture={() => setFocusWithin(true)}
      onBlurCapture={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setFocusWithin(false)
      }}
      onKeyDown={(e) => {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return
        const forward = (e.key === "ArrowRight") !== isRtl()
        if (forward) next()
        else prev()
      }}
      onPointerDown={(e) => {
        if (e.pointerType === "mouse" && e.button !== 0) return
        dragRef.current = { x: e.clientX, y: e.clientY, id: e.pointerId }
      }}
      onPointerUp={(e) => {
        const start = dragRef.current
        dragRef.current = null
        if (!start || start.id !== e.pointerId) return
        const dx = e.clientX - start.x
        const dy = e.clientY - start.y
        if (Math.abs(dx) < 60 || Math.abs(dx) < Math.abs(dy) * 1.3) return
        const towardsNext = isRtl() ? dx > 0 : dx < 0
        if (towardsNext) next()
        else prev()
      }}
    >
      {/* Background layers — crossfade + slow Ken Burns, parallax on scroll */}
      <motion.div className="absolute inset-0 -z-10" style={{ y: reduce ? 0 : bgY }} aria-hidden="true">
        {slides.map((slide, index) => (
          <div key={slide.id} data-fade-ok-slow className={cn("absolute inset-0 transition-opacity duration-[1200ms] ease-[var(--ease-premium)]", index === active ? "opacity-100" : "opacity-0")}>
            <Image
              src={slide.image}
              alt=""
              fill
              priority={index === 0}
              unoptimized={slide.remote}
              sizes="100vw"
              draggable={false}
              className={cn(
                "object-cover opacity-60 will-change-transform motion-safe:transition-transform motion-safe:duration-[8000ms] motion-safe:ease-out",
                slide.position ?? "object-center",
                index === active ? "scale-100" : "motion-safe:scale-[1.09]"
              )}
            />
          </div>
        ))}
      </motion.div>
      <div className="absolute inset-0 -z-10 bg-[linear-gradient(100deg,#0d0d0d_6%,rgba(13,13,13,0.86)_40%,rgba(13,13,13,0.3)_75%,rgba(13,13,13,0.55))] rtl:bg-[linear-gradient(260deg,#0d0d0d_6%,rgba(13,13,13,0.86)_40%,rgba(13,13,13,0.3)_75%,rgba(13,13,13,0.55))]" aria-hidden="true" />
      <div className="absolute inset-x-0 bottom-0 -z-10 h-56 bg-gradient-to-t from-ink to-transparent" aria-hidden="true" />
      <div className="bd-grid absolute inset-0 -z-10 opacity-80 [--grid-color:rgba(255,255,255,0.035)] [background-size:96px_96px]" aria-hidden="true" />
      <svg className="pointer-events-none absolute inset-0 -z-10 size-full" viewBox="0 0 1440 900" preserveAspectRatio="xMidYMid slice" aria-hidden="true" data-draw>
        <path className="draw" pathLength={1} d="M96 0V900" stroke="rgba(255,255,255,0.08)" fill="none" />
        <path className="draw" pathLength={1} d="M0 760H1440" stroke="rgba(255,255,255,0.08)" fill="none" style={{ ["--draw-delay" as string]: "150ms" }} />
        <path className="draw" pathLength={1} d="M1392 180V700" stroke="#f29f04" strokeOpacity="0.7" fill="none" style={{ ["--draw-delay" as string]: "700ms" }} />
        <path className="draw" pathLength={1} d="M1380 180H1404M1380 700H1404" stroke="#f29f04" strokeOpacity="0.7" fill="none" style={{ ["--draw-delay" as string]: "900ms" }} />
      </svg>

      <div className="relative mx-auto grid w-full max-w-[1440px] flex-1 items-center gap-12 px-5 pb-10 pt-28 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:gap-10 lg:px-10 lg:pt-40">
        <motion.div style={{ opacity: reduce ? 1 : fade }} className="grid [grid-template-areas:'stack']">
          {slides.map((slide, index) => {
            const isActive = index === active
            return (
              <div
                key={slide.id}
                className="hero-slide [grid-area:stack]"
                data-active={isActive}
                aria-hidden={!isActive}
                inert={!isActive}
                role="group"
                aria-roledescription="slide"
                aria-label={tc("slideOf", { current: index + 1, total: count })}
              >
                <p className="kicker !text-brand-yellow flex items-center gap-3" data-slide-fade style={{ transitionDelay: "60ms" }}>
                  <span className="h-px w-10 bg-brand-yellow" aria-hidden="true" />
                  {slide.kicker}
                </p>
                <SlideTitle title={slide.title} as={index === 0 ? "h1" : "h2"} />
                {slide.lead ? (
                  <p className="mt-7 max-w-xl text-lg leading-relaxed text-white/70 sm:text-xl" data-slide-fade style={{ transitionDelay: "520ms" }}>
                    {slide.lead}
                  </p>
                ) : null}
                <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center" data-slide-fade style={{ transitionDelay: "650ms" }}>
                  <Magnetic>
                    <Link
                      href={slide.primary.href}
                      draggable={false}
                      className="group inline-flex h-14 w-full items-center justify-center gap-3 rounded-full bg-gold px-7 text-[15px] font-semibold text-ink shadow-[0_22px_50px_-18px_rgba(242,159,4,0.95)] transition-transform duration-300 hover:-translate-y-0.5 sm:w-auto"
                    >
                      {slide.primary.label}
                      <ArrowRight className="size-4 transition-transform group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" aria-hidden="true" />
                    </Link>
                  </Magnetic>
                  {slide.secondary ? (
                    <Link
                      href={slide.secondary.href}
                      draggable={false}
                      className="inline-flex h-14 w-full items-center justify-center gap-3 rounded-full border border-white/20 bg-white/[0.04] px-7 text-[15px] font-semibold text-white backdrop-blur-md transition-colors hover:border-white/50 hover:bg-white/10 sm:w-auto"
                    >
                      {slide.secondary.label}
                    </Link>
                  ) : null}
                  {slide.tertiary ? (
                    <Link href={slide.tertiary.href} draggable={false} className="link-underline inline-flex items-center justify-center px-2 py-3 text-[15px] font-medium text-white/75 hover:text-white">
                      {slide.tertiary.label}
                    </Link>
                  ) : null}
                </div>
              </div>
            )
          })}
        </motion.div>

        {/* Faceted material mosaic (brand slide) */}
        <div data-fade-ok className={cn("relative hidden transition-opacity duration-700 lg:block", slides[active]?.mosaic ? "opacity-100" : "opacity-0")} aria-hidden="true">
          <div className="absolute -inset-10 text-brand-orange/30" data-draw>
            <DiamondFacet className="size-full" strokeWidth={1} />
          </div>
          <div className="relative grid aspect-[4/3.6] grid-cols-3 grid-rows-3 gap-3" data-reveal="scale" style={{ ["--reveal-delay" as string]: "300ms" }}>
            {MOSAIC.map((tile, index) => (
              <div key={tile.src} className={`group relative overflow-hidden ${tile.className}`} style={{ clipPath: tile.clip }}>
                <Image src={tile.src} alt="" fill sizes="(min-width:1024px) 30vw, 0px" draggable={false} className="object-cover transition-transform duration-[1.6s] ease-[var(--ease-premium)] group-hover:scale-110" priority={index === 0} />
                <div className="absolute inset-0 bg-gradient-to-br from-transparent via-transparent to-ink/50" />
              </div>
            ))}
            <div className="col-start-3 row-start-3 flex flex-col justify-between rounded-sm border border-white/10 bg-white/[0.04] p-5 backdrop-blur-md">
              <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-brand-yellow">Boukir</span>
              <span className="text-sm leading-snug text-white/75">{t("manifesto")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Slider controls + facts */}
      <div className="relative mx-auto w-full max-w-[1440px] px-5 pb-8 sm:px-8 lg:px-10 lg:pb-10">
        <div className="flex flex-col gap-6 border-t border-white/10 pt-6 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-4">
            <span className="text-xs font-semibold tabular text-white/60">
              {String(active + 1).padStart(2, "0")} <span className="text-white/30">/ {String(count).padStart(2, "0")}</span>
            </span>
            <div className="flex gap-1.5" role="tablist" aria-label={tc("chooseSlide")}>
              {slides.map((slide, index) => (
                <button key={slide.id} type="button" role="tab" aria-selected={index === active} aria-label={tc("goTo", { index: index + 1 })} onClick={() => go(index)} className="relative h-6 w-10 sm:w-14">
                  <span className="absolute inset-x-0 top-1/2 h-[2px] -translate-y-1/2 overflow-hidden rounded-full bg-white/20">
                    <span
                      key={index === active ? `${cycle}-${running}` : "idle"}
                      className={cn("absolute inset-y-0 start-0 bg-gold", index < active ? "w-full" : index > active ? "w-0" : "w-full")}
                      style={index === active && running ? { animation: `bd-hero-progress ${INTERVAL}ms linear forwards` } : undefined}
                    />
                  </span>
                </button>
              ))}
            </div>
            <div className="ms-1 flex gap-1.5">
              <button type="button" onClick={() => setPaused((p) => !p)} aria-label={paused ? tc("play") : tc("pause")} className="grid size-9 place-items-center rounded-full border border-white/15 text-white/80 hover:border-white/40 hover:text-white">
                {paused ? <Play className="size-3.5" /> : <Pause className="size-3.5" />}
              </button>
              <button type="button" onClick={prev} aria-label={tc("prev")} className="grid size-9 place-items-center rounded-full border border-white/15 text-white/80 hover:border-white/40 hover:text-white">
                <ChevronLeft className="size-4 rtl:rotate-180" />
              </button>
              <button type="button" onClick={next} aria-label={tc("next")} className="grid size-9 place-items-center rounded-full border border-white/15 text-white/80 hover:border-white/40 hover:text-white">
                <ChevronRight className="size-4 rtl:rotate-180" />
              </button>
            </div>
          </div>
          <ul className="grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-4 lg:flex lg:gap-8">
            {facts.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-2.5 text-[13px] text-white/70">
                <Icon className="size-4 shrink-0 text-brand-yellow" strokeWidth={1.6} aria-hidden="true" />
                {label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
