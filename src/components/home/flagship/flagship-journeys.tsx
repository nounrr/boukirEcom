"use client"

import Image from "next/image"
import Link from "next/link"
import { ArrowRight, Hammer, Home } from "lucide-react"
import { useTranslations } from "next-intl"
import { useMemo, useState } from "react"

import { toAbsoluteImageUrl } from "@/lib/image-url"
import { getLocalizedProductName } from "@/lib/localized-fields"
import { productHref } from "@/lib/seo/product-url"
import { cn } from "@/lib/utils"
import { useGetProductsQuery } from "@/state/api/products-api-slice"
import type { ProductListItem } from "@/types/api/products"

type Usage = "Maison" | "Professionel"

/** Products of one usage that have a real photo, in a random order (new order on every visit). */
function useUsagePicks(usage: Usage, seed: number) {
  const { data } = useGetProductsQuery({ utility_type: usage, per_page: 24 })
  const picks = useMemo(() => {
    const withPhoto = (data?.products ?? []).filter((p) => toAbsoluteImageUrl(p.image_url))
    const score = (id: number) => {
      const x = Math.sin(id * 12.9898 + seed * 78.233) * 43758.5453
      return x - Math.floor(x)
    }
    return withPhoto.sort((a, b) => score(a.id) - score(b.id)).slice(0, 3)
  }, [data, seed])
  return { picks, total: data?.pagination?.total_items ?? 0 }
}

/**
 * « Par usage » — Maison / Professionnel. Two large photo panels: the hovered or focused one
 * expands on desktop. Each panel opens the store filtered on its usage, shows how many
 * products it holds and a fan of three real product photos, each opening its product.
 */
export function FlagshipJourneys({ locale }: { locale: string }) {
  const t = useTranslations("home")
  const tx = useTranslations("xp.home.journeys")
  const [focus, setFocus] = useState<0 | 1 | null>(null)
  const [seed] = useState(() => Math.random() * 1000)
  const maison = useUsagePicks("Maison", seed)
  const pro = useUsagePicks("Professionel", seed)

  const panels = [
    { value: "Maison" as const, title: t("utilityType.homeLabel"), desc: t("utilityType.homeDesc"), image: "/utility-types/maison-diy-editorial-2026.webp", position: "object-[62%_center]", tag: "01", Icon: Home, ...maison },
    { value: "Professionel" as const, title: t("utilityType.proLabel"), desc: t("utilityType.proDesc"), image: "/utility-types/professionnel-atelier-editorial-2026.webp", position: "object-[42%_center]", tag: "02", Icon: Hammer, ...pro },
  ]

  return (
    <section className="bg-background pb-20 lg:pb-32" aria-labelledby="journeys-title">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
        <div className="mb-10 flex flex-col justify-between gap-4 border-t border-border pt-10 md:flex-row md:items-end">
          <div>
            <p className="kicker" data-reveal>{tx("kicker")}</p>
            <h2 id="journeys-title" className="display-lg mt-3 max-w-xl text-3xl sm:text-4xl" data-reveal>{t("utilityType.title")}</h2>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-muted-foreground" data-reveal>{t("utilityType.desc")}</p>
        </div>

        <div className="flex flex-col gap-4 lg:h-[620px] lg:flex-row">
          {panels.map((panel, index) => {
            const href = `/${locale}/shop?utility_type=${panel.value}`
            const open = focus === index
            // The other panel slowly loses colour and light while one is hovered.
            const dim = focus !== null && !open
            return (
              <div
                key={panel.value}
                onMouseEnter={() => setFocus(index as 0 | 1)}
                onMouseLeave={() => setFocus(null)}
                onFocus={() => setFocus(index as 0 | 1)}
                onBlur={() => setFocus(null)}
                data-reveal
                style={{ ["--reveal-delay" as string]: `${index * 120}ms` }}
                className={cn(
                  "group relative isolate flex min-h-[520px] overflow-hidden rounded-[2rem] bg-ink text-white transition-[flex-grow,filter] duration-[1600ms] ease-[cubic-bezier(0.16,1,0.3,1)] focus-within:ring-4 focus-within:ring-brand-orange/50 lg:min-h-0",
                  focus === null ? "lg:flex-[1]" : open ? "lg:flex-[1.6]" : "lg:flex-[0.72]",
                  dim && "lg:brightness-[0.72] lg:saturate-[0.4]"
                )}
              >
                <Image src={panel.image} alt="" fill sizes="(min-width:1024px) 60vw, 100vw" className={cn("-z-20 object-cover transition-transform duration-[2600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-2 group-hover:scale-[1.12]", panel.position)} />
                <div className="absolute inset-0 -z-10 bg-gradient-to-t from-ink via-ink/55 to-ink/5" />
                <div className="absolute inset-0 -z-10 bg-[radial-gradient(60%_50%_at_100%_0%,rgba(242,159,4,0.22),transparent_70%)] opacity-0 transition-opacity duration-[1600ms] group-hover:opacity-100" />
                {/* Slow light sweep across the photo on hover. */}
                <span className="pointer-events-none absolute inset-y-0 -start-1/2 -z-10 w-1/3 -skew-x-12 bg-gradient-to-r from-transparent via-white/15 to-transparent opacity-0 transition-[inset-inline-start,opacity] duration-[2400ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:start-[130%] group-hover:opacity-100" aria-hidden="true" />

                {/* The whole panel opens the filtered store; the product photos sit above this link. */}
                <Link href={href} className="absolute inset-0 z-0 outline-none" aria-label={`${panel.title} — ${tx("explore")}`} />

                <div className="pointer-events-none relative flex w-full flex-col justify-between p-6 sm:p-9">
                  <div className="flex items-start justify-between gap-3">
                    <span className="flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.24em] text-white/75">
                      <span className="text-brand-yellow">{panel.tag}</span>
                      <span className="h-px w-8 bg-brand-orange transition-[width] duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:w-16" />
                      {tx("kicker")}
                    </span>
                    {panel.total > 0 ? (
                      <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-bold backdrop-blur-md">
                        {tx("count", { count: panel.total.toLocaleString(locale === "ar" ? "ar-MA" : "fr-FR") })}
                      </span>
                    ) : null}
                  </div>

                  <div className="flex flex-col gap-7">
                    {/* Photos above the text: they never squeeze it when the panel is narrow. */}
                    {panel.picks.length > 0 ? (
                      <ProductFan products={panel.picks} locale={locale} label={tx("picks")} />
                    ) : null}
                    <div className="min-w-0">
                      <span className="mb-4 grid size-12 place-items-center rounded-2xl bg-brand-yellow text-ink shadow-[0_14px_30px_-12px_rgba(242,183,5,0.8)] transition-transform duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-rotate-12 group-hover:scale-110">
                        <panel.Icon className="size-5" aria-hidden="true" />
                      </span>
                      <h3 className="text-4xl font-extrabold tracking-tight transition-transform duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:-translate-y-1 sm:text-5xl">{panel.title}</h3>
                      <span className="mt-3 block h-1 w-0 rounded-full bg-gold transition-[width] duration-[1600ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:w-24" aria-hidden="true" />
                      <p className="mt-3 max-w-sm min-w-[14rem] text-[15px] leading-relaxed text-white/75 transition-colors duration-[1200ms] group-hover:text-white/95">{panel.desc}</p>
                      <span className="relative isolate mt-6 inline-flex h-11 items-center gap-2.5 overflow-hidden rounded-full bg-white/10 ps-5 pe-1.5 text-sm font-semibold backdrop-blur-md transition-colors duration-[1200ms] group-hover:text-ink">
                        {/* Gold slowly fills the button (bg-gold is a gradient, so it is a layer, not a hover colour). */}
                        <span className="absolute inset-0 -z-10 origin-left scale-x-0 bg-gold transition-transform duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:scale-x-100 rtl:origin-right" aria-hidden="true" />
                        {tx("explore")}
                        <span className="grid size-8 place-items-center rounded-full bg-white text-ink transition-transform duration-[1200ms] ease-[cubic-bezier(0.16,1,0.3,1)] group-hover:translate-x-1 rtl:group-hover:-translate-x-1">
                          <ArrowRight className="size-4 rtl:rotate-180" aria-hidden="true" />
                        </span>
                      </span>
                    </div>

                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

/** Three product photos in a fan that opens slowly, one after the other, when the panel is hovered. */
function ProductFan({ products, locale, label }: { products: ProductListItem[]; locale: string; label: string }) {
  const tilt = ["-rotate-6 translate-y-2", "rotate-0 -translate-y-1", "rotate-6 translate-y-2"]
  const spread = [
    "group-hover:-rotate-[10deg] group-hover:-translate-x-3 group-hover:-translate-y-2",
    "group-hover:-translate-y-5 group-hover:scale-105",
    "group-hover:rotate-[10deg] group-hover:translate-x-3 group-hover:-translate-y-2",
  ]
  // A photo that fails to load is dropped instead of showing an empty tile.
  const [broken, setBroken] = useState<number[]>([])
  const shown = products.filter((p) => !broken.includes(p.id))
  if (shown.length === 0) return null
  return (
    <div className="pointer-events-auto relative z-10 shrink-0" role="group" aria-label={label}>
      <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.22em] text-white/60">{label}</p>
      <div className="flex -space-x-4 rtl:space-x-reverse">
        {shown.map((product, i) => {
          const name = getLocalizedProductName(product as never, locale) || product.designation
          return (
            <Link
              key={product.id}
              href={productHref(product, locale)}
              title={name}
              style={{ transitionDelay: `${i * 140}ms` }}
              className={cn(
                "relative size-24 overflow-hidden rounded-2xl border-2 border-white/90 bg-white shadow-[0_18px_40px_-16px_rgba(0,0,0,0.8)] transition-transform duration-[1400ms] ease-[cubic-bezier(0.16,1,0.3,1)] hover:z-10 hover:!scale-110 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-brand-orange sm:size-28",
                tilt[i],
                spread[i]
              )}
            >
              <Image src={toAbsoluteImageUrl(product.image_url) ?? ""} alt={name} fill sizes="112px" className="object-contain p-2" onError={() => setBroken((ids) => [...ids, product.id])} />
            </Link>
          )
        })}
      </div>
    </div>
  )
}
