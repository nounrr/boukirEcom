"use client"

import Image from "next/image"
import Link from "next/link"
import useEmblaCarousel from "embla-carousel-react"
import AutoScroll from "embla-carousel-auto-scroll"
import { ArrowRight, Pause, Play } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useMemo, useRef, useState } from "react"

import { Skeleton } from "@/components/ui/skeleton"
import { API_CONFIG } from "@/lib/api-config"
import { BRAND_LOGOS } from "@/lib/catalog/brand-logos"
import { catalogHref } from "@/lib/catalog/registry"
import { useGetBrandsQuery } from "@/state/api/brands-api-slice"
import { SectionHeading } from "./section-heading"

type LogoBrand = { id: number; name: string; src: string; remote: boolean }

function apiLogo(src?: string | null) {
  const value = String(src ?? "").trim()
  if (!value || value === "null") return null
  if (/^https?:\/\//i.test(value)) return value
  return `${(API_CONFIG.BASE_URL || "").replace(/\/+$/, "")}${value.startsWith("/") ? value : `/${value}`}`
}

function LogoTile({ brand, locale }: { brand: LogoBrand; locale: string }) {
  const [src, setSrc] = useState(brand.src)
  return (
    <Link
      href={catalogHref(locale, "marques", brand.id)}
      draggable={false}
      className="group relative flex h-28 w-[180px] items-center justify-center overflow-hidden rounded-2xl border border-black/[0.06] bg-white px-5 shadow-[0_10px_30px_-18px_rgba(13,13,13,0.35)] transition-[transform,box-shadow] duration-500 hover:-translate-y-1 hover:shadow-[0_22px_40px_-20px_rgba(242,159,4,0.55)] sm:h-32 sm:w-[210px]"
      aria-label={brand.name}
    >
      <Image
        src={src}
        alt={brand.name}
        width={170}
        height={90}
        unoptimized={brand.remote}
        draggable={false}
        className="pointer-events-none h-[72%] w-auto max-w-full object-contain transition-transform duration-500 group-hover:scale-105"
        onError={() => {
          const fallback = BRAND_LOGOS[brand.id]?.src
          if (fallback && src !== fallback) setSrc(fallback)
        }}
      />
      <span className="absolute inset-x-6 bottom-0 h-0.5 origin-center scale-x-0 bg-gold transition-transform duration-500 group-hover:scale-x-100" aria-hidden="true" />
    </Link>
  )
}

function LogoRow({ brands, locale, reverse, playing }: { brands: LogoBrand[]; locale: string; reverse?: boolean; playing: boolean }) {
  const rootRef = useRef<HTMLDivElement>(null)
  const [rtl, setRtl] = useState(false)
  useEffect(() => {
    if (rootRef.current) setRtl(getComputedStyle(rootRef.current).direction === "rtl")
  }, [])
  const plugins = useMemo(
    () => [AutoScroll({ speed: 0.7, startDelay: 400, stopOnInteraction: false, stopOnMouseEnter: true, stopOnFocusIn: true, direction: reverse ? "backward" : "forward" })],
    [reverse]
  )
  const [viewportRef, api] = useEmblaCarousel({ loop: true, dragFree: true, align: "start", direction: rtl ? "rtl" : "ltr" }, plugins)

  useEffect(() => {
    const auto = api?.plugins()?.autoScroll
    if (!auto) return
    if (playing && !auto.isPlaying()) auto.play()
    if (!playing && auto.isPlaying()) auto.stop()
  }, [api, playing])

  // Repeat short lists so the loop always has enough width.
  const items = brands.length < 10 ? [...brands, ...brands, ...brands] : brands
  return (
    <div ref={rootRef} className="overflow-hidden py-2 [mask-image:linear-gradient(90deg,transparent,black_8%,black_92%,transparent)]">
      <div ref={viewportRef} className="cursor-grab overflow-hidden active:cursor-grabbing">
        <div className="flex touch-pan-y">
          {items.map((brand, index) => (
            <div key={`${brand.id}-${index}`} className="shrink-0 grow-0 px-2" aria-hidden={index >= brands.length ? true : undefined}>
              <LogoTile brand={brand} locale={locale} />
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

/**
 * Scene 06 — Brand partners. Real logos only: the API image (uploaded in
 * the back-office) first, then the bundled copy of the same logo. Brands
 * without any logo are not shown here (no invented artwork).
 */
export function FlagshipBrands({ locale }: { locale: string }) {
  const t = useTranslations("xp.home.brands")
  const tc = useTranslations("xp.carousel")
  const { data = [], isLoading } = useGetBrandsQuery()
  const [playing, setPlaying] = useState(true)

  const brands = useMemo<LogoBrand[]>(() => {
    return data
      .map((b) => {
        const remote = apiLogo(b.image_url)
        const bundled = BRAND_LOGOS[b.id]?.src
        const src = remote ?? bundled
        return src ? { id: b.id, name: b.nom, src, remote: Boolean(remote) } : null
      })
      .filter((b): b is LogoBrand => b !== null)
  }, [data])

  if (!isLoading && brands.length === 0) return null
  const half = Math.ceil(brands.length / 2)
  const rowA = brands.slice(0, half)
  const rowB = brands.slice(half)

  return (
    <section className="relative overflow-hidden border-t border-border bg-surface-2/50 py-20 lg:py-28" aria-labelledby="brands-title">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
        <SectionHeading
          id="brands-title"
          kicker={t("kicker")}
          title={t("title")}
          description={t("desc")}
          action={
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setPlaying((p) => !p)}
                aria-label={playing ? tc("pause") : tc("play")}
                className="grid size-11 place-items-center rounded-full border border-border transition-colors hover:border-foreground/40"
              >
                {playing ? <Pause className="size-4" /> : <Play className="size-4" />}
              </button>
              <Link href={`/${locale}/shop`} className="group inline-flex items-center gap-2 text-sm font-semibold">
                <span className="link-underline">{t("viewAll")}</span>
                <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
              </Link>
            </div>
          }
        />
      </div>
      <div className="mt-12 space-y-3" role="region" aria-roledescription="carousel" aria-label={t("title")} data-reveal="fade">
        {isLoading ? (
          <div className="flex gap-4 overflow-hidden px-5">
            {Array.from({ length: 8 }).map((_, i) => <Skeleton key={i} className="h-28 w-[180px] shrink-0 rounded-2xl" />)}
          </div>
        ) : (
          <>
            <LogoRow brands={rowA} locale={locale} playing={playing} />
            {rowB.length ? <LogoRow brands={rowB} locale={locale} reverse playing={playing} /> : null}
          </>
        )}
      </div>
      <p className="mx-auto mt-6 max-w-[1440px] px-5 text-xs text-muted-foreground sm:px-8 lg:px-10">{tc("dragHint")}</p>
    </section>
  )
}
