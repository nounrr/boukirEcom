"use client"

import Link from "next/link"
import { ArrowRight, HardHat, ListChecks, MessageSquareText, Send } from "lucide-react"
import { useTranslations } from "next-intl"
import { useEffect, useMemo, useState } from "react"

import { ServiceCard } from "@/components/services/service-card"
import { MarqueeRow } from "@/components/ui/marquee-row"

import { serviceDetailHref, quickServiceRequestHref, localizedServiceText } from "@/lib/service-catalog"
import type { PublicService } from "@/types/service-request"
import { SectionHeading } from "./section-heading"

/**
 * Scene 05 — Expertise. Three-step journey wired to the existing service
 * request flow (no automatic artisan assignment is implied).
 */
export function FlagshipServices({ locale, services }: { locale: string; services: PublicService[] }) {
  const t = useTranslations("xp.home.services")
  const ts = useTranslations("servicesPage")
  // Services in a new random order on every visit (drawn once mounted, so server and client HTML match).
  const [seed, setSeed] = useState<number | null>(null)
  useEffect(() => setSeed(Math.random()), [])
  const ordered = useMemo(() => {
    if (seed === null) return services
    const score = (id: number) => {
      const x = Math.sin(id * 12.9898 + seed * 7823.3) * 43758.5453
      return x - Math.floor(x)
    }
    return [...services].sort((a, b) => score(a.id) - score(b.id))
  }, [services, seed])
  const steps = [
    { key: "describe", icon: MessageSquareText },
    { key: "choose", icon: ListChecks },
    { key: "send", icon: Send },
  ] as const

  return (
    <section className="bg-background py-20 lg:py-32" aria-labelledby="services-title">
      <div className="mx-auto max-w-[1440px] px-5 sm:px-8 lg:px-10">
        <SectionHeading id="services-title" kicker={t("kicker")} title={t("title")} description={t("desc")} />

        <ol className="mt-12 grid gap-4 md:grid-cols-3">
          {steps.map(({ key, icon: Icon }, index) => (
            <li
              key={key}
              className="group relative flex"
              data-reveal
              style={{ ["--reveal-delay" as string]: `${index * 110}ms` }}
            >
              <div className="relative w-full overflow-hidden rounded-[1.75rem] border border-border bg-surface p-7 transition-[transform,translate,scale,rotate,border-color] duration-[700ms] ease-hover will-change-transform group-hover:-translate-y-1 group-hover:border-primary/40">
              <span className="absolute -end-3 -top-6 select-none text-[7rem] font-extrabold leading-none text-foreground/[0.04] tabular" aria-hidden="true">
                0{index + 1}
              </span>
              <span className="grid size-12 place-items-center rounded-2xl bg-ink text-brand-yellow">
                <Icon className="size-5" strokeWidth={1.6} aria-hidden="true" />
              </span>
              <h3 className="mt-8 text-xl font-bold">{t(`steps.${key}.title`)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(`steps.${key}.desc`)}</p>
              {index < 2 ? <span className="absolute end-6 top-1/2 hidden h-px w-10 bg-gradient-to-r from-primary to-transparent md:block rtl:bg-gradient-to-l" aria-hidden="true" /> : null}
              </div>
            </li>
          ))}
        </ol>

        {ordered.length >= 4 ? (
          // 4 services or more: their cards scroll by themselves and can be dragged; fewer stay as links below.
          <div className="-mx-5 mt-12 sm:-mx-8 lg:-mx-10">
            <p className="mb-4 px-5 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground sm:px-8 lg:px-10">{t("available")}</p>
            <MarqueeRow
              label={t("available")}
              secondsPerItem={6}
              itemDir={locale === "ar" ? "rtl" : "ltr"}
              itemClassName="w-[280px] pr-5 sm:w-[320px] [&>div]:h-full"
              items={ordered.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  locale={locale}
                  viewLabel={ts("card.view")}
                  requestLabel={ts("card.request")}
                  moreCategoriesLabel={ts("card.moreCategories", { count: Math.max(0, service.categories.length - 2) })}
                />
              ))}
            />
          </div>
        ) : ordered.length ? (
          <div className="mt-12" data-reveal>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t("available")}</p>
            <ul className="flex flex-wrap gap-2">
              {ordered.slice(0, 12).map((service) => {
                const { name } = localizedServiceText(service, locale)
                return (
                  <li key={service.id}>
                    <Link
                      href={serviceDetailHref(locale, service.id)}
                      className="inline-flex h-10 items-center gap-2 rounded-full border border-border bg-surface px-4 text-sm font-medium transition-colors hover:border-primary hover:bg-accent"
                    >
                      <HardHat className="size-3.5 text-accent-text" aria-hidden="true" />
                      {name}
                    </Link>
                  </li>
                )
              })}
            </ul>
          </div>
        ) : null}

        <div className="mt-10 flex flex-col gap-3 sm:flex-row" data-reveal>
          <Link href={quickServiceRequestHref(locale)} className="inline-flex h-12 items-center justify-center gap-2 rounded-full bg-foreground px-6 text-sm font-semibold text-background">
            <Send className="size-4" aria-hidden="true" />
            {t("ctaQuick")}
          </Link>
          <Link href={`/${locale}/services`} className="group inline-flex h-12 items-center justify-center gap-2 rounded-full border border-border px-6 text-sm font-semibold hover:border-foreground/40">
            {t("ctaServices")}
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-1 rtl:rotate-180" aria-hidden="true" />
          </Link>
          <Link href={`/${locale}/maalems`} className="link-underline inline-flex h-12 items-center justify-center px-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
            {t("ctaMaalems")}
          </Link>
        </div>
      </div>
    </section>
  )
}
