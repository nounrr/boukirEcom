"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight, ArrowUpRight, Droplets } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useRef, useState } from "react"

import { cn } from "@/lib/utils"
import { DragCarousel } from "@/components/ui/drag-carousel"
import { SectionHeading } from "./section-heading"

export type Universe = {
  slug: string
  href: string
  title: string
  /** real product photo from that category when available */
  image: string | null
  fallback: string | null
}

/**
 * Scene 02 — Materials discovery. Desktop: a sticky visual stage whose image
 * follows the category being read (IntersectionObserver, no scroll-jacking).
 * Mobile: a native horizontal snap rail.
 */
export function FlagshipUniverses({ locale, universes }: { locale: string; universes: Universe[] }) {
  const t = useTranslations("xp.home.universes")
  const [active, setActive] = useState(0)
  const itemRefs = useRef<(HTMLLIElement | null)[]>([])

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActive(Number((entry.target as HTMLElement).dataset.index))
        }
      },
      { rootMargin: "-45% 0px -45% 0px" }
    )
    itemRefs.current.forEach((el) => el && io.observe(el))
    return () => io.disconnect()
  }, [universes.length])

  const visual = (u: Universe, className?: string, sizes = "50vw") =>
    u.image || u.fallback ? (
      <Image src={(u.image ?? u.fallback)!} alt="" fill sizes={sizes} unoptimized={Boolean(u.image && /^https?:/.test(u.image))} className={cn("object-cover", className)} />
    ) : (
      <div className={cn("bd-grid absolute inset-0 grid place-items-center bg-ink-2 [--grid-color:rgba(255,255,255,0.06)]", className)}>
        <Droplets className="size-24 text-brand-orange/40" strokeWidth={0.8} />
      </div>
    )

  return (
    <section id="scene-universes" className="relative bg-background py-20 lg:py-32" aria-labelledby="universes-title">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
        <SectionHeading
          id="universes-title"
          kicker={t("kicker")}
          title={t("title")}
          description={t("desc")}
          action={
            <Link href={`/${locale}/shop`} className="group inline-flex items-center gap-2 text-sm font-semibold text-foreground">
              <span className="link-underline">{t("all")}</span>
              <ArrowRight className="size-4 transition-transform group-hover:translate-x-1 rtl:rotate-180" aria-hidden="true" />
            </Link>
          }
        />

        {/* Mobile / tablet: draggable carousel */}
        <div className="mt-10 lg:hidden" data-reveal>
          <DragCarousel label={t("kicker")} autoplay={5500} controls="bottom" slideClassName="basis-[80%] sm:basis-[46%]">
            {universes.map((u) => (
              <Link key={u.slug} href={u.href} draggable={false} className="group relative block aspect-[4/5] overflow-hidden rounded-3xl bg-ink">
                {visual(u, "transition-transform duration-700 group-hover:scale-105", "80vw")}
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/30 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                  <h3 className="text-xl font-bold leading-tight">{u.title}</h3>
                  <p className="mt-2 line-clamp-2 text-sm text-white/70">{t(`items.${u.slug}`)}</p>
                </div>
              </Link>
            ))}
          </DragCarousel>
        </div>

        {/* Desktop sticky story */}
        <div className="mt-16 hidden gap-16 lg:grid lg:grid-cols-[1fr_1fr]">
          <div className="relative">
            <div className="sticky top-[150px] aspect-[4/4.4] overflow-hidden rounded-[2rem] bg-ink shadow-premium facet-corner">
              {universes.map((u, index) => (
                <div
                  key={u.slug}
                  className={cn(
                    "absolute inset-0 transition-[opacity,transform,clip-path] duration-[1100ms] ease-[var(--ease-premium)]",
                    index === active ? "opacity-100 [clip-path:inset(0_0_0_0)]" : "opacity-0 [clip-path:inset(8%_8%_8%_8%)] scale-[1.04]"
                  )}
                  aria-hidden={index !== active}
                >
                  {visual(u, "", "45vw")}
                </div>
              ))}
              <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-6 p-8 text-white">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.22em] text-brand-yellow tabular">
                    {String(active + 1).padStart(2, "0")} / {String(universes.length).padStart(2, "0")}
                  </p>
                  <p className="mt-2 text-2xl font-bold">{universes[active]?.title}</p>
                </div>
                <div className="flex gap-1.5" aria-hidden="true">
                  {universes.map((u, index) => (
                    <span key={u.slug} className={cn("h-1 rounded-full transition-all duration-500", index === active ? "w-8 bg-brand-orange" : "w-2 bg-white/30")} />
                  ))}
                </div>
              </div>
            </div>
          </div>

          <ol className="relative border-s border-border">
            {universes.map((u, index) => (
              <li
                key={u.slug}
                ref={(el) => {
                  itemRefs.current[index] = el
                }}
                data-index={index}
                className="relative"
                onMouseEnter={() => setActive(index)}
              >
                <span className={cn("absolute -start-px top-0 h-full w-px origin-top bg-brand-orange transition-transform duration-700", index === active ? "scale-y-100" : "scale-y-0")} aria-hidden="true" />
                <Link href={u.href} onFocus={() => setActive(index)} className="group flex min-h-[230px] flex-col justify-center gap-3 py-10 ps-10 outline-none">
                  <span className={cn("text-xs font-semibold tabular tracking-[0.2em] transition-colors", index === active ? "text-accent-text" : "text-muted-foreground")}>
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <span className={cn("flex items-center justify-between gap-6 text-3xl font-bold tracking-tight transition-colors duration-500 xl:text-[2.6rem] xl:leading-tight", index === active ? "text-foreground" : "text-foreground/35")}>
                    {u.title}
                    <ArrowUpRight className={cn("size-7 shrink-0 transition-all duration-500 rtl:-scale-x-100", index === active ? "opacity-100" : "-translate-x-2 opacity-0")} aria-hidden="true" />
                  </span>
                  <span className={cn("max-w-md text-[15px] leading-relaxed transition-colors duration-500", index === active ? "text-muted-foreground" : "text-muted-foreground/50")}>
                    {t(`items.${u.slug}`)}
                  </span>
                  <span className="sr-only">{t("explore")}</span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </div>
    </section>
  )
}
