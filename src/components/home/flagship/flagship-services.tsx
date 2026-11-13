"use client"

import Link from "next/link"
import { ArrowRight, HardHat, ListChecks, MessageSquareText, Send } from "lucide-react"
import { useTranslations } from "next-intl"

import { serviceDetailHref, quickServiceRequestHref, localizedServiceText } from "@/lib/service-catalog"
import type { PublicService } from "@/types/service-request"
import { SectionHeading } from "./section-heading"

/**
 * Scene 05 — Expertise. Three-step journey wired to the existing service
 * request flow (no automatic artisan assignment is implied).
 */
export function FlagshipServices({ locale, services }: { locale: string; services: PublicService[] }) {
  const t = useTranslations("xp.home.services")
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
              className="group relative overflow-hidden rounded-[1.75rem] border border-border bg-surface p-7 transition-[transform,border-color] duration-500 hover:-translate-y-1 hover:border-primary/40"
              data-reveal
              style={{ ["--reveal-delay" as string]: `${index * 110}ms` }}
            >
              <span className="absolute -end-3 -top-6 select-none text-[7rem] font-extrabold leading-none text-foreground/[0.04] tabular" aria-hidden="true">
                0{index + 1}
              </span>
              <span className="grid size-12 place-items-center rounded-2xl bg-ink text-brand-yellow">
                <Icon className="size-5" strokeWidth={1.6} aria-hidden="true" />
              </span>
              <h3 className="mt-8 text-xl font-bold">{t(`steps.${key}.title`)}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t(`steps.${key}.desc`)}</p>
              {index < 2 ? <span className="absolute end-6 top-1/2 hidden h-px w-10 bg-gradient-to-r from-primary to-transparent md:block rtl:bg-gradient-to-l" aria-hidden="true" /> : null}
            </li>
          ))}
        </ol>

        {services.length ? (
          <div className="mt-12" data-reveal>
            <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">{t("available")}</p>
            <ul className="flex flex-wrap gap-2">
              {services.slice(0, 12).map((service) => {
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
